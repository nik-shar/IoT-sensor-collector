# app/database.py
import sqlite3
import psycopg2
import os 

DATABASE_NAME = "iot_data.db"
DATABASE_URL = os.getenv("DATABASE_URL","postgresql://iot_user:0DOksFEqSEUOInctc327xW2jv65xtoeH@dpg-d3u6ge8dl3ps73etc8r0-a/iot_sensor_db_koe7")

def get_connection():
    return psycopg2.connect(DATABASE_URL)

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    # Sensors table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sensors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        location TEXT
    )
    ''')

    # Sensor data table (used in /submit_data)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id INTEGER NOT NULL,
        data_type TEXT NOT NULL,
        value REAL NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (sensor_id) REFERENCES sensors(id)
    )
    ''')

    # Legacy readings table (optional, can remove later)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sensor_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id INTEGER NOT NULL,
        value REAL NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (sensor_id) REFERENCES sensors(id)
    )
    ''')

    conn.commit()
    conn.close()
