import psycopg2
import os

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    return psycopg2.connect(DATABASE_URL)

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensors (
        id SERIAL PRIMARY KEY,
        name TEXT,
        type TEXT,
        location TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_data (
        id SERIAL PRIMARY KEY,
        sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
        data_type TEXT,
        value DOUBLE PRECISION,
        timestamp TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()
