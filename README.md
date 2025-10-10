## 📁 Project Structure & Architecture

The **IoT Sensor Data Collector** is a FastAPI-based backend designed to receive and store sensor data from IoT devices over HTTP. It provides RESTful APIs to collect, view, and manage sensor readings efficiently.


## ⚙️ Internal Component Interaction

```text
      ┌──────────────────────────────────┐
      |            IOT Devices           |
      |       (ESP32 / Respberry Pi)     |
      └────────────────┬─────────────────┘
                       |
                       ▼
      ┌──────────────────────────────────┐
      |           FastAPI App            |
      |        /api/sensors/data         |
      |       Receives + Validates       |
      └────────────────┬─────────────────┘
                       |
                       ▼
      ┌──────────────────────────────────┐
      |          Database Layer          |
      |       (SQLite/PostgreSQL)        |
      |     Stores timestamped data      |
      └────────────────┬─────────────────┘
                       |
                       ▼
      ┌──────────────────────────────────┐
      |        Data Access API/UI        |
      |       (Future Dashboards0)       |
      └────────────────┬─────────────────┘
```

### 📁 Folder Structure

``` text 
    iot-sensor-collector/
    ├── app/
    │   ├── main.py
    │
    │   ├── models.py
    │   ├── schemas.py
    │   ├── database.py
    │   ├── routes/
    │   │   ├── sensors.py
    │   ├── services/
    │   │   ├── sensor_service.py
    │   ├── utils/
    │   │   ├── helpers.py
    │
    ├── tests/
    │   ├── test_api.py
    │
    ├── requirements.txt
    ├── README.md
    └── .env