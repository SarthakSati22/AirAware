# AirAware API Specification

Interactive OpenAPI documentation is automatically served at: `http://localhost:8000/docs`

## Base URL
```
http://localhost:8000/api
```

## Endpoints

### 1. System Health
- **Endpoint:** `GET /health`
- **Description:** Returns application health status, database engine (Atlas vs In-memory fallback), and active record counts.
- **Sample Response:**
```json
{
  "status": "healthy",
  "app_name": "AirAware Big Data Platform",
  "records_count": 21900,
  "cities_count": 8,
  "stations_count": 30,
  "database": {
    "connected": true,
    "is_fallback": false,
    "mode": "MongoDB Atlas Cloud"
  }
}
```

### 2. Supported Cities
- **Endpoint:** `GET /cities`
- **Description:** Returns metadata for all supported Indian cities including verified coordinates.

### 3. Monitoring Stations
- **Endpoint:** `GET /stations?city_id={city_id}`
- **Description:** Returns monitoring stations with station ID, name, coordinates, and monitored pollutants.

### 4. Dashboard KPI Summary
- **Endpoint:** `GET /dashboard/summary`
- **Query Parameters:**
  - `city_id` (optional): Filter by city (e.g. `DEL`, `MUM`)
  - `station_id` (optional): Filter by monitoring station
  - `start_date` (optional, YYYY-MM-DD)
  - `end_date` (optional, YYYY-MM-DD)
- **Response:** Average AQI, Max, Min, Latest PM2.5, Latest PM10, and % change compared to previous equivalent duration.

### 5. Historical Trends
- **Endpoint:** `GET /air-quality/history`
- **Query Parameters:**
  - `city_id`: City code
  - `aggregation`: `daily`, `weekly`, or `monthly`
  - `start_date`, `end_date`

### 6. City Comparison
- **Endpoint:** `GET /air-quality/comparison`
- **Description:** Compares average AQI, PM2.5, PM10, max AQI, and station counts across all supported cities.

### 7. AQI Categories
- **Endpoint:** `GET /air-quality/categories`
- **Description:** Returns percentage distribution of readings across the 6 CPCB NAQI categories.

### 8. Geospatial Hotspots
- **Endpoint:** `GET /hotspots`
- **Description:** Returns geospatial station points with coordinates, latest AQI, category, and pollutant readings for Leaflet rendering.

### 9. AQI Forecast
- **Endpoint:** `GET /forecasts`
- **Query Parameters:**
  - `city_id`: e.g. `DEL`
  - `horizon_days`: 1 to 7
- **Response:** Daily forecasted AQI, uncertainty intervals (lower and upper bounds), and health guidance.

### 10. Model Evaluation Metrics
- **Endpoint:** `GET /model/metrics`
- **Description:** Returns actual offline model evaluation metrics (MAE, RMSE, R²), baseline comparisons, error histogram, and feature importances.

### 11. Automated Data Insights
- **Endpoint:** `GET /insights`
- **Description:** Statistical findings (inter-city disparities, winter surge, traffic signatures, PM ratios) with UN SDG alignments.

### 12. Data Explorer
- **Endpoint:** `GET /data/explorer`
- **Query Parameters:** `city_id`, `station_id`, `category`, `page`, `limit`
- **Description:** Server-side paginated observations.

### 13. CSV Export
- **Endpoint:** `GET /data/export`
- **Description:** Direct attachment stream of filtered dataset as CSV file.
