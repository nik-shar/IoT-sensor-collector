# app/models.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Pydantic schema for registering a sensor
class SensorRegister(BaseModel):
    name: str
    type: str
    location: Optional[str] = None

# Pydantic schema for submitting sensor data
class SensorData(BaseModel):
    sensor_id: int
    data_type: str
    value: float
    timestamp: datetime

# Pydantic schema for returning sensor data
class SensorDataResponse(BaseModel):
    id: int
    sensor_id: int
    data_type: str
    value: float
    timestamp: datetime

    class Config:
        orm_mode = True
