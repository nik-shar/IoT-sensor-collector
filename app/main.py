# app/main.py
from fastapi import FastAPI, HTTPException, Query
from contextlib import asynccontextmanager
from typing import List, Optional
from app.database import get_connection, create_tables
from app.models import SensorRegister, SensorData, SensorDataResponse

# Lifespan event to replace deprecated @app.on_event("startup")
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()  # ensures all tables exist at startup
    print("IoT Sensor Collector API is running!")
    yield

app = FastAPI(title="IoT Sensor Collector API", lifespan=lifespan)

# Root endpoint
@app.get("/")
def home():
    return {"message": "IoT Sensor Collector API is running!"}


# Endpoint A: Register a sensor
@app.post("/register_sensor")
def register_sensor(sensor: SensorRegister):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO sensors (name, type, location) VALUES (?, ?, ?)",
        (sensor.name, sensor.type, sensor.location)
    )

    conn.commit()
    sensor_id = cursor.lastrowid
    conn.close()

    return {"message": "Sensor registered successfully", "sensor_id": sensor_id}


# Endpoint B: Submit sensor data
@app.post("/submit_data")
def submit_data(data: SensorData):
    conn = get_connection()
    cursor = conn.cursor()

    # Check if sensor exists
    cursor.execute("SELECT id FROM sensors WHERE id = ?", (data.sensor_id,))
    sensor = cursor.fetchone()
    if not sensor:
        conn.close()
        raise HTTPException(status_code=404, detail="Sensor not found")

    # Insert sensor data
    cursor.execute(
        "INSERT INTO sensor_data (sensor_id, data_type, value, timestamp) VALUES (?, ?, ?, ?)",
        (data.sensor_id, data.data_type, data.value, data.timestamp.isoformat())
    )

    conn.commit()
    data_id = cursor.lastrowid
    conn.close()

    return {"message": "Sensor data submitted successfully", "data_id": data_id}


# Endpoint C: Get sensor data with optional filters
@app.get("/get_sensor_data", response_model=List[SensorDataResponse])
def get_sensor_data(
    sensor_id: Optional[int] = Query(None, description="Filter by sensor ID"),
    start: Optional[str] = Query(None, description="Start datetime in ISO format"),
    end: Optional[str] = Query(None, description="End datetime in ISO format")
):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT id, sensor_id, data_type, value, timestamp FROM sensor_data WHERE 1=1"
    params = []

    if sensor_id is not None:
        query += " AND sensor_id = ?"
        params.append(sensor_id)
    if start is not None:
        query += " AND timestamp >= ?"
        params.append(start)
    if end is not None:
        query += " AND timestamp <= ?"
        params.append(end)

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()

    results = [
        {
            "id": row[0],
            "sensor_id": row[1],
            "data_type": row[2],
            "value": row[3],
            "timestamp": row[4]
        }
        for row in rows
    ]

    return results
