import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Clock, DollarSign, AlertCircle, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { PickupRoute } from '../../types';
import { MapRouteView } from '../../components/MapRouteView';

export const BuyerRoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<PickupRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<PickupRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.get('/routes/buyer/my-routes');
      if (res.success) {
        setRoutes(res.data);
        if (res.data.length > 0) {
          setSelectedRoute(res.data[0]);
        }
      } else {
        setError(res.message || 'Failed to load routes');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Procurement Logistics & Inbound Routes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Automated multi-stop TSP routing aggregating smallholder farmer lots into direct shipments to your facility.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200">
          <p className="font-semibold">{error}</p>
        </div>
      ) : routes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Inbound Routes Assigned</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            When your purchase requirements match with farmer supply pools, automated pickup and delivery routes will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Route List Sidebar */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Inbound Shipments ({routes.length})
            </h2>

            <div className="space-y-3">
              {routes.map((rt) => {
                const isSelected = selectedRoute?.id === rt.id;
                return (
                  <div
                    key={rt.id}
                    onClick={() => setSelectedRoute(rt)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-slate-600">
                        Shipment #{rt.id.slice(-6).toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        {rt.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Stops</span>
                        <span className="font-bold text-slate-800">{rt.stops?.length || 0} Farm Gates</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Distance</span>
                        <span className="font-bold text-slate-800">{rt.totalDistanceKm} km</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Vehicle</span>
                        <span className="font-semibold text-slate-700">{rt.vehicleType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Logistics Fee</span>
                        <span className="font-bold text-emerald-700">₹{rt.estimatedTransportCost}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Route Map & Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedRoute ? (
              <>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Inbound Route #{selectedRoute.id.slice(-6).toUpperCase()}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Optimization: {selectedRoute.optimizationMethod} &bull; Capacity: {selectedRoute.vehicleCapacityKg} kg
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700">
                        Est. Transit: ~{selectedRoute.estimatedDurationMins} mins
                      </span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                        Cost: ₹{selectedRoute.estimatedTransportCost}
                      </span>
                    </div>
                  </div>

                  <MapRouteView
                    stops={selectedRoute.stops || []}
                    totalDistanceKm={selectedRoute.totalDistanceKm}
                    estimatedDurationMins={selectedRoute.estimatedDurationMins}
                    estimatedTransportCost={selectedRoute.estimatedTransportCost}
                  />
                </div>

                {/* Stops breakdown */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Farm Pickup Schedule</h3>
                  <div className="space-y-3">
                    {selectedRoute.stops
                      ?.sort((a, b) => a.stopSequence - b.stopSequence)
                      .map((stop) => (
                        <div
                          key={stop.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {stop.stopSequence}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">{stop.farmName}</p>
                              <span className="text-xs text-slate-400">
                                {stop.village} &bull; Coordinates: {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-slate-800 block">
                              {stop.quantityToCollectKg} kg
                            </span>
                            <span
                              className={`text-[11px] font-semibold ${
                                stop.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            >
                              {stop.status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
