import React, { useState, useEffect } from 'react';
import {
  fetchCPITransmission,
  fetchRBIMPCImpact,
  fetchMoSPIBenchmarks,
} from '../services/api';
import {
  CPITransmissionResponse,
  RBIMPCPassThroughResponse,
  MoSPITransportCPIItem,
} from '../types';
import { CPITransmissionCard } from '../components/CPITransmissionCard';
import { RBIMPCGauge } from '../components/RBIMPCGauge';
import {
  Layers,
  Landmark,
  Sliders,
  Table,
  Building2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export const CPITransmissionPage: React.FC = () => {
  const [transmission, setTransmission] = useState<CPITransmissionResponse | null>(null);
  const [rbiImpact, setRbiImpact] = useState<RBIMPCPassThroughResponse | null>(null);
  const [benchmarks, setBenchmarks] = useState<MoSPITransportCPIItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive scenario simulation slider state
  const [simulatedAirfareChange, setSimulatedAirfareChange] = useState<number>(50);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [trans, rbi, bench] = await Promise.all([
        fetchCPITransmission(),
        fetchRBIMPCImpact(),
        fetchMoSPIBenchmarks(),
      ]);
      setTransmission(trans);
      setRbiImpact(rbi);
      setBenchmarks(bench);
      if (trans) {
        setSimulatedAirfareChange(trans.airfare_index_change_pct);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  if (loading && !transmission) {
    return (
      <div className="w-full px-4 py-24 text-center">
        <div className="inline-block w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-slate-800 font-bold text-sm">
          Loading MoSPI eSankhyiki Transmission & RBI MPC Analysis...
        </div>
      </div>
    );
  }

  // Dynamic simulation calculations
  const simUrbanImpact = ((14.2 / 100) * simulatedAirfareChange).toFixed(2);
  const simRuralImpact = ((1.8 / 100) * simulatedAirfareChange).toFixed(2);
  const simCombImpact = ((8.6 / 100) * simulatedAirfareChange).toFixed(2);
  const simDirectBps = (((7.59 * 8.6) / 10000) * simulatedAirfareChange * 100).toFixed(1);
  const simAugmentedHeadline = (5.12 + (parseFloat(simDirectBps) * 1.32) / 100).toFixed(2);

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Layers className="w-6 h-6 text-blue-600" />
            <span>MoSPI eSankhyiki CPI Transmission & RBI MPC Impact</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-4xl leading-relaxed">
            Augmentation of the Transport & Communication CPI subgroup (Urban vs. Rural vs. Combined) and simulation of pass-through impacts onto Headline CPI and RBI Monetary Policy Committee (MPC) monetary stance.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="btn-secondary self-start sm:self-auto shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Urban vs Rural Transmission Cards */}
      {transmission && (
        <CPITransmissionCard
          brackets={transmission.brackets}
          benchmarkPeriod={transmission.benchmark_period}
        />
      )}

      {/* RBI MPC Monetary Policy Gauge */}
      {rbiImpact && <RBIMPCGauge impact={rbiImpact} />}

      {/* Interactive Scenario Simulator */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider">
              Interactive Transmission & Pass-Through Simulator
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 self-start sm:self-auto shadow-xs">
            Simulated Airfare Surge: {simulatedAirfareChange > 0 ? `+${simulatedAirfareChange}%` : `${simulatedAirfareChange}%`}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Adjust the airfare inflation slider or select a policy preset below to test how various price shock scenarios pass through to Urban vs Rural transport subgroups and the resulting headline inflation pressure facing the RBI MPC.
        </p>

        {/* Preset scenario buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => setSimulatedAirfareChange(0)}
            className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              simulatedAirfareChange === 0
                ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Baseline Equilibrium (0%)
          </button>
          <button
            type="button"
            onClick={() => setSimulatedAirfareChange(25)}
            className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              simulatedAirfareChange === 25
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Seasonal Peak (+25%)
          </button>
          <button
            type="button"
            onClick={() => setSimulatedAirfareChange(50)}
            className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              simulatedAirfareChange === 50
                ? 'bg-orange-50 text-orange-800 border-orange-300 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Festival Rush (+50%)
          </button>
          <button
            type="button"
            onClick={() => setSimulatedAirfareChange(90)}
            className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              simulatedAirfareChange === 90
                ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Fuel / Capacity Shock (+90%)
          </button>
        </div>

        {/* Range Slider */}
        <div className="space-y-2 pt-2">
          <input
            type="range"
            min="-20"
            max="120"
            step="1"
            value={simulatedAirfareChange}
            onChange={(e) => setSimulatedAirfareChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 border border-slate-200"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>-20% (Discounting)</span>
            <span>0% (Baseline)</span>
            <span>+50% (Spike)</span>
            <span>+120% (Extreme Shock)</span>
          </div>
        </div>

        {/* Simulation Output Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <div className="text-[11px] text-gray-500">Urban Transport CPI Impact</div>
            <div className="text-lg font-bold font-mono text-blue-400 mt-1">
              +{simUrbanImpact}%
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Airfare share: 14.2%</div>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <div className="text-[11px] text-gray-500">Rural Transport CPI Impact</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              +{simRuralImpact}%
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Airfare share: 1.8%</div>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <div className="text-[11px] text-gray-500">Headline CPI Direct Pass-Through</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              +{simDirectBps} bps
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Basket weight: 0.653%</div>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <div className="text-[11px] text-gray-500">Simulated Headline CPI</div>
            <div className="text-lg font-bold font-mono text-rose-400 mt-1">
              {simAugmentedHeadline}%
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Target: 4.0% • Cap: 6.0%</div>
          </div>
        </div>
      </div>

      {/* MoSPI eSankhyiki Benchmark Series Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-400" />
            Official MoSPI eSankhyiki Benchmark Series (Last 12 Months)
          </div>
          <span className="text-xs text-gray-500">Base 2012=100</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Urban Transport CPI</th>
                <th className="px-5 py-3">Rural Transport CPI</th>
                <th className="px-5 py-3">Combined Transport CPI</th>
                <th className="px-5 py-3">Headline Urban</th>
                <th className="px-5 py-3">Headline Rural</th>
                <th className="px-5 py-3">Headline Combined</th>
                <th className="px-5 py-3">Source Attribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {benchmarks.map((row) => (
                <tr key={row.period} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono font-bold text-gray-900">
                    {row.period}
                  </td>
                  <td className="px-5 py-3 font-mono text-blue-300">
                    {row.urban_transport_cpi.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 font-mono text-emerald-300">
                    {row.rural_transport_cpi.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 font-mono text-purple-300 font-semibold">
                    {row.combined_transport_cpi.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 font-mono text-gray-600">
                    {row.headline_cpi_urban.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 font-mono text-gray-600">
                    {row.headline_cpi_rural.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 font-mono text-gray-700 font-semibold">
                    {row.headline_cpi_combined.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-[11px]">
                    {row.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
