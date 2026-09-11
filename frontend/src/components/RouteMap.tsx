import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
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
        return '#A88C6C'; // Caramel Bronze
      case 'UNUSUALLY HIGH':
        return '#CCB68E'; // Sand Gold
      case 'ELEVATED':
        return '#C7B8A4'; // Warm Sand
      case 'NORMAL':
      default:
        return '#5A7C83'; // Slate Teal
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-[#C7B8A4] bg-[#FAF8F5] shadow-xs">
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
              fillColor: '#2C444D',
              fillOpacity: 0.95,
              color: '#ffffff',
              weight: 2,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]} className="custom-airport-tooltip">
              <span className="font-mono font-bold text-xs bg-[#FAF8F5] text-[#2C444D] px-1.5 py-0.5 rounded border border-[#C7B8A4] shadow-xs">
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
                opacity: isSelected ? 0.95 : 0.8,
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
                  <div className="font-bold text-[#2C444D] flex items-center gap-1">
                    <span>{route.origin}</span>
                    <ArrowRight className="w-3 h-3 text-[#5A7C83]" />
                    <span>{route.destination}</span>
                  </div>
                  <div className="text-[#2C444D]/80">
                    Current: ₹{route.current_fare?.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-[#2C444D]/60 font-mono">
                    Baseline: ₹{route.baseline_30d?.toLocaleString() || 'N/A'}
                  </div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-[#FAF8F5]/95 backdrop-blur-md border border-[#C7B8A4] rounded-lg p-3 text-xs shadow-lg max-w-xs pointer-events-auto">
        <div className="font-bold text-[#2C444D] mb-2 uppercase tracking-wider flex items-center gap-2">
          <Plane className="w-3.5 h-3.5 text-[#5A7C83]" />
          Route Anomaly Classification
        </div>
        <div className="space-y-1.5 font-mono">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[#2C444D]">
              <span className="w-3 h-1.5 rounded bg-[#5A7C83]" />
              Normal (≤15%)
            </span>
            <span className="text-[#2C444D]/60 text-[10px]">baseline</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[#2C444D]">
              <span className="w-3 h-1.5 rounded bg-[#C7B8A4]" />
              Elevated (+15% - 35%)
            </span>
            <span className="text-[#C7B8A4] text-[10px] font-bold">elevated</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[#2C444D]">
              <span className="w-3 h-1.5 rounded bg-[#CCB68E]" />
              Unusually High (+35% - 60%)
            </span>
            <span className="text-[#CCB68E] text-[10px] font-bold">alert</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[#2C444D]">
              <span className="w-3 h-1.5 rounded bg-[#A88C6C]" />
              Extreme (+60%+)
            </span>
            <span className="text-[#A88C6C] text-[10px] font-bold">critical</span>
          </div>
        </div>
      </div>

      {/* Interactive Flyout Route Drawer */}
      {activeRoute && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-[1000] bg-[#FAF8F5]/95 backdrop-blur-md border border-[#C7B8A4] rounded-xl p-4 shadow-xl">
          <div className="flex items-start justify-between pb-3 border-b border-[#C7B8A4]/50">
            <div>
              <div className="text-lg font-bold text-[#2C444D] flex items-center gap-2">
                <span>{activeRoute.origin}</span>
                <ArrowRight className="w-4 h-4 text-[#5A7C83]" />
                <span>{activeRoute.destination}</span>
              </div>
              <div className="text-xs text-[#2C444D]/70 mt-0.5">
                {activeRoute.origin_name.split(',')[0]} to {activeRoute.destination_name.split(',')[0]} ({activeRoute.distance_km} km)
              </div>
            </div>
            <button
              onClick={() => setActiveRoute(null)}
              className="text-[#2C444D]/60 hover:text-[#2C444D] text-sm px-1.5 py-0.5 rounded hover:bg-white border border-transparent hover:border-[#C7B8A4]"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 my-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-[#C7B8A4]">
              <div className="text-[#2C444D]/70 mb-1">Current Fare</div>
              <div className="text-base font-bold font-mono text-[#2C444D]">
                ₹{activeRoute.current_fare?.toLocaleString() || 'N/A'}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-[#C7B8A4]">
              <div className="text-[#2C444D]/70 mb-1">30-Day Average</div>
              <div className="text-base font-bold font-mono text-[#2C444D]/80">
                ₹{activeRoute.baseline_30d?.toLocaleString() || 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <AnomalyBadge status={activeRoute.anomaly_status} />
            <Link
              to={`/routes/${activeRoute.code}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2C444D] hover:text-[#5A7C83] transition-colors"
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
