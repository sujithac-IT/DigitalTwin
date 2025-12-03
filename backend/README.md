# Backend (FastAPI)

Receives sensor data from the device and serves the latest reading to the frontend. Provides simple auth (register/login) backed by Supabase Postgres.

## Endpoints
- POST /data — accept JSON sensor payload
- GET /latest — return latest reading or {"status": "no data yet"}
- POST /auth/register — body: { email, password }
- POST /auth/login — body: { email, password }

## Setup
1) Create and activate a virtual env, then install deps:

- Windows PowerShell

    - python -m venv venv
    - .\venv\Scripts\Activate.ps1
    - pip install -r requirements.txt

2) Copy .env.example to .env and fill SUPABASE_URI and SECRET_KEY.

3) Run the API:

- uvicorn app:app --host 0.0.0.0 --port 5000 --reload

## Sensor payload example
```json
{
  "voltage": 12.34,
  "current": 1.23,
  "temperature": 30.5,
  "latitude": 37.4219983,
  "longitude": -122.084
}
```

Arduino/ESP32 should POST JSON with Content-Type: application/json to http://<backend-host>:5000/data.