import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Filter,
  TrendingDown,
  TrendingUp,
  Activity,
  Wind,
  Layers,
  Calendar,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { getAQIInfo } from '../utils/aqiUtils';

export default function DashboardPage() {
  const [cities, setCities] = useState([]);
  const [stations, setStations] = useState([]);

  // Filter States
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [aggregation, setAggregation] = useState('monthly');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');

  // Data States
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cities on mount
  useEffect(() => {
    api.getCities().then(data => setCities(data)).catch(console.error);
  }, []);

  // Load stations when city changes
  useEffect(() => {
    if (selectedCity && selectedCity !== 'ALL') {
      api.getStations(selectedCity).then(data => setStations(data)).catch(console.error);
    } else {
      setStations([]);
      setSelectedStation('ALL');
    }
  }, [selectedCity]);

  // Fetch Dashboard Data
  useEffect(() => {
    setLoading(true);
    const params = {
      city_id: selectedCity !== 'ALL' ? selectedCity : undefined,
      station_id: selectedStation !== 'ALL' ? selectedStation : undefined,
      aggregation: aggregation,
      start_date: startDate,
      end_date: endDate
    };

    Promise.all([
      api.getDashboardSummary(params),
      api.getHistoricalTrends(params),
      api.getCityComparisons({ start_date: startDate, end_date: endDate }),
      api.getAQICategories({
        city_id: selectedCity !== 'ALL' ? selectedCity : undefined,
        start_date: startDate,
        end_date: endDate
      })
    ])
      .then(([summaryRes, trendsRes, compRes, catRes]) => {
        setKpis(summaryRes);
        setTrends(trendsRes || []);
        setComparisons(compRes || []);
        setCategories(catRes || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      });
  }, [selectedCity, selectedStation, aggregation, startDate, endDate]);

  const handleResetFilters = () => {
    setSelectedCity('ALL');
    setSelectedStation('ALL');
    setAggregation('monthly');
    setStartDate('2023-01-01');
    setEndDate('2024-12-31');
  };

  const aqiInfo = getAQIInfo(kpis?.average_aqi);

  return (
    <div className="space-y-8 py-2">
      {/* Page Title & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Interactive Analytics Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time querying over historical CPCB & OpenAQ datasets across Indian monitoring stations.
          </p>
        </div>

        <button
          onClick={handleResetFilters}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Filter Panel */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* City Filter */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            City
          </label>
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setSelectedStation('ALL');
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Supported Cities</option>
            {cities.map((c) => (
              <option key={c.city_id} value={c.city_id}>
                {c.city_name} ({c.state})
              </option>
            ))}
          </select>
        </div>

        {/* Station Filter */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Monitoring Station
          </label>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            disabled={selectedCity === 'ALL'}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 disabled:opacity-50"
          >
            <option value="ALL">All Stations in City</option>
            {stations.map((s) => (
              <option key={s.station_id} value={s.station_id}>
                {s.station_name}
              </option>
            ))}
          </select>
        </div>

        {/* Aggregation Filter */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Time Interval
          </label>
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="daily">Daily Resolution</option>
            <option value="weekly">Weekly Average</option>
            <option value="monthly">Monthly Aggregate</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            min="2023-01-01"
            max="2024-12-31"
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            min="2023-01-01"
            max="2024-12-31"
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Average AQI */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average AQI</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {kpis?.average_aqi != null && !isNaN(kpis.average_aqi) ? Math.round(kpis.average_aqi) : (loading ? '...' : '—')}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${aqiInfo.bgClass}`}>
              {kpis?.aqi_category || (loading ? 'Loading' : 'N/A')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 truncate">
            {kpis?.data_quality_note || (loading ? 'Querying sensor records...' : 'No data')}
          </p>
        </div>

        {/* Card 2: Period Percentage Change */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Change vs Prev</span>
            {kpis?.pct_change_vs_prev_period != null && kpis.pct_change_vs_prev_period > 0 ? (
              <TrendingUp className="w-4 h-4 text-rose-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span
              className={`text-2xl font-extrabold ${
                kpis?.pct_change_vs_prev_period == null || isNaN(kpis.pct_change_vs_prev_period)
                  ? 'text-slate-400'
                  : kpis.pct_change_vs_prev_period > 0
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }`}
            >
              {kpis?.pct_change_vs_prev_period != null && !isNaN(kpis.pct_change_vs_prev_period)
                ? `${kpis.pct_change_vs_prev_period > 0 ? '+' : ''}${kpis.pct_change_vs_prev_period}%`
                : 'N/A'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Compared with equivalent prior duration
          </p>
        </div>

        {/* Card 3: Max AQI */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Peak AQI Recorded</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {kpis?.max_aqi != null && !isNaN(kpis.max_aqi) ? Math.round(kpis.max_aqi) : (loading ? '...' : '—')}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Highest daily level in filtered span
          </p>
        </div>

        {/* Card 4: Min AQI */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cleanest AQI</span>
            <Wind className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {kpis?.min_aqi != null && !isNaN(kpis.min_aqi) ? Math.round(kpis.min_aqi) : (loading ? '...' : '—')}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Minimum observation recorded
          </p>
        </div>

        {/* Card 5: Latest PM2.5 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Latest PM2.5</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold text-white">
              {kpis?.latest_pm25 != null && !isNaN(kpis.latest_pm25) ? kpis.latest_pm25 : (loading ? '...' : '—')}
            </span>
            <span className="text-[10px] text-slate-400">µg/m³</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Fine respirable particulate
          </p>
        </div>

        {/* Card 6: Latest PM10 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Latest PM10</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold text-white">
              {kpis?.latest_pm10 != null && !isNaN(kpis.latest_pm10) ? kpis.latest_pm10 : (loading ? '...' : '—')}
            </span>
            <span className="text-[10px] text-slate-400">µg/m³</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Inhalable coarse particulate
          </p>
        </div>
      </div>

      {/* Chart Section 1: Historical AQI Trend Line Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Historical AQI Trend Progression</h2>
            <p className="text-xs text-slate-400">
              Temporal fluctuation across {aggregation} intervals demonstrating seasonal winter smog and monsoon washout.
            </p>
          </div>
          <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/30">
            {trends.length} data points
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} domain={[0, 450]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                labelStyle={{ color: '#94A3B8' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="aqi"
                name="CPCB AQI"
                stroke="#14B8A6"
                strokeWidth={2.5}
                dot={aggregation !== 'daily'}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Section 2: City Comparison & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City Comparison Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-1">Average AQI Comparison Across Indian Hubs</h2>
          <p className="text-xs text-slate-400 mb-6">
            Ranked by overall average pollution level during the active date range.
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisons} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="city_name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Bar dataKey="avg_aqi" name="Average AQI" fill="#06B6D4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AQI Category Distribution Donut Chart (1 Col) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Category Distribution</h2>
            <p className="text-xs text-slate-400 mb-4">
              Share of recorded days per CPCB category.
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-[11px]">
            {categories.map((c) => (
              <div key={c.category} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-slate-300 font-medium truncate">{c.category}:</span>
                <span className="text-slate-400 font-mono">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Section 3: PM2.5 vs PM10 Comparison Line Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-1">Particulate Concentrations: PM2.5 vs PM10</h2>
        <p className="text-xs text-slate-400 mb-6">
          Comparing fine respirable particles (PM2.5) with coarse inhalable dust (PM10) in µg/m³.
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                labelStyle={{ color: '#94A3B8' }}
              />
              <Legend />
              <Line type="monotone" dataKey="pm25" name="PM2.5 (µg/m³)" stroke="#F59E0B" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pm10" name="PM10 (µg/m³)" stroke="#06B6D4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Section 4: Gaseous Pollutants (NO2, SO2, CO, O3) */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-1">Gaseous Pollutants Dynamics (NO2, SO2, O3)</h2>
        <p className="text-xs text-slate-400 mb-6">
          Vehicular combustion indicators (NO2), industrial sulfur emissions (SO2), and photochemical smog (O3).
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                labelStyle={{ color: '#94A3B8' }}
              />
              <Legend />
              <Line type="monotone" dataKey="no2" name="NO2 (µg/m³)" stroke="#EC4899" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="so2" name="SO2 (µg/m³)" stroke="#8B5CF6" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="o3" name="O3 (µg/m³)" stroke="#10B981" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
