# app/schemas.py
from pydantic import BaseModel
from datetime import datetime

class SensorReadingCreate(BaseModel):
    sensor_id: int
    value: float
    timestamp: datetime

class SensorReadingResponse(SensorReadingCreate):
    id: int
    class Config:
        orm_mode = True
