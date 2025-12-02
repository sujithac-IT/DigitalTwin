from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

app = FastAPI()

class Voltage(BaseModel):
    voltage: float

@app.post("/data")
def receive(data: Voltage):
    print("Received:", data.voltage)
    return {"status": "ok"}

if __name__ == '__main__':
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)