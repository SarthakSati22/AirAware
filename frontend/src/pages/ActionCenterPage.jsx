import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents
} from 'react-leaflet';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  ShieldAlert,
  PlusCircle,
  MapPin,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Sliders,
  Filter,
  Download,
  Lock,
  Unlock,
  Eye,
  Crosshair,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Building2,
  HeartPulse,
  Radio,
  RefreshCw,
  Info,
  Calendar,
  CheckCircle,
  XCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

// Helper component for smooth map pan/zoom
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Click listener to pick coordinates on citizen report map
function LocationPickerHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
    },
  });
  return null;
}

const CATEGORY_MAP = {
  garbage_burning: { label: 'Garbage or waste burning', color: '#f97316' },
  construction_dust: { label: 'Construction dust', color: '#eab308' },
  industrial_smoke: { label: 'Industrial smoke', color: '#ef4444' },
  vehicle_pollution: { label: 'Vehicle-related pollution', color: '#06b6d4' },
  road_dust: { label: 'Road dust', color: '#84cc16' },
  other: { label: 'Other suspected pollution source', color: '#a855f7' }
};

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', badge: 'bg-slate-700/70 text-slate-200 border-slate-600', step: 1 },
  under_review: { label: 'Under Review', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40', step: 2 },
  verified: { label: 'Verified', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', step: 3 },
  action_assigned: { label: 'Action Assigned', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', step: 4 },
  resolved: { label: 'Resolved', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', step: 5 },
  rejected: { label: 'Rejected', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', step: 0 },
  duplicate: { label: 'Duplicate', badge: 'bg-slate-800 text-slate-400 border-slate-700', step: 0 }
};

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#ef4444', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50' },
  high: { label: 'High', color: '#f97316', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/50' },
  moderate: { label: 'Moderate', color: '#eab308', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50' },
  low: { label: 'Low', color: '#10b981', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' }
};

const CITY_COORDS = {
  DEL: [28.6139, 77.2090],
  BOM: [19.0760, 72.8777],
  BLR: [12.9716, 77.5946],
  HYD: [17.3850, 78.4867],
  CCU: [22.5726, 88.3639],
  MAA: [13.0827, 80.2707],
  PNQ: [18.5204, 73.8567],
  AMD: [23.0225, 72.5714],
  LKO: [26.8467, 80.9462],
  JAI: [26.9124, 75.7873]
};

export default function ActionCenterPage() {
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();

  // Active Tab: overview | report | map | track | admin | analytics
  const [activeTab, setActiveTab] = useState(urlTab || 'overview');

  // Shared Data States
  const [cities, setCities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States for Map & Lists
  const [filterCity, setFilterCity] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  // Report Submission Form State
  const [reportForm, setReportForm] = useState({
    city_id: 'DEL',
    category: 'garbage_burning',
    description: '',
    address: '',
    latitude: 28.6139,
    longitude: 77.2090,
    contact_email: '',
    contact_phone: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Tracking State
  const [trackInputId, setTrackInputId] = useState('');
  const [trackedReport, setTrackedReport] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  // Admin Portal State
  const [adminToken, setAdminToken] = useState(
    () => sessionStorage.getItem('airaware_admin_token') || ''
  );
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminAuthInput, setAdminAuthInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(null);
  const [selectedReportForAction, setSelectedReportForAction] = useState(null);
  const [statusUpdatePayload, setStatusUpdatePayload] = useState({
    status: 'under_review',
    notes: '',
    verified_by: 'Authorized Environmental Inspector'
  });
  const [remediationPayload, setRemediationPayload] = useState({
    action_type: 'inspection',
    assigned_to: 'Municipal Environmental Wing',
    notes: 'Urgent site inspection scheduled within 24 hours.',
    due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  });
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [remediationModalOpen, setRemediationModalOpen] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const switchTab = (tabName) => {
    setActiveTab(tabName);
    navigate(`/action-center/${tabName}`);
  };

  // Initial Data Fetching
  const refreshData = async () => {
    setLoading(true);
    try {
      const [citiesRes, analyticsRes, reportsRes, spotsRes] = await Promise.all([
        api.getCities(),
        api.getActionAnalytics(),
        api.getActionReports({ limit: 100 }),
        api.getHotspots()
      ]);
      setCities(citiesRes);
      setAnalytics(analyticsRes);
      setReports(reportsRes.reports || []);
      setStations(spotsRes || []);
    } catch (err) {
      console.error('Failed to load Action Center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Validate Admin Token if already in session
  useEffect(() => {
    if (adminToken) {
      api.verifyAdminToken(adminToken)
        .then(() => setAdminAuthenticated(true))
        .catch(() => {
          setAdminAuthenticated(false);
          sessionStorage.removeItem('airaware_admin_token');
        });
    }
  }, [adminToken]);

  // Handle Citizen Form Location Selection
  const handlePickCoordinates = (lat, lng) => {
    setReportForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  // Geolocation Browser Support
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setReportForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      },
      (err) => {
        alert(`Location permission denied or unavailable: ${err.message}`);
      }
    );
  };

  // Submit Citizen Report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (reportForm.description.trim().length < 10) {
      setSubmitError('Please provide a detailed description (minimum 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        city_id: reportForm.city_id,
        category: reportForm.category,
        description: reportForm.description.trim(),
        address: reportForm.address.trim() || undefined,
        latitude: Number(reportForm.latitude),
        longitude: Number(reportForm.longitude),
        contact_email: reportForm.contact_email.trim() || undefined,
        contact_phone: reportForm.contact_phone.trim() || undefined,
        image_url: reportForm.image_url.trim() || undefined,
        observed_at: new Date().toISOString()
      };

      const result = await api.submitActionReport(payload);
      setSubmitSuccess(result);
      setReportForm((prev) => ({
        ...prev,
        description: '',
        address: '',
        contact_email: '',
        contact_phone: '',
        image_url: ''
      }));
      // Refresh datasets
      refreshData();
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Lookup Report by ID
  const handleTrackLookup = async (idToLookup) => {
    const id = (idToLookup || trackInputId).trim();
    if (!id) return;
    setTrackingLoading(true);
    setTrackingError(null);
    setTrackedReport(null);

    try {
      const data = await api.trackActionReport(id);
      setTrackedReport(data);
    } catch (err) {
      setTrackingError(err.message || 'Report not found. Please verify the Reference ID.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminAuthError(null);
    try {
      await api.verifyAdminToken(adminAuthInput.trim());
      sessionStorage.setItem('airaware_admin_token', adminAuthInput.trim());
      setAdminToken(adminAuthInput.trim());
      setAdminAuthenticated(true);
      setAdminAuthInput('');
    } catch (err) {
      setAdminAuthError(err.message || 'Invalid administrative credentials.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('airaware_admin_token');
    setAdminToken('');
    setAdminAuthenticated(false);
  };

  // Admin Status Update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReportForAction) return;
    try {
      await api.updateActionReportStatus(
        selectedReportForAction.report_id,
        statusUpdatePayload,
        adminToken
      );
      setActionModalOpen(false);
      refreshData();
      if (trackedReport && trackedReport.report_id === selectedReportForAction.report_id) {
        handleTrackLookup(selectedReportForAction.report_id);
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  // Admin Remediation Assignment
  const handleAssignRemediation = async (e) => {
    e.preventDefault();
    if (!selectedReportForAction) return;
    try {
      await api.assignActionReportRemediation(
        selectedReportForAction.report_id,
        remediationPayload,
        adminToken
      );
      setRemediationModalOpen(false);
      refreshData();
      if (trackedReport && trackedReport.report_id === selectedReportForAction.report_id) {
        handleTrackLookup(selectedReportForAction.report_id);
      }
    } catch (err) {
      alert(`Remediation assignment failed: ${err.message}`);
    }
  };

  // Filtered reports for map & admin table
  const filteredReports = reports.filter((r) => {
    if (filterCity !== 'ALL' && r.city_id !== filterCity) return false;
    if (filterCategory !== 'ALL' && r.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && r.priority_level !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6 py-2">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Community Air Defense & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            AirAware Action Center
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              UN SDG 3 & 11
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Citizen pollution reporting, data-driven hotspot prioritization, and municipal corrective action tracking. Bridging environmental observations with accountable urban enforcement.
          </p>
        </div>

        {/* Global Action Center Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => switchTab('report')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Incident</span>
          </button>
          <a
            href={api.getActionExportUrl({ format: 'csv' })}
            download
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs border border-slate-700 transition-all"
            title="Export Reports Data"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">CSV Export</span>
          </a>
        </div>
      </div>

      {/* Action Center Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto scrollbar-none text-xs">
        {[
          { id: 'overview', label: 'Action Center Overview', icon: Layers },
          { id: 'report', label: 'Report an Incident', icon: PlusCircle },
          { id: 'map', label: 'Pollution Reports Map', icon: MapPin },
          { id: 'track', label: 'Track Status', icon: Search },
          { id: 'admin', label: 'Admin Review Portal', icon: Lock },
          { id: 'analytics', label: 'Analytics & BDA Insights', icon: TrendingUp }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key KPI Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              {
                title: 'Total Incidents',
                value: analytics?.total_reports ?? reports.length,
                sub: 'Logged to Date',
                color: 'text-white'
              },
              {
                title: 'Urgent & High',
                value: (analytics?.priority_distribution?.urgent || 0) + (analytics?.priority_distribution?.high || 0),
                sub: 'Critical Priority',
                color: 'text-rose-400'
              },
              {
                title: 'Verified Incidents',
                value: (analytics?.status_counts?.verified || 0) + (analytics?.status_counts?.action_assigned || 0) + (analytics?.status_counts?.resolved || 0),
                sub: `${analytics?.verification_rate || 0}% Verification Rate`,
                color: 'text-purple-400'
              },
              {
                title: 'Remediations Active',
                value: analytics?.status_counts?.action_assigned || 0,
                sub: 'Field Teams Assigned',
                color: 'text-amber-400'
              },
              {
                title: 'Resolved Cases',
                value: analytics?.status_counts?.resolved || 0,
                sub: `${analytics?.resolution_rate || 0}% Resolution Rate`,
                color: 'text-emerald-400'
              },
              {
                title: 'Avg Turnaround',
                value: `${analytics?.avg_resolution_hours || 0} hrs`,
                sub: 'Action SLA Metric',
                color: 'text-cyan-400'
              }
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
              >
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {kpi.title}
                </span>
                <div className={`text-2xl sm:text-3xl font-extrabold ${kpi.color} my-1`}>
                  {kpi.value}
                </div>
                <span className="text-[10px] text-slate-400">{kpi.sub}</span>
              </div>
            ))}
          </div>

          {/* Workflow Architecture Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0F172A] to-slate-950 border border-slate-800 shadow-xl">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-teal-400 animate-pulse" />
              How the AirAware Closed-Loop Resolution System Works
            </h2>
            <p className="text-xs text-slate-400 mb-6 max-w-4xl">
              AirAware transforms citizen participation into high-integrity governance. Each submission is correlated with CPCB sensor readings, scored through big data prioritization, reviewed by municipal authorities, and tracked through verified resolution.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  title: 'Citizen Reporting',
                  desc: 'Residents log localized smoke, construction dust, or garbage fires with geo-coordinates, photos, and time stamps.',
                  icon: PlusCircle,
                  color: 'text-teal-400 border-teal-500/30'
                },
                {
                  step: '02',
                  title: 'BDA Prioritization',
                  desc: 'Explainable scoring weighs category risk (25%), ambient CPCB AQI (35%), cluster density (25%), and recency (15%).',
                  icon: Sliders,
                  color: 'text-amber-400 border-amber-500/30'
                },
                {
                  step: '03',
                  title: 'Administrative Triage',
                  desc: 'Pollution control boards audit evidence, dispatch inspection squads, issue violation notices, or order work halts.',
                  icon: ShieldAlert,
                  color: 'text-purple-400 border-purple-500/30'
                },
                {
                  step: '04',
                  title: 'Public Verification',
                  desc: 'Citizens follow their unique Reference ID from submission through on-site corrective action to case closure.',
                  icon: CheckCircle2,
                  color: 'text-emerald-400 border-emerald-500/30'
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl bg-slate-900/40 border ${item.color} relative group hover:bg-slate-800/40 transition-all`}
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-500 block mb-1">
                      STAGE {item.step}
                    </span>
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon className="w-4 h-4 text-slate-200" />
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Portals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => switchTab('report')}
              className="p-5 rounded-2xl bg-gradient-to-b from-teal-950/20 to-slate-900/60 border border-teal-500/30 hover:border-teal-500/60 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                Report a Suspected Incident
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Witnessed illegal burning or severe dust? Submit an incident report anonymously with map coordinates.
              </p>
              <span className="text-xs font-semibold text-teal-400 flex items-center gap-1">
                Open Form <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            <div
              onClick={() => switchTab('map')}
              className="p-5 rounded-2xl bg-gradient-to-b from-cyan-950/20 to-slate-900/60 border border-cyan-500/30 hover:border-cyan-500/60 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Explore Pollution Reports Map
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Interactive spatial view contrasting citizen-reported hotspots against official CPCB air monitors.
              </p>
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
                View Geospatial Map <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            <div
              onClick={() => switchTab('track')}
              className="p-5 rounded-2xl bg-gradient-to-b from-purple-950/20 to-slate-900/60 border border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Track Report by Reference ID
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Enter your reference code (e.g. REP-2026-6819) to inspect audit timeline and field actions.
              </p>
              <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                Track Status <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          {/* Recent Reports Live Feed */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Community Incident Feed</h3>
                <p className="text-xs text-slate-400">Latest submissions across verified Indian cities</p>
              </div>
              <button
                onClick={refreshData}
                className="flex items-center space-x-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {reports.slice(0, 5).map((r) => {
                const catInfo = CATEGORY_MAP[r.category] || { label: r.category, color: '#94a3b8' };
                const prioInfo = PRIORITY_CONFIG[r.priority_level] || PRIORITY_CONFIG.low;
                const statInfo = STATUS_CONFIG[r.status] || STATUS_CONFIG.submitted;

                return (
                  <div
                    key={r.report_id}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30 px-3 rounded-xl transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: catInfo.color }}
                        title={catInfo.label}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-teal-300">
                            {r.report_id}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-200">
                            {catInfo.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({r.city_name || r.city_id})
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                          {r.description}
                        </p>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                          <span>{new Date(r.observed_at).toLocaleDateString()}</span>
                          {r.nearest_station && (
                            <span>
                              {r.nearest_station.distance_km} km to {r.nearest_station.station_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prioInfo.badge}`}>
                        {prioInfo.label} ({r.priority_score})
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statInfo.badge}`}>
                        {statInfo.label}
                      </span>
                      <button
                        onClick={() => {
                          setTrackInputId(r.report_id);
                          handleTrackLookup(r.report_id);
                          switchTab('track');
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="View Incident Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CITIZEN REPORT FORM */}
      {/* ========================================================================= */}
      {activeTab === 'report' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {submitSuccess && (
            <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 shadow-2xl animate-fade-in">
              <div className="flex items-start space-x-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">
                    Pollution Incident Successfully Logged!
                  </h3>
                  <p className="text-xs text-emerald-300/90 mt-1">
                    Your report has been received and processed by the Big Data prioritization engine.
                  </p>

                  <div className="my-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Tracking Reference ID
                      </span>
                      <span className="font-mono text-base font-bold text-teal-300">
                        {submitSuccess.report_id}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Calculated Priority Level
                      </span>
                      <span className="font-bold text-amber-400">
                        {submitSuccess.priority_level?.toUpperCase()} (Score: {submitSuccess.priority_score}/100)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Nearest CPCB Station
                      </span>
                      <span className="text-slate-200">
                        {submitSuccess.nearest_station?.station_name} ({submitSuccess.nearest_station?.distance_km} km)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Correlation Assessment
                      </span>
                      <span className="text-slate-300 text-[11px]">
                        {submitSuccess.correlation_note}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setTrackInputId(submitSuccess.report_id);
                        handleTrackLookup(submitSuccess.report_id);
                        switchTab('track');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      Track This Report Live
                    </button>
                    <button
                      onClick={() => setSubmitSuccess(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                    >
                      Submit Another Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmitReport}
            className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-teal-400" />
                Submit Citizen Pollution Report
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Help local authorities target illegal burning, unsuppressed dust, and unpermitted industrial emissions. Your submission is protected and prioritized by statistical algorithms.
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* City & Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Urban Region / City <span className="text-rose-400">*</span>
                </label>
                <select
                  value={reportForm.city_id}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const coords = CITY_COORDS[cId] || [28.6139, 77.2090];
                    setReportForm((prev) => ({
                      ...prev,
                      city_id: cId,
                      latitude: coords[0],
                      longitude: coords[1]
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                >
                  {cities.map((c) => (
                    <option key={c.city_id} value={c.city_id}>
                      {c.city_name} ({c.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pollution Incident Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={reportForm.category}
                  onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                >
                  {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Coordinate Picker Map */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>Pin Location on Map (Click to Set Coordinates)</span>
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-[11px] border border-teal-500/30 transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Use My GPS Location</span>
                </button>
              </div>

              <div className="h-64 rounded-2xl overflow-hidden border border-slate-700 relative bg-slate-950">
                <MapContainer
                  center={[reportForm.latitude, reportForm.longitude]}
                  zoom={12}
                  className="h-full w-full"
                >
                  <ChangeMapView
                    center={[reportForm.latitude, reportForm.longitude]}
                    zoom={12}
                  />
                  <LocationPickerHandler onPick={handlePickCoordinates} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <CircleMarker
                    center={[reportForm.latitude, reportForm.longitude]}
                    radius={9}
                    pathOptions={{ color: '#0d9488', fillColor: '#14b8a6', fillOpacity: 0.9 }}
                  >
                    <Popup>
                      <div className="text-slate-900 text-xs">
                        <strong>Selected Incident Coordinates</strong>
                        <br />
                        Lat: {reportForm.latitude}, Lng: {reportForm.longitude}
                      </div>
                    </Popup>
                  </CircleMarker>
                </MapContainer>
              </div>

              {/* Coordinate Inputs */}
              <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Latitude:</span>
                  <input
                    type="number"
                    step="0.00001"
                    value={reportForm.latitude}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, latitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Longitude:</span>
                  <input
                    type="number"
                    step="0.00001"
                    value={reportForm.longitude}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, longitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address / Landmark */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Address or Landmark Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Near Anand Vihar Bus Terminal, opposite Metro Pillar 142"
                value={reportForm.address}
                onChange={(e) => setReportForm({ ...reportForm, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            {/* Incident Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Incident Observations & Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Describe the visible emissions, smell, estimated intensity, or operating equipment (minimum 10 characters)..."
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
            </div>

            {/* Optional Photo URL / Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Photo Evidence URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/evidence-image.jpg"
                value={reportForm.image_url}
                onChange={(e) => setReportForm({ ...reportForm, image_url: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Provide an image link documenting the smoke plume or dust activity.
              </p>
            </div>

            {/* Anonymous / Contact Info Privacy Box */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                <Info className="w-4 h-4 text-teal-400" />
                <span>Citizen Privacy & Anonymous Protection Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Citizen reporting is completely anonymous by default. You do not need to provide personal identification. If you want email alerts on status resolutions, you can optionally provide an email below. It will never be publicly displayed.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <input
                    type="email"
                    placeholder="Optional email for resolution alert"
                    value={reportForm.contact_email}
                    onChange={(e) => setReportForm({ ...reportForm, contact_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Optional phone number (confidential)"
                    value={reportForm.contact_phone}
                    onChange={(e) => setReportForm({ ...reportForm, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing Spatial Correlation...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Incident for Prioritization</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: POLLUTION REPORTS MAP */}
      {/* ========================================================================= */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          {/* Map Controls & Filters */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* City Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">City:</span>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 outline-none"
                >
                  <option value="ALL">All Cities ({reports.length})</option>
                  {cities.map((c) => (
                    <option key={c.city_id} value={c.city_id}>
                      {c.city_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Category:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Priority:</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 outline-none"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="moderate">Moderate</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="text-slate-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Matching Incidents:</span>
              <span className="font-mono text-slate-200 font-bold">{filteredReports.length}</span>
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[560px] w-full bg-slate-950">
            <MapContainer
              center={
                filterCity !== 'ALL' && CITY_COORDS[filterCity]
                  ? CITY_COORDS[filterCity]
                  : [22.5, 78.9]
              }
              zoom={filterCity !== 'ALL' ? 11 : 5}
              className="h-full w-full"
            >
              <ChangeMapView
                center={
                  filterCity !== 'ALL' && CITY_COORDS[filterCity]
                    ? CITY_COORDS[filterCity]
                    : [22.5, 78.9]
                }
                zoom={filterCity !== 'ALL' ? 11 : 5}
              />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* CPCB Official Monitoring Stations (Squares / Diamond Blue circles) */}
              {stations.map((st) => (
                <CircleMarker
                  key={st.station_id}
                  center={[st.latitude, st.longitude]}
                  radius={6}
                  pathOptions={{
                    color: '#0284c7',
                    fillColor: '#38bdf8',
                    fillOpacity: 0.6,
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div className="text-slate-950 text-xs p-1">
                      <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[9px] font-bold uppercase block mb-1">
                        CPCB Official Monitoring Station
                      </span>
                      <strong>{st.station_name}</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Current AQI: <strong>{st.aqi ?? 'N/A'}</strong> ({st.status || 'Active'})
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Citizen Incident Reports Markers */}
              {filteredReports.map((rep) => {
                const prioInfo = PRIORITY_CONFIG[rep.priority_level] || PRIORITY_CONFIG.low;
                const catInfo = CATEGORY_MAP[rep.category] || { label: rep.category, color: '#f97316' };
                const statInfo = STATUS_CONFIG[rep.status] || STATUS_CONFIG.submitted;

                return (
                  <CircleMarker
                    key={rep.report_id}
                    center={[rep.latitude, rep.longitude]}
                    radius={rep.priority_level === 'urgent' ? 11 : 8}
                    pathOptions={{
                      color: prioInfo.color,
                      fillColor: prioInfo.color,
                      fillOpacity: 0.85,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="text-slate-900 text-xs p-1 max-w-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono font-bold text-[11px] text-teal-800">
                            {rep.report_id}
                          </span>
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white uppercase"
                            style={{ backgroundColor: prioInfo.color }}
                          >
                            {prioInfo.label} ({rep.priority_score})
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs mb-1">
                          {catInfo.label}
                        </p>
                        <p className="text-slate-600 text-[11px] italic mb-2">
                          "{rep.description}"
                        </p>
                        <div className="border-t border-slate-200 pt-1.5 text-[10px] space-y-0.5 text-slate-500">
                          <div>Status: <strong className="text-slate-700">{statInfo.label}</strong></div>
                          {rep.nearest_station && (
                            <div>
                              Nearest Monitor: <strong>{rep.nearest_station.station_name}</strong> ({rep.nearest_station.distance_km} km)
                            </div>
                          )}
                          {rep.nearest_station?.ambient_aqi && (
                            <div>Ambient AQI: <strong>{rep.nearest_station.ambient_aqi}</strong></div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 backdrop-blur-md shadow-xl space-y-2">
              <span className="font-bold text-slate-200 block text-[10px] uppercase tracking-wider">
                Map Markers Legend
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span>Urgent Priority</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>High Priority</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Moderate Priority</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Low Priority</span>
                </div>
                <div className="flex items-center space-x-1.5 col-span-2 pt-1 border-t border-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-sky-600" />
                  <span>Official CPCB Station</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TRACK STATUS & DETAILS */}
      {/* ========================================================================= */}
      {activeTab === 'track' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Tracking Search Input */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-400" />
              Track Citizen Incident by Reference ID
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter your unique tracking code generated at the time of submission (e.g. <span className="font-mono text-teal-300">REP-2026-6819</span>) to review on-site remediation, inspection outcomes, and administrative status.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Reference ID (e.g. REP-2026-XXXX)"
                value={trackInputId}
                onChange={(e) => setTrackInputId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleTrackLookup()}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 font-mono text-sm tracking-wider uppercase focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <button
                onClick={() => handleTrackLookup()}
                disabled={trackingLoading || !trackInputId.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all flex items-center space-x-2"
              >
                {trackingLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track</span>
                  </>
                )}
              </button>
            </div>

            {trackingError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{trackingError}</span>
              </div>
            )}
          </div>

          {/* Tracked Report Detail Card */}
          {trackedReport && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 animate-fade-in">
              {/* Reference Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Official Incident Record
                  </span>
                  <div className="flex items-center space-x-3 mt-0.5">
                    <h3 className="font-mono text-xl sm:text-2xl font-extrabold text-teal-300">
                      {trackedReport.report_id}
                    </h3>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        PRIORITY_CONFIG[trackedReport.priority_level]?.badge || 'border-slate-700'
                      }`}
                    >
                      Priority: {trackedReport.priority_level?.toUpperCase()} ({trackedReport.priority_score}/100)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${
                      STATUS_CONFIG[trackedReport.status]?.badge || 'border-slate-700'
                    }`}
                  >
                    {STATUS_CONFIG[trackedReport.status]?.label || trackedReport.status}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-1">
                    Logged: {new Date(trackedReport.observed_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Stepper Progression */}
              <div className="py-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-4">
                  Resolution Lifecycle Progression
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { key: 'submitted', label: '1. Submitted', num: 1 },
                    { key: 'under_review', label: '2. Under Review', num: 2 },
                    { key: 'verified', label: '3. Verified', num: 3 },
                    { key: 'action_assigned', label: '4. Action Dispatched', num: 4 },
                    { key: 'resolved', label: '5. Resolved', num: 5 }
                  ].map((st) => {
                    const currentStep = STATUS_CONFIG[trackedReport.status]?.step || 1;
                    const isDone = currentStep >= st.num;
                    const isCurrent = currentStep === st.num;

                    return (
                      <div
                        key={st.key}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 font-bold'
                            : isDone
                            ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                            : 'bg-slate-900/40 border-slate-800/60 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {isDone ? (
                            <CheckCircle className="w-4 h-4 text-teal-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <span className="text-xs block">{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Incident Details & Big Data Prioritization Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Core Incident Card */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Incident Information
                  </h4>
                  <div className="text-xs space-y-2 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">CATEGORY:</span>
                      <strong className="text-slate-100">
                        {CATEGORY_MAP[trackedReport.category]?.label || trackedReport.category}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">DESCRIPTION:</span>
                      <p className="text-slate-300 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        "{trackedReport.description}"
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">LOCATION / LANDMARK:</span>
                      <span>{trackedReport.address || 'Coordinates only'}</span>
                      <span className="text-slate-500 block font-mono text-[11px] mt-0.5">
                        {trackedReport.latitude}, {trackedReport.longitude}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Data Prioritization Math Explanation */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                  <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    BDA Prioritization Scoring Breakdown
                  </h4>
                  <div className="text-xs space-y-2 text-slate-300">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Category Risk Weight (25%):</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {trackedReport.score_breakdown?.category_score ?? 'N/A'}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Ambient CPCB AQI Factor (35%):</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {trackedReport.score_breakdown?.aqi_score ?? 'N/A'}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Local Cluster Density (25%):</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {trackedReport.score_breakdown?.cluster_score ?? 'N/A'}/100 ({trackedReport.score_breakdown?.cluster_count_7d || 0} nearby reports)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Recency Decay Factor (15%):</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {trackedReport.score_breakdown?.recency_score ?? 'N/A'}/100
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-700/80 text-[11px] text-slate-400 leading-snug">
                      <span className="font-semibold text-slate-300">CPCB Sensor Correlation: </span>
                      {trackedReport.correlation_note}
                    </div>
                  </div>
                </div>
              </div>

              {/* Remediation & Audit History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Remediation Actions & Audit Trail
                </h4>

                {trackedReport.actions && trackedReport.actions.length > 0 ? (
                  <div className="space-y-2">
                    {trackedReport.actions.map((act) => (
                      <div
                        key={act.action_id}
                        className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px]">
                              {act.action_type.replace('_', ' ')}
                            </span>
                            <span className="text-slate-300 font-semibold">
                              Assigned to: {act.assigned_to}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs mt-1">{act.notes}</p>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            Dispatched: {new Date(act.created_at).toLocaleString()} • Target SLA: {act.due_date || 'Standard'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">
                          {act.status?.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 italic">
                    No field actions dispatched yet. Report is currently queued in triage.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ADMIN REVIEW DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {!adminAuthenticated ? (
            /* Admin Password Gate */
            <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Administrative Portal</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Restricted access for pollution control inspectors and municipal coordinators.
                </p>
              </div>

              {adminAuthError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Admin Secret Key
                  </label>
                  <input
                    type="password"
                    placeholder="Enter Admin Key (default: airaware-admin-2026)"
                    value={adminAuthInput}
                    onChange={(e) => setAdminAuthInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20"
                >
                  Verify Credentials & Enter
                </button>
              </form>
            </div>
          ) : (
            /* Admin Workstation */
            <div className="space-y-4">
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Unlock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Inspector Triage Workstation
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Authenticated Session • Direct database triage and remediation dispatch
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={api.getActionExportUrl({ format: 'csv' })}
                    download
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export CSV</span>
                  </a>
                  <button
                    onClick={handleAdminLogout}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs border border-rose-500/30 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>

              {/* Triage Table */}
              <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-700">
                      <tr>
                        <th className="p-3.5">Ref ID</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">City</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Priority</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Nearest Monitor</th>
                        <th className="p-3.5 text-right">Triage Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {reports.map((r) => {
                        const catInfo = CATEGORY_MAP[r.category] || { label: r.category };
                        const prioInfo = PRIORITY_CONFIG[r.priority_level] || PRIORITY_CONFIG.low;
                        const statInfo = STATUS_CONFIG[r.status] || STATUS_CONFIG.submitted;

                        return (
                          <tr key={r.report_id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-teal-300">
                              {r.report_id}
                            </td>
                            <td className="p-3.5 text-slate-400 whitespace-nowrap">
                              {new Date(r.observed_at).toLocaleDateString()}
                            </td>
                            <td className="p-3.5 font-semibold text-slate-200">
                              {r.city_name || r.city_id}
                            </td>
                            <td className="p-3.5">{catInfo.label}</td>
                            <td className="p-3.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prioInfo.badge}`}>
                                {prioInfo.label} ({r.priority_score})
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statInfo.badge}`}>
                                {statInfo.label}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-400">
                              {r.nearest_station ? (
                                <span>
                                  {r.nearest_station.station_name} ({r.nearest_station.distance_km} km)
                                </span>
                              ) : (
                                'Coverage Blindspot'
                              )}
                            </td>
                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedReportForAction(r);
                                  setStatusUpdatePayload({
                                    status: r.status,
                                    notes: '',
                                    verified_by: 'Environmental Board Inspector'
                                  });
                                  setActionModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-semibold text-[11px] border border-teal-500/40 transition-colors"
                              >
                                Triage Status
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedReportForAction(r);
                                  setRemediationModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px] border border-amber-500/40 transition-colors"
                              >
                                Dispatch Action
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Status Update Modal */}
          {actionModalOpen && selectedReportForAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-teal-400" />
                    Update Incident Triage Status: {selectedReportForAction.report_id}
                  </h3>
                  <button
                    onClick={() => setActionModalOpen(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      New Status Transition
                    </label>
                    <select
                      value={statusUpdatePayload.status}
                      onChange={(e) =>
                        setStatusUpdatePayload({ ...statusUpdatePayload, status: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                    >
                      <option value="under_review">Under Review</option>
                      <option value="verified">Verified (Confirmed Source)</option>
                      <option value="action_assigned">Action Assigned</option>
                      <option value="resolved">Resolved (Remediation Complete)</option>
                      <option value="rejected">Rejected (Unsubstantiated)</option>
                      <option value="duplicate">Duplicate Record</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Inspector Name / Designation
                    </label>
                    <input
                      type="text"
                      value={statusUpdatePayload.verified_by}
                      onChange={(e) =>
                        setStatusUpdatePayload({ ...statusUpdatePayload, verified_by: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Verification Findings / Audit Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add official notes documenting site inspection findings or reason for status update..."
                      value={statusUpdatePayload.notes}
                      onChange={(e) =>
                        setStatusUpdatePayload({ ...statusUpdatePayload, notes: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActionModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
                    >
                      Save Status Update
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Remediation Action Dispatch Modal */}
          {remediationModalOpen && selectedReportForAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Dispatch Remediation: {selectedReportForAction.report_id}
                  </h3>
                  <button
                    onClick={() => setRemediationModalOpen(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAssignRemediation} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Remediation Action Type
                    </label>
                    <select
                      value={remediationPayload.action_type}
                      onChange={(e) =>
                        setRemediationPayload({ ...remediationPayload, action_type: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                    >
                      <option value="inspection">On-Site Environmental Inspection</option>
                      <option value="fine_notice">Issue Environmental Penalty / Notice</option>
                      <option value="water_sprinkling">Deploy Mechanical Water Sprinklers</option>
                      <option value="work_halt_order">Issue Construction Work-Halt Order</option>
                      <option value="waste_clearance">Municipal Waste Clearance Dispatch</option>
                      <option value="equipment_repair">Mandate Industrial Scrubber / Filter Repair</option>
                      <option value="other">Other Corrective Intervention</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Assigned Agency / Department
                    </label>
                    <input
                      type="text"
                      value={remediationPayload.assigned_to}
                      onChange={(e) =>
                        setRemediationPayload({ ...remediationPayload, assigned_to: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      SLA Target Resolution Date
                    </label>
                    <input
                      type="date"
                      value={remediationPayload.due_date}
                      onChange={(e) =>
                        setRemediationPayload({ ...remediationPayload, due_date: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Field Instructions & Directives
                    </label>
                    <textarea
                      rows={3}
                      value={remediationPayload.notes}
                      onChange={(e) =>
                        setRemediationPayload({ ...remediationPayload, notes: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRemediationModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                    >
                      Dispatch Field Action
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: BDA ANALYTICS & RESOLUTION INSIGHTS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Verification Integrity Rate
              </span>
              <div className="text-3xl font-extrabold text-teal-300 my-1">
                {analytics?.verification_rate || 0}%
              </div>
              <p className="text-xs text-slate-500">
                Of citizen reports confirmed by official inspectors or ambient CPCB monitors
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Resolution Closure Rate
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 my-1">
                {analytics?.resolution_rate || 0}%
              </div>
              <p className="text-xs text-slate-500">
                Action items successfully executed and remediated on-site
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Average Resolution Turnaround
              </span>
              <div className="text-3xl font-extrabold text-cyan-400 my-1">
                {analytics?.avg_resolution_hours || 0} Hours
              </div>
              <p className="text-xs text-slate-500">
                Mean elapsed time from submission to verified remediation
              </p>
            </div>
          </div>

          {/* Recharts Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Bar Chart */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-1">
                Reports Distribution by Incident Category
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Identifies prevailing pollution vectors across monitored urban clusters
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(analytics?.category_distribution || {}).map(([k, v]) => ({
                      name: CATEGORY_MAP[k]?.label?.split(' ')[0] || k,
                      count: v
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px'
                      }}
                    />
                    <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Distribution Pie Chart */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-1">
                BDA Priority Triage Classification
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Calculated via 4-factor multi-criteria decision algorithm
              </p>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Urgent', value: analytics?.priority_distribution?.urgent || 0, color: '#ef4444' },
                        { name: 'High', value: analytics?.priority_distribution?.high || 0, color: '#f97316' },
                        { name: 'Moderate', value: analytics?.priority_distribution?.moderate || 0, color: '#eab308' },
                        { name: 'Low', value: analytics?.priority_distribution?.low || 0, color: '#10b981' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { color: '#ef4444' },
                        { color: '#f97316' },
                        { color: '#eab308' },
                        { color: '#10b981' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Spatial Clusters Table & Monitoring Blind Spots */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Spatial Hotspot Clusters & Monitoring Coverage Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Spatial clusters with dense incident concentration compared against official CPCB sensor grid
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="p-3">Cluster Sector</th>
                    <th className="p-3">Incident Count</th>
                    <th className="p-3">Coordinates (Approx)</th>
                    <th className="p-3">Nearest CPCB Station</th>
                    <th className="p-3">Coverage Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analytics?.hotspot_clusters && analytics.hotspot_clusters.length > 0 ? (
                    analytics.hotspot_clusters.map((cluster, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-slate-200">
                          {cluster.city_id} Sector Cluster #{i + 1}
                        </td>
                        <td className="p-3 font-mono font-bold text-teal-300">
                          {cluster.report_count} reports
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {cluster.lat}, {cluster.lng}
                        </td>
                        <td className="p-3 text-slate-300">
                          {cluster.nearest_station || 'None within 15 km'}
                        </td>
                        <td className="p-3">
                          {cluster.is_blind_spot ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                              Monitoring Blind Spot (&gt;15km)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              Sensor Covered
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                        No distinct spatial clusters detected in current filter window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
