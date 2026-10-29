import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Calendar,
  MapPin,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight,
  Trash2,
  DollarSign,
} from 'lucide-react';
import api from '../../services/api';
import { Crop, PurchaseRequirement, SupplyPool } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const BuyerRequirementsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requirements, setRequirements] = useState<any[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Requirement Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cropId: '',
    quantity: 500,
    qualityGrade: 'A',
    maxPricePerUnit: 35,
    deliveryAddress: user?.buyerProfile?.address || 'Koyambedu Wholesale Hub, Chennai',
    deliveryDistrict: user?.buyerProfile?.city || 'Chennai',
    deliveryState: user?.buyerProfile?.state || 'Tamil Nadu',
    deliveryLatitude: user?.buyerProfile?.latitude || 13.0692,
    deliveryLongitude: user?.buyerProfile?.longitude || 80.1915,
    requiredDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [matchingPoolId, setMatchingPoolId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reqsRes, cropsRes]: any = await Promise.all([
        api.get('/buyers/requirements'),
        api.get('/crops'),
      ]);

      if (reqsRes.success) {
        setRequirements(reqsRes.data);
      }
      if (cropsRes.success) {
        setCrops(cropsRes.data);
        if (cropsRes.data.length > 0 && !formData.cropId) {
          setFormData((prev) => ({ ...prev, cropId: cropsRes.data[0].id }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching purchase requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cropId || formData.quantity <= 0) return;

    try {
      setSubmitting(true);
      setError(null);
      const res: any = await api.post('/buyers/requirements', {
        ...formData,
        quantity: Number(formData.quantity),
        maxPricePerUnit: Number(formData.maxPricePerUnit),
        deliveryLatitude: Number(formData.deliveryLatitude),
        deliveryLongitude: Number(formData.deliveryLongitude),
      });

      if (res.success) {
        setActionSuccess('Purchase requirement posted successfully! Algorithms are searching for supply matches.');
        setModalOpen(false);
        fetchData();
      } else {
        setError(res.message || 'Failed to post requirement');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating requirement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOrderFromMatch = async (requirementId: string, supplyPoolId: string) => {
    try {
      setMatchingPoolId(supplyPoolId);
      const res: any = await api.post('/orders/create-from-match', {
        requirementId,
        supplyPoolId,
      });

      if (res.success) {
        setActionSuccess('Wholesale order & logistics route successfully created! Redirecting to checkout...');
        setTimeout(() => {
          navigate(`/buyer/orders/${res.data.id}`);
        }, 1200);
      } else {
        alert(res.message || 'Failed to create order from match');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating contract order');
    } finally {
      setMatchingPoolId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Purchase Requirements & Supply Matches
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Specify produce needs, get AI-compatible farmer aggregation pool matches, or pool demand with peers.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Post New Requirement
        </button>
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

      {/* Main List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200">
          <p className="font-semibold">{error}</p>
        </div>
      ) : requirements.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Purchase Requirements Posted</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Post your bulk or small-lot procurement requirements to match with smallholder farmer supply pools.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-sm"
          >
            Post Your First Requirement
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-black text-emerald-800 text-base">
                      {req.crop?.name?.slice(0, 2).toUpperCase() || 'CR'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-extrabold text-lg text-slate-900">{req.crop?.name} Requirement</h2>
                        <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                          Grade: {req.qualityGrade}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Destination: {req.deliveryDistrict}, {req.deliveryState} &bull; Delivery by{' '}
                        {new Date(req.requiredDeliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Target Volume</span>
                      <span className="text-xl font-black text-slate-900">
                        {req.quantity.toLocaleString()} {req.unit || 'kg'}
                      </span>
                    </div>

                    <div className="border-l border-slate-200 pl-4 text-right">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Budget Cap</span>
                      <span className="text-xl font-black text-emerald-700">₹{req.maxPricePerUnit}/{req.unit || 'kg'}</span>
                    </div>
                  </div>
                </div>

                {/* Compatibility Matches Section */}
                <div className="mt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> Compatible Farmer Supply Pools
                  </h3>

                  {req.matches && req.matches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {req.matches.map((match: any) => {
                        const pool: SupplyPool = match.supplyPool;
                        return (
                          <div
                            key={match.id}
                            className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/80 transition-colors flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-900 text-sm">{pool.poolName}</span>
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  {match.compatibilityScore}% Compatible
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                Aggregated: <strong>{pool.currentQuantity} / {pool.targetQuantity} {pool.crop.unit}</strong> &bull; Location: {pool.district}
                              </p>
                              <p className="text-xs font-semibold text-slate-700 mt-1">
                                Offer Rate: <span className="text-emerald-700 font-bold">₹{pool.avgPricePerUnit}</span>/{pool.crop.unit}
                              </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-emerald-100 flex items-center justify-between">
                              <span className="text-[11px] text-slate-400">
                                Harvest: {new Date(pool.harvestWindowEnd).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => handleCreateOrderFromMatch(req.id, pool.id)}
                                disabled={matchingPoolId === pool.id}
                                className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-xs transition-all disabled:opacity-50"
                              >
                                {matchingPoolId === pool.id ? 'Creating Order...' : 'Accept & Contract'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                      <p className="text-xs text-slate-500">
                        No immediate 100% matched supply pool found in {req.deliveryDistrict}. If you have a small quantity requirement, you can also join a peer Demand Pool.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Requirement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-extrabold text-slate-900">Post Purchase Requirement</h3>
            <p className="text-xs text-slate-500 mt-1">
              Submit your crop demand. Our matching engine will pair you with aggregated farmer batches.
            </p>

            <form onSubmit={handleCreateRequirement} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Crop
                  </label>
                  <select
                    required
                    value={formData.cropId}
                    onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {crops.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.name} ({crop.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quality Grade
                  </label>
                  <select
                    value={formData.qualityGrade}
                    onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="A">Grade A (Premium / Export)</option>
                    <option value="B">Grade B (Standard Market)</option>
                    <option value="C">Grade C (Processing / Pulp)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quantity Needed (kg)
                  </label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Max Price Budget (₹ / kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.maxPricePerUnit}
                    onChange={(e) => setFormData({ ...formData, maxPricePerUnit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Required Delivery Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.requiredDeliveryDate}
                  onChange={(e) => setFormData({ ...formData, requiredDeliveryDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Destination Delivery Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    District / City
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryDistrict}
                    onChange={(e) => setFormData({ ...formData, deliveryDistrict: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryState}
                    onChange={(e) => setFormData({ ...formData, deliveryState: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Confirm Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
