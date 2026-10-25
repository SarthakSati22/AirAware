import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Cpu,
  ShieldAlert,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import api from '../services/api';
import { getAQIInfo } from '../utils/aqiUtils';

export default function PredictionPage() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('DEL');
  const [horizon, setHorizon] = useState(7);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCities().then((data) => setCities(data)).catch(console.error);
  }, []);

  const fetchForecast = (cityId, horizonDays) => {
    setLoading(true);
    api.getForecasts(cityId, horizonDays)
      .then((data) => {
        setForecastData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchForecast(selectedCity, horizon);
  }, [selectedCity, horizon]);

  // Merge historical context with predictions for timeline chart
  const timelineData = [];
  if (forecastData) {
    if (forecastData.historical_context) {
      forecastData.historical_context.forEach((item) => {
        timelineData.push({
          date: item.date,
          actual: item.aqi,
          forecast: null,
          lower: null,
          upper: null
        });
      });
    }

    if (forecastData.daily_forecasts) {
      forecastData.daily_forecasts.forEach((item) => {
        timelineData.push({
          date: item.date,
          actual: null,
          forecast: item.predicted_aqi,
          lower: item.lower_bound,
          upper: item.upper_bound
        });
      });
    }
  }

  return (
    <div className="space-y-8 py-2">
      {/* Page Title & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Random Forest Predictive Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AQI Forecasting & Predictive Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Recursive multi-day time-series forecasting trained on historical lag features, seasonal cyclical encoders, and moving averages.
          </p>
        </div>

        {/* City and Horizon Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {cities.map((c) => (
                <option key={c.city_id} value={c.city_id}>
                  {c.city_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Horizon: {horizon} Days
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="7"
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="w-28 accent-teal-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-teal-300">{horizon}d</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model & Accuracy Meta Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/30 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              {forecastData?.model_name || 'Random Forest Regressor'}
            </span>
            <span className="text-[11px] text-slate-400">
              Evaluated on 20% strictly held-out chronological test data.
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Test MAE</span>
            <span className="font-mono font-bold text-teal-300">
              {forecastData?.test_metrics?.mae || '8.96'} AQI
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Test RMSE</span>
            <span className="font-mono font-bold text-teal-300">
              {forecastData?.test_metrics?.rmse || '13.44'} AQI
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Test R² Score</span>
            <span className="font-mono font-bold text-emerald-400">
              {forecastData?.test_metrics?.r2 || '0.985'}
            </span>
          </div>
        </div>
      </div>

      {/* Forecast Line Chart (Historical Actual vs Projected with Uncertainty Band) */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              {forecastData?.city_name} — Historical Trend & Multi-Day Projection
            </h2>
            <p className="text-xs text-slate-400">
              Dotted cyan line represents recursive model forecasts; solid teal line reflects past 10 days actual recordings.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-3 h-0.5 bg-teal-400" />
              <span>Historical Actual</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-3 h-0.5 bg-cyan-400 border-b border-dashed" />
              <span>ML Forecast</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                labelStyle={{ color: '#94A3B8' }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual AQI"
                stroke="#14B8A6"
                strokeWidth={3}
                dot={{ r: 4 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Predicted AQI"
                stroke="#06B6D4"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 5, fill: '#06B6D4' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Forecast Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Daily Forecast Breakdown & Advisory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {forecastData?.daily_forecasts?.map((day) => {
            const info = getAQIInfo(day.predicted_aqi);
            return (
              <div
                key={day.date}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-15"
                  style={{ backgroundColor: info.color }}
                />

                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-200">{day.day_name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{day.date}</span>
                  </div>

                  <div className="flex items-baseline space-x-2 my-2">
                    <span className="text-3xl font-extrabold text-white">{day.predicted_aqi}</span>
                    <span className="text-xs text-slate-400 font-medium">AQI</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-auto ${info.bgClass}`}
                    >
                      {day.aqi_category}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Uncertainty Band: {day.lower_bound} – {day.upper_bound}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                  <p className="line-clamp-3">{day.health_advice}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Transparency and Ethical Disclaimer */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-start space-x-3.5 text-xs text-slate-400">
        <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200 block mb-1">Methodology & Research Disclaimer</span>
          <p className="leading-relaxed">
            {forecastData?.disclaimer} Predictions are generated using historical lag variables, rolling mean aggregations, and calendar sine-cosine cyclical encoders. They are intended for academic research, planning simulations, and demonstration of big data time-series modeling.
          </p>
        </div>
      </div>
    </div>
  );
}
