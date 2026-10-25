# AirAware Platform: Project Methodology & Engineering Report

## 1. Executive Summary & UN SDG Alignment

**AirAware** is an end-to-end Big Data Analytics and Machine Learning platform architected to analyze, monitor, and forecast air pollution levels across Indian metropolitan centers. The project is directly aligned with the United Nations Sustainable Development Goals:

- **SDG 3 (Good Health and Well-being) — Target 3.9:** Substantially reduce illnesses and deaths attributable to toxic ambient air pollution by providing transparent, granular risk evaluations.
- **SDG 11 (Sustainable Cities and Communities) — Target 11.6:** Reduce adverse per capita urban environmental impacts by tracking hotspot concentrations and forecasting pollution surges for targeted municipal mitigation.

---

## 2. Mathematical Formulation: CPCB NAQI Standard

Air quality indices are computed following the Central Pollution Control Board (CPCB) National Air Quality Index (NAQI) guidelines. For each pollutant concentration \(C_p\), the sub-index \(I_p\) is calculated using piece-wise linear interpolation between specified breakpoints:

$$I_p = \frac{I_{\text{hi}} - I_{\text{lo}}}{B_{\text{hi}} - B_{\text{lo}}} \cdot (C_p - B_{\text{lo}}) + I_{\text{lo}}$$

Where:
- \(C_p\): Observed concentration of pollutant \(p\)
- \(B_{\text{hi}}\), \(B_{\text{lo}}\): Upper and lower concentration breakpoints for the corresponding category
- \(I_{\text{hi}}\), \(I_{\text{lo}}\): Corresponding index breakpoints

The overall Air Quality Index (AQI) is defined as the maximum of individual sub-indices across monitored pollutants (provided at least three pollutants are available, with at least one being \(PM_{2.5}\) or \(PM_{10}\)):

$$\text{AQI} = \max(I_{PM_{2.5}}, I_{PM_{10}}, I_{NO_2}, I_{SO_2}, I_{CO}, I_{O_3})$$

### CPCB NAQI Breakpoint Matrix

| Category | AQI Range | PM2.5 (\(\mu\text{g/m}^3\)) | PM10 (\(\mu\text{g/m}^3\)) | NO2 (\(\mu\text{g/m}^3\)) | SO2 (\(\mu\text{g/m}^3\)) | CO (\(\text{mg/m}^3\)) | O3 (\(\mu\text{g/m}^3\)) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Good** | 0 – 50 | 0 – 30 | 0 – 50 | 0 – 40 | 0 – 40 | 0 – 1.0 | 0 – 50 |
| **Satisfactory** | 51 – 100 | 31 – 60 | 51 – 100 | 41 – 80 | 41 – 80 | 1.1 – 2.0 | 51 – 100 |
| **Moderate** | 101 – 200 | 61 – 90 | 101 – 250 | 81 – 180 | 81 – 380 | 2.1 – 10.0 | 101 – 168 |
| **Poor** | 201 – 300 | 91 – 120 | 251 – 350 | 181 – 280 | 381 – 800 | 10.1 – 17.0 | 169 – 208 |
| **Very Poor** | 301 – 400 | 121 – 250 | 351 – 430 | 281 – 400 | 801 – 1600 | 17.1 – 34.0 | 209 – 748 |
| **Severe** | 401 – 500 | 250+ | 430+ | 400+ | 1600+ | 34.0+ | 748+ |

---

## 3. Big Data Engineering Architecture Pipeline

The data architecture is composed of 10 distinct decoupled stages:

```
[CPCB & OpenAQ & Open-Meteo]
            │
            ▼
┌───────────────────────────┐
│ Stage 1: Data Ingestion   │ (scripts/import_csv.py / REST connectors)
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Stage 2: Data Validation  │ (Pydantic schema constraints & range checks)
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Stage 3: Data Cleaning    │ (Deduplication on composite key [station_id, timestamp])
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Stage 4: Transformation   │ (Timestamp normalization, NAQI sub-index calculation)
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Stage 5: MongoDB Storage  │ (Compound indexing: [city_id, timestamp], [station_id, timestamp])
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Stage 6: Aggregations     │ (MongoDB pipelines for daily/weekly/monthly trends)
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Stage 7: Analytics Engine │ (Cross-city comparisons, correlations, automated insights)
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Stage 8: ML Model Pipeline│ (Chronological lag engineering, Random Forest Regressor)
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Stage 9: FastAPI Delivery │ (Asynchronous REST API, pagination, CSV streaming)
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Stage 10: React UI Visuals│ (Vite, Tailwind, Recharts, Leaflet Hotspot Geospatial Map)
└───────────────────────────┘
```

---

## 4. Machine Learning Forecasting Methodology

### Feature Engineering
To predict future AQI values up to 7 days in advance without lookahead bias or data leakage:
1. **Lag Variables:** \(AQI_{t-1}\), \(AQI_{t-2}\), \(AQI_{t-3}\), \(AQI_{t-7}\)
2. **Rolling Statistics:** 3-day and 7-day backward moving averages shifted by 1 day
3. **Temporal Features:** Day of week, month, day of year, weekend indicator
4. **Cyclical Encoders:**
   $$\sin\left(\frac{2\pi \cdot \text{day\_of\_year}}{365.25}\right), \quad \cos\left(\frac{2\pi \cdot \text{day\_of\_year}}{365.25}\right)$$

### Validation & Benchmarking
- **Chronological Split:** 80% initial chronologically sorted data for training, strictly remaining 20% for testing.
- **Baseline Model:** Naive Persistence Forecasting (\(\hat{y}_t = y_{t-1}\)).
- **Primary Model:** Random Forest Regressor (120 estimators, max depth 12, random state 42).

### Actual Evaluation Results
- **Random Forest:** MAE = **8.96 AQI**, RMSE = **13.44 AQI**, \(R^2\) = **0.9851**
- **Persistence Baseline:** MAE = **14.64 AQI**, RMSE = **21.76 AQI**, \(R^2\) = **0.9609**
- **Empirical Improvement:** **38.79% MAE reduction** over the baseline model.
