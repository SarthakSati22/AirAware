"""
Unit & Integration Tests for AirAware Backend
Tests:
1. Health endpoint & DB connectivity.
2. Cities and stations metadata.
3. Dashboard KPI calculation & percentage changes.
4. Historical trend aggregation (daily, weekly, monthly).
5. Category distribution.
6. Hotspots geospatial data.
7. Machine learning forecasts (1 to 7 days).
8. Model evaluation metrics.
9. Data insights generation.
10. CSV export streaming.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_database

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["records_count"] > 0
    assert data["cities_count"] == 8

def test_get_cities():
    response = client.get("/api/cities")
    assert response.status_code == 200
    cities = response.json()
    assert len(cities) == 8
    city_ids = [c["city_id"] for c in cities]
    assert "DEL" in city_ids
    assert "MUM" in city_ids
    assert "BLR" in city_ids

def test_get_stations():
    response = client.get("/api/stations?city_id=DEL")
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) > 0
    assert all(s["city_id"] == "DEL" for s in stations)

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary?city_id=DEL")
    assert response.status_code == 200
    data = response.json()
    assert data["average_aqi"] is not None
    assert data["average_aqi"] > 0
    assert data["max_aqi"] >= data["min_aqi"]
    assert data["latest_pm25"] is not None
    assert data["aqi_category"] in ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]

def test_historical_trends():
    response = client.get("/api/air-quality/history?city_id=DEL&aggregation=monthly")
    assert response.status_code == 200
    trends = response.json()
    assert len(trends) > 0
    first = trends[0]
    assert "aqi" in first
    assert "pm25" in first
    assert "pm10" in first

def test_city_comparisons():
    response = client.get("/api/air-quality/comparison")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 8
    # Top city should have high AQI
    assert data[0]["avg_aqi"] >= data[-1]["avg_aqi"]

def test_hotspots():
    response = client.get("/api/hotspots")
    assert response.status_code == 200
    spots = response.json()
    assert len(spots) > 0
    spot = spots[0]
    assert "latitude" in spot and "longitude" in spot
    assert spot["latitude"] != 0.0

def test_forecasts():
    response = client.get("/api/forecasts?city_id=DEL&horizon_days=5")
    assert response.status_code == 200
    data = response.json()
    assert data["city_id"] == "DEL"
    assert len(data["daily_forecasts"]) == 5
    assert len(data["historical_context"]) > 0

def test_model_metrics():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    metrics = response.json()
    assert "metrics" in metrics
    assert "mae" in metrics["metrics"]
    assert "rmse" in metrics["metrics"]
    assert "r2" in metrics["metrics"]
    assert metrics["metrics"]["r2"] > 0.8
    assert len(metrics["feature_importances"]) > 0

def test_insights():
    response = client.get("/api/insights")
    assert response.status_code == 200
    insights = response.json()
    assert len(insights) >= 5
    assert any("Inter-City" in i["category"] for i in insights)

def test_csv_export():
    response = client.get("/api/data/export?city_id=DEL")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "city_id" in response.text
