import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Package,
  Calendar,
  MapPin,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import { SupplyPool, FarmerCrop } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export const FarmerPoolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pool, setPool] = useState<SupplyPool | null>(null);
  const [farmerCrops, setFarmerCrops] = useState<FarmerCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState('');
  const [contributeQuantity, setContributeQuantity] = useState<number>(50);
  const [expectedPrice, setExpectedPrice] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchPoolDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.get(`/supply-pools/${id}`);
      if (res.success) {
        setPool(res.data);
      } else {
        setError(res.message || 'Failed to load pool details');
      }

      // Also fetch farmer crops to allow joining
      const cropsRes: any = await api.get('/farmers/crops');
      if (cropsRes.success) {
        setFarmerCrops(cropsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching pool details');
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
    if (!selectedCropId || contributeQuantity <= 0) return;

    try {
      setSubmitting(true);
      setError(null);
      const res: any = await api.post(`/supply-pools/${id}/join`, {
        farmerCropId: selectedCropId,
        contributedQuantity: Number(contributeQuantity),
        expectedPricePerUnit: Number(expectedPrice),
      });

      if (res.success) {
        setActionSuccess('Successfully contributed produce to this aggregation pool!');
        setJoinModalOpen(false);
        fetchPoolDetail();
      } else {
        setError(res.message || 'Failed to join pool');
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
            <h3 className="font-bold text-lg">Unable to load supply pool</h3>
            <p className="text-sm">{error || 'Pool not found.'}</p>
            <button
              onClick={() => navigate('/farmer/pools')}
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
  const isMember = pool.members?.some(
    (m) => m.farmerProfileId === user?.farmerProfile?.id || (m.farmerCrop && farmerCrops.some((fc) => fc.id === m.farmerCropId))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/farmer/pools"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Supply Pools
        </Link>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
              pool.status === 'OPEN'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : pool.status === 'TARGET_REACHED'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : pool.status === 'MATCHED'
                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {pool.status.replace('_', ' ')}
          </span>

          {!isMember && pool.status === 'OPEN' && (
            <button
              onClick={() => setJoinModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Contribute to this Pool
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

      {/* Hero Overview Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-200 text-sm font-medium mb-1">
                <span>{pool.crop.category}</span> &bull; <span>Grade: {pool.qualityGrade}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{pool.poolName}</h1>
              <p className="text-emerald-100 text-sm mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-emerald-300" /> {pool.district}, {pool.state}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 flex items-center gap-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Current Aggregated</span>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {pool.currentQuantity.toLocaleString()} <span className="text-base font-normal text-emerald-200">{pool.crop.unit}</span>
                </p>
              </div>
              <div className="border-l border-white/20 pl-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Target Bulk Order</span>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {pool.targetQuantity.toLocaleString()} <span className="text-base font-normal text-emerald-200">{pool.crop.unit}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-xs font-semibold text-emerald-100 mb-2">
              <span>Pool Aggregation Progress</span>
              <span>{progressPct}% Completed</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Key Pool Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50/50 p-6 text-center">
          <div className="p-3">
            <span className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Target Price Range
            </span>
            <p className="text-lg font-bold text-slate-800 mt-1">
              ₹{pool.minPricePerUnit} - ₹{pool.maxPricePerUnit} <span className="text-xs font-normal text-slate-500">/{pool.crop.unit}</span>
            </p>
          </div>

          <div className="p-3">
            <span className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Harvest Window
            </span>
            <p className="text-sm font-bold text-slate-800 mt-1">
              {new Date(pool.harvestWindowStart).toLocaleDateString()} - {new Date(pool.harvestWindowEnd).toLocaleDateString()}
            </p>
          </div>

          <div className="p-3">
            <span className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" /> Farmers Joined
            </span>
            <p className="text-lg font-bold text-slate-800 mt-1">{pool.members?.length || 0} Members</p>
          </div>

          <div className="p-3">
            <span className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Escrow Protected
            </span>
            <p className="text-sm font-bold text-emerald-700 mt-1">100% Guaranteed</p>
          </div>
        </div>
      </div>

      {/* Members & Contributions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Participating Farmers</h2>
              <p className="text-xs text-slate-500">Transparent pool contributions forming this collective lot</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
              {pool.members?.length || 0} Contributors
            </span>
          </div>

          {pool.members && pool.members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium text-xs uppercase tracking-wider">
                    <th className="pb-3">Farmer</th>
                    <th className="pb-3 text-right">Quantity</th>
                    <th className="pb-3 text-right">Target Price</th>
                    <th className="pb-3 text-right">Share</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pool.members.map((member, idx) => {
                    const sharePct = pool.currentQuantity > 0 ? ((member.contributedQuantity / pool.currentQuantity) * 100).toFixed(1) : '0';
                    return (
                      <tr key={member.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                              {member.farmerProfile?.user?.name ? member.farmerProfile.user.name[0] : 'F'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {member.farmerProfile?.user?.name || `Farmer #${idx + 1}`}
                              </p>
                              <span className="text-xs text-slate-400">
                                {member.farmerProfile?.user?.phone ? `+91 ${member.farmerProfile.user.phone.slice(-4).padStart(10, '•')}` : 'Verified Farm'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-right font-bold text-slate-800">
                          {member.contributedQuantity} {pool.crop.unit}
                        </td>
                        <td className="py-3.5 text-right text-slate-600 font-medium">₹{member.expectedPricePerUnit}</td>
                        <td className="py-3.5 text-right">
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold">
                            {sharePct}%
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Committed
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">No farmers have joined this pool yet. Be the first to contribute!</p>
            </div>
          )}
        </div>

        {/* Right side: Aggregation Logic & Disclaimer */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-emerald-600" /> How Supply Aggregation Works
            </h3>
            <ul className="text-xs text-emerald-800 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>Small farmers contribute lots (e.g. 50kg, 100kg, 200kg) of identical crop and grade.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>Once the pool reaches target volume, B2B wholesale buyers place bulk purchase contracts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>An optimized multi-stop route picks up each farmer's share right from their farm gate.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  4
                </span>
                <span>Payment is held in digital escrow and paid directly into your bank account on delivery.</span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">Quality & Weight Rule</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Produce must match grade <strong>{pool.qualityGrade}</strong>. Weighing is verified by the logistics driver with a digital handheld scale at the time of farm-gate collection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Pool Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900">Contribute to Supply Pool</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select produce from your registered inventory to commit to {pool.poolName}.
            </p>

            <form onSubmit={handleJoinPool} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Your Produce Batch
                </label>
                <select
                  required
                  value={selectedCropId}
                  onChange={(e) => {
                    setSelectedCropId(e.target.value);
                    const crop = farmerCrops.find((c) => c.id === e.target.value);
                    if (crop) {
                      setExpectedPrice(crop.expectedPricePerUnit);
                      setContributeQuantity(Math.min(50, crop.availableQuantity - crop.allocatedQuantity));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose registered crop --</option>
                  {farmerCrops
                    .filter((c) => c.cropId === pool.cropId && c.availableQuantity - c.allocatedQuantity > 0)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.crop.name} ({c.farm.farmName}) - Avail: {c.availableQuantity - c.allocatedQuantity} {c.unit}
                      </option>
                    ))}
                </select>
                {farmerCrops.filter((c) => c.cropId === pool.cropId && c.availableQuantity - c.allocatedQuantity > 0).length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    You do not have available {pool.crop.name} in your inventory.{' '}
                    <Link to="/farmer/produce" className="underline font-bold">
                      Add produce first
                    </Link>
                    .
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantity to Contribute ({pool.crop.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={contributeQuantity}
                  onChange={(e) => setContributeQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Expected Price (₹ / {pool.crop.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">
                  Pool range: ₹{pool.minPricePerUnit} - ₹{pool.maxPricePerUnit}
                </span>
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
                  disabled={submitting || !selectedCropId}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
