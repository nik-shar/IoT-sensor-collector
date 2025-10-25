# app/main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel
from app.database import get_connection, create_tables
from app.models import SensorRegister, SensorData, SensorDataResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    print("✅ IoT Sensor Collector API is running!")
    yield


app = FastAPI(title="IoT Sensor Collector API", lifespan=lifespan)

led_state = {"led": "off"}

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173","https://iot-sensor-collector.onrender.com",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SensorCommand(BaseModel):
    sensor_id: int
    command: str


class DeleteDataRequest(BaseModel):
    sensor_id: int
    data_ids: List[int]


@app.get("/")
def home():
    return {"message": "IoT Sensor Collector API is running!"}


@app.get("/device/led")
def get_led_state():
    return led_state


@app.post("/device/led")
def set_led_state(state: dict):
    led_state["led"] = state.get("led", "off")
    return led_state


# ✅ A: Register a sensor
@app.post("/register_sensor")
def register_sensor(sensor: SensorRegister):
    conn = get_connection()
    cursor = conn.cursor()

    # Get all existing sensor IDs
    cursor.execute("SELECT id FROM sensors ORDER BY id ASC")
    existing_ids = [row[0] for row in cursor.fetchall()]

    # Find the smallest available ID in range 1–100
    new_id = None
    for i in range(1, 101):
        if i not in existing_ids:
            new_id = i
            break

    if new_id is None:
        conn.close()
        raise HTTPException(status_code=400, detail="No available sensor IDs (1–100 limit reached)")

    # Insert with custom ID
    cursor.execute(
        "INSERT INTO sensors (id, name, type, location) VALUES (%s, %s, %s, %s)",
        (new_id, sensor.name, sensor.type, sensor.location),
    )
    conn.commit()
    conn.close()

    return {"message": "Sensor registered successfully", "sensor_id": new_id}


# ✅ B: Submit sensor data
@app.post("/submit_data")
def submit_data(data: SensorData):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM sensors WHERE id = %s", (data.sensor_id,))
    sensor = cursor.fetchone()
    if not sensor:
        conn.close()
        raise HTTPException(status_code=404, detail="Sensor not found")

    cursor.execute(
        "INSERT INTO sensor_data (sensor_id, data_type, value, timestamp) VALUES (%s, %s, %s, %s)",
        (data.sensor_id, data.data_type, data.value, data.timestamp.isoformat()),
    )
    conn.commit()
    cursor.execute("SELECT currval(pg_get_serial_sequence('sensor_data', 'id'))")
    data_id = cursor.fetchone()[0]
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
        query += " AND sensor_id = %s"
        params.append(sensor_id)
    if start is not None:
        query += " AND timestamp >= %s"
        params.append(start)
    if end is not None:
        query += " AND timestamp <= %s"
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
    cursor.execute("SELECT id, name FROM sensors WHERE id = %s", (cmd.sensor_id,))
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

    placeholders = ",".join(["%s"] * len(request.data_ids))

    cursor.execute("SELECT id FROM sensors WHERE id = %s", (request.sensor_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Sensor not found")

    query = f"DELETE FROM sensor_data WHERE sensor_id = %s AND id IN ({placeholders})"
    cursor.execute(query, (request.sensor_id, *request.data_ids))
    deleted_count = cursor.rowcount

    conn.commit()
    conn.close()

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="No datapoints found")

    return {
        "status": "success",
        "deleted_count": deleted_count,
        "message": f"Deleted {deleted_count} datapoints for sensor {request.sensor_id}.",
    }


@app.delete("/delete_data_range")
def delete_data_range(sensor_id: int, start: str, end: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM sensors WHERE id = %s", (sensor_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Sensor not found")

    cursor.execute(
        "DELETE FROM sensor_data WHERE sensor_id = %s AND timestamp BETWEEN %s AND %s",
        (sensor_id, start, end),
    )
    deleted_count = cursor.rowcount

    conn.commit()
    conn.close()

    if deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No data points found in range {start} to {end} for sensor {sensor_id}",
        )

    return {
        "status": "success",
        "deleted_count": deleted_count,
        "message": f"Deleted {deleted_count} data points for sensor {sensor_id} between {start} and {end}.",
    }


@app.delete("/delete_sensor/{sensor_id}")
def delete_sensor(sensor_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name FROM sensors WHERE id = %s", (sensor_id,))
    sensor = cursor.fetchone()
    if not sensor:
        conn.close()
        raise HTTPException(status_code=404, detail="Sensor not found")

    cursor.execute("DELETE FROM sensor_data WHERE sensor_id = %s", (sensor_id,))
    deleted_data_points = cursor.rowcount

    cursor.execute("DELETE FROM sensors WHERE id = %s", (sensor_id,))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "deleted_data_points": deleted_data_points,
        "message": f"Sensor '{sensor[1]}' (ID: {sensor_id}) and its {deleted_data_points} data points deleted successfully.",
    }


@app.get("/system_status")
def system_status():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM sensors")
    sensors_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM sensor_data")
    data_count = cursor.fetchone()[0]
    conn.close()

    return {
        "status": "ok",
        "sensors": sensors_count,
        "datapoints": data_count,
        "uptime": datetime.now().isoformat(),
    }
