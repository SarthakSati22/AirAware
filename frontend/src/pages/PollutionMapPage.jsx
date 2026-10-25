import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Filter,
  Info,
  Calendar,
  AlertCircle,
  Eye,
  Activity
} from 'lucide-react';
import api from '../services/api';
import { getAQIInfo, AQI_CATEGORIES } from '../utils/aqiUtils';

// Helper component to smoothly center map when selected city changes
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function PollutionMapPage() {
  const [hotspots, setHotspots] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [viewMode, setViewMode] = useState('markers'); // 'markers' or 'clusters'
  const [loading, setLoading] = useState(true);

  // Default view centered over India
  const [mapCenter, setMapCenter] = useState([21.7679, 78.8718]);
  const [mapZoom, setMapZoom] = useState(5);

  useEffect(() => {
    Promise.all([api.getCities(), api.getHotspots()])
      .then(([citiesRes, spotsRes]) => {
        setCities(citiesRes);
        setHotspots(spotsRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCityChange = (e) => {
    const cId = e.target.value;
    setSelectedCity(cId);

    if (cId === 'ALL') {
      setMapCenter([21.7679, 78.8718]);
      setMapZoom(5);
    } else {
      const cityObj = cities.find((c) => c.city_id === cId);
      if (cityObj) {
        setMapCenter([cityObj.latitude, cityObj.longitude]);
        setMapZoom(11);
      }
    }
  };

  const filteredHotspots =
    selectedCity === 'ALL'
      ? hotspots
      : hotspots.filter((h) => h.city_id === selectedCity);

  return (
    <div className="space-y-6 py-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pollution Hotspot Geospatial Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Verified monitoring stations across Indian cities with CPCB category color coding and detailed sensor popups.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('markers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'markers'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Station Markers
          </button>
          <button
            onClick={() => setViewMode('heat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'heat'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hotspot Aura
          </button>
        </div>
      </div>

      {/* Control & Filter Strip */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-300">Target Focus:</span>
          <select
            value={selectedCity}
            onChange={handleCityChange}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Indian Regions (National Overview)</option>
            {cities.map((c) => (
              <option key={c.city_id} value={c.city_id}>
                {c.city_name} ({c.state})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span>Active Stations Mapped:</span>
          <span className="font-mono text-slate-200 font-bold">{filteredHotspots.length}</span>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[560px] w-full bg-slate-950">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading Geospatial Stations...</span>
            </div>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="h-full w-full z-10"
          >
            <ChangeMapView center={mapCenter} zoom={mapZoom} />

            {/* OpenStreetMap Tile Layer with Custom Dark Styling */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Station Circle Markers */}
            {filteredHotspots.map((spot) => {
              const info = getAQIInfo(spot.aqi);
              const radius = viewMode === 'heat' ? 24 : 10;
              const fillOpacity = viewMode === 'heat' ? 0.35 : 0.85;

              return (
                <CircleMarker
                  key={spot.station_id}
                  center={[spot.latitude, spot.longitude]}
                  radius={radius}
                  pathOptions={{
                    color: info.color,
                    fillColor: info.color,
                    fillOpacity: fillOpacity,
                    weight: viewMode === 'heat' ? 0 : 2
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 space-y-2.5 text-slate-100 min-w-[220px]">
                      <div className="border-b border-slate-700/80 pb-2">
                        <span className="text-[10px] font-mono text-teal-400 block uppercase">
                          {spot.city_name} • {spot.station_id}
                        </span>
                        <h4 className="font-bold text-sm text-white leading-tight mt-0.5">
                          {spot.station_name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-extrabold text-white">{spot.aqi}</span>
                          <span className="text-[10px] text-slate-400 ml-1">AQI</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.bgClass}`}
                        >
                          {spot.aqi_category}
                        </span>
                      </div>

                      {/* Pollutant Readings breakdown */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-slate-700/60">
                        <div>
                          <span className="text-slate-400">PM2.5:</span>{' '}
                          <span className="font-semibold text-slate-200">{spot.pm25} µg/m³</span>
                        </div>
                        <div>
                          <span className="text-slate-400">PM10:</span>{' '}
                          <span className="font-semibold text-slate-200">{spot.pm10} µg/m³</span>
                        </div>
                        <div>
                          <span className="text-slate-400">NO2:</span>{' '}
                          <span className="font-semibold text-slate-200">{spot.no2 || '—'} µg/m³</span>
                        </div>
                        <div>
                          <span className="text-slate-400">SO2:</span>{' '}
                          <span className="font-semibold text-slate-200">{spot.so2 || '—'} µg/m³</span>
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-700/60 flex items-center justify-between">
                        <span>Lead: {spot.primary_pollutant}</span>
                        <span>{spot.source}</span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}

        {/* Floating Interactive Map Legend */}
        <div className="absolute bottom-5 right-5 z-20 p-3.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl max-w-xs text-xs space-y-2 pointer-events-auto">
          <div className="font-bold text-slate-200 flex items-center justify-between">
            <span>CPCB NAQI Index Legend</span>
            <span className="text-[10px] text-slate-400 font-mono">0-500 scale</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {Object.values(AQI_CATEGORIES).map((cat) => (
              <div key={cat.label} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-300 font-medium truncate">{cat.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">({cat.range})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
