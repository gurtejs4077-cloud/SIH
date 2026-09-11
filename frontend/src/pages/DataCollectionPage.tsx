import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Layers,
  Activity,
  Calendar,
} from 'lucide-react';
import { fetchCollectionStatus, triggerCollection } from '../services/api';
import { CollectionStatus } from '../types';

export const DataCollectionPage: React.FC = () => {
  const [status, setStatus] = useState<CollectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await fetchCollectionStatus();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRunCollection = async () => {
    try {
      setRunning(true);
      setLastActionMessage('Triggering collection cycle across all corridors...');
      const res = await triggerCollection();
      setLastActionMessage(
        `✓ ${res.message} (Ingested in ${res.duration_ms} ms)`
      );
      await loadStatus();
    } catch (err: any) {
      setLastActionMessage(`❌ Failed: ${err.message || 'Collection failed'}`);
    } finally {
      setRunning(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="w-full px-4 py-24 text-center">
        <div className="inline-block w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-slate-800 font-bold text-sm">
          Loading Data Pipeline Status...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            <span>Airfare Data Collection Pipeline (Admin)</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-4xl leading-relaxed">
            Automated background scheduler and telemetry engine for collecting, normalizing, and calculating Indian airfare prices.
          </p>
        </div>

        {/* Run Collection Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRunCollection}
            disabled={running}
            className="btn-emerald h-10 px-5 text-xs font-bold"
          >
            {running ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{running ? 'Collecting Observations...' : 'Run Collection Now'}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {lastActionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-mono font-medium flex items-center gap-2 ${
            lastActionMessage.startsWith('✓')
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : lastActionMessage.startsWith('❌')
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
              : 'bg-blue-950/40 border-blue-800/80 text-blue-300'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>{lastActionMessage}</span>
        </div>
      )}

      {/* Primary Telemetry Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-xl">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Active Provider</div>
          <div className="text-base font-bold text-gray-900 font-mono">
            {status?.active_provider}
          </div>
          <div className="text-[11px] text-amber-400 mt-1">
            {status?.is_demo_mode ? '● Mode: Synthetic Simulation' : '● Mode: Live Verified Feed'}
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Collection Cadence</div>
          <div className="text-2xl font-bold text-gray-900 font-mono">
            Every {status?.interval_minutes}m
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Background AsyncIOScheduler
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Last Run</div>
          <div className="text-sm font-bold text-gray-700 font-mono mt-1">
            {status?.last_collection
              ? new Date(status.last_collection).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Just started'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Next: {status?.next_collection ? new Date(status.next_collection).toLocaleTimeString() : 'Pending'}
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Execution Track Record</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {status?.total_successful_runs} <span className="text-xs text-gray-500">success</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {status?.total_failed_runs} failed runs
          </div>
        </div>
      </div>

      {/* Execution Audit Log Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Collection Execution History Log
          </div>
          <span className="text-xs text-gray-500">Audit Trail of Collection Cycles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Records Ingested</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Diagnostics / Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {status?.recent_logs && status.recent_logs.length > 0 ? (
                status.recent_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-mono text-gray-600">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-700">
                      {log.provider_type}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                      +{log.records_fetched.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-gray-500">
                      {log.duration_ms} ms
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          log.is_demo
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        {log.is_demo ? 'SIMULATED' : 'VERIFIED'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 font-mono text-[11px]">
                      {log.error_message || 'OK'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No collection cycles logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
