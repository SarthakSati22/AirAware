"""
AirAware ML Training Script: train_model.py
Executes reproducible training of Random Forest AQI forecasting model.
"""

import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.ml.trainer import train_and_evaluate_model

if __name__ == "__main__":
    print("Starting ML Model Training...")
    results = train_and_evaluate_model()
    print("=" * 60)
    print("AIRAWARE MODEL TRAINING REPORT")
    print("=" * 60)
    print(f"Model: {results['model_name']} ({results['model_version']})")
    print(f"Total Samples: {results['total_samples']} | Train: {results['train_samples']} | Test: {results['test_samples']}")
    print(f"Training Range: {results['training_date_range']['start']} to {results['training_date_range']['end']}")
    print(f"Testing Range:  {results['test_date_range']['start']} to {results['test_date_range']['end']}")
    print("-" * 60)
    print("Random Forest Regressor Performance:")
    print(f"  MAE:  {results['metrics']['mae']} AQI")
    print(f"  RMSE: {results['metrics']['rmse']} AQI")
    print(f"  R²:   {results['metrics']['r2']}")
    print("-" * 60)
    print("Baseline Persistence Performance:")
    print(f"  MAE:  {results['baseline_metrics']['mae']} AQI")
    print(f"  RMSE: {results['baseline_metrics']['rmse']} AQI")
    print(f"  R²:   {results['baseline_metrics']['r2']}")
    print("-" * 60)
    print(f"Improvement over Baseline: MAE: {results['improvement_pct']['mae']}% | RMSE: {results['improvement_pct']['rmse']}%")
    print("=" * 60)
    print("Model artifact successfully saved to backend/app/ml/artifacts/")
