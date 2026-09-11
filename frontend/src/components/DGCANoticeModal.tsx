import React, { useRef } from 'react';
import {
  ShieldAlert,
  Printer,
  Download,
  X,
  Building2,
  CheckCircle2,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2C444D]/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#C7B8A4] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Action Toolbar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#FAF8F5] text-[#2C444D] border-b border-[#C7B8A4]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#A88C6C]" />
            <span className="font-mono text-sm font-bold tracking-wide text-[#2C444D]">
              STATUTORY ENFORCEMENT ORDER • DGCA / MoCA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="btn-primary h-8 px-3"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#2C444D]/60 hover:text-[#2C444D] hover:bg-white border border-transparent hover:border-[#C7B8A4] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Notice Paper Content */}
        <div ref={printRef} className="p-8 sm:p-10 font-serif text-[#2C444D] leading-relaxed bg-white">
          {/* Official Emblem & Header */}
          <div className="text-center pb-6 border-b-2 border-[#2C444D]">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-full border-2 border-[#2C444D] flex items-center justify-center bg-[#FAF8F5]">
                <Building2 className="w-8 h-8 text-[#2C444D]" />
              </div>
            </div>
            <h2 className="text-xl font-bold tracking-widest uppercase text-[#2C444D]">
              GOVERNMENT OF INDIA
            </h2>
            <h3 className="text-base font-semibold tracking-wide uppercase text-[#2C444D]/90">
              MINISTRY OF CIVIL AVIATION
            </h3>
            <p className="text-xs font-sans text-[#2C444D]/80 font-medium">
              DIRECTORATE GENERAL OF CIVIL AVIATION (DGCA) • AIR TRANSPORT DIRECTORATE
            </p>
            <p className="text-[11px] font-sans text-[#2C444D]/60">
              Aurobindo Marg, Opp. Safdarjung Airport, New Delhi – 110003
            </p>
          </div>

          {/* Reference and Date Strip */}
          <div className="flex justify-between items-start font-sans text-xs pt-4 pb-4 border-b border-[#C7B8A4]/60">
            <div>
              <p className="font-semibold text-[#2C444D]">
                File Ref No: <span className="font-mono text-[#2C444D] font-bold">{notice.refNumber}</span>
              </p>
              <p className="text-[#2C444D]/70">Classification: STATUTORY ENFORCEMENT NOTICE / STRICT COMPLIANCE</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[#2C444D]">
                Date: <span className="font-mono text-[#2C444D]">{notice.detectedAt}</span>
              </p>
              <p className="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold uppercase bg-[#FAF8F5] text-[#A88C6C] border border-[#A88C6C]">
                PRIORITY: IMMEDIATE DISPATCH
              </p>
            </div>
          </div>

          {/* Addressee */}
          <div className="py-4 font-sans text-xs space-y-1">
            <p className="font-bold text-[#2C444D]">TO:</p>
            <p className="font-semibold text-[#2C444D]">The Chief Commercial Officer / Revenue Management Division</p>
            <p className="font-bold text-[#2C444D] uppercase">{notice.airline} Passenger Air Services</p>
            <p className="text-[#2C444D]/70">All Scheduled Air Operators Operating on Trunk Domestic Corridors</p>
          </div>

          {/* Subject Line */}
          <div className="my-3 p-3 bg-[#FAF8F5] border-l-4 border-l-[#A88C6C] border border-[#C7B8A4] rounded-r-lg font-sans text-xs">
            <span className="font-bold text-[#2C444D] uppercase">SUBJECT: </span>
            <span className="font-semibold text-[#2C444D]">
              SHOW CAUSE NOTICE UNDER RULE 135 & 161 OF THE AIRCRAFT RULES, 1937 FOR UNREASONABLE AIRFARE SURGE ON SECTOR {notice.routeCode} ({notice.routeName.toUpperCase()}).
            </span>
          </div>

          {/* Body Paragraphs */}
          <div className="text-xs space-y-3 font-sans text-[#2C444D]/90 leading-normal">
            <p>
              <strong>1. Statutory Finding:</strong> Automated real-time price surveillance conducted by the National Airfare Price Index & Monitoring System (MoCA-SIH AI Grid) has observed predatory and uncalibrated fare inflation on the scheduled sector <strong>{notice.routeName}</strong>.
            </p>

            {/* Evidence Metric Table */}
            <div className="my-4 border border-[#C7B8A4] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#2C444D] font-bold border-b border-[#C7B8A4]">
                  <tr>
                    <th className="py-2 px-3">Surveillance Parameter</th>
                    <th className="py-2 px-3">Observed Metric</th>
                    <th className="py-2 px-3">Regulatory Benchmark</th>
                    <th className="py-2 px-3">Deviation Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C7B8A4]/40 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 font-sans text-[#2C444D] font-medium">Spot Fare (T+1 Horizon)</td>
                    <td className="py-2 px-3 font-bold text-[#A88C6C]">₹{notice.currentFare.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-[#2C444D]/70">₹{notice.baselineFare.toLocaleString('en-IN')} (30-Day Mean)</td>
                    <td className="py-2 px-3 font-bold text-[#A88C6C]">+{notice.surgeMultiplier}% Spike</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-[#2C444D] font-medium">Cartelization Risk Index</td>
                    <td className="py-2 px-3 font-bold text-[#CCB68E]">84.6 / 100 (HIGH)</td>
                    <td className="py-2 px-3 text-[#2C444D]/70">&lt; 35.0 (Normal Dispersion)</td>
                    <td className="py-2 px-3 font-bold text-[#CCB68E]">Synchronized Hikes</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-[#2C444D] font-medium">Inflation Basket Distortion</td>
                    <td className="py-2 px-3 font-bold text-[#5A7C83]">+0.22 bps</td>
                    <td className="py-2 px-3 text-[#2C444D]/70">Transport CPI Threshold</td>
                    <td className="py-2 px-3 text-[#5A7C83] font-semibold">Elevated Impact</td>
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
          <div className="mt-8 pt-6 border-t border-[#C7B8A4] flex justify-between items-end font-sans">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#A88C6C] p-1 flex flex-col items-center justify-center text-center rotate-[-8deg] bg-[#FAF8F5]">
                <Stamp className="w-5 h-5 text-[#A88C6C] mb-0.5" />
                <span className="text-[8px] font-bold uppercase tracking-tight text-[#A88C6C] leading-tight">
                  DGCA SURVEILLANCE CELL
                </span>
                <span className="text-[7px] text-[#A88C6C] font-mono">VERIFIED AI AUDIT</span>
              </div>
              <div className="text-[10px] text-[#2C444D]/70">
                <p>Digital Cryptographic Hash:</p>
                <p className="font-mono text-[#2C444D] font-bold text-[9px]">SHA256: 8f4c2b9a...710e2d58</p>
                <p className="text-[9px] text-[#5A7C83] font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Digitally Stamped & Authenticated
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-serif italic font-bold text-[#2C444D] text-sm mb-1 tracking-wide">
                Rajiv Shrivastav
              </div>
              <p className="font-bold text-[#2C444D]">Controller of Air Transport Regulations</p>
              <p className="text-[#2C444D]/80 text-[11px]">For Directorate General of Civil Aviation</p>
              <p className="text-[#2C444D]/60 text-[10px]">Ministry of Civil Aviation, Govt. of India</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#C7B8A4] flex items-center justify-between">
          <span className="text-xs text-[#2C444D]/70 flex items-center gap-1.5 font-medium">
            <FileCheck className="w-4 h-4 text-[#5A7C83]" />
            Automatic dispatch generated under Section 19A Regulatory Framework
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close Window
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary"
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
