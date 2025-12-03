import os
import logging
import json
from datetime import datetime
from collections import deque
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import Base, engine, get_db
from auth import router as auth_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

# ---------------------------
# LIFESPAN CONTEXT MANAGER (Modern FastAPI startup/shutdown)
# ---------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    load_dotenv()
    
    # Load sensor history from file
    load_history()
    
    # Create tables if they don't exist (requires Supabase permissions)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully")
    except Exception as e:
        logger.warning("DB init warning: %s", str(e))

    # Try connecting once to validate DB connectivity and log a redacted DSN
    try:
        dsn = os.getenv("SUPABASE_URI", "")
        redacted = dsn
        if redacted:
            # redact credentials in logs
            # e.g. postgres://user:pass@host:port/db -> postgres://user:****@host:port/db
            import re
            redacted = re.sub(r":([^:@/]+)@", r":****@", redacted)
        with engine.connect() as conn:
            # SQLAlchemy 2.0 requires text/driver_sql for raw execution
            conn.exec_driver_sql("SELECT 1")
            logger.info(
                "Database connection OK (dialect=%s): %s",
                engine.dialect.name,
                redacted or "<not set>",
            )
            # Ensure vehicle_id column exists on users table (Postgres only)
            # This runs AFTER create_all to handle existing tables
            if engine.dialect.name.startswith("postgres"):
                try:
                    conn.exec_driver_sql(
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_id VARCHAR(255)"
                    )
                    conn.commit()
                    logger.info("Verified vehicle_id column exists in users table")
                except Exception as e2:
                    logger.warning("Schema check for vehicle_id failed (non-fatal): %s", str(e2))
    except Exception as e:
        logger.error("Database connection failed: %s", str(e))
    
    yield  # Application is running
    
    # Shutdown logic (if needed)
    logger.info("Application shutting down...")

app = FastAPI(lifespan=lifespan)

# ---------------------------
# ENABLE CORS FOR VITE FRONTEND
# ---------------------------
allowed_origins_env = os.getenv("FRONTEND_ORIGINS", "").strip()
if allowed_origins_env:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    # sensible dev defaults
    allowed_origins = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,  # use Authorization header instead of cookies; allows wildcard behavior
    allow_methods=["*"],
    allow_headers=["*"]
)

# ---------------------------
# DATA MODEL RECEIVED FROM ESP32
# ---------------------------
class SensorData(BaseModel):
    voltage: float
    current: float
    temperature: float
    latitude: float
    longitude: float

class SensorDataWithTimestamp(SensorData):
    timestamp: str

# ---------------------------
# STORE LATEST DATA IN MEMORY AND HISTORY IN FILE
# ---------------------------
latest_data: Optional[SensorData] = None
HISTORY_FILE = "sensor_history.json"
MAX_HISTORY_RECORDS = 1000  # Keep last 1000 readings

# Initialize history deque (max 1000 items for memory efficiency)
sensor_history: deque = deque(maxlen=MAX_HISTORY_RECORDS)

# Load existing history from file on startup
def load_history():
    global sensor_history
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r') as f:
                data = json.load(f)
                sensor_history = deque(data, maxlen=MAX_HISTORY_RECORDS)
                logger.info(f"Loaded {len(sensor_history)} historical records")
    except Exception as e:
        logger.error(f"Failed to load history: {e}")
        sensor_history = deque(maxlen=MAX_HISTORY_RECORDS)

# Save history to file
def save_history():
    try:
        with open(HISTORY_FILE, 'w') as f:
            json.dump(list(sensor_history), f)
    except Exception as e:
        logger.error(f"Failed to save history: {e}")

# Calculate SOH based on voltage degradation patterns
def calculate_soh(history: List[dict]) -> float:
    """
    Calculate State of Health based on voltage patterns over time.
    SOH degrades as battery ages - we track max voltage capability.
    """
    if len(history) < 10:
        return 100.0  # Not enough data, assume new battery
    
    try:
        # Get voltage readings from recent history (last 100 readings)
        recent_voltages = [h['voltage'] for h in list(history)[-100:] if 'voltage' in h]
        if not recent_voltages:
            return 100.0
        
        # Calculate max voltage observed (should be ~14V for healthy battery)
        max_voltage = max(recent_voltages)
        avg_voltage = sum(recent_voltages) / len(recent_voltages)
        
        # SOH estimation based on voltage capability
        # New battery: max voltage ~14V = 100% SOH
        # Degraded battery: max voltage ~13V = 93% SOH
        # Heavily degraded: max voltage ~12.5V = 89% SOH
        if max_voltage >= 13.8:
            base_soh = 100.0
        elif max_voltage >= 13.0:
            base_soh = 93.0 + ((max_voltage - 13.0) / 0.8) * 7.0
        else:
            base_soh = 85.0 + ((max_voltage - 12.5) / 0.5) * 8.0
        
        # Adjust for voltage stability (more stable = better health)
        voltage_std = (max(recent_voltages) - min(recent_voltages)) / avg_voltage
        stability_penalty = min(5.0, voltage_std * 10)
        
        final_soh = max(70.0, min(100.0, base_soh - stability_penalty))
        return round(final_soh, 1)
        
    except Exception as e:
        logger.error(f"SOH calculation error: {e}")
        return 95.0  # Safe default


# ===================================================
# 📥 ESP32 POSTS DATA TO THIS ENDPOINT
# ===================================================
@app.post("/data")
async def receive_data(request: Request):
    """Accept sensor data as JSON or form-encoded and store the latest sample."""
    global latest_data
    content_type = request.headers.get("content-type", "").lower()
    payload = None
    try:
        if "application/json" in content_type:
            payload = await request.json()
        elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
            form = await request.form()
            payload = dict(form)
        else:
            # Try JSON by default if unknown
            payload = await request.json()
    except Exception:
        # Fallback to empty payload if parsing fails
        payload = None

    if not isinstance(payload, dict):
        return {"status": "invalid payload"}

    try:
        data = SensorData(
            voltage=float(payload.get("voltage")),
            current=float(payload.get("current")),
            temperature=float(payload.get("temperature")),
            latitude=float(payload.get("latitude")),
            longitude=float(payload.get("longitude")),
        )
    except Exception as e:
        return {"status": "invalid fields", "detail": str(e)}

    latest_data = data
    
    # Store in history with timestamp
    timestamp = datetime.utcnow().isoformat()
    history_entry = {
        "timestamp": timestamp,
        "voltage": data.voltage,
        "current": data.current,
        "temperature": data.temperature,
        "latitude": data.latitude,
        "longitude": data.longitude,
    }
    sensor_history.append(history_entry)
    
    # Save to file every 10 readings to reduce I/O
    if len(sensor_history) % 10 == 0:
        save_history()
    
    print("Received:", latest_data)
    return {"status": "received", "data": data}


# ===================================================
# 📤 FRONTEND FETCHES DATA FROM THIS ENDPOINT
# ===================================================
@app.get("/latest")
def get_latest_data():
    if latest_data is None:
        return {"status": "no data yet"}
    
    # Calculate SOH from historical data
    soh = calculate_soh(list(sensor_history))
    
    return {
        **latest_data.dict(),
        "soh": soh
    }

# ===================================================
# 🏥 HEALTH CHECK ENDPOINT
# ===================================================
@app.get("/health")
def health_check():
    """Health check endpoint for keeping server alive"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "data_points": len(sensor_history)
    }

# ===================================================
# 📊 GET HISTORICAL SENSOR DATA
# ===================================================
@app.get("/history")
def get_history(limit: int = 100):
    """
    Get historical sensor readings.
    limit: number of most recent readings to return (default 100, max 1000)
    """
    limit = min(limit, MAX_HISTORY_RECORDS)
    history_list = list(sensor_history)
    
    # Return most recent 'limit' readings
    return {
        "status": "success",
        "count": len(history_list),
        "data": history_list[-limit:] if len(history_list) > limit else history_list
    }


# ==========================================
# Database init and auth routes
# ==========================================
# INCLUDE AUTH ROUTER
# ==========================================
app.include_router(auth_router)


# ===================================================
# RUN UVICORN (for local testing)
# ===================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
