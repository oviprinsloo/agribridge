import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PickupStop, Delivery } from '../types';
import { Truck, MapPin, Clock, IndianRupee, Scale } from 'lucide-react';

interface MapRouteViewProps {
  stops: PickupStop[];
  delivery?: Delivery | {
    destinationName: string;
    destinationAddress: string;
    latitude: number;
    longitude: number;
  };
  destination?: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  totalDistanceKm: number;
  estimatedDurationMins: number;
  estimatedTransportCost: number;
  totalQuantityKg?: number;
  orderNumber?: string;
}

export const MapRouteView: React.FC<MapRouteViewProps> = ({
  stops,
  delivery,
  destination,
  totalDistanceKm,
  estimatedDurationMins,
  estimatedTransportCost,
  totalQuantityKg,
  orderNumber,
}) => {
  const actualDelivery = delivery || (destination ? {
    destinationName: destination.name,
    destinationAddress: destination.address,
    latitude: destination.latitude,
    longitude: destination.longitude,
  } : undefined);
  const actualTotalKg = totalQuantityKg ?? stops.reduce((sum, s) => sum + s.quantityToCollectKg, 0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center (Tamil Nadu / South India center)
    const initialLat = stops.length > 0 ? stops[0].latitude : 11.2189;
    const initialLon = stops.length > 0 ? stops[0].longitude : 78.1674;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([initialLat, initialLon], 9);

    mapInstanceRef.current = map;

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const latLngPoints: L.LatLngExpression[] = [];

    // Helper for circular stop badge icon
    const createStopIcon = (sequence: number) => {
      return L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #16a34a, #15803d);
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 14px;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          ">
            ${sequence}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // Helper for destination warehouse marker icon
    const createWarehouseIcon = () => {
      return L.divIcon({
        className: 'custom-warehouse-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #d97706, #b45309);
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 16px;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);
          ">
            🏢
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    };

    // 1. Add Pickup Stops in order
    const sortedStops = [...stops].sort((a, b) => a.stopSequence - b.stopSequence);

    sortedStops.forEach((stop) => {
      const point: [number, number] = [stop.latitude, stop.longitude];
      latLngPoints.push(point);

      const marker = L.marker(point, { icon: createStopIcon(stop.stopSequence) }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <div style="font-size: 11px; font-weight: 700; color: #16a34a; text-transform: uppercase;">Stop #${stop.stopSequence} (Farm)</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${stop.farmName}</div>
          <div style="font-size: 12px; color: #64748b;">${stop.village}</div>
          <hr style="margin: 6px 0; border: 0; border-top: 1px solid #e2e8f0;" />
          <div style="font-size: 12px; font-weight: 600;">Pickup: <span style="color: #16a34a;">${stop.quantityToCollectKg} kg</span></div>
          <div style="font-size: 11px; color: #64748b;">Status: ${stop.status}</div>
        </div>
      `);
    });

    // 2. Add Buyer Delivery Destination
    if (actualDelivery && actualDelivery.latitude && actualDelivery.longitude) {
      const destPoint: [number, number] = [actualDelivery.latitude, actualDelivery.longitude];
      latLngPoints.push(destPoint);

      const destMarker = L.marker(destPoint, { icon: createWarehouseIcon() }).addTo(map);

      destMarker.bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <div style="font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase;">Final Destination</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${actualDelivery.destinationName}</div>
          <div style="font-size: 12px; color: #64748b;">${actualDelivery.destinationAddress}</div>
          <hr style="margin: 6px 0; border: 0; border-top: 1px solid #e2e8f0;" />
          <div style="font-size: 12px; font-weight: 600;">Delivery Batch: <span style="color: #0284c7;">${actualTotalKg} kg</span></div>
        </div>
      `);
    }

    // 3. Draw Polyline Route connecting stops to destination
    if (latLngPoints.length > 1) {
      // Glow background line
      L.polyline(latLngPoints, {
        color: '#10b981',
        weight: 6,
        opacity: 0.5,
      }).addTo(map);

      // Dash pattern foreground line
      L.polyline(latLngPoints, {
        color: '#047857',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '6, 8',
      }).addTo(map);

      // Fit map view to bounds
      const bounds = L.latLngBounds(latLngPoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stops, delivery, totalQuantityKg]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
      {/* Route Header Metrics Bar */}
      <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Optimized route (heuristic)
              </span>
              {orderNumber && <span className="text-xs text-slate-400 font-mono">#{orderNumber}</span>}
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Multi-Stop Farm Collection Route</h3>
          </div>
          <div className="text-xs text-slate-400 italic">
            Nearest-Neighbor TSP with 2-Opt Improvement
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Total Distance</p>
              <p className="text-base font-bold text-white">{totalDistanceKm} km</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Estimated Time</p>
              <p className="text-base font-bold text-white">
                {Math.floor(estimatedDurationMins / 60)}h {estimatedDurationMins % 60}m
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Transport Cost</p>
              <p className="text-base font-bold text-white">₹{estimatedTransportCost.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Total Produce</p>
              <p className="text-base font-bold text-white">{totalQuantityKg} kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-[420px] md:h-[480px] z-0"
          style={{ minHeight: '380px' }}
        />
        {/* Subtle Map Overlay Watermark */}
        <div className="absolute bottom-2 left-2 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md shadow-sm">
          OpenStreetMap • Heuristic Routing
        </div>
      </div>

      {/* Sequential Stop List Breakdown */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Pickup Stops Sequence
        </h4>
        <div className="space-y-2">
          {stops.map((stop) => (
            <div
              key={stop.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center">
                  {stop.stopSequence}
                </span>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{stop.farmName}</p>
                  <p className="text-xs text-slate-500">{stop.village}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
                  {stop.quantityToCollectKg} kg
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {stop.stopDistanceKm > 0 ? `+${stop.stopDistanceKm} km` : 'Origin farm'}
                </p>
              </div>
            </div>
          ))}

          {delivery && (
            <div className="flex items-center justify-between p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center">
                  🏢
                </span>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {delivery.destinationName}
                  </p>
                  <p className="text-xs text-slate-500">{delivery.destinationAddress}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100/70 px-2.5 py-1 rounded-md">
                  Final Dropoff
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mandatory Logistics Disclaimer */}
        <p className="text-[11px] text-slate-500 mt-4 text-center italic">
          "Route shown is an optimization estimate and may differ from actual road conditions."
        </p>
      </div>
    </div>
  );
};
