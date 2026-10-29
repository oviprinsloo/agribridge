import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Sprout,
  Users,
  ShoppingBag,
  IndianRupee,
  Clock,
  Mic,
  ArrowRight,
  TrendingUp,
  Landmark,
  Truck,
  Plus,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import api from '../../services/api';
import { VoiceAssistantModal } from '../../components/VoiceAssistantModal';

export const FarmerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res: any = await api.get('/farmers/dashboard');
        if (res.success) {
          setDashboardData(res.data);
        }
      } catch (e) {
        console.error('Failed to load farmer dashboard:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning', 'Good morning');
    if (hour < 17) return t('dashboard.greetingAfternoon', 'Good afternoon');
    return t('dashboard.greetingEvening', 'Good evening');
  };

  const summary = dashboardData?.summary || {
    totalAvailableProduceKg: 0,
    activeSupplyPoolsCount: 0,
    matchedOrdersCount: 0,
    pendingPaymentAmount: 0,
    totalEarnedAmount: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Welcoming Farmer Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
            Farmer Portal • Namakkal Agricultural Cluster
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            {getGreeting()}, {user?.name}! 🌾
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
            You have {summary.totalAvailableProduceKg} kg of farm produce listed. Form or join a supply pool to fulfill large B2B orders with lower transport costs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/farmer/produce"
            className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Produce
          </Link>
          <button
            type="button"
            onClick={() => setIsVoiceOpen(true)}
            className="px-4 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white border border-emerald-400/30 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Mic className="w-4 h-4 animate-pulse" /> Ask AgriBridge
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Produce */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('dashboard.availableProduce', 'Available Produce')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {summary.totalAvailableProduceKg} <span className="text-xs font-semibold text-slate-500">kg</span>
          </div>
          <Link to="/farmer/produce" className="text-[11px] font-bold text-emerald-600 hover:underline mt-2 inline-block">
            View / Edit listings →
          </Link>
        </div>

        {/* Active Supply Pools */}
        <div className="bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('dashboard.activePools', 'Active Supply Pools')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {summary.activeSupplyPoolsCount} <span className="text-xs font-semibold text-slate-500">pools</span>
          </div>
          <Link to="/farmer/pools" className="text-[11px] font-bold text-sky-600 hover:underline mt-2 inline-block">
            Browse compatible pools →
          </Link>
        </div>

        {/* Matched Orders */}
        <div className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('dashboard.matchedOrders', 'Matched Orders')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {summary.matchedOrdersCount} <span className="text-xs font-semibold text-slate-500">orders</span>
          </div>
          <Link to="/farmer/orders" className="text-[11px] font-bold text-amber-600 hover:underline mt-2 inline-block">
            Track pickup & delivery →
          </Link>
        </div>

        {/* Pending Escrow Payments */}
        <div className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('dashboard.pendingPayments', 'Pending Payments')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            ₹{summary.pendingPaymentAmount.toLocaleString('en-IN')}
          </div>
          <Link to="/farmer/transactions" className="text-[11px] font-bold text-purple-600 hover:underline mt-2 inline-block">
            View transaction history →
          </Link>
        </div>
      </div>

      {/* 3. Upcoming Pickups Schedule */}
      {dashboardData?.upcomingPickups && dashboardData.upcomingPickups.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-700" />
              <h3 className="font-bold text-base text-amber-900">Upcoming Farm Pickup Schedule</h3>
            </div>
            <Link to="/farmer/routes" className="text-xs font-bold text-amber-800 hover:underline">
              View Route Map →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dashboardData.upcomingPickups.map((p: any, idx: number) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Stop #{p.stopSequence} • {p.status}
                  </span>
                  <p className="font-bold text-slate-800 text-sm mt-1">{p.cropName} ({p.quantityKg} kg)</p>
                  <p className="text-xs text-slate-500">{p.farmName}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> in ~{p.estimatedArrivalMins} mins
                  </span>
                  <Link
                    to={`/farmer/orders/${p.orderId}`}
                    className="mt-1 inline-block text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    Confirm Dispatch →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Two Column Content: Recommended Pools & Mandi Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recommended Supply Pools & Crops */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Active Supply Pooling Opportunities
              </h3>
              <p className="text-xs text-slate-500">
                Join other local farmers in Namakkal to hit 500kg target for bulk buyers
              </p>
            </div>
            <Link to="/farmer/pools" className="text-xs font-bold text-emerald-600 hover:underline">
              View All Pools →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData?.pools && dashboardData.pools.length > 0 ? (
              dashboardData.pools.map((pool: any) => (
                <div key={pool.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                      {pool.crop?.name}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{pool.status}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{pool.poolName}</h4>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
                      <span>{pool.currentQuantity} kg</span>
                      <span>Target: {pool.targetQuantity} kg</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (pool.currentQuantity / pool.targetQuantity) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Avg ₹{pool.avgPricePerUnit}/kg</span>
                    <Link to={`/farmer/pools/${pool.id}`} className="font-bold text-emerald-600 hover:underline">
                      Pool Details →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 bg-slate-50 rounded-3xl text-center text-xs text-slate-500">
                No active pools joined yet. Visit the <Link to="/farmer/pools" className="text-emerald-600 font-bold underline">Supply Pools Directory</Link> to join an aggregation cluster!
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Mandi Rate Ticker & Schemes */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mandi Benchmark Ticker
              </h3>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="space-y-3">
              {dashboardData?.marketPrices?.slice(0, 4).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{p.crop.name}</p>
                    <p className="text-[10px] text-slate-400">{p.marketName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-emerald-700 dark:text-emerald-400">₹{p.modalPrice}/{p.crop.unit}</p>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{p.trendDirection}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/farmer/market" className="block text-center text-xs font-bold text-emerald-600 hover:underline pt-2">
              View Detailed Price Trends →
            </Link>
          </div>

          {/* Quick Government Scheme Banner */}
          <div className="bg-gradient-to-br from-teal-900 to-emerald-950 text-white rounded-3xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-300" />
              <h4 className="font-bold text-sm">PM-KISAN & Subsidy Check</h4>
            </div>
            <p className="text-xs text-slate-300">
              Check direct income support and micro-irrigation subsidy eligibility tailored for your land size.
            </p>
            <Link
              to="/farmer/schemes"
              className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              Check My Eligibility
            </Link>
          </div>
        </div>
      </div>

      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
};
