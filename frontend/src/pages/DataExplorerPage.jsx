import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
  Calendar,
  RotateCcw,
  Info
} from 'lucide-react';
import api from '../services/api';
import { getAQIInfo } from '../utils/aqiUtils';

export default function DataExplorerPage() {
  const [cities, setCities] = useState([]);
  const [stations, setStations] = useState([]);

  // Query filters
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Data states
  const [data, setData] = useState({ items: [], total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);

  // Load cities
  useEffect(() => {
    api.getCities().then(setCities).catch(console.error);
  }, []);

  // Load stations
  useEffect(() => {
    if (selectedCity && selectedCity !== 'ALL') {
      api.getStations(selectedCity).then(setStations).catch(console.error);
    } else {
      setStations([]);
      setSelectedStation('ALL');
    }
  }, [selectedCity]);

  // Fetch paginated data
  useEffect(() => {
    setLoading(true);
    api.getExplorerData({
      city_id: selectedCity,
      station_id: selectedStation,
      category: selectedCategory,
      start_date: startDate,
      end_date: endDate,
      page: page,
      limit: limit
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedCity, selectedStation, selectedCategory, startDate, endDate, page]);

  const handleExportCSV = () => {
    const url = api.getExportUrl({
      city_id: selectedCity,
      station_id: selectedStation,
      start_date: startDate,
      end_date: endDate
    });
    window.location.href = url;
  };

  const handleReset = () => {
    setSelectedCity('ALL');
    setSelectedStation('ALL');
    setSelectedCategory('ALL');
    setStartDate('2023-01-01');
    setEndDate('2024-12-31');
    setPage(1);
  };

  return (
    <div className="space-y-6 py-2">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Historical Data Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Inspect raw multi-pollutant measurements with backend pagination, unit clarity, and filtered CSV export.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Filtered CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* City Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">City</label>
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setSelectedStation('ALL');
              setPage(1);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Cities</option>
            {cities.map((c) => (
              <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
            ))}
          </select>
        </div>

        {/* Station Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Station</label>
          <select
            value={selectedStation}
            onChange={(e) => {
              setSelectedStation(e.target.value);
              setPage(1);
            }}
            disabled={selectedCity === 'ALL'}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 disabled:opacity-50"
          >
            <option value="ALL">All Stations</option>
            {stations.map((s) => (
              <option key={s.station_id} value={s.station_id}>{s.station_name}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">AQI Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Good">Good (0-50)</option>
            <option value="Satisfactory">Satisfactory (51-100)</option>
            <option value="Moderate">Moderate (101-200)</option>
            <option value="Poor">Poor (201-300)</option>
            <option value="Very Poor">Very Poor (301-400)</option>
            <option value="Severe">Severe (401-500)</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Table Metadata Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing <span className="font-semibold text-white">{data.items.length}</span> records (Page {data.page} of {data.total_pages}) • Total Filtered: <span className="font-mono font-semibold text-teal-300">{data.total.toLocaleString()}</span>
        </span>
        <span className="font-mono text-[11px]">Units: µg/m³ (CO: mg/m³)</span>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4 text-center">AQI</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">PM2.5</th>
                <th className="py-3 px-4 text-right">PM10</th>
                <th className="py-3 px-4 text-right">NO2</th>
                <th className="py-3 px-4 text-right">SO2</th>
                <th className="py-3 px-4 text-right">CO</th>
                <th className="py-3 px-4 text-right">O3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400 font-sans">
                    Loading records from database...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400 font-sans">
                    No air quality observations found matching the specified filters.
                  </td>
                </tr>
              ) : (
                data.items.map((row, idx) => {
                  const info = getAQIInfo(row.aqi);
                  return (
                    <tr key={`${row.station_id}-${row.date}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 text-slate-300">{row.date}</td>
                      <td className="py-2.5 px-4 font-sans font-medium text-white">{row.city_name}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-400 max-w-xs truncate">{row.station_name}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-white text-sm">{row.aqi}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border ${info.bgClass}`}>
                          {row.aqi_category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-300">{row.pm25}</td>
                      <td className="py-2.5 px-4 text-right text-slate-300">{row.pm10}</td>
                      <td className="py-2.5 px-4 text-right text-slate-400">{row.no2}</td>
                      <td className="py-2.5 px-4 text-right text-slate-400">{row.so2}</td>
                      <td className="py-2.5 px-4 text-right text-slate-400">{row.co}</td>
                      <td className="py-2.5 px-4 text-right text-slate-400">{row.o3}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="font-semibold text-white">{data.page}</span> of{' '}
            <span className="font-semibold text-white">{data.total_pages}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-lg bg-slate-800/80 font-mono text-slate-200">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page >= data.total_pages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
