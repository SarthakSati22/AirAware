import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Cpu,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  Calendar,
  Layers,
  Info,
  ShieldCheck,
  Zap
} from 'lucide-react';
import api from '../services/api';

export default function ModelEvaluationPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getModelMetrics()
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading Model Evaluation Metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Empirical Validation & Benchmarking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Machine Learning Model Evaluation
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Transparent performance auditing comparing the Random Forest Regressor against a naive Persistence baseline over strictly held-out chronological test observations.
        </p>
      </div>

      {/* KPI Comparison Cards: Random Forest vs Baseline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MAE Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Mean Absolute Error (MAE)</span>
            <span className="text-emerald-400 text-xs font-bold font-mono">
              -{metrics?.improvement_pct?.mae}% Error
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-3xl font-extrabold text-white">{metrics?.metrics?.mae}</span>
              <span className="text-xs text-slate-400 ml-1">AQI (RF Model)</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono text-slate-400 line-through">
                {metrics?.baseline_metrics?.mae}
              </span>
              <span className="text-[10px] text-slate-400 block">Baseline</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Average magnitude of errors in AQI units. Lower is strictly better.
          </p>
        </div>

        {/* RMSE Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Root Mean Squared Error (RMSE)</span>
            <span className="text-emerald-400 text-xs font-bold font-mono">
              -{metrics?.improvement_pct?.rmse}% Error
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-3xl font-extrabold text-white">{metrics?.metrics?.rmse}</span>
              <span className="text-xs text-slate-400 ml-1">AQI (RF Model)</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono text-slate-400 line-through">
                {metrics?.baseline_metrics?.rmse}
              </span>
              <span className="text-[10px] text-slate-400 block">Baseline</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Heavily penalizes larger outlier prediction misses.
          </p>
        </div>

        {/* R-squared Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">R-Squared Coefficient (R²)</span>
            <span className="text-teal-400 text-xs font-bold font-mono">High Fit</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-3xl font-extrabold text-emerald-400">{metrics?.metrics?.r2}</span>
              <span className="text-xs text-slate-400 ml-1">(RF Model)</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono text-slate-400">
                {metrics?.baseline_metrics?.r2}
              </span>
              <span className="text-[10px] text-slate-400 block">Baseline</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Proportion of variance explained by lag & cyclical features.
          </p>
        </div>
      </div>

      {/* Actual vs Predicted on Test Set Line Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Actual vs Predicted Line Comparison (Held-Out Test Set)</h2>
            <p className="text-xs text-slate-400">
              Evaluated sequentially chronologically to prevent lookahead data leakage.
            </p>
          </div>
          <span className="text-xs text-teal-400 font-mono bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/30">
            Test Window: {metrics?.test_date_range?.start} to {metrics?.test_date_range?.end}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics?.actual_vs_predicted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                labelStyle={{ color: '#94A3B8' }}
              />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Actual AQI" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="predicted" name="Random Forest Prediction" stroke="#06B6D4" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="baseline" name="Persistence Baseline" stroke="#64748B" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Importance & Error Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importances */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-1">Gini Feature Importances</h2>
          <p className="text-xs text-slate-400 mb-6">
            Relative weight assigned to lags, rolling statistics, and calendar cyclical variables.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.feature_importances?.slice(0, 7)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="feature" type="category" stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Bar dataKey="importance" name="Importance" fill="#14B8A6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Error Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-1">Residual Error Distribution (Histogram)</h2>
          <p className="text-xs text-slate-400 mb-6">
            Bell curve centered near 0 AQI indicates unbiased predictions without systemic skew.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.error_distribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="bin" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Bar dataKey="count" name="Frequency" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dataset & Training Provenance Meta */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Total Historical Records</span>
          <span className="font-mono font-bold text-white text-base">
            {metrics?.total_samples?.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Training Observations</span>
          <span className="font-mono font-bold text-teal-300 text-base">
            {metrics?.train_samples?.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Testing Observations</span>
          <span className="font-mono font-bold text-cyan-300 text-base">
            {metrics?.test_samples?.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Model Algorithm & Version</span>
          <span className="font-mono font-bold text-slate-200 text-base">
            RF {metrics?.model_version}
          </span>
        </div>
      </div>
    </div>
  );
}
