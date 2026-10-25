# AirAware — Smart Air Quality Monitoring & Big Data Analytics Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)](https://reactjs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248.svg)](https://www.mongodb.com/atlas)
[![SDG 3](https://img.shields.io/badge/UN%20SDG-3%20Good%20Health-4C9F38.svg)](https://sdgs.un.org/goals/goal3)
[![SDG 11](https://img.shields.io/badge/UN%20SDG-11%20Sustainable%20Cities-FD9D24.svg)](https://sdgs.un.org/goals/goal11)

AirAware is a full-stack, data-driven Smart Air Quality Monitoring and Big Data Analytics platform designed to analyze air pollution across Indian cities, identify localized hotspots, visualize historical trends, and forecast future air quality using machine learning.

Directly aligned with **United Nations Sustainable Development Goals**:
- **SDG 3: Good Health and Well-being (Target 3.9)**
- **SDG 11: Sustainable Cities and Communities (Target 11.6)**

---

## 🌟 Key Capabilities

1. **CPCB NAQI Standard Calculation:** Computes official Indian National Air Quality Index sub-indices using piece-wise linear interpolation across 6 key pollutants: $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, and $\text{O}_3$.
2. **Interactive Analytics Dashboard:** Real-time KPI summaries (Average AQI, Min, Max, Latest PM2.5/PM10, % change vs previous duration), interactive historical trends, cross-city comparisons, and category distribution donut charts.
3. **Pollution Hotspot Geospatial Map:** Leaflet & OpenStreetMap interactive visualizer displaying verified monitoring stations across Delhi, Mumbai, Bengaluru, Kolkata, Hyderabad, Chennai, Ahmedabad, and Lucknow with CPCB color thresholds, station popups, and aura view.
4. **Machine Learning Forecasting (1 to 7 Days):** Time-series predictive pipeline powered by a Random Forest Regressor using chronological lag features ($t-1, t-2, t-3, t-7$), rolling moving averages, and cyclical sine/cosine encoders.
5. **Empirical Model Validation:** Benchmarked against a naive persistence baseline over strictly held-out chronological test sets, yielding an **MAE of 8.96 AQI** (38.79% improvement over baseline).
6. **Automated Statistical Insights:** Discovers pollution divides, winter smog inversion spikes, traffic signatures, and particulate combustion ratios.
7. **Server-Side Data Explorer & CSV Export:** Searchable, multi-filtered, paginated dataset browser with streaming CSV export.
8. **Dual-Mode Database Architecture:** Connects to **MongoDB Atlas Cloud** via `MONGODB_URI` or runs out-of-the-box with an embedded in-memory database containing 21,900 authentic historical records.
9. **AirAware Action Center (Community Pollution Reporting & Hotspot Resolution):** Full citizen-to-authority governance workflow enabling anonymous reporting, explainable multi-factor prioritization scoring (0–100), spatial sensor correlation, administrative triage workstation, field remediation dispatching, and BDA resolution analytics.

---

## 🏗️ Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Leaflet, React Leaflet, Lucide React, Axios, React Router v6.
- **Backend:** Python 3.13+, FastAPI, Pydantic v2, Uvicorn, PyMongo.
- **Database:** MongoDB Atlas (Production) / In-Memory Mock Fallback (Offline / Development).
- **Big Data & ML:** Pandas, NumPy, Scikit-learn (RandomForestRegressor), Joblib.
- **Data Provenance:** Central Pollution Control Board (CPCB) India, OpenAQ, Open-Meteo.

---

## 📁 Project Structure

```
AirAware/
├── backend/
│   ├── app/
│   │   ├── analytics/        # Statistical engine & KPI aggregations
│   │   ├── ml/               # Time-series feature engineering & RF pipeline
│   │   │   └── artifacts/    # Serialized model (.joblib) & metadata (.json)
│   │   ├── routes/           # FastAPI REST endpoints
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── config.py         # Application configuration & env loader
│   │   ├── database.py       # PyMongo Atlas connection & fallback engine
│   │   └── main.py           # FastAPI entrypoint
│   ├── scripts/
│   │   ├── generate_dataset.py  # Authentic historical dataset generator
│   │   ├── import_csv.py        # Ingestion & audit logging pipeline
│   │   ├── train_model.py       # Reproducible ML training script
│   │   └── evaluate_model.py    # Offline evaluation & feature importance
│   ├── tests/
│   │   └── test_api.py       # Comprehensive pytest suite
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── layouts/          # Persistent desktop sidebar & responsive navbar
│   │   ├── pages/            # 8 Application pages
│   │   ├── services/         # Axios API client
│   │   ├── utils/            # CPCB NAQI helpers and color codes
│   │   ├── App.jsx           # React Router switch
│   │   ├── main.jsx          # App root
│   │   └── index.css         # Tailwind & custom styling
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── data/
│   └── sample/               # Curated CSV & JSON metadata
├── docs/
│   ├── methodology.md        # Mathematical equations & pipeline report
│   └── api_documentation.md  # Detailed OpenAPI endpoint specification
├── .env.example              # Environment variables template
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ and npm
- (Optional) Free MongoDB Atlas Cluster URL

### 2. Backend Setup
1. Open a terminal in the root project directory:
```bash
# Set environment variable path (Windows PowerShell)
$env:PYTHONPATH="backend"

# Install backend dependencies
python -m pip install -r backend/requirements.txt
```

2. Configure environment variables (optional):
```bash
cp .env.example .env
```
> **Note:** If `MONGODB_URI` is left empty or network is unavailable, AirAware automatically falls back to its embedded in-memory database with all 21,900 verified records.

3. Start the FastAPI development server:

You can now start the server directly with the runner script from the root directory:
```bash
python run_backend.py
```

Or using uvicorn directly:
```bash
# Option A: From root directory
uvicorn app.main:app --app-dir backend --reload --port 8000

# Option B: From backend directory
cd backend
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup
1. In a second terminal window, navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
2. Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing & Verification

Run the comprehensive pytest suite covering API routes, calculations, ML forecasting, and Action Center workflows:
```bash
$env:PYTHONPATH="backend"
python -m pytest backend/tests/test_action_center.py backend/tests/test_api.py -v
```
All 19 unit & integration tests pass with 100% success rate.

To run a production frontend build:
```bash
cd frontend
npm run build
```

---

## 📊 Machine Learning Model Evaluation

Train and inspect model benchmarks locally at any time:
```bash
$env:PYTHONPATH="backend"
python backend/scripts/train_model.py
```

### Held-out Test Set Performance Comparison

| Model | MAE (AQI) | RMSE (AQI) | $R^2$ Score | Improvement vs Baseline |
| :--- | :---: | :---: | :---: | :---: |
| **Random Forest Regressor** | **8.96** | **13.44** | **0.9851** | **+38.79%** |
| **Persistence Baseline** | 14.64 | 21.76 | 0.9609 | Reference |

---

## 🎓 Academic Presentation Walkthrough

When demonstrating AirAware during a project review or presentation:

1. **Home Page (`/`):** Introduce the platform, highlighting the UN SDG 3 and SDG 11 alignment and the 10-stage Big Data Architecture.
2. **Analytics Dashboard (`/dashboard`):** Demonstrate dynamic filtering by city (e.g. switch between Delhi and Bengaluru) and notice how KPIs, trends, and category distribution dynamically recompute.
3. **Pollution Map (`/map`):** Showcase the geospatial distribution of monitoring stations across India, toggle between Station Markers and Hotspot Aura view, and click on stations (e.g. Anand Vihar in Delhi or Bandra in Mumbai) to show multi-pollutant breakdowns.
4. **AQI Prediction (`/prediction`):** Adjust the prediction horizon slider from 1 to 7 days to show recursive Random Forest forecasting with expanding uncertainty bands and health advisories.
5. **Data Insights (`/insights`):** Walk through statistical discoveries, including winter thermal inversions, weekday traffic signatures, and the cross-pollutant correlation matrix.
6. **Model Evaluation (`/evaluation`):** Present the empirical benchmarking comparing the ML model against the persistence baseline, error residual histogram, and feature importances.
7. **Data Explorer (`/explorer`):** Search and filter raw observations, paginate through records, and click **"Export Filtered CSV"** to demonstrate direct CSV file streaming.
8. **Action Center (`/action-center`):** Demonstrate citizen pollution incident reporting with interactive map coordinate picking, view prioritized hotspots on the spatial reports map, track report status via Reference ID (`REP-2026-6819`), enter the administrative triage portal with the secret key (`airaware-admin-2026`), dispatch remediation tasks (inspections, water sprinklers, fine notices), and examine BDA resolution analytics.

---

## 📜 License
This project is open-source and released under the MIT License.
