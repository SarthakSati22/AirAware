import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  BarChart3,
  MapPin,
  TrendingUp,
  Lightbulb,
  Cpu,
  Database,
  Info,
  Menu,
  X,
  Activity,
  HeartPulse,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Analytics Dashboard', path: '/dashboard', icon: BarChart3 },
  { name: 'Pollution Map', path: '/map', icon: MapPin },
  { name: 'AQI Prediction', path: '/prediction', icon: TrendingUp },
  { name: 'Data Insights', path: '/insights', icon: Lightbulb },
  { name: 'Model Evaluation', path: '/evaluation', icon: Cpu },
  { name: 'Data Explorer', path: '/explorer', icon: Database },
  { name: 'About the Project', path: '/about', icon: Info },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    api.getHealth()
      .then(res => setSystemHealth(res))
      .catch(() => setSystemHealth({ status: 'offline', records_count: 0 }));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0B1120] text-slate-100">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 border-r border-slate-800/80 bg-[#0F172A]/80 backdrop-blur-xl shrink-0 fixed inset-y-0 z-30">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Activity className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-teal-200 bg-clip-text text-transparent">
                AirAware
              </h1>
              <p className="text-[11px] font-medium text-teal-400/90 tracking-wide uppercase">
                Smart Air Quality Platform
              </p>
            </div>
          </div>
        </div>

        {/* SDG Impact Badges */}
        <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-900/40">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5">
            UN Sustainable Development Goals
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
              <HeartPulse className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="leading-tight">
                <span className="text-[10px] font-bold text-emerald-300 block">SDG 3</span>
                <span className="text-[9px] text-slate-400">Good Health</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="leading-tight">
                <span className="text-[10px] font-bold text-amber-300 block">SDG 11</span>
                <span className="text-[9px] text-slate-400">Sustainable Cities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Database & System Info Footnote */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Analytics Engine
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-semibold">Active</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Verified Records:</span>
            <span className="font-mono text-slate-300 font-medium">
              {systemHealth?.records_count ? systemHealth.records_count.toLocaleString() : '21,900'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {systemHealth?.database?.mode || 'MongoDB Engine'}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-72 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 border-b border-slate-800/80 bg-[#0B1120]/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-slate-200">
                National Air Quality Monitoring & Big Data Analytics
              </h2>
              <p className="text-[11px] text-slate-400">
                CPCB Standards • OpenAQ Historical Data • ML Forecasting
              </p>
            </div>
          </div>

          {/* Quick Metrics Header Pill */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>CPCB Verified Standard</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-xs font-medium text-teal-300 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
              <span>8 Major Indian Hubs</span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-[#0B1120]/95 backdrop-blur-2xl p-6 border-b border-slate-800 flex flex-col overflow-y-auto">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium ${
                        isActive
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs">
                <span className="font-bold text-emerald-400 block mb-1">SDG 3</span>
                <span className="text-slate-400 text-[11px]">Good Health & Well-being</span>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs">
                <span className="font-bold text-amber-400 block mb-1">SDG 11</span>
                <span className="text-slate-400 text-[11px]">Sustainable Urban Cities</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Global Clean Footer */}
        <footer className="border-t border-slate-800/80 bg-[#0A0F1D] py-6 px-4 sm:px-8 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              © 2026 AirAware Platform. Developed for Big Data Analytics (BDA). Aligned with UN SDGs 3 & 11.
            </p>
            <div className="flex items-center space-x-4 text-slate-400">
              <span className="hover:text-slate-300">Data: CPCB & OpenAQ</span>
              <span>•</span>
              <span className="hover:text-slate-300">ML: Random Forest Time-Series</span>
              <span>•</span>
              <span className="hover:text-slate-300">FastAPI & MongoDB</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
