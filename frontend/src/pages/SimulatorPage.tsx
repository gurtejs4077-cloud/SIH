import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Sparkles,
  AlertTriangle,
  Flame,
  Droplets,
  CloudLightning,
  PlaneTakeoff,
  TrendingUp,
  Landmark,
  FileText,
  RotateCcw,
  ShieldCheck,
  Building2,
  ChevronRight,
  Info,
  DollarSign,
  Layers,
  Activity
} from 'lucide-react';
import { sfx } from '../utils/audioEffects';

interface ScenarioPreset {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  fuelShift: number; // percentage (-20 to +60)
  demandSurge: number; // multiplier (1.0 to 3.0)
  fleetGrounded: number; // percentage (0 to 50)
  affectedHubs: string[];
  rationale: string;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'diwali-rush',
    name: 'Diwali & Chhath Festival Surge',
    icon: '🪔',
    tagline: 'Massive festive family migration to North/East corridors',
    fuelShift: 5,
    demandSurge: 2.4,
    fleetGrounded: 5,
    affectedHubs: ['DEL', 'CCU', 'BOM'],
    rationale: 'Severe ticket stock exhaustion on outbound trunk routes causes dynamic pricing algorithms to quote emergency-tier tariffs.'
  },
  {
    id: 'atf-spike',
    name: 'Global Oil & ATF Fuel Shock (+35%)',
    icon: '⛽',
    tagline: 'Aviation Turbine Fuel tax & crude import inflation',
    fuelShift: 38,
    demandSurge: 1.1,
    fleetGrounded: 0,
    affectedHubs: ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU'],
    rationale: 'ATF accounts for 40% of airline operating costs; carriers implement immediate fuel surcharge pass-through across all booking horizons.'
  },
  {
    id: 'cyclone-grounding',
    name: 'Cyclone Severe Weather Disruption',
    icon: '🌀',
    tagline: 'Coastal hub shutdown (Mumbai & Chennai inundated)',
    fuelShift: 0,
    demandSurge: 1.5,
    fleetGrounded: 38,
    affectedHubs: ['BOM', 'MAA'],
    rationale: 'Runway closures and diversions reduce daily capacity by 65%, creating bottleneck cascades across inter-state connecting routes.'
  },
  {
    id: 'fleet-grounding',
    name: 'Fleet Technical Engine Directive',
    icon: '⚠️',
    tagline: 'DGCA mandated inspection parks 25% narrowbody aircraft',
    fuelShift: 10,
    demandSurge: 1.3,
    fleetGrounded: 28,
    affectedHubs: ['DEL', 'BLR'],
    rationale: 'Sudden capacity shortfall leaves remaining scheduled departures overbooked, accelerating steep dynamic surge curves.'
  },
  {
    id: 'rail-spillover',
    name: 'Railway Waitlist Spillover Crisis',
    icon: '🚆',
    tagline: 'Tatkal exhaustion shifts 300,000+ passengers to air',
    fuelShift: 0,
    demandSurge: 1.9,
    fleetGrounded: 0,
    affectedHubs: ['DEL', 'BOM', 'HYD'],
    rationale: 'High-income and emergency rail travelers migrate en masse to domestic airlines on routes under 1,200 km.'
  }
];

const SIMULATED_ROUTES = [
  { code: 'DEL-BOM', name: 'Delhi ⇄ Mumbai', baseFare: 5240, elasticity: 1.25 },
  { code: 'DEL-BLR', name: 'Delhi ⇄ Bengaluru', baseFare: 6100, elasticity: 1.15 },
  { code: 'BOM-BLR', name: 'Mumbai ⇄ Bengaluru', baseFare: 4200, elasticity: 1.35 },
  { code: 'DEL-CCU', name: 'Delhi ⇄ Kolkata', baseFare: 5100, elasticity: 1.45 },
  { code: 'DEL-HYD', name: 'Delhi ⇄ Hyderabad', baseFare: 4600, elasticity: 1.1 },
  { code: 'BOM-MAA', name: 'Mumbai ⇄ Chennai', baseFare: 4200, elasticity: 1.2 }
];

export const SimulatorPage: React.FC = () => {
  const [activePreset, setActivePreset] = useState<string>('diwali-rush');
  const [fuelShift, setFuelShift] = useState<number>(5);
  const [demandSurge, setDemandSurge] = useState<number>(2.4);
  const [fleetGrounded, setFleetGrounded] = useState<number>(5);
  const [affectedHubs, setAffectedHubs] = useState<string[]>(['DEL', 'CCU', 'BOM']);
  const [shockPulse, setShockPulse] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Apply a preset scenario
  const applyPreset = (preset: ScenarioPreset) => {
    sfx.playShockwaveBoom();
    setActivePreset(preset.id);
    setFuelShift(preset.fuelShift);
    setDemandSurge(preset.demandSurge);
    setFleetGrounded(preset.fleetGrounded);
    setAffectedHubs(preset.affectedHubs);
    setShockPulse((prev) => prev + 1);
  };

  const handleReset = () => {
    sfx.playClick();
    setActivePreset('custom');
    setFuelShift(0);
    setDemandSurge(1.0);
    setFleetGrounded(0);
    setAffectedHubs([]);
  };

  // Shockwave Math Calculations
  // Total fare multiplier = 1 + (fuelShift * 0.40 / 100) + (demandSurge - 1) * 0.75 + (fleetGrounded / 100) * 1.2
  const combinedMultiplier = Math.max(
    0.8,
    1 + (fuelShift * 0.004) + (demandSurge - 1) * 0.75 + (fleetGrounded * 0.015)
  );

  const baselineAvgFare = 4900;
  const simulatedAvgFare = Math.round(baselineAvgFare * combinedMultiplier);
  const fareIncreasePercent = Math.round(((simulatedAvgFare - baselineAvgFare) / baselineAvgFare) * 100);

  // Projected Transport CPI basket shock (basis points)
  const cpiShockBps = Number(((fareIncreasePercent * 0.0028) * 100).toFixed(2));

  // Consumer Outflow Loss Burden (in ₹ Crores per month across 1.2 crore domestic passengers)
  const monthlyPassengers = 12500000; // 1.25 Crore monthly domestic passengers
  const excessCostPerPassenger = Math.max(0, simulatedAvgFare - baselineAvgFare);
  const consumerBurdenCrores = Math.round((monthlyPassengers * excessCostPerPassenger) / 10000000);

  // Animated Shockwave Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let radius = 10;
    const maxRadius = 140;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Hub locations on a 480x360 canvas
      const hubs: Record<string, { x: number; y: number }> = {
        DEL: { x: 210, y: 85 },
        BOM: { x: 130, y: 195 },
        BLR: { x: 190, y: 285 },
        CCU: { x: 330, y: 160 },
        HYD: { x: 215, y: 235 },
        MAA: { x: 240, y: 295 }
      };

      // Draw route connecting lines
      ctx.lineWidth = 1.5;
      const routes = [
        ['DEL', 'BOM'],
        ['DEL', 'BLR'],
        ['BOM', 'BLR'],
        ['DEL', 'CCU'],
        ['DEL', 'HYD'],
        ['BOM', 'MAA'],
        ['HYD', 'MAA']
      ];

      routes.forEach(([from, to]) => {
        const start = hubs[from];
        const end = hubs[to];
        if (start && end) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(199, 184, 164, 0.7)';
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      });

      // Expand Shockwave Rings from affected hubs
      radius = (radius + 1.5) % maxRadius;
      affectedHubs.forEach((hubCode) => {
        const hub = hubs[hubCode];
        if (hub) {
          // Inner glowing ring
          ctx.beginPath();
          ctx.arc(hub.x, hub.y, radius, 0, Math.PI * 2);
          const alpha = Math.max(0, 1 - radius / maxRadius);
          ctx.strokeStyle = `rgba(168, 140, 108, ${alpha * 0.85})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Second harmonic ring
          const radius2 = (radius + 40) % maxRadius;
          ctx.beginPath();
          ctx.arc(hub.x, hub.y, radius2, 0, Math.PI * 2);
          const alpha2 = Math.max(0, 1 - radius2 / maxRadius);
          ctx.strokeStyle = `rgba(204, 182, 142, ${alpha2 * 0.65})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Draw Hub Points
      Object.entries(hubs).forEach(([code, pt]) => {
        const isAffected = affectedHubs.includes(code);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isAffected ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isAffected ? '#A88C6C' : '#5A7C83';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Airport Label Text
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = isAffected ? '#A88C6C' : '#2C444D';
        ctx.fillText(code, pt.x + 10, pt.y + 4);
      });

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [affectedHubs, combinedMultiplier, shockPulse]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C444D] p-3 sm:p-6 lg:p-8 font-sans">
      {/* Top Title & Mission Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FAF8F5] text-[#A88C6C] border border-[#C7B8A4] flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-[#A88C6C]" />
                POLICY STRESS-TEST ENGINE • SIH 2026
              </span>
              <span className="text-[#C7B8A4] text-xs hidden sm:inline">•</span>
              <span className="text-xs font-mono text-[#2C444D]/70 hidden sm:inline">
                MoCA / DGCA REAL-TIME WHAT-IF SIMULATOR
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2C444D] flex items-center gap-2">
              CRISIS & FESTIVAL SHOCKWAVE SIMULATOR
            </h1>
            <p className="text-xs text-[#2C444D]/80 mt-1 max-w-2xl leading-relaxed">
              Model sudden geopolitical oil spikes, extreme festive surges (Diwali / Chhath), and fleet grounding shocks to assess consumer price vulnerability and national CPI transport inflation pass-through.
            </p>
          </div>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="btn-secondary self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Baseline
          </button>
        </div>
      </div>

      {/* Scenario Presets Quick-Selector */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-mono font-bold text-[#2C444D]/70 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#A88C6C]" />
            SELECT NATIONAL CRISIS PRESET (INSTANT SIMULATION)
          </span>
          <span className="text-[11px] font-mono text-[#5A7C83] font-bold">CLICK ANY TO WITNESS SHOCKWAVE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SCENARIO_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`p-3.5 rounded-xl text-left transition-all border font-sans cursor-pointer ${
                  isSelected
                    ? 'bg-[#FAF8F5] border-[#A88C6C] shadow-xs ring-1 ring-[#A88C6C]'
                    : 'bg-white border-[#C7B8A4] hover:border-[#A88C6C] hover:bg-[#FAF8F5]/60 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">{preset.icon}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#A88C6C] animate-ping" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-[#2C444D] mb-0.5">{preset.name}</h4>
                <p className="text-[10px] text-[#2C444D]/70 line-clamp-2 leading-tight">
                  {preset.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Odometer Impact KPI Cards */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Metric 1: Average Domestic Fare */}
        <div className="p-4 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs">
          <div className="text-[11px] text-[#2C444D]/70 mb-1 flex items-center justify-between">
            <span>Projected Domestic Fare</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                fareIncreasePercent > 0
                  ? 'bg-[#FAF8F5] text-[#A88C6C] border-[#A88C6C]'
                  : 'bg-[#FAF8F5] text-[#5A7C83] border-[#5A7C83]'
              }`}
            >
              {fareIncreasePercent >= 0 ? `+${fareIncreasePercent}%` : `${fareIncreasePercent}%`}
            </span>
          </div>
          <div className="text-2xl font-bold text-[#2C444D]">
            ₹{simulatedAvgFare.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-[#2C444D]/60 mt-1">
            Baseline: ₹{baselineAvgFare.toLocaleString('en-IN')} across 6 trunk hubs
          </div>
        </div>

        {/* Metric 2: CPI Transport Basket Shock */}
        <div className="p-4 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs">
          <div className="text-[11px] text-[#2C444D]/70 mb-1 flex items-center justify-between">
            <span>Transport CPI Inflation Shock</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#5A7C83] border border-[#5A7C83]">
              {cpiShockBps > 0.25 ? 'CRITICAL' : 'MODERATE'}
            </span>
          </div>
          <div className="text-2xl font-bold text-[#5A7C83]">
            +{cpiShockBps.toFixed(2)} bps
          </div>
          <div className="text-[10px] text-[#2C444D]/60 mt-1">
            MoSPI headline inflation pass-through
          </div>
        </div>

        {/* Metric 3: National Consumer Loss Burden */}
        <div className="p-4 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs">
          <div className="text-[11px] text-[#2C444D]/70 mb-1 flex items-center justify-between">
            <span>Monthly Consumer Outflow</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#A88C6C] border border-[#A88C6C]">
              EXTRA BURDEN
            </span>
          </div>
          <div className="text-2xl font-bold text-[#A88C6C]">
            ₹{consumerBurdenCrores.toLocaleString('en-IN')} Cr
          </div>
          <div className="text-[10px] text-[#2C444D]/60 mt-1">
            Excess tariff transfer from passenger wallets
          </div>
        </div>

        {/* Metric 4: Route Choke / Surge Multiplier */}
        <div className="p-4 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs">
          <div className="text-[11px] text-[#2C444D]/70 mb-1 flex items-center justify-between">
            <span>Stress Multiplier Index</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#2C444D] border border-[#2C444D]">
              ALGO SURGE
            </span>
          </div>
          <div className="text-2xl font-bold text-[#2C444D]">
            {combinedMultiplier.toFixed(2)}x
          </div>
          <div className="text-[10px] text-[#2C444D]/60 mt-1">
            Dynamic pricing elasticity coefficient
          </div>
        </div>
      </div>

      {/* Main Interactive Grid: Sliders Deck on Left + Geospatial Shockwave Canvas on Right */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulation Sliders Deck (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-[#C7B8A4]/50 pb-3">
              <span className="text-xs font-mono font-bold text-[#2C444D] uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#A88C6C]" />
                MANUAL STRESS PARAMETER CALIBRATION
              </span>
              <span className="text-[10px] font-mono text-[#A88C6C] font-bold">LIVE FEEDBACK</span>
            </div>

            {/* Slider 1: Fuel (ATF) Price Shift */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-[#2C444D] font-semibold flex items-center gap-1.5">
                  <span>⛽</span> Aviation Turbine Fuel (ATF) Cost Shift
                </span>
                <span className="font-bold text-[#A88C6C]">{fuelShift > 0 ? `+${fuelShift}%` : `${fuelShift}%`}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="60"
                step="5"
                value={fuelShift}
                onChange={(e) => {
                  setFuelShift(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full h-2 bg-[#FAF8F5] rounded-lg appearance-none cursor-pointer accent-[#A88C6C] border border-[#C7B8A4]"
              />
              <div className="flex justify-between text-[10px] text-[#2C444D]/60 font-mono mt-1">
                <span>-20% (Subsidized)</span>
                <span>0% (Neutral)</span>
                <span>+60% (Severe Crude Spike)</span>
              </div>
            </div>

            {/* Slider 2: Passenger Demand Multiplier */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-[#2C444D] font-semibold flex items-center gap-1.5">
                  <span>🪔</span> Festive / Peak Demand Multiplier
                </span>
                <span className="font-bold text-[#2C444D]">{demandSurge.toFixed(1)}x Peak</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.1"
                value={demandSurge}
                onChange={(e) => {
                  setDemandSurge(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full h-2 bg-[#FAF8F5] rounded-lg appearance-none cursor-pointer accent-[#2C444D] border border-[#C7B8A4]"
              />
              <div className="flex justify-between text-[10px] text-[#2C444D]/60 font-mono mt-1">
                <span>0.8x (Off-Peak)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Festive)</span>
                <span>3.0x (Critical Emergency)</span>
              </div>
            </div>

            {/* Slider 3: Fleet Grounding / Capacity Reduction */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-[#2C444D] font-semibold flex items-center gap-1.5">
                  <span>✈️</span> Fleet Grounding / Capacity Cut
                </span>
                <span className="font-bold text-[#5A7C83]">{fleetGrounded}% Grounded</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={fleetGrounded}
                onChange={(e) => {
                  setFleetGrounded(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full h-2 bg-[#FAF8F5] rounded-lg appearance-none cursor-pointer accent-[#5A7C83] border border-[#C7B8A4]"
              />
              <div className="flex justify-between text-[10px] text-[#2C444D]/60 font-mono mt-1">
                <span>0% (100% Operational)</span>
                <span>25% (Engine Inspections)</span>
                <span>50% (Severe Grounding)</span>
              </div>
            </div>

            {/* Hub Selector Toggles */}
            <div className="pt-2 border-t border-[#C7B8A4]/40">
              <span className="text-xs font-mono text-[#2C444D]/70 mb-2 block font-semibold">
                TARGET AIRPORT HUBS TRIGGERING SHOCKWAVES:
              </span>
              <div className="flex flex-wrap gap-2">
                {['DEL', 'BOM', 'BLR', 'CCU', 'HYD', 'MAA'].map((code) => {
                  const active = affectedHubs.includes(code);
                  return (
                    <button
                      key={code}
                      onClick={() => {
                        sfx.playClick();
                        if (active) {
                          setAffectedHubs(affectedHubs.filter((h) => h !== code));
                        } else {
                          setAffectedHubs([...affectedHubs, code]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#2C444D] text-white shadow-xs'
                          : 'bg-[#FAF8F5] text-[#2C444D] hover:bg-[#C7B8A4]/30 border border-[#C7B8A4]'
                      }`}
                    >
                      {code} {active && '●'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Policy Assessment Rationale */}
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#C7B8A4] shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#A88C6C]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold text-[#2C444D] uppercase font-mono">
                DGCA Regulatory Recommendation Engine
              </h3>
            </div>
            <p className="text-xs text-[#2C444D]/80 leading-relaxed">
              Under current simulated conditions (<strong>+{fareIncreasePercent}% fare inflation</strong>), dynamic pricing caps under Rule 135(1) are triggered. 
              MoCA should issue a temporary statutory upper bound ceiling of <strong>₹{(simulatedAvgFare * 0.78).toFixed(0)}</strong> on high-stress sectors ({affectedHubs.join(', ') || 'Nationwide'}) to safeguard consumer welfare and curb CPI transport inflation.
            </p>
          </div>
        </div>

        {/* Right Column: Geospatial Shockwave Canvas & Corridors Table (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Shockwave Radar / Visual Canvas Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-[#C7B8A4]/40 pb-2.5">
              <span className="text-xs font-mono font-bold text-[#2C444D] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#A88C6C]" />
                GEOSPATIAL SHOCKWAVE PROPAGATION GRID
              </span>
              <span className="text-[10px] font-mono font-bold text-[#A88C6C]">
                {affectedHubs.length} HUBS IN CRISIS
              </span>
            </div>

            {/* Canvas Area */}
            <div className="w-full aspect-[4/3] rounded-xl bg-[#FAF8F5] border border-[#C7B8A4] overflow-hidden flex items-center justify-center relative">
              <canvas
                ref={canvasRef}
                width={480}
                height={360}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 right-3 bg-[#FAF8F5]/90 backdrop-blur-md px-2.5 py-1 rounded border border-[#C7B8A4] font-mono text-[10px] text-[#2C444D] shadow-xs">
                PULSE INTENSITY: {(combinedMultiplier * 100).toFixed(0)}%
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#2C444D]/70">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#A88C6C]" /> Epicenter Hubs (Surge Initiators)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5A7C83]" /> Connecting Trunk Corridors
              </span>
            </div>
          </div>

          {/* Stressed Trunk Corridors Comparison Table */}
          <div className="p-5 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-[#2C444D] uppercase tracking-wide">
                TRUNK CORRIDOR SIMULATED TARIFFS
              </span>
              <span className="text-[10px] font-mono text-[#A88C6C] font-bold">SPOT T+1 HORIZON</span>
            </div>

            <div className="space-y-2.5 font-mono">
              {SIMULATED_ROUTES.map((route) => {
                const routeMultiplier = combinedMultiplier * (1 + (route.elasticity - 1) * 0.3);
                const projectedFare = Math.round(route.baseFare * routeMultiplier);
                const pct = Math.round(((projectedFare - route.baseFare) / route.baseFare) * 100);

                return (
                  <div
                    key={route.code}
                    className="p-3 rounded-xl bg-[#FAF8F5] border border-[#C7B8A4] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#2C444D]">{route.name}</div>
                      <div className="text-[10px] text-[#2C444D]/60">
                        Base: ₹{route.baseFare.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-[#2C444D]">
                        ₹{projectedFare.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] font-bold text-[#A88C6C]">
                        +{pct}% Surge
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorPage;
