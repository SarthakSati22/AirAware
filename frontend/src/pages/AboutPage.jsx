import React from 'react';
import {
  HeartPulse,
  Building2,
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  Globe,
  ExternalLink,
  BookOpen,
  Code2,
  Workflow
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-12 py-2 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Project Documentation & Methodology</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          About the AirAware Platform
        </h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          AirAware is a full-stack Smart Air Quality Monitoring and Big Data Analytics Platform designed to translate raw environmental sensor streams into actionable public health intelligence.
        </p>
      </div>

      {/* UN Sustainable Development Goals Focus */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Globe className="w-5 h-5 text-teal-400" />
          <span>Alignment with UN Sustainable Development Goals</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-emerald-500/30 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-emerald-400">SDG 3: Good Health & Well-being</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Target 3.9:</strong> By 2030, substantially reduce the number of deaths and illnesses from hazardous chemicals and air, water and soil pollution and contamination.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              AirAware provides daily and hourly risk classifications so citizens, schools, and vulnerable populations can protect their respiratory health during severe pollution episodes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-500/30 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-amber-400">SDG 11: Sustainable Cities & Communities</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Target 11.6:</strong> By 2030, reduce the adverse per capita environmental impact of cities, including by paying special attention to air quality and municipal and other waste management.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              By mapping station-level hotspots and forecasting 7-day trajectories, municipal authorities can enforce dynamic traffic diversions and anti-smog sprinkler deployments.
            </p>
          </div>
        </div>
      </section>

      {/* CPCB NAQI Calculation Methodology */}
      <section className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Central Pollution Control Board (CPCB) NAQI Formula</h2>
          <p className="text-xs text-slate-400 mt-1">
            Standard mathematical formulation used by the Government of India for computing air quality sub-indices.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-teal-300 space-y-2">
          <p className="text-slate-400">// Linear Interpolation Sub-Index Equation:</p>
          <p className="text-sm font-bold text-white">
            I_p = [ (I_hi - I_lo) / (B_hi - B_lo) ] * (C_p - B_lo) + I_lo
          </p>
          <p className="text-[11px] text-slate-400">
            Where C_p = Pollutant concentration, B_hi/B_lo = Breakpoint category limits, I_hi/I_lo = AQI index limits.
          </p>
          <p className="text-[11px] text-amber-400">
            Overall AQI = max(I_pm25, I_pm10, I_no2, I_so2, I_co, I_o3)
          </p>
        </div>

        {/* Breakpoint Reference Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] font-semibold border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">AQI Category</th>
                <th className="py-2.5 px-3">Index Range</th>
                <th className="py-2.5 px-3">PM2.5 (µg/m³)</th>
                <th className="py-2.5 px-3">PM10 (µg/m³)</th>
                <th className="py-2.5 px-3">NO2 (µg/m³)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              <tr>
                <td className="py-2 px-3 font-semibold text-emerald-400">Good</td>
                <td className="py-2 px-3">0 – 50</td>
                <td className="py-2 px-3">0 – 30</td>
                <td className="py-2 px-3">0 – 50</td>
                <td className="py-2 px-3">0 – 40</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-lime-400">Satisfactory</td>
                <td className="py-2 px-3">51 – 100</td>
                <td className="py-2 px-3">31 – 60</td>
                <td className="py-2 px-3">51 – 100</td>
                <td className="py-2 px-3">41 – 80</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-yellow-400">Moderate</td>
                <td className="py-2 px-3">101 – 200</td>
                <td className="py-2 px-3">61 – 90</td>
                <td className="py-2 px-3">101 – 250</td>
                <td className="py-2 px-3">81 – 180</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-orange-400">Poor</td>
                <td className="py-2 px-3">201 – 300</td>
                <td className="py-2 px-3">91 – 120</td>
                <td className="py-2 px-3">251 – 350</td>
                <td className="py-2 px-3">181 – 280</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-red-400">Very Poor</td>
                <td className="py-2 px-3">301 – 400</td>
                <td className="py-2 px-3">121 – 250</td>
                <td className="py-2 px-3">351 – 430</td>
                <td className="py-2 px-3">281 – 400</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-rose-500">Severe</td>
                <td className="py-2 px-3">401 – 500</td>
                <td className="py-2 px-3">250+</td>
                <td className="py-2 px-3">430+</td>
                <td className="py-2 px-3">400+</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 10-Stage Big Data Architecture */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Workflow className="w-5 h-5 text-cyan-400" />
          <span>Big Data Engineering Architecture Pipeline</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {[
            { step: '01', title: 'Data Ingestion', desc: 'Pulling CPCB, OpenAQ, and Open-Meteo multi-source records.' },
            { step: '02', title: 'Data Validation', desc: 'Pydantic schemas checking null bounds and sensor range anomalies.' },
            { step: '03', title: 'Data Cleaning', desc: 'Deduplication by composite key (station_id, timestamp).' },
            { step: '04', title: 'Transformation', desc: 'Standardizing UTC timestamps and calculating CPCB sub-indices.' },
            { step: '05', title: 'MongoDB Storage', desc: 'PyMongo compound indexed collections for high throughput.' },
            { step: '06', title: 'Aggregation', desc: 'MongoDB pipelines computing rolling means and daily intervals.' },
            { step: '07', title: 'Analytics', desc: 'Correlation matrices and automated data-driven insight discovery.' },
            { step: '08', title: 'ML Forecasting', desc: 'Random Forest Regressor trained on chronological lag features.' },
            { step: '09', title: 'API Delivery', desc: 'FastAPI async REST endpoints with streaming CSV downloads.' },
            { step: '10', title: 'UI Visualization', desc: 'React, Vite, Tailwind CSS, Recharts, and Leaflet Maps.' }
          ].map((item) => (
            <div key={item.step} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-teal-400">{item.step}</span>
              <h4 className="font-bold text-white">{item.title}</h4>
              <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data Provenance & References */}
      <section className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white">Data Provenance & Acknowledgements</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <h4 className="font-bold text-white mb-1">Central Pollution Control Board (CPCB)</h4>
            <p className="text-slate-400 text-[11px]">
              Statutory organization under the Ministry of Environment, Forest and Climate Change, Government of India.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <h4 className="font-bold text-white mb-1">OpenAQ Community</h4>
            <p className="text-slate-400 text-[11px]">
              Open-source environmental data platform providing global air quality measurements.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <h4 className="font-bold text-white mb-1">Open-Meteo Weather API</h4>
            <p className="text-slate-400 text-[11px]">
              Open-source weather API providing temperature, relative humidity, and surface wind parameters.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
