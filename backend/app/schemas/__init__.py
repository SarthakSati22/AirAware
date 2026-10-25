"""
Pydantic Schemas for AirAware Platform
Provides strong data validation for all API inputs, query parameters, and responses.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CitySchema(BaseModel):
    city_id: str
    city_name: str
    state: str
    country: str = "India"
    latitude: float
    longitude: float
    region: Optional[str] = None
    station_count: Optional[int] = 0

class StationSchema(BaseModel):
    station_id: str
    station_name: str
    city_id: str
    city_name: str
    latitude: float
    longitude: float
    pollutants: List[str] = ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"]
    source: str = "CPCB"

class AirQualityReadingSchema(BaseModel):
    city_id: str
    city_name: str
    state: Optional[str] = None
    station_id: Optional[str] = None
    station_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: str
    date: str
    pm25: float
    pm10: float
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    o3: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    aqi: int
    aqi_category: str
    primary_pollutant: str = "PM2.5"
    source: str = "CPCB / OpenAQ Historical Data"
    unit: str = "µg/m³"

class KPISummary(BaseModel):
    average_aqi: Optional[float] = None
    max_aqi: Optional[float] = None
    min_aqi: Optional[float] = None
    latest_pm25: Optional[float] = None
    latest_pm10: Optional[float] = None
    latest_no2: Optional[float] = None
    latest_so2: Optional[float] = None
    latest_co: Optional[float] = None
    latest_o3: Optional[float] = None
    aqi_category: Optional[str] = None
    pct_change_vs_prev_period: Optional[float] = None
    total_records: int
    city_id: Optional[str] = None
    city_name: Optional[str] = None
    station_id: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    data_quality_note: Optional[str] = None

class TrendPoint(BaseModel):
    timestamp: str
    date: str
    aqi: float
    pm25: float
    pm10: float
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    o3: Optional[float] = None
    aqi_category: Optional[str] = None

class CityComparison(BaseModel):
    city_id: str
    city_name: str
    avg_aqi: float
    avg_pm25: float
    avg_pm10: float
    max_aqi: float
    min_aqi: float
    category: str
    station_count: int

class HotspotPoint(BaseModel):
    station_id: str
    station_name: str
    city_id: str
    city_name: str
    latitude: float
    longitude: float
    aqi: int
    aqi_category: str
    pm25: float
    pm10: float
    primary_pollutant: str
    timestamp: str
    source: str

class ForecastDay(BaseModel):
    date: str
    day_name: str
    predicted_aqi: int
    aqi_category: str
    lower_bound: int
    upper_bound: int
    health_advice: str

class ForecastResponse(BaseModel):
    city_id: str
    city_name: str
    horizon_days: int
    generated_at: str
    model_name: str
    model_version: str
    test_metrics: Dict[str, float]
    daily_forecasts: List[ForecastDay]
    historical_context: List[Dict[str, Any]]
    disclaimer: str

class ModelMetricsResponse(BaseModel):
    model_name: str
    model_version: str
    training_date_range: Dict[str, str]
    test_date_range: Dict[str, str]
    total_samples: int
    train_samples: int
    test_samples: int
    metrics: Dict[str, float]  # mae, rmse, r2
    baseline_metrics: Dict[str, float]  # persistence baseline mae, rmse, r2
    improvement_pct: Dict[str, float]
    feature_importances: List[Dict[str, Any]]
    error_distribution: List[Dict[str, Any]]
    actual_vs_predicted: List[Dict[str, Any]]

class InsightItem(BaseModel):
    id: str
    category: str  # "Hotspot", "Temporal", "Comparison", "Correlation", "Health & SDG"
    title: str
    summary: str
    metric_value: Optional[str] = None
    detail: str
    sdg_alignment: str
    badge_type: str  # "warning", "info", "success", "danger"

class DataQualityResponse(BaseModel):
    total_records: int
    date_coverage: Dict[str, str]
    cities_count: int
    stations_count: int
    completeness_percentage: float
    pollutants_coverage: Dict[str, float]
    sources: List[str]
    ingestion_logs: List[Dict[str, Any]]
