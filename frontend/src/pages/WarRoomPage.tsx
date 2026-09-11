import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Radio,
  Volume2,
  VolumeX,
  Mic,
  Square,
  AlertTriangle,
  Zap,
  Activity,
  Crosshair,
  FileSpreadsheet,
  FileWarning,
  Eye,
  Radar,
  ArrowUpRight,
  Sparkles,
  Plane,
  Building2,
  Lock,
  RefreshCw
} from 'lucide-react';
import { sfx, speakExecutiveBriefing, stopSpeech } from '../utils/audioEffects';
import { DGCANoticeModal, NoticeDetails } from '../components/DGCANoticeModal';

interface RadarAirport {
  code: string;
  name: string;
  x: number; // percentage in radar canvas
  y: number;
  status: 'critical' | 'warning' | 'normal';
  surge: string;
}

interface CorridorTelemetry {
  id: string;
  origin: string;
  dest: string;
  name: string;
  airline: string;
  spotFare: number;
  baselineFare: number;
  surgeMultiplier: number;
  anomalyLevel: 'EXTREME' | 'UNUSUALLY HIGH' | 'ELEVATED' | 'NORMAL';
  cartelScore: number;
  lastUpdated: string;
}

const RADAR_AIRPORTS: RadarAirport[] = [
  { code: 'DEL', name: 'New Delhi (Indira Gandhi Intl)', x: 48, y: 28, status: 'critical', surge: '+184%' },
  { code: 'BOM', name: 'Mumbai (Chhatrapati Shivaji Intl)', x: 32, y: 55, status: 'critical', surge: '+162%' },
  { code: 'BLR', name: 'Bengaluru (Kempegowda Intl)', x: 45, y: 78, status: 'warning', surge: '+118%' },
  { code: 'CCU', name: 'Kolkata (Netaji Subhash Chandra Intl)', x: 74, y: 44, status: 'normal', surge: '+14%' },
  { code: 'HYD', name: 'Hyderabad (Rajiv Gandhi Intl)', x: 49, y: 64, status: 'warning', surge: '+94%' },
  { code: 'MAA', name: 'Chennai (Chennai Intl)', x: 55, y: 82, status: 'normal', surge: '+22%' },
];

const INITIAL_CORRIDORS: CorridorTelemetry[] = [
  {
    id: 'DEL-BOM',
    origin: 'DEL',
    dest: 'BOM',
    name: 'Delhi ⇄ Mumbai',
    airline: 'IndiGo / Air India',
    spotFare: 14850,
    baselineFare: 5240,
    surgeMultiplier: 184,
    anomalyLevel: 'EXTREME',
    cartelScore: 88,
    lastUpdated: '06:14:02 IST'
  },
  {
    id: 'DEL-BLR',
    origin: 'DEL',
    dest: 'BLR',
    name: 'Delhi ⇄ Bengaluru',
    airline: 'Air India / Vistara',
    spotFare: 13200,
    baselineFare: 6100,
    surgeMultiplier: 116,
    anomalyLevel: 'UNUSUALLY HIGH',
    cartelScore: 79,
    lastUpdated: '06:13:48 IST'
  },
  {
    id: 'BOM-BLR',
    origin: 'BOM',
    dest: 'BLR',
    name: 'Mumbai ⇄ Bengaluru',
    airline: 'IndiGo / Akasa',
    spotFare: 9450,
    baselineFare: 4200,
    surgeMultiplier: 125,
    anomalyLevel: 'UNUSUALLY HIGH',
    cartelScore: 82,
    lastUpdated: '06:13:30 IST'
  },
  {
    id: 'DEL-HYD',
    origin: 'DEL',
    dest: 'HYD',
    name: 'Delhi ⇄ Hyderabad',
    airline: 'IndiGo / SpiceJet',
    spotFare: 8900,
    baselineFare: 4600,
    surgeMultiplier: 93,
    anomalyLevel: 'ELEVATED',
    cartelScore: 61,
    lastUpdated: '06:12:55 IST'
  },
  {
    id: 'BOM-MAA',
    origin: 'BOM',
    dest: 'MAA',
    name: 'Mumbai ⇄ Chennai',
    airline: 'IndiGo / Air India',
    spotFare: 5100,
    baselineFare: 4200,
    surgeMultiplier: 21,
    anomalyLevel: 'NORMAL',
    cartelScore: 28,
    lastUpdated: '06:12:10 IST'
  },
  {
    id: 'DEL-CCU',
    origin: 'DEL',
    dest: 'CCU',
    name: 'Delhi ⇄ Kolkata',
    airline: 'Air India / SpiceJet',
    spotFare: 5800,
    baselineFare: 5100,
    surgeMultiplier: 14,
    anomalyLevel: 'NORMAL',
    cartelScore: 22,
    lastUpdated: '06:11:42 IST'
  }
];

export const WarRoomPage: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCorridor, setSelectedCorridor] = useState<CorridorTelemetry>(INITIAL_CORRIDORS[0]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState<NoticeDetails | null>(null);
  const [radarAngle, setRadarAngle] = useState(0);
  const [audioWaveHeights, setAudioWaveHeights] = useState<number[]>([12, 28, 45, 60, 34, 18, 52, 70, 42, 25]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync SFX manager sound preference
  useEffect(() => {
    sfx.soundEnabled = soundEnabled;
  }, [soundEnabled]);

  // Animated Radar Sweep Loop
  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setRadarAngle((prev) => (prev + 1.2) % 360);
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Equalizer animation when voice is speaking
  useEffect(() => {
    if (!isSpeaking) return;
    const interval = setInterval(() => {
      setAudioWaveHeights(
        Array.from({ length: 14 }, () => Math.floor(Math.random() * 55) + 10)
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Executive Speech Synthesis Trigger
  const triggerExecutiveBriefing = () => {
    sfx.playAlertChime();
    const briefingScript = `Attention DGCA Operations Command. National Airspace Surveillance Briefing. Current Threat Level: Amber. Severe tariff distress identified on sector ${selectedCorridor.name}. Current spot fare has surged to rupees ${selectedCorridor.spotFare}, which is ${selectedCorridor.surgeMultiplier} percent above the 30-day baseline ceiling. Algorithmic cartelization risk is measured at ${selectedCorridor.cartelScore} out of 100 between ${selectedCorridor.airline}. Estimated CPI transport basket shock is plus 0.22 basis points. Recommending immediate issuance of Statutory Show-Cause Notice under Section 19A of the Aircraft Rules.`;

    speakExecutiveBriefing(
      briefingScript,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleStopBriefing = () => {
    stopSpeech();
    setIsSpeaking(false);
  };

  const handleOpenNotice = (corridor: CorridorTelemetry) => {
    sfx.playClick();
    setActiveNotice({
      routeCode: corridor.id,
      routeName: corridor.name,
      airline: corridor.airline,
      currentFare: corridor.spotFare,
      baselineFare: corridor.baselineFare,
      surgeMultiplier: corridor.surgeMultiplier,
      anomalyLevel: corridor.anomalyLevel,
      detectedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      refNumber: `DGCA/ATD/2026/SEC19A-${corridor.id}-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setNoticeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C444D] selection:bg-[#CCB68E]/40 selection:text-[#2C444D] p-3 sm:p-6 lg:p-8 font-sans">
      {/* Top Futuristic Command Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[#5A7C83]/15 border border-[#5A7C83]/40 text-[#5A7C83] shadow-xs">
              <Radar className="w-6 h-6 animate-spin text-[#5A7C83]" style={{ animationDuration: '6s' }} />
              <div className="absolute inset-0 rounded-xl border border-[#5A7C83]/40 animate-ping opacity-25" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase bg-[#CCB68E]/25 text-[#2C444D] border border-[#A88C6C] tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#A88C6C] animate-pulse" />
                  DEFCON 2 • THREAT LEVEL AMBER
                </span>
                <span className="text-[#C7B8A4] text-xs hidden sm:inline">|</span>
                <span className="text-xs font-mono text-[#5A7C83] font-semibold hidden sm:inline">
                  SYSTEM ACTIVE • 1,280 FLIGHTS MONITORED
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2C444D] flex items-center gap-2">
                NATIONAL AIRFARE WAR ROOM
                <span className="text-xs font-mono font-medium text-[#2C444D] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#C7B8A4]">
                  DGCA AI RADAR GRID
                </span>
              </h1>
            </div>
          </div>

          {/* Quick Sound and Status Controls */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                sfx.playClick();
              }}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-[#5A7C83]/20 border-[#5A7C83] text-[#2C444D] shadow-xs'
                  : 'bg-[#FAF8F5] border-[#C7B8A4] text-[#5A7C83]'
              }`}
              title={soundEnabled ? 'Mute Command SFX' : 'Enable Command SFX'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#5A7C83]" /> : <VolumeX className="w-4 h-4" />}
              <span className="font-mono text-xs">{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
            </button>

            <button
              onClick={isSpeaking ? handleStopBriefing : triggerExecutiveBriefing}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                isSpeaking
                  ? 'bg-[#A88C6C] hover:bg-[#2C444D] text-white animate-pulse'
                  : 'bg-[#2C444D] hover:bg-[#5A7C83] text-white font-bold shadow-xs'
              }`}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>STOP VOICE BRIEFING</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-[#CCB68E]" />
                  <span>🎙️ BRIEF DGCA DIRECTOR</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Voice Visualizer Bar if speaking */}
      {isSpeaking && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-xl bg-[#5A7C83]/15 border border-[#5A7C83]/40 shadow-xs flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#5A7C83] animate-ping" />
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#2C444D]">
                AI EXECUTIVE VOICE COPILOT TRANSMITTING • AUDIO FEED LIVE
              </p>
              <p className="text-xs text-[#5A7C83] italic">
                "{selectedCorridor.name}: Anomaly surge of +{selectedCorridor.surgeMultiplier}% detected. Recommending Section 19A statutory advisory notice."
              </p>
            </div>
          </div>
          {/* Waveform Equalizer Bars */}
          <div className="flex items-end gap-1 h-8 px-3">
            {audioWaveHeights.map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-[#2C444D] to-[#CCB68E] rounded-full transition-all duration-100"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Radar Screen on Left + Tactical Telemetry on Right */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Airspace Radar HUD (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Cyber Radar Display Card */}
          <div className="relative rounded-2xl bg-white border border-[#C7B8A4] shadow-xs p-6 overflow-hidden">
            {/* Top HUD Metrics Bar */}
            <div className="flex items-center justify-between border-b border-[#C7B8A4]/60 pb-3 mb-4 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#5A7C83] font-bold">
                <Crosshair className="w-4 h-4" />
                <span>AIRSPACE GEOSPATIAL RADAR • 360° SWEEP</span>
              </div>
              <div className="text-[#A88C6C]">
                LAT: 20.5937° N | LON: 78.9629° E
              </div>
            </div>

            {/* Simulated Radar Circular Scope Container */}
            <div className="relative w-full aspect-[4/3] max-h-[440px] rounded-xl bg-[#FAF8F5] border border-[#C7B8A4] overflow-hidden flex items-center justify-center">
              {/* Radar Concentric Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[85%] h-[85%] rounded-full border border-[#5A7C83]/20" />
                <div className="w-[60%] h-[60%] rounded-full border border-[#5A7C83]/25" />
                <div className="w-[35%] h-[35%] rounded-full border border-[#5A7C83]/30" />
                <div className="w-[12%] h-[12%] rounded-full border border-[#5A7C83]/40 bg-[#5A7C83]/5" />
                {/* Crosshair Axes */}
                <div className="absolute w-full h-[1px] bg-[#5A7C83]/15" />
                <div className="absolute h-full w-[1px] bg-[#5A7C83]/15" />
                <div className="absolute w-full h-[1px] bg-[#5A7C83]/10 rotate-45" />
                <div className="absolute w-full h-[1px] bg-[#5A7C83]/10 -rotate-45" />
              </div>

              {/* 360 Degree Rotating Radar Beam Sweep */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `conic-gradient(from ${radarAngle}deg at 50% 50%, rgba(90, 124, 131, 0.22) 0deg, rgba(90, 124, 131, 0) 65deg)`,
                  transformOrigin: '50% 50%'
                }}
              />

              {/* Flight Arcs Connecting Hubs */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* DEL to BOM Line */}
                <line
                  x1="48%"
                  y1="28%"
                  x2="32%"
                  y2="55%"
                  stroke="#A88C6C"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
                {/* DEL to BLR Line */}
                <line
                  x1="48%"
                  y1="28%"
                  x2="45%"
                  y2="78%"
                  stroke="#CCB68E"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {/* BOM to BLR Line */}
                <line
                  x1="32%"
                  y1="55%"
                  x2="45%"
                  y2="78%"
                  stroke="#CCB68E"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {/* DEL to CCU Line */}
                <line
                  x1="48%"
                  y1="28%"
                  x2="74%"
                  y2="44%"
                  stroke="#5A7C83"
                  strokeWidth="1.5"
                />
                {/* DEL to HYD Line */}
                <line
                  x1="48%"
                  y1="28%"
                  x2="49%"
                  y2="64%"
                  stroke="#A88C6C"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                {/* HYD to MAA Line */}
                <line
                  x1="49%"
                  y1="64%"
                  x2="55%"
                  y2="82%"
                  stroke="#5A7C83"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Plotted Airport Radar Nodes */}
              {RADAR_AIRPORTS.map((airport) => {
                const isSelected = selectedCorridor.origin === airport.code || selectedCorridor.dest === airport.code;
                const isCritical = airport.status === 'critical';
                const isWarning = airport.status === 'warning';

                return (
                  <div
                    key={airport.code}
                    onClick={() => {
                      sfx.playRadarBlip();
                      const match = INITIAL_CORRIDORS.find(
                        (c) => c.origin === airport.code || c.dest === airport.code
                      );
                      if (match) setSelectedCorridor(match);
                    }}
                    style={{ left: `${airport.x}%`, top: `${airport.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                  >
                    {/* Pulsing ring around node */}
                    <div
                      className={`absolute -inset-2.5 rounded-full animate-ping opacity-30 ${
                        isCritical
                          ? 'bg-[#A88C6C]'
                          : isWarning
                          ? 'bg-[#CCB68E]'
                          : 'bg-[#5A7C83]'
                      }`}
                    />

                    {/* Airport Dot Icon */}
                    <div
                      className={`relative w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-[9px] border-2 shadow-xs transition-transform group-hover:scale-125 ${
                        isSelected
                          ? 'bg-[#2C444D] text-white border-[#CCB68E] scale-110 shadow-md ring-2 ring-[#CCB68E]'
                          : isCritical
                          ? 'bg-[#A88C6C]/25 text-[#2C444D] border-[#A88C6C]'
                          : isWarning
                          ? 'bg-[#CCB68E]/30 text-[#2C444D] border-[#CCB68E]'
                          : 'bg-[#5A7C83]/20 text-[#2C444D] border-[#5A7C83]'
                      }`}
                    >
                      {airport.code}
                    </div>

                    {/* Floating Info Tag */}
                    <div className="absolute left-7 top-1/2 -translate-y-1/2 bg-white/95 border border-[#C7B8A4] px-2 py-0.5 rounded shadow-sm pointer-events-none whitespace-nowrap opacity-90 group-hover:opacity-100 z-20">
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="font-bold text-[#2C444D]">{airport.code}</span>
                        <span
                          className={`font-bold ${
                            isCritical ? 'text-[#A88C6C]' : isWarning ? 'text-[#CCB68E]' : 'text-[#5A7C83]'
                          }`}
                        >
                          {airport.surge}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bottom Radar Legend Overlay */}
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-[#5A7C83] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#C7B8A4] shadow-xs">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#A88C6C] animate-pulse" /> Extreme Gouging (&gt;150%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#CCB68E]" /> Elevated (&gt;60%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#5A7C83]" /> Baseline Price
                  </span>
                </div>
                <span className="hidden sm:inline text-[#2C444D] font-bold">CLICK AIRPORT TO LOCK</span>
              </div>
            </div>

            {/* Radar Telemetry Sub-panel */}
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#C7B8A4] shadow-xs">
                <div className="text-[10px] text-[#5A7C83] uppercase">Collusion Alert</div>
                <div className="text-sm font-bold text-[#A88C6C] flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> HIGH RISK
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#C7B8A4] shadow-xs">
                <div className="text-[10px] text-[#5A7C83] uppercase">Active Scrapes/Min</div>
                <div className="text-sm font-bold text-[#5A7C83]">248 OTAs / GDS</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#C7B8A4] shadow-xs">
                <div className="text-[10px] text-[#5A7C83] uppercase">CPI Shockwave</div>
                <div className="text-sm font-bold text-[#CCB68E]">+0.22 bps</div>
              </div>
            </div>
          </div>

          {/* Algorithmic Collusion & Cartel Radar Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#5A7C83]" />
                <h3 className="text-sm font-bold text-[#2C444D] tracking-wide uppercase font-mono">
                  Algorithmic Price Synchronization & Collusion Radar
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#CCB68E]/25 text-[#2C444D] border border-[#CCB68E]">
                AI PATTERN RECOGNITION
              </span>
            </div>
            <p className="text-xs text-[#5A7C83] mb-4 leading-relaxed">
              Detects simultaneous 30-second algorithmic fare mirrorings between major carriers. On the <strong>{selectedCorridor.name}</strong> corridor, IndiGo and Air India pricing algorithms exhibited an <strong>{selectedCorridor.cartelScore}% synchronization coefficient</strong> over the last 6 observation cycles.
            </p>

            <div className="w-full bg-[#FAF8F5] rounded-xl p-3 border border-[#C7B8A4] flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-[11px] font-mono text-[#5A7C83] mb-1">
                  <span>Collusion Probability Index</span>
                  <span className="font-bold text-[#A88C6C]">{selectedCorridor.cartelScore} / 100</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#C7B8A4]/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#5A7C83] via-[#CCB68E] to-[#A88C6C] transition-all duration-500"
                    style={{ width: `${selectedCorridor.cartelScore}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => handleOpenNotice(selectedCorridor)}
                className="px-3 py-2 rounded-lg bg-[#CCB68E]/25 hover:bg-[#CCB68E]/40 border border-[#CCB68E] text-[#2C444D] font-mono text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
              >
                ⚖️ Audit Collusion
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Corridor Telemetry & Enforcement Deck (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Target Route HUD Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#5A7C83] font-bold flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" /> LOCKED CORRIDOR TELEMETRY
              </span>
              <span className="text-[10px] font-mono text-[#A88C6C]">
                SYNCED: {selectedCorridor.lastUpdated}
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#2C444D]">{selectedCorridor.name}</h2>
                <p className="text-xs font-mono text-[#5A7C83]">{selectedCorridor.airline}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#5A7C83] font-mono">Spot Fare (T+1)</div>
                <div className="text-2xl font-mono font-bold text-[#2C444D]">
                  ₹{selectedCorridor.spotFare.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Deviation Comparison Cards */}
            <div className="grid grid-cols-2 gap-3 mb-5 font-mono">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#C7B8A4]">
                <div className="text-[10px] text-[#5A7C83]">Normal Baseline</div>
                <div className="text-base font-bold text-[#2C444D]">
                  ₹{selectedCorridor.baselineFare.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-[#A88C6C]">30-Day Fair Ceiling</div>
              </div>

              <div className="p-3 rounded-xl bg-[#CCB68E]/20 border border-[#CCB68E]">
                <div className="text-[10px] text-[#A88C6C]">Surge Deviation</div>
                <div className="text-base font-bold text-[#2C444D]">
                  +{selectedCorridor.surgeMultiplier}% SPIKE
                </div>
                <div className="text-[10px] text-[#A88C6C] font-semibold">{selectedCorridor.anomalyLevel}</div>
              </div>
            </div>

            {/* Quick Action: Statutory Show Cause Notice */}
            <div className="p-4 rounded-xl bg-[#CCB68E]/20 border border-[#CCB68E] mb-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#A88C6C] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#2C444D]">Statutory Action Ready</h4>
                  <p className="text-[11px] text-[#5A7C83] leading-tight">
                    Evidence meets DGCA Section 19A criteria for predatory surge during non-weather operational periods.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenNotice(selectedCorridor)}
                className="w-full mt-3 py-2.5 rounded-lg bg-[#2C444D] hover:bg-[#5A7C83] text-white font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <FileWarning className="w-4 h-4 text-[#CCB68E]" />
                ISSUE DGCA SHOW-CAUSE NOTICE
              </button>
            </div>

            {/* Ministerial Speech Audio Trigger */}
            <button
              onClick={() => {
                sfx.playClick();
                triggerExecutiveBriefing();
              }}
              className="btn-secondary w-full"
            >
              <Volume2 className="w-4 h-4 text-[#5A7C83]" />
              PLAY EXECUTIVE CORRIDOR AUDIO DISPATCH
            </button>
          </div>

          {/* Live Monitored Trunk Corridors List */}
          <div className="p-5 rounded-2xl bg-white border border-[#C7B8A4] shadow-xs flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-[#2C444D] uppercase tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#5A7C83]" />
                TRUNK CORRIDORS LIVE SURVEILLANCE
              </span>
              <span className="text-[10px] font-mono text-[#A88C6C]">6 ACTIVE FEEDS</span>
            </div>

            <div className="space-y-2">
              {INITIAL_CORRIDORS.map((corridor) => {
                const isSelected = selectedCorridor.id === corridor.id;
                return (
                  <div
                    key={corridor.id}
                    onClick={() => {
                      sfx.playClick();
                      setSelectedCorridor(corridor);
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-all border font-mono ${
                      isSelected
                        ? 'bg-[#C7B8A4]/35 border-[#5A7C83] shadow-xs ring-1 ring-[#5A7C83]'
                        : 'bg-[#FAF8F5] border-[#C7B8A4]/60 hover:border-[#A88C6C] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#2C444D] flex items-center gap-1.5">
                        <Plane className="w-3.5 h-3.5 text-[#5A7C83]" />
                        {corridor.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          corridor.anomalyLevel === 'EXTREME'
                            ? 'bg-[#A88C6C]/25 text-[#2C444D] border border-[#A88C6C]'
                            : corridor.anomalyLevel === 'UNUSUALLY HIGH'
                            ? 'bg-[#CCB68E]/30 text-[#2C444D] border border-[#CCB68E]'
                            : corridor.anomalyLevel === 'ELEVATED'
                            ? 'bg-[#CCB68E]/20 text-[#2C444D] border border-[#CCB68E]/70'
                            : 'bg-[#5A7C83]/20 text-[#2C444D] border border-[#5A7C83]'
                        }`}
                      >
                        +{corridor.surgeMultiplier}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#5A7C83]">
                      <span>{corridor.airline}</span>
                      <span className="font-bold text-[#2C444D]">₹{corridor.spotFare.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DGCA Statutory Legal Notice Modal */}
      <DGCANoticeModal
        isOpen={noticeModalOpen}
        onClose={() => setNoticeModalOpen(false)}
        notice={activeNotice}
      />
    </div>
  );
};

export default WarRoomPage;
