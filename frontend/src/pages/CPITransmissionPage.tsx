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
  Sliders,
  Table,
  RefreshCw,
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
        <div className="inline-block w-9 h-9 border-3 border-[#5A7C83] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-[#2C444D] font-bold text-sm">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C7B8A4]/70">
        <div>
          <div className="flex items-center gap-2 text-xl font-bold text-[#2C444D]">
            <Layers className="w-6 h-6 text-[#5A7C83]" />
            <span>MoSPI eSankhyiki CPI Transmission & RBI MPC Impact</span>
          </div>
          <p className="text-xs text-[#2C444D]/70 mt-1 max-w-4xl leading-relaxed">
            Augmentation of the Transport & Communication CPI subgroup (Urban vs. Rural vs. Combined) and simulation of pass-through impacts onto Headline CPI and RBI Monetary Policy Committee (MPC) monetary stance.
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="btn-secondary self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
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
      <div className="bg-white border border-[#C7B8A4] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#C7B8A4]/50 gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#5A7C83]" />
            <span className="text-sm sm:text-base font-bold text-[#2C444D] uppercase tracking-wider">
              Interactive Transmission & Pass-Through Simulator
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#2C444D] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#C7B8A4] self-start sm:self-auto shadow-xs">
            Simulated Airfare Surge: {simulatedAirfareChange > 0 ? `+${simulatedAirfareChange}%` : `${simulatedAirfareChange}%`}
          </span>
        </div>

        <p className="text-xs text-[#2C444D]/70 leading-relaxed">
          Adjust the airfare inflation slider or select a policy preset below to test how various price shock scenarios pass through to Urban vs Rural transport subgroups and the resulting headline inflation pressure facing the RBI MPC.
        </p>

        {/* Preset scenario buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-[#A88C6C] uppercase tracking-wider mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => setSimulatedAirfareChange(0)}
            className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              simulatedAirfareChange === 0
                ? 'bg-[#2C444D] text-white border-[#2C444D] shadow-xs'
                : 'bg-white text-[#2C444D] border-[#C7B8A4] hover:bg-[#FAF8F5]'
            }`}
          >
            Baseline Equilibrium (0%)
          </button>
          <button
            type="button"
            onClick={() => setSimulatedAirfareChange(25)}
            className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              simulatedAirfareChange === 25
                ? 'bg-[#CCB68E] text-[#2C444D] border-[#CCB68E] font-bold shadow-xs'
                : 'bg-white text-[#2C444D] border-[#C7B8A4] hover:bg-[#FAF8F5]'
            }`}
          >
            Seasonal Peak (+25%)
          </button>
          <button
            type="button"
            onClick={() => setSimulatedAirfareChange(50)}
            className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              simulatedAirfareChange === 50
                ? 'bg-[#A88C6C] text-white border-[#A88C6C] font-bold shadow-xs'
                : 'bg-white text-[#2C444D] border-[#C7B8A4] hover:bg-[#FAF8F5]'
            }`}
          >
            Festival Rush (+50%)
          </button>
          <button
            type="button"
            onClick={() => setSimulatedAirfareChange(90)}
            className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              simulatedAirfareChange === 90
                ? 'bg-[#2C444D] text-[#CCB68E] border-[#A88C6C] font-bold shadow-xs'
                : 'bg-white text-[#2C444D] border-[#C7B8A4] hover:bg-[#FAF8F5]'
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
            className="w-full h-2 bg-[#FAF8F5] rounded-lg appearance-none cursor-pointer accent-[#2C444D] border border-[#C7B8A4]"
          />
          <div className="flex justify-between text-[11px] text-[#2C444D]/60 font-mono">
            <span>-20% (Discounting)</span>
            <span>0% (Baseline)</span>
            <span>+50% (Spike)</span>
            <span>+120% (Extreme Shock)</span>
          </div>
        </div>

        {/* Simulation Output Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#C7B8A4]">
            <div className="text-[11px] text-[#2C444D]/70 font-bold">Urban Transport CPI Impact</div>
            <div className="text-lg font-bold font-mono text-[#5A7C83] mt-1">
              +{simUrbanImpact}%
            </div>
            <div className="text-[10px] text-[#2C444D]/60 mt-0.5">Airfare share: 14.2%</div>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#C7B8A4]">
            <div className="text-[11px] text-[#2C444D]/70 font-bold">Rural Transport CPI Impact</div>
            <div className="text-lg font-bold font-mono text-[#CCB68E] mt-1">
              +{simRuralImpact}%
            </div>
            <div className="text-[10px] text-[#2C444D]/60 mt-0.5">Airfare share: 1.8%</div>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#C7B8A4]">
            <div className="text-[11px] text-[#2C444D]/70 font-bold">Headline CPI Direct Pass-Through</div>
            <div className="text-lg font-bold font-mono text-[#A88C6C] mt-1">
              +{simDirectBps} bps
            </div>
            <div className="text-[10px] text-[#2C444D]/60 mt-0.5">Basket weight: 0.653%</div>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#C7B8A4]">
            <div className="text-[11px] text-[#2C444D]/70 font-bold">Simulated Headline CPI</div>
            <div className="text-lg font-bold font-mono text-[#2C444D] mt-1">
              {simAugmentedHeadline}%
            </div>
            <div className="text-[10px] text-[#2C444D]/60 mt-0.5">Target: 4.0% • Cap: 6.0%</div>
          </div>
        </div>
      </div>

      {/* MoSPI eSankhyiki Benchmark Series Table */}
      <div className="bg-white border border-[#C7B8A4] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-[#FAF8F5] border-b border-[#C7B8A4] flex items-center justify-between">
          <div className="text-sm font-bold text-[#2C444D] uppercase tracking-wider flex items-center gap-2">
            <Table className="w-4 h-4 text-[#5A7C83]" />
            Official MoSPI eSankhyiki Benchmark Series (Last 12 Months)
          </div>
          <span className="text-xs text-[#2C444D]/70 font-mono">Base 2012=100</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#2C444D]/70 uppercase tracking-wider text-[11px] border-b border-[#C7B8A4]">
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
            <tbody className="divide-y divide-[#C7B8A4]/30 font-sans">
              {benchmarks.map((row) => (
                <tr key={row.period} className="hover:bg-[#FAF8F5]">
                  <td className="px-5 py-3 font-mono font-bold text-[#2C444D]">
                    {row.period}
                  </td>
                  <td className="px-5 py-3 font-mono text-[#5A7C83] font-bold">
                    {row.urban_transport_cpi.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 font-mono text-[#CCB68E] font-bold">
                    {row.rural_transport_cpi.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 font-mono text-[#A88C6C] font-bold">
                    {row.combined_transport_cpi.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 font-mono text-[#2C444D]/70">
                    {row.headline_cpi_urban.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 font-mono text-[#2C444D]/70">
                    {row.headline_cpi_rural.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 font-mono text-[#2C444D] font-bold">
                    {row.headline_cpi_combined.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 text-[#2C444D]/70 text-[11px]">
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
