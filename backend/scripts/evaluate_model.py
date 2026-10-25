"""
AirAware Model Evaluation Script: evaluate_model.py
Displays detailed offline performance metrics and feature rankings.
"""

import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.ml.trainer import get_model_evaluation_metrics

if __name__ == "__main__":
    meta = get_model_evaluation_metrics()
    print("=" * 60)
    print("AIRAWARE MODEL EVALUATION & FEATURE ANALYSIS")
    print("=" * 60)
    print(f"Model: {meta['model_name']}")
    print(f"Metrics -> MAE: {meta['metrics']['mae']} | RMSE: {meta['metrics']['rmse']} | R²: {meta['metrics']['r2']}")
    print("-" * 60)
    print("Top Feature Importances:")
    for feat in meta["feature_importances"][:8]:
        bar = "█" * int(feat["importance"] * 50)
        print(f"  {feat['feature']:<16} : {feat['importance']:.4f} {bar}")
    print("=" * 60)
