import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  Truck,
  Plus,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  MapPin,
  Calendar,
  AlertCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Order, PurchaseRequirement, SupplyPool, MarketPrice } from '../../types';

interface BuyerDashboardData {
  summary: {
    activeRequirementsCount: number;
    pooledOrdersCount: number;
    matchedSupplyCount: number;
    pendingDeliveriesCount: number;
    totalSpent: number;
    totalVolumeKg: number;
  };
  requirements: PurchaseRequirement[];
  orders: Order[];
  demandPools: any[];
  recommendedSupplyPools: SupplyPool[];
  marketPrices: MarketPrice[];
}

export const BuyerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<BuyerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.get('/buyers/dashboard');
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load buyer dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to buyer services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center gap-4">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Unable to load dashboard</h3>
            <p className="text-sm">{error || 'An unexpected error occurred.'}</p>
            <button
              onClick={fetchDashboard}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-1">
            <span>B2B Institutional Procurement</span> &bull; <span>Verified Buyer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome, {user?.buyerProfile?.businessName || user?.name}!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Access collective smallholder harvests at farm-gate bulk pricing with unified multi-stop logistics and protected escrow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/buyer/requirements"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Post Requirement
          </Link>
          <Link
            to="/buyer/pools"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-bold rounded-xl transition-all"
          >
            <Layers className="w-4 h-4" /> Demand Pooling
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Demands</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {data.summary.activeRequirementsCount}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Purchase requests posted</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pooled Batches</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {data.summary.pooledOrdersCount}
          </p>
          <span className="text-[11px] text-purple-600 font-semibold mt-1 block">
            Shared wholesale pricing unlocked
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Transit</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {data.summary.pendingDeliveriesCount}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Shipments on route to hub</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Procured Volume</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {data.summary.totalVolumeKg.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg</span>
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            ₹{data.summary.totalSpent.toLocaleString()} completed
          </span>
        </div>
      </div>

      {/* Active Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Shipments & Orders</h2>
            <p className="text-xs text-slate-500">Live logistics and platform escrow locks</p>
          </div>
          <Link
            to="/buyer/orders"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View all ({data.orders.length}) <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {data.orders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No active orders</p>
            <p className="text-xs text-slate-400 mt-1">Post a requirement or join an aggregation pool to procure produce.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.orders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        order.status === 'COMPLETED' || order.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'IN_TRANSIT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{order.crop?.name} Wholesale Order</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-3 bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Batch</span>
                      <span className="font-bold text-slate-800">{order.totalQuantity} {order.crop?.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Order Value</span>
                      <span className="font-bold text-emerald-700">₹{order.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {order.payment && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        Escrow:{' '}
                        <strong>
                          {order.payment.status === 'HELD_IN_ESCROW'
                            ? 'Protected in Escrow'
                            : order.payment.status === 'RELEASED_TO_FARMERS'
                            ? 'Released'
                            : order.payment.status}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Pickup: {order.farmerPickupConfirmed ? 'Done' : 'In Progress'} &bull; Delivery: {order.buyerDeliveryConfirmed ? 'Received' : 'Pending'}
                  </span>
                  <Link
                    to={`/buyer/orders/${order.id}`}
                    className="text-xs font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Ready Aggregated Farmer Supply Pools */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ready Supply Pools (Bulk Batches)</h2>
            <p className="text-xs text-slate-500">
              Aggregated farmer harvests ready for institutional B2B contract execution
            </p>
          </div>
          <Link
            to="/buyer/requirements"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Post Custom Request <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.recommendedSupplyPools.map((pool) => {
            const pct = Math.min(100, Math.round((pool.currentQuantity / pool.targetQuantity) * 100));
            return (
              <div
                key={pool.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Grade: {pool.qualityGrade}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {pool.members?.length || 0} Farms
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{pool.poolName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" /> {pool.district}, {pool.state}
                  </p>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Aggregated Volume</span>
                      <span className="font-bold">
                        {pool.currentQuantity} / {pool.targetQuantity} {pool.crop.unit}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 mt-3 font-semibold">
                    Target Rate: <span className="text-emerald-700 font-bold">₹{pool.minPricePerUnit} - ₹{pool.maxPricePerUnit}</span> /{pool.crop.unit}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    to={`/buyer/requirements`}
                    className="w-full block text-center py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    Match & Contract
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* APMC Mandi Benchmark Prices */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> APMC Mandi Price Feeds
            </h3>
            <p className="text-xs text-slate-500">Benchmark wholesale mandi rates for pricing reference</p>
          </div>
          <Link to="/market" className="text-xs font-bold text-emerald-700 hover:underline">
            View full market directory
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.marketPrices.map((mp) => (
            <div key={mp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-xs font-bold text-slate-800 block line-clamp-1">{mp.crop?.name}</span>
              <span className="text-[10px] text-slate-400 block line-clamp-1">{mp.marketName}</span>
              <p className="text-base font-black text-slate-900 mt-1">₹{mp.modalPrice}</p>
              <span className="text-[10px] text-slate-400">per {mp.crop?.unit || 'kg'}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 italic">
          * Market information shown in this demo is sample data and should not be treated as live market pricing.
        </p>
      </div>
    </div>
  );
};
