"""
Air Quality API Endpoints
Handles city lookups, station metadata, KPI summaries, historical trends,
category distributions, cross-city comparisons, hotspots, and CSV streaming.
"""

import io
import csv
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, Response
from fastapi.responses import StreamingResponse

from app.database import get_database, get_db_status
from app.analytics.engine import (
    compute_kpi_summary,
    get_historical_trends,
    get_city_comparisons,
    get_aqi_category_distribution,
    get_hotspots_data,
    get_correlations
)
from app.schemas import KPISummary, CityComparison, HotspotPoint

router = APIRouter(prefix="/api", tags=["Air Quality Analytics"])

@router.get("/health")
def health_check():
    """Returns application status, database connectivity, and data volume."""
    db = get_database()
    db_info = get_db_status()
    readings_count = db.air_quality_readings.count_documents({})
    cities_count = db.cities.count_documents({})
    stations_count = db.monitoring_stations.count_documents({})

    return {
        "status": "healthy",
        "app_name": "AirAware Big Data Platform",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_info,
        "records_count": readings_count,
        "cities_count": cities_count,
        "stations_count": stations_count,
        "sdg_alignment": ["SDG 3: Good Health & Well-being", "SDG 11: Sustainable Cities & Communities"]
    }

@router.get("/cities")
def get_cities():
    """Returns list of supported Indian cities with verified coordinates."""
    db = get_database()
    cities = list(db.cities.find({}, {"_id": 0}).sort("city_name", 1))
    return cities

@router.get("/stations")
def get_stations(city_id: Optional[str] = Query(None, description="Optional city filter")):
    """Returns monitoring stations with verified geographical coordinates."""
    db = get_database()
    query = {}
    if city_id and city_id != "ALL":
        query["city_id"] = city_id
    stations = list(db.monitoring_stations.find(query, {"_id": 0}).sort("station_name", 1))
    return stations

@router.get("/dashboard/summary", response_model=KPISummary)
def get_dashboard_summary(
    city_id: Optional[str] = Query(None, description="City code (e.g. DEL, MUM)"),
    station_id: Optional[str] = Query(None, description="Station identifier"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Computes dynamic KPIs (Avg AQI, Max, Min, Latest PM2.5/PM10, % change)."""
    return compute_kpi_summary(city_id, station_id, start_date, end_date)

@router.get("/air-quality/latest")
def get_latest_readings(city_id: Optional[str] = Query(None)):
    """Returns latest available measurements for supported cities/stations."""
    db = get_database()
    query = {}
    if city_id and city_id != "ALL":
        query["city_id"] = city_id

    # Retrieve most recent records
    latest_cursor = db.air_quality_readings.find(query, {"_id": 0}).sort("timestamp", -1).limit(10)
    return list(latest_cursor)

@router.get("/air-quality/history")
def get_history(
    city_id: Optional[str] = Query(None),
    station_id: Optional[str] = Query(None),
    pollutant: str = Query("aqi", description="aqi, pm25, pm10, no2, so2, co, o3"),
    aggregation: str = Query("daily", description="daily, weekly, monthly"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Retrieves aggregated historical trend line series."""
    return get_historical_trends(city_id, station_id, pollutant, aggregation, start_date, end_date)

@router.get("/air-quality/comparison", response_model=List[CityComparison])
def get_comparison(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Compares average AQI, PM2.5, and PM10 across cities."""
    return get_city_comparisons(start_date, end_date)

@router.get("/air-quality/categories")
def get_categories(
    city_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Returns distribution of observations across standard CPCB AQI categories."""
    return get_aqi_category_distribution(city_id, start_date, end_date)

@router.get("/air-quality/correlations")
def get_pollutant_correlations(city_id: Optional[str] = Query(None)):
    """Calculates Pearson correlation matrix between pollutants and weather."""
    return get_correlations(city_id)

@router.get("/hotspots", response_model=List[HotspotPoint])
def get_hotspots(
    city_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None)
):
    """Returns geospatial pollution data for interactive Leaflet mapping."""
    return get_hotspots_data(city_id, date)

@router.get("/data/explorer")
def explore_data(
    city_id: Optional[str] = Query(None),
    station_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100)
):
    """Searchable, paginated data explorer table backend."""
    db = get_database()
    query = {}
    if city_id and city_id != "ALL":
        query["city_id"] = city_id
    if station_id and station_id != "ALL":
        query["station_id"] = station_id
    if category and category != "ALL":
        query["aqi_category"] = category
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}
    elif end_date:
        query["date"] = {"$lte": end_date}

    total = db.air_quality_readings.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.air_quality_readings.find(query, {"_id": 0}).sort("date", -1).skip(skip).limit(limit)
    items = list(cursor)

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total > 0 else 1
    }

@router.get("/data/export")
def export_csv(
    city_id: Optional[str] = Query(None),
    station_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Streams filtered dataset as a downloadable CSV file."""
    db = get_database()
    query = {}
    if city_id and city_id != "ALL":
        query["city_id"] = city_id
    if station_id and station_id != "ALL":
        query["station_id"] = station_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}

    readings = list(db.air_quality_readings.find(query, {"_id": 0}).sort("date", -1).limit(5000))
    if not readings:
        raise HTTPException(status_code=404, detail="No observations found matching filter criteria.")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=readings[0].keys())
    writer.writeheader()
    writer.writerows(readings)

    output.seek(0)
    filename = f"airaware_export_{city_id or 'all'}_{datetime.now().strftime('%Y%m%d')}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
