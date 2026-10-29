import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  Users,
  Calendar,
  MapPin,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  ShieldCheck,
  Building,
} from 'lucide-react';
import api from '../../services/api';
import { DemandPool } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export const BuyerPoolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pool, setPool] = useState<DemandPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [requestedQuantity, setRequestedQuantity] = useState(100);
  const [offeredPrice, setOfferedPrice] = useState(28);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchPoolDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.get(`/demand-pools/${id}`);
      if (res.success) {
        setPool(res.data);
        setOfferedPrice(res.data.maxPricePerUnit);
      } else {
        setError(res.message || 'Failed to load pool');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching demand pool');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPoolDetail();
    }
  }, [id]);

  const handleJoinPool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestedQuantity <= 0) return;

    try {
      setSubmitting(true);
      setError(null);
      const res: any = await api.post(`/demand-pools/${id}/join`, {
        requestedQuantity: Number(requestedQuantity),
        offeredPricePerUnit: Number(offeredPrice),
      });

      if (res.success) {
        setActionSuccess('Joined demand pool successfully! Your quota has been pledged.');
        setJoinModalOpen(false);
        fetchPoolDetail();
      } else {
        setError(res.message || 'Failed to join demand pool');
      }
    } catch (err: any) {
      setError(err.message || 'Error joining pool');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center gap-4">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Unable to load demand pool</h3>
            <p className="text-sm">{error || 'Pool not found.'}</p>
            <button
              onClick={() => navigate('/buyer/pools')}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
            >
              Back to Pools
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPct = Math.min(100, Math.round((pool.currentQuantity / pool.targetQuantity) * 100));
  const isMember = pool.members?.some((m) => m.buyerProfileId === user?.buyerProfile?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/buyer/pools"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Demand Pools
        </Link>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              pool.status === 'OPEN'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : pool.status === 'TARGET_REACHED'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {pool.status.replace('_', ' ')}
          </span>

          {!isMember && pool.status === 'OPEN' && (
            <button
              onClick={() => setJoinModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Join This Demand Pool
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-teal-300 text-sm font-medium mb-1">
                <span>{pool.crop?.category}</span> &bull; <span>Grade: {pool.qualityGrade}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{pool.poolName}</h1>
              <p className="text-slate-300 text-sm mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-emerald-400" /> Delivery Hub: {pool.deliveryDistrict}, {pool.deliveryState}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 flex items-center gap-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-200">Current Pledged</span>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {pool.currentQuantity.toLocaleString()} <span className="text-base font-normal text-teal-200">{pool.crop?.unit}</span>
                </p>
              </div>
              <div className="border-l border-white/20 pl-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-200">Target Bulk Quota</span>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {pool.targetQuantity.toLocaleString()} <span className="text-base font-normal text-teal-200">{pool.crop?.unit}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-xs font-semibold text-teal-100 mb-2">
              <span>Demand Aggregation Progress</span>
              <span>{progressPct}% Reached</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50/50 p-6 text-center">
          <div className="p-3">
            <span className="text-xs text-slate-500 font-medium">Max Price Cap</span>
            <p className="text-lg font-bold text-slate-800 mt-1">
              ₹{pool.maxPricePerUnit} /{pool.crop?.unit}
            </p>
          </div>
          <div className="p-3">
            <span className="text-xs text-slate-500 font-medium">Delivery Date</span>
            <p className="text-sm font-bold text-slate-800 mt-1">
              {new Date(pool.deliveryDate).toLocaleDateString()}
            </p>
          </div>
          <div className="p-3">
            <span className="text-xs text-slate-500 font-medium">Participating Buyers</span>
            <p className="text-lg font-bold text-slate-800 mt-1">{pool.members?.length || 0} Businesses</p>
          </div>
          <div className="p-3">
            <span className="text-xs text-slate-500 font-medium">Escrow Security</span>
            <p className="text-sm font-bold text-emerald-700 mt-1">Protected Hold</p>
          </div>
        </div>
      </div>

      {/* Participating Buyers Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Participating Buyers in this Pool</h2>
        {pool.members && pool.members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Buyer Business</th>
                  <th className="pb-3 text-right">Pledged Quantity</th>
                  <th className="pb-3 text-right">Offered Rate</th>
                  <th className="pb-3 text-right">Share</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pool.members.map((member, idx) => {
                  const sharePct = pool.currentQuantity > 0 ? ((member.requestedQuantity / pool.currentQuantity) * 100).toFixed(1) : '0';
                  return (
                    <tr key={member.id || idx} className="hover:bg-slate-50">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {member.buyerProfile?.businessName || `Buyer #${idx + 1}`}
                            </p>
                            <span className="text-xs text-slate-400">Verified B2B Buyer</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-bold text-slate-800">
                        {member.requestedQuantity} {pool.crop?.unit}
                      </td>
                      <td className="py-3.5 text-right text-slate-600">₹{member.offeredPricePerUnit}</td>
                      <td className="py-3.5 text-right font-semibold text-teal-700">{sharePct}%</td>
                      <td className="py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" /> Pledged
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No members have joined yet.</p>
        )}
      </div>

      {/* Join Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900">Join Demand Pool</h3>
            <p className="text-xs text-slate-500 mt-1">
              Pledge your order quantity to fulfill the bulk order threshold of {pool.poolName}.
            </p>

            <form onSubmit={handleJoinPool} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantity Required ({pool.crop?.unit})
                </label>
                <input
                  type="number"
                  min="10"
                  required
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Offered Price (₹ / {pool.crop?.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Max pool price cap: ₹{pool.maxPricePerUnit}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Pledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
