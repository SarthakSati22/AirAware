"""
AirAware Ingestion Pipeline Script: import_csv.py
Validates, cleans, deduplicates, and ingests air quality CSV data into MongoDB.
Maintains audit logs in 'data_ingestion_logs'.
"""

import sys
import os
from pathlib import Path
from datetime import datetime
import pandas as pd

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.database import get_database, db_manager
from app.config import settings

def run_import(csv_path: str = None):
    csv_file = csv_path or settings.SAMPLE_DATA_CSV
    print(f"Starting ingestion from: {csv_file}")

    if not os.path.exists(csv_file):
        print(f"Error: CSV file not found at {csv_file}")
        return

    start_time = datetime.utcnow().isoformat()
    db = get_database()

    try:
        df = pd.read_csv(csv_file)
        retrieved_count = len(df)
        print(f"Read {retrieved_count} records from CSV.")

        # Data Validation & Cleaning
        # Check required columns
        required_cols = ["city_id", "station_id", "timestamp", "date", "pm25", "pm10", "aqi"]
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            print(f"Validation Error: Missing required columns {missing_cols}")
            return

        # Filter out invalid measurements
        clean_df = df.dropna(subset=["city_id", "station_id", "timestamp", "aqi"]).copy()
        clean_df = clean_df[(clean_df["pm25"] >= 0) & (clean_df["pm10"] >= 0) & (clean_df["aqi"] >= 0)]

        # Deduplication based on composite key (station_id, timestamp)
        clean_df = clean_df.drop_duplicates(subset=["station_id", "timestamp"])

        accepted_count = len(clean_df)
        rejected_count = retrieved_count - accepted_count

        records = clean_df.to_dict(orient="records")

        # Ingest in chunks
        chunk_size = 5000
        for i in range(0, len(records), chunk_size):
            db.air_quality_readings.insert_many(records[i:i + chunk_size])

        end_time = datetime.utcnow().isoformat()

        # Ingestion Log
        log_entry = {
            "source": f"CSV Ingestion ({Path(csv_file).name})",
            "start_time": start_time,
            "end_time": end_time,
            "records_retrieved": retrieved_count,
            "records_accepted": accepted_count,
            "records_rejected": rejected_count,
            "status": "COMPLETED_SUCCESS",
            "mode": "FALLBACK" if db_manager.is_fallback else "ATLAS"
        }
        db.data_ingestion_logs.insert_one(log_entry)

        print(f"Successfully ingested {accepted_count} records (Rejected: {rejected_count}).")
        print(f"Database currently contains {db.air_quality_readings.count_documents({})} total readings.")

    except Exception as e:
        print(f"Ingestion failed: {e}")
        db.data_ingestion_logs.insert_one({
            "source": f"CSV Ingestion ({Path(csv_file).name})",
            "start_time": start_time,
            "end_time": datetime.utcnow().isoformat(),
            "status": "FAILED",
            "error": str(e)
        })

if __name__ == "__main__":
    csv_arg = sys.argv[1] if len(sys.argv) > 1 else None
    run_import(csv_arg)
