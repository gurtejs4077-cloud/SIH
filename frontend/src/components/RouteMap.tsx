import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { RouteItem } from '../types';
import { AnomalyBadge } from './StatusBadge';
import { Link } from 'react-router-dom';
import { ArrowRight, Plane, ExternalLink } from 'lucide-react';

interface RouteMapProps {
  routes: RouteItem[];
  selectedRoute?: string;
  onSelectRoute?: (code: string) => void;
}

const AIRPORTS = [
  { code: 'DEL', name: 'New Delhi (DEL)', lat: 28.5562, lng: 77.1000 },
  { code: 'BOM', name: 'Mumbai (BOM)', lat: 19.0896, lng: 72.8656 },
  { code: 'BLR', name: 'Bengaluru (BLR)', lat: 13.1986, lng: 77.7066 },
  { code: 'CCU', name: 'Kolkata (CCU)', lat: 22.6547, lng: 88.4467 },
  { code: 'HYD', name: 'Hyderabad (HYD)', lat: 17.2403, lng: 78.4294 },
  { code: 'MAA', name: 'Chennai (MAA)', lat: 12.9941, lng: 80.1709 },
];

export const RouteMap: React.FC<RouteMapProps> = ({ routes, selectedRoute, onSelectRoute }) => {
  const [activeRoute, setActiveRoute] = useState<RouteItem | null>(null);

  const getRouteColor = (status?: string) => {
    switch (status) {
      case 'EXTREME':
        return '#ef4444'; // Crimson red
      case 'UNUSUALLY HIGH':
        return '#f97316'; // Vivid orange
      case 'ELEVATED':
        return '#eab308'; // Amber yellow
      case 'NORMAL':
      default:
        return '#10b981'; // Emerald green
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      <MapContainer
        center={[21.5, 78.9]}
        zoom={5}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        {/* Clean CartoDB Light Matter tile layer - perfect for official financial dashboards */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>, OpenStreetMap contributors'
        />

        {/* Airport Hub Markers */}
        {AIRPORTS.map((airport) => (
          <CircleMarker
            key={airport.code}
            center={[airport.lat, airport.lng]}
            radius={7}
            pathOptions={{
              fillColor: '#3b82f6',
              fillOpacity: 0.9,
              color: '#ffffff',
              weight: 2,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]} className="custom-airport-tooltip">
              <span className="font-mono font-bold text-xs bg-white text-gray-800 px-1.5 py-0.5 rounded border border-gray-200 shadow-sm">
                {airport.code}
              </span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Route Lines */}
        {routes.map((route) => {
          const color = getRouteColor(route.anomaly_status);
          const isSelected = selectedRoute === route.code || activeRoute?.code === route.code;
          const positions: [number, number][] = [
            [route.origin_lat, route.origin_lng],
            [route.dest_lat, route.dest_lng],
          ];

          return (
            <Polyline
              key={route.code}
              positions={positions}
              pathOptions={{
                color: color,
                weight: isSelected ? 4 : 2.5,
                opacity: isSelected ? 0.95 : 0.75,
                dashArray: route.anomaly_status === 'EXTREME' ? '6, 6' : undefined,
              }}
              eventHandlers={{
                click: () => {
                  setActiveRoute(route);
                  if (onSelectRoute) onSelectRoute(route.code);
                },
              }}
            >
              <Tooltip sticky>
                <div className="font-sans text-xs p-1">
                  <div className="font-bold text-gray-900 flex items-center gap-1">
                    <span>{route.origin}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{route.destination}</span>
                  </div>
                  <div className="text-gray-600">
                    Current: ₹{route.current_fare?.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-gray-500">
                    Baseline: ₹{route.baseline_30d?.toLocaleString() || 'N/A'}
                  </div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur border border-gray-200 rounded-lg p-3 text-xs shadow-lg max-w-xs pointer-events-auto">
        <div className="font-bold text-gray-800 mb-2 uppercase tracking-wider flex items-center gap-2">
          <Plane className="w-3.5 h-3.5 text-blue-500" />
          Route Anomaly Classification
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-gray-600">
              <span className="w-3 h-1 rounded bg-emerald-500" />
              Normal (≤15%)
            </span>
            <span className="text-gray-400 font-mono">baseline</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-gray-600">
              <span className="w-3 h-1 rounded bg-amber-400" />
              Elevated (+15% - 35%)
            </span>
            <span className="text-amber-500 font-mono">warning</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-gray-600">
              <span className="w-3 h-1 rounded bg-orange-500" />
              Unusually High (+35% - 60%)
            </span>
            <span className="text-orange-500 font-mono">alert</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-gray-600">
              <span className="w-3 h-1 rounded bg-red-500" />
              Extreme (+60%+)
            </span>
            <span className="text-red-500 font-mono">critical</span>
          </div>
        </div>
      </div>

      {/* Interactive Flyout Route Drawer */}
      {activeRoute && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-[1000] bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-4 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between pb-3 border-b border-gray-200">
            <div>
              <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>{activeRoute.origin}</span>
                <ArrowRight className="w-4 h-4 text-blue-500" />
                <span>{activeRoute.destination}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {activeRoute.origin_name.split(',')[0]} to {activeRoute.destination_name.split(',')[0]} ({activeRoute.distance_km} km)
              </div>
            </div>
            <button
              onClick={() => setActiveRoute(null)}
              className="text-gray-400 hover:text-gray-900 text-sm px-1.5 py-0.5 rounded hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 my-3 text-xs">
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <div className="text-gray-500 mb-1">Current Fare</div>
              <div className="text-base font-bold font-mono text-gray-900">
                ₹{activeRoute.current_fare?.toLocaleString() || 'N/A'}
              </div>
            </div>

            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <div className="text-gray-500 mb-1">30-Day Average</div>
              <div className="text-base font-bold font-mono text-gray-700">
                ₹{activeRoute.baseline_30d?.toLocaleString() || 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <AnomalyBadge status={activeRoute.anomaly_status} />
            <Link
              to={`/routes/${activeRoute.code}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              View Route Analytics
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
