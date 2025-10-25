import os
import psycopg2
from psycopg2 import sql, OperationalError
from dotenv import load_dotenv

# Load environment variables from .env (useful for local dev)
load_dotenv()

# Get DATABASE_URL from environment (Render or local)
DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    """
    Create and return a connection to the PostgreSQL database.
    Raises a clear error if DATABASE_URL is missing or connection fails.
    """
    if not DATABASE_URL:
        raise RuntimeError("❌ DATABASE_URL environment variable is not set.")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except OperationalError as e:
        raise RuntimeError(f"❌ Database connection failed: {e}")


def create_tables():
    """
    Create required tables if they do not already exist.
    Compatible with PostgreSQL.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Sensors table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensors (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            location TEXT
        );
        """)

        # Sensor data table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensor_data (
            id SERIAL PRIMARY KEY,
            sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
            data_type TEXT NOT NULL,
            value DOUBLE PRECISION,
            timestamp TIMESTAMP
        );
        """)

        conn.commit()
        print("✅ Database tables verified or created.")
    except Exception as e:
        conn.rollback()
        print(f"❌ Error while creating tables: {e}")
    finally:
        conn.close()
