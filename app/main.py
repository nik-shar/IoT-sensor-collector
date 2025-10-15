# app/main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel
from app.database import get_connection, create_tables
from app.models import SensorRegister, SensorData, SensorDataResponse

# Lifespan startup event
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    print("✅ IoT Sensor Collector API is running!")
    yield

# Create ONE FastAPI app
app = FastAPI(title="IoT Sensor Collector API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class SensorCommand(BaseModel):
    sensor_id: int
    command: str

class DeleteDataRequest(BaseModel):
    sensor_id: int
    data_ids: List[int]



# ✅ Root endpoint
@app.get("/")
def home():
    return {"message": "IoT Sensor Collector API is running!"}

# ✅ A: Register a sensor
@app.post("/register_sensor")
def register_sensor(sensor: SensorRegister):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sensors (name, type, location) VALUES (?, ?, ?)",
        (sensor.name, sensor.type, sensor.location),
    )
    conn.commit()
    sensor_id = cursor.lastrowid
    conn.close()
    return {"message": "Sensor registered successfully", "sensor_id": sensor_id}

# ✅ B: Submit sensor data
@app.post("/submit_data")
def submit_data(data: SensorData):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM sensors WHERE id = ?", (data.sensor_id,))
    sensor = cursor.fetchone()
    if not sensor:
        conn.close()
        raise HTTPException(status_code=404, detail="Sensor not found")
    cursor.execute(
        "INSERT INTO sensor_data (sensor_id, data_type, value, timestamp) VALUES (?, ?, ?, ?)",
        (data.sensor_id, data.data_type, data.value, data.timestamp.isoformat()),
    )
    conn.commit()
    data_id = cursor.lastrowid
    conn.close()
    return {"message": "Sensor data submitted successfully", "data_id": data_id}

# ✅ C: Get sensor data (optional filters)
@app.get("/get_sensor_data", response_model=List[SensorDataResponse])
def get_sensor_data(
    sensor_id: Optional[int] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
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
    return [
        {"id": r[0], "sensor_id": r[1], "data_type": r[2], "value": r[3], "timestamp": r[4]}
        for r in rows
    ]

# ✅ D: Latest data for all sensors
@app.get("/latest_data")
def get_all_data():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT sensor_id, value, timestamp FROM sensor_data ORDER BY sensor_id ASC, timestamp ASC"
    )
    rows = cursor.fetchall()
    conn.close()
    grouped: Dict[int, List[dict]] = {}
    for sensor_id, value, timestamp in rows:
        grouped.setdefault(sensor_id, []).append({"value": value, "timestamp": timestamp})
    return grouped

# ✅ E: Get all sensors
@app.get("/get_sensors")
def get_sensors():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, type, location FROM sensors")
    sensors = cursor.fetchall()
    conn.close()
    return [{"id": s[0], "name": s[1], "type": s[2], "location": s[3]} for s in sensors]

# ✅ F: Send command
@app.post("/send_command")
def send_command(cmd: SensorCommand):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM sensors WHERE id = ?", (cmd.sensor_id,))
    sensor = cursor.fetchone()
    conn.close()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    print(f"Command received for sensor {sensor[1]} (ID {cmd.sensor_id}): {cmd.command}")
    return {"status": "success", "message": f"Command '{cmd.command}' sent to {sensor[1]}."}


@app.delete("/delete_data")
def delete_data(request: DeleteDataRequest):
    conn = get_connection()
    cursor = conn.cursor()

    placeholders = ",".join("?" for _ in request.data_ids)

    cursor.execute("SELECT id FROM sensors WHERE id = ?",(request.sensor_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404,detail="sensor not found")
    
    query = f"DELETE FROM sensor_data WHERE sensor_id = ? AND id IN ({placeholders})"
    cursor.execute(query, (request.sensor_id,*request.data_ids))
    deleted_count = cursor.rowcount

    conn.commit()
    conn.close()

    if deleted_count == 0 :
        raise HTTPException(status_code=404, detail="No datapoints found")
    
    return{
        "status" : "success",
        "deleted_count" : deleted_count,
        "message": f"Deleted {deleted_count} datapoints for server {request.sensor_id}."
    }

@app.delete("/delete_data_range")
def delete_data_range(
    sensor_id : int,
    start : str,
    end : str
):
    """
    Delete sensor data for a given sensor_id within the timestamp range[start,end].
    Example : /delete_data_range?sensor_id=1&start=2025-10-01T00:00:00&end=2025-10-10T23:59:59
    """
    conn = get_connection()
    cursor = conn.cursor() 

    cursor.execute("SELECT if FROM sensors WHERE id = ?",(sensor_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404,detail="Sensor not found")
    
    cursor.execute(
        "DELETE FROM sensor_data WHERE sensor_id = ? AND timestamp BETWEEN ? AND ?",
        (sensor_id,start,end),
    )
    deleted_count = cursor.rowcount

    conn.commit()
    conn.close()

    if deleted_count == 0 :
        raise HTTPException(
            status_code = 404,
            detail= f"No data points found in range {start} to {end} for sensor {sensor_id}"
        )
    return {
        "status" : "success",
        "deleted_count" : deleted_count,
        "message":f"Deleted {deleted_count} data points for sensor {sensor_id} between {start} to {end}."
    }

@app.delete("/delete_sensor/{sensor_id}")
def delete_sensor(sensor_id : int):
    """
    Delete a sensor and all its associated data from the database.
    Example : /delete_sensor/2
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name FROM sensors WHERE id = ?",(sensor_id,))
    sensor = cursor.fetchone()
    if not sensor : 
        conn.close()
        raise HTTPException(status_code=404,detial="Sensor not found")
    
    cursor.execute("DELETE FROM sensor_data WHERE sensor_id = ?",(sensor_id,))
    deleted_data_points = cursor.rowcount

    cursor.execute("DELETE FROM sensors WHERE id = ?",(sensor_id,))
    conn.commit()
    conn.close()

    return{
        "status" : "success",
        "deleted_data_points" : deleted_data_points,
        "message":f"Sensor '{sensor[1]}'(ID : {sensor_id}) and its {deleted_data_points} data points deleted successfully."
    }