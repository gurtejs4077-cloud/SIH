import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, CheckCircle, AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { fetchDataSources } from '../services/api';
import { DataSourceItem } from '../types';
import { AuthenticityBadge } from '../components/StatusBadge';

export const DataSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataSources()
      .then(setSources)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Database className="w-6 h-6 text-blue-400" />
          <span>Data Sources & Observation Transparency Registry</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 max-w-3xl">
          Comprehensive disclosure of all active and configured airfare data collection connectors. The platform enforces strict ethical policies and transparently demarcates genuine external observations from synthetic prototype simulation data.
        </p>
      </div>

      {/* Honesty & Demarcation Policy Callout */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Data Authenticity & Ethical Scraping Charter</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <strong className="text-gray-900 block mb-1">1. Transparent Attribution</strong>
            Every observation record contains a persistent source timestamp, provider identification, and authenticity flag (`is_demo = true|false`).
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <strong className="text-gray-900 block mb-1">2. No Deceptive Scraping</strong>
            Zero circumvention of CAPTCHAs, paywalls, or authentication. Rate-limited and respectful of robots.txt directives on public endpoints.
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <strong className="text-gray-900 block mb-1">3. Modular Provider Architecture</strong>
            Decoupled `DataProvider` abstraction allowing plug-and-play connection of licensed commercial GDS APIs without UI rewrites.
          </div>
        </div>
      </div>

      {/* Sources Status Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Configured Provider Registry
          </div>
          <span className="text-xs text-gray-500">System Telemetry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Source Name</th>
                <th className="px-5 py-3">Provider Type</th>
                <th className="px-5 py-3">Connection Status</th>
                <th className="px-5 py-3">Endpoint / URI</th>
                <th className="px-5 py-3">Records Ingested</th>
                <th className="px-5 py-3">Role & Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {sources.map((src) => (
                <tr key={src.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-bold text-gray-900">
                    {src.name}
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-600">
                    {src.provider_type}
                  </td>
                  <td className="px-5 py-4">
                    {src.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        🟢 Connected
                      </span>
                    ) : src.status === 'SIMULATION' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        🟡 Active Simulation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-gray-500 border border-gray-300">
                        ⚪ Not Configured
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-500 text-[11px]">
                    {src.base_url || '—'}
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-gray-900">
                    {src.total_records.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-gray-500 max-w-xs leading-relaxed">
                    {src.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Example Comparison Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-200">
          Observation Card Presentation Standard (Demarcation Comparison)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentic / Real Example Card */}
          <div className="bg-gray-50 border border-emerald-800/60 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                When Legitimate API is Connected
              </span>
              <AuthenticityBadge isDemo={false} source="IndiGo Direct Feed" />
            </div>

            <div className="text-3xl font-extrabold text-gray-900 font-mono">₹6,240</div>

            <div className="text-xs space-y-1 text-gray-600">
              <div className="font-bold text-slate-100">IndiGo • Flight 6E-204</div>
              <div>DEL → BOM (New Delhi to Mumbai)</div>
              <div className="text-gray-500 font-mono">
                Observed: 10 Sep 2026, 11:42 IST
              </div>
              <div className="text-gray-500 font-mono">
                Source: Official Airline Feed / Verified API
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 text-[11px] text-emerald-400/90 font-medium flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Verified observation stored with immutable timestamp
            </div>
          </div>

          {/* Simulated Demo Example Card */}
          <div className="bg-gray-50 border border-amber-800/60 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                When Running in Prototype Demo Mode
              </span>
              <AuthenticityBadge isDemo={true} />
            </div>

            <div className="text-3xl font-extrabold text-gray-700 font-mono">₹6,240</div>

            <div className="text-xs space-y-1 text-gray-600">
              <div className="font-bold text-slate-100">IndiGo (Simulated) • 6E-204</div>
              <div>DEL → BOM (Synthetic Elasticity Engine)</div>
              <div className="text-gray-500 font-mono">
                Generated: 10 Sep 2026, 11:42 IST
              </div>
              <div className="text-gray-500 font-mono">
                Source: DemoProvider Synthetic Engine
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 text-[11px] text-amber-400/90 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              DEMO DATA: Not a live fare. Clearly marked to ensure full integrity.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
