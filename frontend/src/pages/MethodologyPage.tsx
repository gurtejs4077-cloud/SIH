import React from 'react';
import { BookOpen, Shield, Calculator, CheckCircle, AlertTriangle, Key } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <span>Technical Methodology & Compliance Charter</span>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-4xl leading-relaxed">
          Formal documentation of price index mathematical formulations, anomaly detection logic, booking elasticity metrics, and data integrity standards for SIH 2026.
        </p>
      </div>

      {/* 1. CPI Augmentation Index Methodology */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Calculator className="w-5 h-5 text-blue-400" />
          <span>1. Laspeyres Price Index Formulation for Air Travel</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          The platform calculates a transparent weighted basket index to augment the transport component of the Consumer Price Index (CPI). We adopt the Laspeyres index methodology where the basket quantities/weights $w_r$ represent historical passenger volume proportions across trunk routes:
        </p>
        <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs text-blue-300 border border-gray-200">
          I_nat(t) = ∑ [ w_r × ( P_r(t) / P_r(0) ) ] / ∑ w_r × 100
        </div>
        <ul className="text-xs text-gray-500 space-y-2 list-disc list-inside">
          <li><strong>P_r(t):</strong> Current mean fare observed across airlines for route corridor $r$ at time $t$.</li>
          <li><strong>P_r(0):</strong> 30-day baseline reference price for route $r$ normalized to index base 100.0.</li>
          <li><strong>w_r:</strong> Configurable route weight proportional to Directorate General of Civil Aviation (DGCA) monthly city-pair passenger traffic shares (e.g., DEL-BOM has weight 1.5, DEL-BLR has weight 1.3).</li>
        </ul>
      </section>

      {/* 2. Anomaly Detection & Classification Thresholds */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-gray-900">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>2. Anomaly Detection & Spike vs Persistent Classification</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          For each route corridor, current prices are tested against a 30-day rolling baseline and sample standard deviation ($Z$-Score):
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-gray-50 p-3 rounded-lg border border-emerald-900/40">
            <strong className="text-emerald-400 block mb-1">NORMAL (≤ +15%)</strong>
            Fares within seasonal baseline boundaries.
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-amber-900/40">
            <strong className="text-amber-400 block mb-1">ELEVATED (+15% - 35%)</strong>
            Mild upward pressure from weekend or peak time slots.
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-orange-900/40">
            <strong className="text-orange-400 block mb-1">UNUSUALLY HIGH (+35% - 60%)</strong>
            Significant capacity squeeze or surge pricing.
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-rose-900/40">
            <strong className="text-rose-400 block mb-1">EXTREME (+60%+)</strong>
            Severe price anomaly warranting regulatory oversight.
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 space-y-2 text-xs text-gray-600">
          <strong className="text-gray-900 block">Trajectory Differentiation:</strong>
          <p>
            • <strong>Temporary Spike:</strong> An isolated 1-2 period sharp deviation followed by reversion towards mean baseline with elevated volatility.
          </p>
          <p>
            • <strong>Persistent Increase:</strong> Monotonically climbing or sustained elevations across 3+ consecutive periods with low relative variance, denoting structural inflation.
          </p>
        </div>
      </section>

      {/* 3. Booking Horizon Price Elasticity */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span>3. Advance Booking Horizon Elasticity</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Airfare dynamic revenue management algorithms vary price sharply as departure dates approach. The platform tracks 5 standard windows:
        </p>
        <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs text-gray-600 border border-gray-200 grid grid-cols-5 gap-2 text-center">
          <div>T+1 (1 day)</div>
          <div>T+7 (1 week)</div>
          <div>T+15 (2 weeks)</div>
          <div>T+30 (1 month)</div>
          <div>T+45 (1.5 months)</div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          This segmentation permits calculating price elasticity curves and consumer savings ratios (e.g. average savings from booking 30 days early vs last-minute surge tickets).
        </p>
      </section>

      {/* 4. Switching to a Live External API */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Key className="w-5 h-5 text-purple-400" />
          <span>4. Connecting Legitimate External Provider APIs</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          The platform features a fully modular <code className="text-blue-400 font-mono">FareDataProvider</code> architecture. To transition from the default demo simulator to a verified commercial feed, update environment variables:
        </p>
        <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs text-gray-600 border border-gray-200 space-y-1">
          <div># Set data provider mode to api</div>
          <div className="text-blue-400">DATA_PROVIDER=api</div>
          <div className="text-gray-500">API_KEY=your_commercial_api_key</div>
          <div className="text-gray-500">API_SECRET=your_commercial_api_secret</div>
          <div className="text-gray-500">API_BASE_URL=https://api.aviationprovider.com/v1</div>
        </div>
        <p className="text-xs text-gray-500">
          Once configured, the system automatically detects verified records, sets <code className="text-emerald-400 font-mono">is_demo=False</code>, and updates the global banner to <strong className="text-emerald-400">● LIVE DATA</strong>.
        </p>
      </section>
    </div>
  );
};
