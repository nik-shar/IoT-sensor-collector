## Flowchart 

ESP32["ESP32 / IoT Device"]

``` text 
    --> |HTTP/MQTT| FastAPI["FastAPI Server (main.py)"]
    --> DB[(Database)]
    --> Dashboard["Frontend / API Client"]
```
## ⚙️ Internal Component Interaction

```
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
      |       (Future Dashboards)        |
      └────────────────┬─────────────────┘
```

### 📁 Folder Structure

``` text 
    iot-sensor-collector/
    ├── app/
    │   ├── main.py
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