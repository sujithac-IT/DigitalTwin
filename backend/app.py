from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ---------------------------
# ENABLE CORS FOR VITE FRONTEND
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can replace "*" with your Vite URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# ---------------------------
# STORE LATEST DATA IN MEMORY
# ---------------------------
latest_data: Optional[SensorData] = None


# ===================================================
# 📥 ESP32 POSTS DATA TO THIS ENDPOINT
# ===================================================
@app.post("/data")
def receive_data(data: SensorData):
    global latest_data
    latest_data = data
    print("Received:", data)
    return {"status": "received", "data": data}


# ===================================================
# 📤 FRONTEND FETCHES DATA FROM THIS ENDPOINT
# ===================================================
@app.get("/latest")
def get_latest_data():
    if latest_data is None:
        return {"status": "no data yet"}
    return latest_data


# ===================================================
# RUN UVICORN (for local testing)
# ===================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
