import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Plane,
  TrendingUp,
  MapPin,
  Database,
  RefreshCw,
  FileText,
  Download,
  Activity,
  Landmark,
  Building2,
  MessageSquare,
  Sparkles,
  Radar,
  Flame
} from 'lucide-react';
import { fetchHealth, getExportCsvUrl } from '../services/api';
import { openWhatsAppModal } from '../services/modalEvents';

export const Navbar: React.FC = () => {
  const [health, setHealth] = useState<{ status: string; data_provider_mode: string; is_demo_mode: boolean } | null>(null);
  const [timeString, setTimeString] = useState<string>('');


  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => setHealth({ status: 'offline', data_provider_mode: 'demo', is_demo_mode: true }));

    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `h-9 px-3.5 rounded-lg text-xs font-semibold transition-all duration-150 inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
      isActive
        ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
    }`;

  const isDemo = health?.is_demo_mode ?? true;

  return (
    <header className="w-full border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      {/* Top Government/Ministry Strip - Full Width */}
      <div className="w-full bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 md:px-8 lg:px-10 py-1.5 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            GOVERNMENT OF INDIA • STATISTICAL INTELLIGENCE PROTOTYPE
          </span>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="hidden md:inline text-slate-500 text-[11px]">
            Consumer Price Index (CPI) Augmentation Platform • SIH 2026
          </span>
        </div>

        {/* Global Live vs Demo Data Status Badge */}
        <div className="flex items-center gap-3">
          {isDemo ? (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>● DEMO MODE — SIMULATED OBSERVATIONS</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>● LIVE DATA — VERIFIED API STREAM</span>
            </div>
          )}
          <span className="text-slate-500 text-[11px] font-mono">
            {timeString}
          </span>
        </div>
      </div>

      {/* Main Navigation Bar - Full Width */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:border-blue-400 group-hover:bg-blue-100/50 transition-all shadow-xs">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>AIRFARE PRICE INTELLIGENCE</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold">
                  India
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Prototype National Airfare Price Index
              </div>
            </div>
          </Link>

          {/* Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <NavLink to="/" end className={navItemClass}>
              <Activity className="w-4 h-4" />
              Dashboard
            </NavLink>
            <NavLink to="/war-room" className={navItemClass}>
              <Radar className="w-4 h-4 text-red-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="font-bold text-red-700">War Room</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            </NavLink>
            <NavLink to="/simulator" className={navItemClass}>
              <Flame className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-700">Crisis Simulator</span>
            </NavLink>
            <NavLink to="/forecast" className={navItemClass}>
              <Sparkles className="w-4 h-4 text-purple-600" />
              AI Forecast
            </NavLink>
            <NavLink to="/routes" className={navItemClass}>
              <MapPin className="w-4 h-4" />
              Routes
            </NavLink>
            <NavLink to="/index" className={navItemClass}>
              <TrendingUp className="w-4 h-4" />
              Price Index
            </NavLink>
            <NavLink to="/cpi-transmission" className={navItemClass}>
              <Landmark className="w-4 h-4 text-amber-600" />
              MoSPI & RBI Policy
            </NavLink>
            <NavLink to="/sources" className={navItemClass}>
              <Database className="w-4 h-4" />
              Sources
            </NavLink>
            <NavLink to="/data-collection" className={navItemClass}>
              <RefreshCw className="w-4 h-4" />
              Pipeline
            </NavLink>
            <NavLink to="/methodology" className={navItemClass}>
              <FileText className="w-4 h-4" />
              Methodology
            </NavLink>
          </nav>

          {/* Action Export Button & WhatsApp Button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={openWhatsAppModal}
              className="btn-secondary text-emerald-700 hover:text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50/50"
              title="Link WhatsApp & Dispatch Real-Time Intelligence Report"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
              <span>WhatsApp Report</span>
            </button>

            <a
              href={getExportCsvUrl()}
              download
              className="btn-secondary"
              title="Download CSV of observed airfares"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              Export CSV
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
