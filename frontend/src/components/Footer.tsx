import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#C7B8A4] bg-white mt-16 text-xs text-[#2C444D]/70">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-[#C7B8A4]/60">
          <div>
            <h4 className="font-bold text-[#2C444D] text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#5A7C83]" />
              SIH 2026 Problem Statement
            </h4>
            <p className="text-[#2C444D]/70 leading-relaxed">
              Development of a Real-time Airfare Price Index for India through Automated Observation of Airline and OTA Portals for Augmentation of the Consumer Price Index (CPI).
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#2C444D] text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#A88C6C]" />
              Data Authenticity & Integrity
            </h4>
            <p className="text-[#2C444D]/70 leading-relaxed">
              Strict demarcation between simulated and verified data. When external GDS APIs are active, records are labeled as <strong className="text-[#5A7C83] font-bold">VERIFIED</strong>. When in demo mode, data is transparently marked <strong className="text-[#A88C6C] font-bold">DEMO DATA</strong>.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#2C444D] text-xs uppercase tracking-wider mb-2">
              Regulatory & Methodology Notice
            </h4>
            <p className="text-[#2C444D]/70 leading-relaxed">
              This platform provides a <em>Prototype Airfare Price Index</em> constructed using weighted Laspeyres aggregation. It is an academic and technical prototype and not an official gazetted index of the Government of India or DGCA.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-[#2C444D]/60 text-xs">
          <div>
            © 2026 Indian Airfare Price Intelligence Platform • Built for SIH 2026
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0 font-medium">
            <span>Laspeyres Index Aggregation</span>
            <span>•</span>
            <span>Ethical Public Observation Policy</span>
            <span>•</span>
            <span>Booking Elasticity Analytics</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
