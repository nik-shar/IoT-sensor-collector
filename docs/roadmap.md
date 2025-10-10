## 📁 Project Structure & Architecture

The **IoT Sensor Data Collector** is a FastAPI-based backend designed to receive and store sensor data from IoT devices over HTTP. It provides RESTful APIs to collect, view, and manage sensor readings efficiently.


```markdown
System Architecture

```mermaid
flowchart TD
    A[IoT Devices<br/>(ESP32 / Raspberry Pi)] -->|HTTP POST (JSON)| B[FastAPI Backend]
    B -->|Validate + Parse Data| C[Database Layer<br/>(SQLite / PostgreSQL)]
    C --> D[API / Dashboard<br/>(Future Integration)]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
    style D fill:#ffb,stroke:#333,stroke-width:2px
