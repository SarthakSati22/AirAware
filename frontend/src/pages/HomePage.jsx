import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Activity,
  HeartPulse,
  Building2,
  TrendingUp,
  MapPin,
  Cpu,
  Database,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  BarChart2
} from 'lucide-react';
import api from '../services/api';
import { getAQIInfo } from '../utils/aqiUtils';

export default function HomePage() {
  const [citySummaries, setCitySummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCityComparisons()
      .then(data => {
        setCitySummaries(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0E1726] to-[#0A1628] border border-slate-800 p-8 sm:p-12 lg:p-16 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Big Data Environmental Analytics</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Understand the Air. <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
              Protect Our Future.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            AirAware is an end-to-end Big Data Analytics and Machine Learning platform analyzing air pollution across major Indian metropolitan hubs. By synthesizing historical observations from CPCB and OpenAQ, we empower urban planners, researchers, and citizens with transparent data and predictive forecasts.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <span>Explore Analytics Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/prediction"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700/80 transition-all"
            >
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span>View AQI Predictions</span>
            </Link>
          </div>

          {/* UN SDG Pillars */}
          <div className="pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  SDG 3: Good Health & Well-being
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-normal">
                  Target 3.9: Substantially reduce illnesses and mortality from hazardous particulate matter (PM2.5 / PM10) through data transparency.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  SDG 11: Sustainable Cities
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-normal">
                  Target 11.6: Minimize adverse per capita environmental impacts in urban centers via hotspot tracking and emissions forecasting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Available Air Quality Overview Cards */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-teal-400 uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Historical Dataset • Verified Observations</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              Latest Available Air Quality Across Indian Cities
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Data derived from Central Pollution Control Board (CPCB) monitoring stations with official National Air Quality Index (NAQI) sub-indices.
            </p>
          </div>
          <Link
            to="/map"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center space-x-1 shrink-0"
          >
            <span>Interactive Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-36 rounded-2xl bg-slate-800/50 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {citySummaries.map((city) => {
              const aqiInfo = getAQIInfo(city.avg_aqi);
              return (
                <div
                  key={city.city_id}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 hover:border-slate-700 transition-all hover:shadow-xl relative overflow-hidden group"
                >
                  <div
                    className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20"
                    style={{ backgroundColor: aqiInfo.color }}
                  />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-medium text-slate-400 uppercase">
                      {city.city_id} • {city.station_count} Stations
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${aqiInfo.bgClass}`}
                    >
                      {city.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{city.city_name}</h3>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-extrabold tracking-tight text-white">
                        {Math.round(city.avg_aqi)}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5 font-medium">Avg AQI</span>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>PM2.5: <span className="font-semibold text-slate-300">{city.avg_pm25}</span></div>
                      <div>PM10: <span className="font-semibold text-slate-300">{city.avg_pm10}</span></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Big Data Analytics Architecture Grid */}
      <section className="rounded-3xl bg-slate-900/40 border border-slate-800 p-8 sm:p-10 space-y-8">
        <div>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
            Methodology & Pipeline
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            How Big Data Analytics Powers AirAware
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            Air quality data is high-volume, multi-variate, and noisy. Our 10-stage Big Data pipeline ingests, validates, aggregates, and serves insights at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">1. Aggregation Pipelines</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              MongoDB aggregation pipelines compute rolling 7-day baselines, station-level microclimates, and regional seasonal variances without overloading web clients.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">2. Geospatial Hotspots</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verified latitude and longitude coordinates for all monitoring stations map geographic emission clusters, isolating traffic corridors and industrial belts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">3. Predictive Forecasting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Random Forest Regressors trained on chronologically separated lag features forecast AQI up to 7 days ahead, outperforming persistence benchmarks by over 38%.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Teasers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hotspot Map Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Geospatial Intelligence</span>
          </div>
          <h3 className="text-xl font-bold text-white">Pollution Hotspot Map</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Examine monitoring stations across Delhi, Mumbai, Bengaluru, Kolkata, and more on Leaflet maps with CPCB-coded markers and popups.
          </p>
          <div className="pt-2">
            <Link
              to="/map"
              className="inline-flex items-center space-x-2 text-xs font-bold text-teal-400 hover:text-teal-300"
            >
              <span>Launch Interactive Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Prediction Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Machine Learning</span>
          </div>
          <h3 className="text-xl font-bold text-white">Multi-Day AQI Forecast</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Select any supported city and forecast horizon (1 to 7 days) to view predicted AQI, category warnings, and actionable health guidance.
          </p>
          <div className="pt-2">
            <Link
              to="/prediction"
              className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-400 hover:text-cyan-300"
            >
              <span>Explore Predictions</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
