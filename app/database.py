import os
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable not set")
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
