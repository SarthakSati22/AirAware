import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  HeartPulse,
  Building2,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import api from '../services/api';

export default function InsightsPage() {
  const [insights, setInsights] = useState([]);
  const [correlations, setCorrelations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getInsights(), api.getCorrelations()])
      .then(([insightsRes, corrRes]) => {
        setInsights(insightsRes);
        setCorrelations(corrRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const badgeStyles = {
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  };

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Automated Statistical Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Data Insights & Policy Recommendations
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Automated findings synthesized across millions of observations. Aligned with UN Sustainable Development Goals (SDG 3 & SDG 11) to bridge environmental data with actionable public health awareness.
        </p>
      </div>

      {/* Insights Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-56 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      badgeStyles[item.badge_type] || badgeStyles.info
                    }`}
                  >
                    {item.category}
                  </span>
                  {item.metric_value && (
                    <span className="text-xs font-mono font-bold text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                      {item.metric_value}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight">{item.title}</h3>
                <p className="text-xs text-slate-300 font-medium mt-2 leading-relaxed">
                  {item.summary}
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {item.detail}
                </p>
              </div>

              {/* SDG Alignment Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-teal-400/90 font-medium">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{item.sdg_alignment}</span>
                </span>
                <span className="text-slate-400 font-mono text-[10px]">{item.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Correlation Matrix Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">Cross-Pollutant & Weather Correlation Matrix</h2>
            <p className="text-xs text-slate-400">
              Pearson correlation coefficients (\(r\)) highlighting chemical coupling and meteorological interactions.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Normalized -1.0 to +1.0</span>
        </div>

        {correlations && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 uppercase">Parameter</th>
                  {Object.keys(correlations).map((key) => (
                    <th key={key} className="py-2.5 px-3 uppercase text-center">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.keys(correlations).map((rowKey) => (
                  <tr key={rowKey} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-200 uppercase">{rowKey}</td>
                    {Object.keys(correlations).map((colKey) => {
                      const val = correlations[rowKey][colKey];
                      const isHighPos = val >= 0.7;
                      const isNegative = val < -0.3;
                      return (
                        <td
                          key={colKey}
                          className={`py-2.5 px-3 text-center ${
                            isHighPos
                              ? 'text-teal-300 font-bold bg-teal-500/10'
                              : isNegative
                              ? 'text-indigo-300 bg-indigo-500/10'
                              : 'text-slate-400'
                          }`}
                        >
                          {val !== undefined ? val.toFixed(2) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scientific Distinction Notice */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-start space-x-3.5 text-xs text-slate-400">
        <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-200">Scientific Integrity Note:</strong> The insights presented are statistical observations derived from the CPCB monitoring network. In environmental data science, correlation does not imply direct causation. Local topography, boundary layer heights, and seasonal biomass fires simultaneously influence multiple parameters.
        </p>
      </div>
    </div>
  );
}
