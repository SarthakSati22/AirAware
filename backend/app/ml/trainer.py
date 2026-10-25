"""
AirAware Machine Learning Forecasting Pipeline
Implements:
1. Chronological feature engineering (lags, rolling statistics, cyclical calendar features).
2. Strict train-test split without data leakage.
3. Baseline persistence forecasting model.
4. Random Forest Regressor time-series forecasting model.
5. Rigorous evaluation (MAE, RMSE, R2, error distribution, feature importances).
6. Model artifact persistence with joblib.
"""

import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, List, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.config import settings
from app.database import get_database

ARTIFACTS_DIR = Path(settings.MODEL_DIR)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = ARTIFACTS_DIR / "rf_aqi_model.joblib"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"

FEATURE_COLS = [
    "lag_1", "lag_2", "lag_3", "lag_7",
    "rolling_mean_3", "rolling_mean_7",
    "day_of_week", "month", "day_of_year", "is_weekend",
    "sin_day", "cos_day"
]

def prepare_time_series_features(df: pd.DataFrame) -> pd.DataFrame:
    """Prepares lag and temporal features strictly chronologically."""
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Lags of AQI
    df["lag_1"] = df["aqi"].shift(1)
    df["lag_2"] = df["aqi"].shift(2)
    df["lag_3"] = df["aqi"].shift(3)
    df["lag_7"] = df["aqi"].shift(7)

    # Rolling window statistics (using shift(1) to avoid lookahead bias!)
    df["rolling_mean_3"] = df["aqi"].shift(1).rolling(window=3).mean()
    df["rolling_mean_7"] = df["aqi"].shift(1).rolling(window=7).mean()

    # Temporal features
    df["day_of_week"] = df["date"].dt.weekday
    df["month"] = df["date"].dt.month
    df["day_of_year"] = df["date"].dt.dayofyear
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Cyclical day of year encoding
    df["sin_day"] = np.sin(2 * np.pi * df["day_of_year"] / 365.25)
    df["cos_day"] = np.cos(2 * np.pi * df["day_of_year"] / 365.25)

    # Drop rows with NaN from lags
    df = df.dropna().reset_index(drop=True)
    return df

def train_and_evaluate_model() -> Dict[str, Any]:
    """
    Trains Random Forest Regressor and evaluates against Persistence Baseline.
    Saves trained model and detailed evaluation metrics.
    """
    db = get_database()
    readings = list(db.air_quality_readings.find({}, {
        "city_id": 1, "date": 1, "aqi": 1, "pm25": 1, "pm10": 1
    }).sort("date", 1))

    if not readings:
        raise ValueError("No historical readings found in database for model training.")

    raw_df = pd.DataFrame(readings)
    # Aggregate to daily city-level average AQI
    daily_city = raw_df.groupby(["city_id", "date"]).agg({
        "aqi": "mean",
        "pm25": "mean",
        "pm10": "mean"
    }).reset_index()

    # Engineer features per city
    processed_dfs = []
    for city_id, group in daily_city.groupby("city_id"):
        feat_df = prepare_time_series_features(group)
        processed_dfs.append(feat_df)

    full_df = pd.concat(processed_dfs, ignore_index=True)
    full_df = full_df.sort_values("date").reset_index(drop=True)

    # Chronological Split (80% Train, 20% Test)
    unique_dates = sorted(full_df["date"].unique())
    split_idx = int(len(unique_dates) * 0.80)
    split_date = unique_dates[split_idx]

    train_mask = full_df["date"] < split_date
    test_mask = full_df["date"] >= split_date

    X_train = full_df.loc[train_mask, FEATURE_COLS]
    y_train = full_df.loc[train_mask, "aqi"]
    X_test = full_df.loc[test_mask, FEATURE_COLS]
    y_test = full_df.loc[test_mask, "aqi"]

    # Baseline Model: Persistence (Predicted AQI = Yesterday's AQI: lag_1)
    baseline_preds = full_df.loc[test_mask, "lag_1"].values
    baseline_mae = float(mean_absolute_error(y_test, baseline_preds))
    baseline_rmse = float(np.sqrt(mean_squared_error(y_test, baseline_preds)))
    baseline_r2 = float(r2_score(y_test, baseline_preds))

    # Machine Learning Model: Random Forest Regressor
    model = RandomForestRegressor(
        n_estimators=120,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Predictions on held-out test data
    test_preds = model.predict(X_test)
    test_mae = float(mean_absolute_error(y_test, test_preds))
    test_rmse = float(np.sqrt(mean_squared_error(y_test, test_preds)))
    test_r2 = float(r2_score(y_test, test_preds))

    # Calculate Improvement
    mae_improvement = round(((baseline_mae - test_mae) / baseline_mae) * 100, 2)
    rmse_improvement = round(((baseline_rmse - test_rmse) / baseline_rmse) * 100, 2)

    # Feature Importances
    importances = model.feature_importances_
    feat_importance_list = [
        {"feature": feat, "importance": round(float(imp), 4)}
        for feat, imp in sorted(zip(FEATURE_COLS, importances), key=lambda x: x[1], reverse=True)
    ]

    # Error distribution
    errors = y_test - test_preds
    error_hist, bin_edges = np.histogram(errors, bins=12)
    error_dist = []
    for i in range(len(error_hist)):
        bin_label = f"{int(bin_edges[i])} to {int(bin_edges[i+1])}"
        error_dist.append({"bin": bin_label, "count": int(error_hist[i])})

    # Sample actual vs predicted for chart (downsampled for clean UI rendering)
    test_df_eval = full_df.loc[test_mask, ["date", "city_id", "aqi"]].copy()
    test_df_eval["predicted"] = test_preds.round(1)
    test_df_eval["baseline"] = baseline_preds.round(1)
    test_df_eval["error"] = (test_df_eval["aqi"] - test_df_eval["predicted"]).round(1)

    # Take Delhi or aggregate test samples for display
    sample_records = []
    sample_sub = test_df_eval[test_df_eval["city_id"] == "DEL"].tail(45)
    for _, row in sample_sub.iterrows():
        sample_records.append({
            "date": str(row["date"].strftime("%Y-%m-%d")),
            "actual": round(float(row["aqi"]), 1),
            "predicted": round(float(row["predicted"]), 1),
            "baseline": round(float(row["baseline"]), 1),
            "error": round(float(row["error"]), 1)
        })

    metadata = {
        "model_name": "Random Forest Regressor (Time-Series Ensemble)",
        "model_version": "v1.2.0",
        "trained_at": datetime.utcnow().isoformat(),
        "training_date_range": {
            "start": str(full_df.loc[train_mask, "date"].min().strftime("%Y-%m-%d")),
            "end": str(full_df.loc[train_mask, "date"].max().strftime("%Y-%m-%d"))
        },
        "test_date_range": {
            "start": str(full_df.loc[test_mask, "date"].min().strftime("%Y-%m-%d")),
            "end": str(full_df.loc[test_mask, "date"].max().strftime("%Y-%m-%d"))
        },
        "total_samples": len(full_df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "metrics": {
            "mae": round(test_mae, 2),
            "rmse": round(test_rmse, 2),
            "r2": round(test_r2, 4)
        },
        "baseline_metrics": {
            "mae": round(baseline_mae, 2),
            "rmse": round(baseline_rmse, 2),
            "r2": round(baseline_r2, 4)
        },
        "improvement_pct": {
            "mae": mae_improvement,
            "rmse": rmse_improvement
        },
        "feature_importances": feat_importance_list,
        "error_distribution": error_dist,
        "actual_vs_predicted": sample_records
    }

    # Save model artifact and metadata
    joblib.dump(model, MODEL_PATH)
    import json
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return metadata

def get_model_evaluation_metrics() -> Dict[str, Any]:
    """Retrieves cached model evaluation metrics or trains if not yet created."""
    if not METADATA_PATH.exists() or not MODEL_PATH.exists():
        return train_and_evaluate_model()

    import json
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def generate_multi_day_forecast(city_id: str, horizon_days: int = 7) -> Dict[str, Any]:
    """
    Generates multi-day recursive AQI forecast for the specified city.
    Uses trained Random Forest model and historical context.
    """
    horizon_days = max(1, min(7, horizon_days))
    if not MODEL_PATH.exists():
        train_and_evaluate_model()

    model = joblib.load(MODEL_PATH)
    metrics_meta = get_model_evaluation_metrics()

    db = get_database()
    # Fetch city metadata
    city = db.cities.find_one({"city_id": city_id})
    city_name = city.get("city_name", city_id) if city else city_id

    # Retrieve last 14 days of city daily readings for context
    readings = list(db.air_quality_readings.find(
        {"city_id": city_id},
        {"date": 1, "aqi": 1, "pm25": 1, "pm10": 1}
    ).sort("date", -1).limit(14 * 4))

    if not readings:
        raise ValueError(f"Insufficient historical observations found for city {city_id}.")

    raw_df = pd.DataFrame(readings)
    daily = raw_df.groupby("date").agg({"aqi": "mean", "pm25": "mean", "pm10": "mean"}).reset_index()
    daily["date"] = pd.to_datetime(daily["date"])
    daily = daily.sort_values("date").reset_index(drop=True)

    # Historical context for charting (last 10 days)
    hist_context = []
    for _, row in daily.tail(10).iterrows():
        hist_context.append({
            "date": row["date"].strftime("%Y-%m-%d"),
            "aqi": round(float(row["aqi"])),
            "type": "Historical Actual"
        })

    # Prepare buffer for recursive forecasting
    aqi_history = list(daily["aqi"].values)
    last_date = daily["date"].iloc[-1]

    forecasts = []
    category_health = {
        "Good": "Air quality is considered satisfactory; air pollution poses little or no risk.",
        "Satisfactory": "Minor breathing discomfort to sensitive people. Ideal for outdoor exercise.",
        "Moderate": "Breathing discomfort to people with lungs, asthma and heart diseases.",
        "Poor": "Breathing discomfort to most people on prolonged exposure. Wear N95 masks.",
        "Very Poor": "Respiratory illness on prolonged exposure. Avoid strenuous outdoor activities.",
        "Severe": "Affects healthy people and seriously impacts those with existing diseases. Stay indoors."
    }

    def get_cat(val):
        if val <= 50: return "Good"
        elif val <= 100: return "Satisfactory"
        elif val <= 200: return "Moderate"
        elif val <= 300: return "Poor"
        elif val <= 400: return "Very Poor"
        else: return "Severe"

    for step in range(1, horizon_days + 1):
        target_date = last_date + timedelta(days=step)
        d_of_w = target_date.weekday()
        month = target_date.month
        d_of_y = target_date.timetuple().tm_yday
        is_wknd = 1 if d_of_w >= 5 else 0
        sin_d = np.sin(2 * np.pi * d_of_y / 365.25)
        cos_d = np.cos(2 * np.pi * d_of_y / 365.25)

        # Lags from historical + forecasted buffer
        lag_1 = aqi_history[-1]
        lag_2 = aqi_history[-2] if len(aqi_history) >= 2 else lag_1
        lag_3 = aqi_history[-3] if len(aqi_history) >= 3 else lag_2
        lag_7 = aqi_history[-7] if len(aqi_history) >= 7 else lag_3

        rolling_3 = float(np.mean(aqi_history[-3:]))
        rolling_7 = float(np.mean(aqi_history[-7:]))

        feat_vector = pd.DataFrame([{
            "lag_1": lag_1,
            "lag_2": lag_2,
            "lag_3": lag_3,
            "lag_7": lag_7,
            "rolling_mean_3": rolling_3,
            "rolling_mean_7": rolling_7,
            "day_of_week": d_of_w,
            "month": month,
            "day_of_year": d_of_y,
            "is_weekend": is_wknd,
            "sin_day": sin_d,
            "cos_day": cos_d
        }])[FEATURE_COLS]

        pred_val = float(model.predict(feat_vector)[0])
        # Uncertainty band expands with horizon
        uncertainty = 6.0 + (step * 2.5)
        lower_b = max(10, int(round(pred_val - uncertainty)))
        upper_b = min(500, int(round(pred_val + uncertainty)))
        pred_int = int(round(pred_val))
        cat_name = get_cat(pred_int)

        forecasts.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "day_name": target_date.strftime("%A"),
            "predicted_aqi": pred_int,
            "aqi_category": cat_name,
            "lower_bound": lower_b,
            "upper_bound": upper_b,
            "health_advice": category_health[cat_name]
        })

        # Append recursive prediction to history for next day's features
        aqi_history.append(pred_val)

    return {
        "city_id": city_id,
        "city_name": city_name,
        "horizon_days": horizon_days,
        "generated_at": datetime.utcnow().isoformat(),
        "model_name": "Random Forest Regressor (Time-Series Ensemble)",
        "model_version": "v1.2.0",
        "test_metrics": metrics_meta["metrics"],
        "daily_forecasts": forecasts,
        "historical_context": hist_context,
        "disclaimer": "Forecasts are generated by a trained Random Forest predictive model for research and demonstration purposes. They represent statistical projections and are not official CPCB meteorological forecasts."
    }
