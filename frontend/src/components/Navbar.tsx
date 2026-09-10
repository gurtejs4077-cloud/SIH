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
  Building2
} from 'lucide-react';
import { fetchHealth, getExportCsvUrl } from '../services/api';

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
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
      isActive
        ? 'bg-blue-50 text-blue-700 border border-blue-200'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  const isDemo = health?.is_demo_mode ?? true;

  return (
    <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top Government/Ministry Strip */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-1 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-gray-700 font-semibold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            GOVERNMENT OF INDIA • STATISTICAL INTELLIGENCE PROTOTYPE
          </span>
          <span className="hidden md:inline text-gray-300">|</span>
          <span className="hidden md:inline text-gray-500">
            Consumer Price Index (CPI) Augmentation Platform • SIH 2026
          </span>
        </div>

        {/* Global Live vs Demo Data Status Badge */}
        <div className="flex items-center gap-3">
          {isDemo ? (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>● DEMO MODE — SIMULATED OBSERVATIONS</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>● LIVE DATA — VERIFIED API STREAM</span>
            </div>
          )}
          <span className="text-gray-500 text-[11px] font-mono">
            {timeString}
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:border-blue-400 transition-colors">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>AIRFARE PRICE INTELLIGENCE</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  India
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Prototype National Airfare Price Index
              </div>
            </div>
          </Link>

          {/* Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink to="/" end className={navItemClass}>
              <Activity className="w-4 h-4" />
              Dashboard
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

          {/* Action Export Button */}
          <div className="flex items-center gap-3">
            <a
              href={getExportCsvUrl()}
              download
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm"
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
