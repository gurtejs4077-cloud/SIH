import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white mt-16 text-xs text-slate-500">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-200">
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              SIH 2026 Problem Statement
            </h4>
            <p className="text-slate-500 leading-relaxed">
              Development of a Real-time Airfare Price Index for India through Automated Observation of Airline and OTA Portals for Augmentation of the Consumer Price Index (CPI).
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Data Authenticity & Integrity
            </h4>
            <p className="text-slate-500 leading-relaxed">
              Strict demarcation between simulated and verified data. When external GDS APIs are active, records are labeled as <strong className="text-emerald-700 font-semibold">VERIFIED</strong>. When in demo mode, data is transparently marked <strong className="text-amber-700 font-semibold">DEMO DATA</strong>.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              Regulatory & Methodology Notice
            </h4>
            <p className="text-slate-500 leading-relaxed">
              This platform provides a <em>Prototype Airfare Price Index</em> constructed using weighted Laspeyres aggregation. It is an academic and technical prototype and not an official gazetted index of the Government of India or DGCA.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-slate-500 text-xs">
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
