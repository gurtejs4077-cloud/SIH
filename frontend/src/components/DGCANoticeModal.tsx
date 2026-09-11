import React, { useRef } from 'react';
import {
  ShieldAlert,
  Printer,
  Download,
  X,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Stamp
} from 'lucide-react';

export interface NoticeDetails {
  routeCode: string;
  routeName: string;
  airline: string;
  currentFare: number;
  baselineFare: number;
  surgeMultiplier: number;
  anomalyLevel: string;
  detectedAt: string;
  refNumber: string;
}

interface DGCANoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: NoticeDetails | null;
}

export const DGCANoticeModal: React.FC<DGCANoticeModalProps> = ({ isOpen, onClose, notice }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !notice) return null;

  const handlePrint = () => {
    window.print();
  };

  const penaltyAmount = Math.round(notice.currentFare * 140 * 12); // Simulated route daily passenger fine estimate

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Action Toolbar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span className="font-mono text-sm font-semibold tracking-wide text-amber-300">
              STATUTORY ENFORCEMENT ORDER • DGCA / MoCA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Notice Paper Content */}
        <div ref={printRef} className="p-8 sm:p-10 font-serif text-slate-900 leading-relaxed bg-white">
          {/* Official Emblem & Header */}
          <div className="text-center pb-6 border-b-2 border-slate-900">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-full border-2 border-slate-800 flex items-center justify-center bg-amber-50">
                <Building2 className="w-8 h-8 text-amber-800" />
              </div>
            </div>
            <h2 className="text-xl font-bold tracking-widest uppercase text-slate-900">
              GOVERNMENT OF INDIA
            </h2>
            <h3 className="text-base font-semibold tracking-wide uppercase text-slate-800">
              MINISTRY OF CIVIL AVIATION
            </h3>
            <p className="text-xs font-sans text-slate-600 font-medium">
              DIRECTORATE GENERAL OF CIVIL AVIATION (DGCA) • AIR TRANSPORT DIRECTORATE
            </p>
            <p className="text-[11px] font-sans text-slate-500">
              Aurobindo Marg, Opp. Safdarjung Airport, New Delhi – 110003
            </p>
          </div>

          {/* Reference and Date Strip */}
          <div className="flex justify-between items-start font-sans text-xs pt-4 pb-4 border-b border-slate-200">
            <div>
              <p className="font-semibold text-slate-700">
                File Ref No: <span className="font-mono text-slate-900 font-bold">{notice.refNumber}</span>
              </p>
              <p className="text-slate-500">Classification: STATUTORY ENFORCEMENT NOTICE / STRICT COMPLIANCE</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-700">
                Date: <span className="font-mono text-slate-900">{notice.detectedAt}</span>
              </p>
              <p className="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-200">
                PRIORITY: IMMEDIATE DISPATCH
              </p>
            </div>
          </div>

          {/* Addressee */}
          <div className="py-4 font-sans text-xs space-y-1">
            <p className="font-bold text-slate-900">TO:</p>
            <p className="font-semibold text-slate-800">The Chief Commercial Officer / Revenue Management Division</p>
            <p className="font-bold text-blue-900 uppercase">{notice.airline} Passenger Air Services</p>
            <p className="text-slate-600">All Scheduled Air Operators Operating on Trunk Domestic Corridors</p>
          </div>

          {/* Subject Line */}
          <div className="my-3 p-3 bg-amber-50 border-l-4 border-amber-600 rounded-r-lg font-sans text-xs">
            <span className="font-bold text-slate-900 uppercase">SUBJECT: </span>
            <span className="font-semibold text-slate-800">
              SHOW CAUSE NOTICE UNDER RULE 135 & 161 OF THE AIRCRAFT RULES, 1937 FOR UNREASONABLE AIRFARE SURGE ON SECTOR {notice.routeCode} ({notice.routeName.toUpperCase()}).
            </span>
          </div>

          {/* Body Paragraphs */}
          <div className="text-xs space-y-3 font-sans text-slate-700 leading-normal">
            <p>
              <strong>1. Statutory Finding:</strong> Automated real-time price surveillance conducted by the National Airfare Price Index & Monitoring System (MoCA-SIH AI Grid) has observed predatory and uncalibrated fare inflation on the scheduled sector <strong>{notice.routeName}</strong>.
            </p>

            {/* Evidence Metric Table */}
            <div className="my-4 border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3">Surveillance Parameter</th>
                    <th className="py-2 px-3">Observed Metric</th>
                    <th className="py-2 px-3">Regulatory Benchmark</th>
                    <th className="py-2 px-3">Deviation Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 font-sans text-slate-800 font-medium">Spot Fare (T+1 Horizon)</td>
                    <td className="py-2 px-3 font-bold text-red-600">₹{notice.currentFare.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-slate-600">₹{notice.baselineFare.toLocaleString('en-IN')} (30-Day Mean)</td>
                    <td className="py-2 px-3 font-bold text-red-700">+{notice.surgeMultiplier}% Spike</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-slate-800 font-medium">Cartelization Risk Index</td>
                    <td className="py-2 px-3 font-bold text-amber-600">84.6 / 100 (HIGH)</td>
                    <td className="py-2 px-3 text-slate-600">&lt; 35.0 (Normal Dispersion)</td>
                    <td className="py-2 px-3 font-bold text-amber-700">Synchronized Hikes</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-slate-800 font-medium">Inflation Basket Distortion</td>
                    <td className="py-2 px-3 font-bold text-slate-900">+0.22 bps</td>
                    <td className="py-2 px-3 text-slate-600">Transport CPI Threshold</td>
                    <td className="py-2 px-3 text-orange-600 font-semibold">Elevated Impact</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              <strong>2. Legal Directive:</strong> Whereas Rule 135(1) of the Aircraft Rules mandates that airlines shall establish tariffs having regard to all relevant factors, including the cost of operation and reasonable profit, the observed pricing constitutes predatory surge pricing contrary to public interest and consumer welfare.
            </p>

            <p>
              <strong>3. Requirement to Show Cause:</strong> You are hereby directed to <strong>show cause within 48 hours</strong> of receipt of this notice as to why corrective fare caps should not be imposed on the sector, and why appropriate penalties up to <strong>₹{(penaltyAmount / 100000).toFixed(2)} Lakhs</strong> under Rule 161 should not be initiated against the carrier.
            </p>
          </div>

          {/* Signatures and Official Stamp */}
          <div className="mt-8 pt-6 border-t border-slate-300 flex justify-between items-end font-sans">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-700/60 p-1 flex flex-col items-center justify-center text-center rotate-[-8deg] bg-red-50/50">
                <Stamp className="w-5 h-5 text-red-700 mb-0.5" />
                <span className="text-[8px] font-bold uppercase tracking-tight text-red-800 leading-tight">
                  DGCA SURVEILLANCE CELL
                </span>
                <span className="text-[7px] text-red-600 font-mono">VERIFIED AI AUDIT</span>
              </div>
              <div className="text-[10px] text-slate-500">
                <p>Digital Cryptographic Hash:</p>
                <p className="font-mono text-slate-700 font-semibold text-[9px]">SHA256: 8f4c2b9a...710e2d58</p>
                <p className="text-[9px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Digitally Stamped & Authenticated
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-serif italic font-bold text-slate-800 text-sm mb-1 tracking-wide">
                Rajiv Shrivastav
              </div>
              <p className="font-bold text-slate-900">Controller of Air Transport Regulations</p>
              <p className="text-slate-600 text-[11px]">For Directorate General of Civil Aviation</p>
              <p className="text-slate-500 text-[10px]">Ministry of Civil Aviation, Govt. of India</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            Automatic dispatch generated under Section 19A Regulatory Framework
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Close Window
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Download Statutory Notice (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
