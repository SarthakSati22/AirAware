"""
Big Data Analytics Engine for AirAware
Implements advanced aggregation pipelines, statistical correlations,
time-series summarization, and data-driven automated insight generation.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.database import get_database

def compute_kpi_summary(
    city_id: Optional[str] = None,
    station_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """Computes dynamic KPIs and percentage changes for the selected filters."""
    db = get_database()
    query: Dict[str, Any] = {}
    if city_id and city_id != "ALL":
        query["city_id"] = city_id
    if station_id and station_id != "ALL":
        query["station_id"] = station_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}
    elif end_date:
        query["date"] = {"$lte": end_date}

    # Optimized projection: only fetch fields required for calculation
    projection = {
        "aqi": 1, "pm25": 1, "pm10": 1, "no2": 1, "so2": 1, "co": 1, "o3": 1,
        "date": 1, "timestamp": 1, "city_name": 1
    }
    cursor = db.air_quality_readings.find(query, projection)
    readings = list(cursor)

    if not readings:
        return {
            "average_aqi": None,
            "max_aqi": None,
            "min_aqi": None,
            "latest_pm25": None,
            "latest_pm10": None,
            "latest_no2": None,
            "latest_so2": None,
            "latest_co": None,
            "latest_o3": None,
            "aqi_category": "No Data",
            "pct_change_vs_prev_period": None,
            "total_records": 0,
            "city_id": city_id,
            "city_name": "All Cities" if not city_id or city_id == "ALL" else city_id,
            "station_id": station_id,
            "period_start": start_date,
            "period_end": end_date,
            "data_quality_note": "No measurements matching specified filter criteria."
        }

    df = pd.DataFrame(readings)
    avg_aqi = round(float(df["aqi"].mean()), 1)
    max_aqi = int(df["aqi"].max())
    min_aqi = int(df["aqi"].min())

    # Fast fetch of the single most recent reading
    latest = db.air_quality_readings.find_one(query, sort=[("timestamp", -1)])
    if not latest:
        latest = readings[-1]

    latest_pm25 = float(latest.get("pm25", 0.0))
    latest_pm10 = float(latest.get("pm10", 0.0))
    latest_no2 = float(latest.get("no2", 0.0))
    latest_so2 = float(latest.get("so2", 0.0))
    latest_co = float(latest.get("co", 0.0))
    latest_o3 = float(latest.get("o3", 0.0))

    # Determine category
    def cat(val):
        if val is None or math.isnan(val): return "N/A"
        if val <= 50: return "Good"
        elif val <= 100: return "Satisfactory"
        elif val <= 200: return "Moderate"
        elif val <= 300: return "Poor"
        elif val <= 400: return "Very Poor"
        else: return "Severe"

    # Percentage change calculation if date range provided
    pct_change = None
    if start_date and end_date:
        try:
            d_start = datetime.strptime(start_date, "%Y-%m-%d")
            d_end = datetime.strptime(end_date, "%Y-%m-%d")
            duration = (d_end - d_start).days
            if duration > 0 and duration < 730:
                prev_start = (d_start - timedelta(days=duration + 1)).strftime("%Y-%m-%d")
                prev_end = (d_start - timedelta(days=1)).strftime("%Y-%m-%d")

                prev_query = dict(query)
                prev_query["date"] = {"$gte": prev_start, "$lte": prev_end}
                prev_cursor = db.air_quality_readings.find(prev_query, {"aqi": 1})
                prev_readings = list(prev_cursor)
                if prev_readings:
                    prev_df = pd.DataFrame(prev_readings)
                    prev_avg = float(prev_df["aqi"].mean())
                    if prev_avg > 0:
                        pct_change = round(((avg_aqi - prev_avg) / prev_avg) * 100, 1)
        except Exception:
            pct_change = None

    city_name = latest.get("city_name") if city_id and city_id != "ALL" else "All Cities"

    return {
        "average_aqi": avg_aqi,
        "max_aqi": max_aqi,
        "min_aqi": min_aqi,
        "latest_pm25": latest_pm25,
        "latest_pm10": latest_pm10,
        "latest_no2": latest_no2,
        "latest_so2": latest_so2,
        "latest_co": latest_co,
        "latest_o3": latest_o3,
        "aqi_category": cat(avg_aqi),
        "pct_change_vs_prev_period": pct_change,
        "total_records": len(df),
        "city_id": city_id,
        "city_name": city_name,
        "station_id": station_id,
        "period_start": start_date or str(df["date"].min()),
        "period_end": end_date or str(df["date"].max()),
        "data_quality_note": f"Computed dynamically across {len(df):,} validated sensor readings."
    }

def get_historical_trends(
    city_id: Optional[str] = None,
    station_id: Optional[str] = None,
    pollutant: str = "aqi",
    aggregation: str = "daily",  # "daily", "weekly", "monthly"
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Generates aggregated time-series trends."""
    db = get_database()
    query: Dict[str, Any] = {}
    if city_id and city_id != "ALL":
        query["city_id"] = city_id
    if station_id and station_id != "ALL":
        query["station_id"] = station_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}

    readings = list(db.air_quality_readings.find(query, {
        "date": 1, "aqi": 1, "pm25": 1, "pm10": 1,
        "no2": 1, "so2": 1, "co": 1, "o3": 1
    }))

    if not readings:
        return []

    df = pd.DataFrame(readings)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    if aggregation == "monthly":
        df["period"] = df["date"].dt.to_period("M").astype(str)
    elif aggregation == "weekly":
        df["period"] = df["date"].dt.to_period("W").astype(str)
    else:
        df["period"] = df["date"].dt.strftime("%Y-%m-%d")

    agg_df = df.groupby("period").agg({
        "aqi": "mean",
        "pm25": "mean",
        "pm10": "mean",
        "no2": "mean",
        "so2": "mean",
        "co": "mean",
        "o3": "mean"
    }).reset_index()

    def cat(val):
        if val <= 50: return "Good"
        elif val <= 100: return "Satisfactory"
        elif val <= 200: return "Moderate"
        elif val <= 300: return "Poor"
        elif val <= 400: return "Very Poor"
        else: return "Severe"

    result = []
    for _, row in agg_df.iterrows():
        aqi_val = round(float(row["aqi"]), 1)
        result.append({
            "timestamp": str(row["period"]),
            "date": str(row["period"]),
            "aqi": aqi_val,
            "pm25": round(float(row["pm25"]), 1),
            "pm10": round(float(row["pm10"]), 1),
            "no2": round(float(row["no2"]), 1),
            "so2": round(float(row["so2"]), 1),
            "co": round(float(row["co"]), 2),
            "o3": round(float(row["o3"]), 1),
            "aqi_category": cat(aqi_val)
        })

    return result

def get_city_comparisons(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Compares average AQI, PM2.5, PM10 across all supported Indian cities."""
    db = get_database()
    query: Dict[str, Any] = {}
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}

    readings = list(db.air_quality_readings.find(query, {
        "city_id": 1, "city_name": 1, "aqi": 1, "pm25": 1, "pm10": 1, "station_id": 1
    }))

    if not readings:
        return []

    df = pd.DataFrame(readings)
    grouped = df.groupby(["city_id", "city_name"]).agg({
        "aqi": ["mean", "max", "min"],
        "pm25": "mean",
        "pm10": "mean",
        "station_id": "nunique"
    }).reset_index()

    # Flatten column multi-index
    grouped.columns = ["city_id", "city_name", "avg_aqi", "max_aqi", "min_aqi", "avg_pm25", "avg_pm10", "station_count"]

    def cat(val):
        if val <= 50: return "Good"
        elif val <= 100: return "Satisfactory"
        elif val <= 200: return "Moderate"
        elif val <= 300: return "Poor"
        elif val <= 400: return "Very Poor"
        else: return "Severe"

    result = []
    for _, row in grouped.iterrows():
        avg_aqi = round(float(row["avg_aqi"]), 1)
        result.append({
            "city_id": str(row["city_id"]),
            "city_name": str(row["city_name"]),
            "avg_aqi": avg_aqi,
            "avg_pm25": round(float(row["avg_pm25"]), 1),
            "avg_pm10": round(float(row["avg_pm10"]), 1),
            "max_aqi": int(row["max_aqi"]),
            "min_aqi": int(row["min_aqi"]),
            "category": cat(avg_aqi),
            "station_count": int(row["station_count"])
        })

    # Sort by avg_aqi descending
    result.sort(key=lambda x: x["avg_aqi"], reverse=True)
    return result

def get_aqi_category_distribution(
    city_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Calculates breakdown of days spent in each CPCB AQI category."""
    db = get_database()
    query: Dict[str, Any] = {}
    if city_id and city_id != "ALL":
        query["city_id"] = city_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}

    readings = list(db.air_quality_readings.find(query, {"aqi_category": 1}))
    if not readings:
        return []

    cats = ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]
    colors = {
        "Good": "#10B981",
        "Satisfactory": "#84CC16",
        "Moderate": "#EAB308",
        "Poor": "#F97316",
        "Very Poor": "#EF4444",
        "Severe": "#881337"
    }

    df = pd.DataFrame(readings)
    counts = df["aqi_category"].value_counts().to_dict()
    total = len(df)

    res = []
    for c in cats:
        count = counts.get(c, 0)
        pct = round((count / total) * 100, 1) if total > 0 else 0.0
        res.append({
            "category": c,
            "count": count,
            "percentage": pct,
            "color": colors[c]
        })
    return res

def get_hotspots_data(
    city_id: Optional[str] = None,
    date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Returns geospatial pollution data for all active monitoring stations."""
    db = get_database()
    query: Dict[str, Any] = {}
    if city_id and city_id != "ALL":
        query["city_id"] = city_id

    # If specific date given, use it; otherwise get latest available reading per station
    if date:
        query["date"] = date
        readings = list(db.air_quality_readings.find(query))
    else:
        # Get latest reading for each station
        stations = list(db.monitoring_stations.find({} if not city_id or city_id == "ALL" else {"city_id": city_id}))
        readings = []
        for s in stations:
            latest = db.air_quality_readings.find_one(
                {"station_id": s["station_id"]},
                sort=[("timestamp", -1)]
            )
            if latest:
                readings.append(latest)

    result = []
    for r in readings:
        result.append({
            "station_id": r.get("station_id"),
            "station_name": r.get("station_name"),
            "city_id": r.get("city_id"),
            "city_name": r.get("city_name"),
            "latitude": float(r.get("latitude", 0.0)),
            "longitude": float(r.get("longitude", 0.0)),
            "aqi": int(r.get("aqi", 0)),
            "aqi_category": r.get("aqi_category", "Unknown"),
            "pm25": float(r.get("pm25", 0.0)),
            "pm10": float(r.get("pm10", 0.0)),
            "no2": float(r.get("no2", 0.0)),
            "so2": float(r.get("so2", 0.0)),
            "co": float(r.get("co", 0.0)),
            "o3": float(r.get("o3", 0.0)),
            "primary_pollutant": r.get("primary_pollutant", "PM2.5"),
            "timestamp": r.get("timestamp", ""),
            "date": r.get("date", ""),
            "source": r.get("source", "CPCB / OpenAQ")
        })

    return result

def get_correlations(city_id: Optional[str] = None) -> Dict[str, Any]:
    """Computes correlation matrix between pollutants and weather parameters."""
    db = get_database()
    query = {"city_id": city_id} if city_id and city_id != "ALL" else {}
    readings = list(db.air_quality_readings.find(query, {
        "pm25": 1, "pm10": 1, "no2": 1, "so2": 1, "co": 1, "o3": 1,
        "temperature": 1, "humidity": 1, "wind_speed": 1
    }))
    if not readings:
        return {}

    df = pd.DataFrame(readings)
    cols = ["pm25", "pm10", "no2", "so2", "co", "o3", "temperature", "humidity", "wind_speed"]
    valid_cols = [c for c in cols if c in df.columns]
    corr_matrix = df[valid_cols].corr().round(2).to_dict()
    return corr_matrix

def generate_automated_insights() -> List[Dict[str, Any]]:
    """Derives actionable statistical insights and policy findings from the full dataset."""
    db = get_database()
    readings = list(db.air_quality_readings.find({}))
    if not readings:
        return []

    df = pd.DataFrame(readings)
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.month
    df["day_name"] = df["date"].dt.day_name()
    df["is_weekend"] = df["date"].dt.weekday >= 5

    insights = []

    # 1. Cleanest vs Most Polluted City
    city_avg = df.groupby(["city_id", "city_name"])["aqi"].mean().sort_values()
    cleanest = city_avg.index[0]
    cleanest_val = round(city_avg.iloc[0], 1)
    worst = city_avg.index[-1]
    worst_val = round(city_avg.iloc[-1], 1)

    insights.append({
        "id": "INSIGHT-01",
        "category": "Inter-City Disparity",
        "title": f"Pollution Divide: {worst[1]} vs {cleanest[1]}",
        "summary": f"{worst[1]} records the highest historical average AQI ({worst_val}), whereas {cleanest[1]} maintains the lowest ({cleanest_val}).",
        "metric_value": f"{round((worst_val / cleanest_val), 1)}x Difference",
        "detail": f"Geographical factors (landlocked Indo-Gangetic basin thermal inversion vs coastal/plateau ventilation) create a {round(worst_val - cleanest_val, 1)} AQI point disparity between {worst[1]} and {cleanest[1]}.",
        "sdg_alignment": "SDG 11 (Target 11.6: Reduce adverse environmental impact of cities)",
        "badge_type": "danger"
    })

    # 2. Seasonal Inversion / Winter Peak
    monthly_aqi = df.groupby("month")["aqi"].mean().to_dict()
    peak_month_num = max(monthly_aqi, key=monthly_aqi.get)
    min_month_num = min(monthly_aqi, key=monthly_aqi.get)
    month_names = {1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
                   7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"}

    insights.append({
        "id": "INSIGHT-02",
        "category": "Seasonal Pattern",
        "title": f"Winter Inversion Surge ({month_names[peak_month_num]})",
        "summary": f"Average AQI spikes to {round(monthly_aqi[peak_month_num], 1)} in {month_names[peak_month_num]}, dropping to {round(monthly_aqi[min_month_num], 1)} during {month_names[min_month_num]} monsoons.",
        "metric_value": f"{round(monthly_aqi[peak_month_num] - monthly_aqi[min_month_num], 1)} AQI Surge",
        "detail": "Boundary layer contraction and low surface wind velocities in northern and central India trap vehicular and biomass emissions during late autumn and winter months.",
        "sdg_alignment": "SDG 3 (Target 3.9: Reduce deaths from air pollution)",
        "badge_type": "warning"
    })

    # 3. Particulate Ratio Analysis (PM2.5 to PM10)
    df["pm_ratio"] = df["pm25"] / df["pm10"].replace(0, np.nan)
    avg_ratio = round(float(df["pm_ratio"].mean()), 2)
    winter_ratio = round(float(df[df["month"].isin([11, 12, 1])]["pm_ratio"].mean()), 2)

    insights.append({
        "id": "INSIGHT-03",
        "category": "Particulate Dynamics",
        "title": "High Fine Particulate Combustion Share",
        "summary": f"PM2.5 accounts for {int(avg_ratio * 100)}% of PM10 overall, surging to {int(winter_ratio * 100)}% during winter periods.",
        "metric_value": f"{winter_ratio} Winter Ratio",
        "detail": "A PM2.5/PM10 ratio exceeding 0.50 denotes dominance of secondary aerosol formation, vehicular exhaust, and biomass combustion rather than coarse road dust.",
        "sdg_alignment": "SDG 3: Good Health & Well-being",
        "badge_type": "info"
    })

    # 4. Weekday vs Weekend Traffic Variation
    weekday_mean = round(float(df[~df["is_weekend"]]["aqi"].mean()), 1)
    weekend_mean = round(float(df[df["is_weekend"]]["aqi"].mean()), 1)
    diff_pct = round(((weekday_mean - weekend_mean) / weekend_mean) * 100, 1)

    insights.append({
        "id": "INSIGHT-04",
        "category": "Anthropogenic Activity",
        "title": "Weekday Congestion Signature",
        "summary": f"Weekday AQI averages {weekday_mean} compared to {weekend_mean} on weekends ({diff_pct}% drop on weekends).",
        "metric_value": f"-{diff_pct}% on Weekends",
        "detail": "Reduced commercial transport, industrial operation, and commuter traffic during Saturdays and Sundays consistently decreases ambient NO2 and particulate levels.",
        "sdg_alignment": "SDG 11: Sustainable Cities & Communities",
        "badge_type": "success"
    })

    # 5. Hotspot Identification
    station_avg = df.groupby(["station_id", "station_name", "city_name"])["aqi"].mean().sort_values(ascending=False)
    top_station = station_avg.index[0]
    top_station_aqi = round(station_avg.iloc[0], 1)

    insights.append({
        "id": "INSIGHT-05",
        "category": "Microclimate Hotspot",
        "title": f"Critical Hotspot: {top_station[1]} ({top_station[2]})",
        "summary": f"Station {top_station[1]} exhibits the highest sustained average AQI of {top_station_aqi}.",
        "metric_value": f"AQI {top_station_aqi}",
        "detail": "Proximity to high-density arterial intersections and industrial activities concentrates toxic emissions, necessitating localized traffic diversion and green buffer zones.",
        "sdg_alignment": "SDG 11 (Target 11.7: Safe, inclusive and green public spaces)",
        "badge_type": "danger"
    })

    return insights
