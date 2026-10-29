import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  Package,
  Calendar,
  MapPin,
  TrendingDown,
  Users,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import { DemandPool, Crop } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export const BuyerPoolsPage: React.FC = () => {
  const { user } = useAuth();
  const [pools, setPools] = useState<DemandPool[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    cropId: '',
    poolName: '',
    targetQuantity: 500,
    maxPricePerUnit: 28,
    qualityGrade: 'A',
    deliveryDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
    deliveryDistrict: user?.buyerProfile?.city || 'Chennai',
    deliveryState: user?.buyerProfile?.state || 'Tamil Nadu',
    centerLatitude: user?.buyerProfile?.latitude || 13.0827,
    centerLongitude: user?.buyerProfile?.longitude || 80.2707,
    initialQuantity: 100,
    offeredPrice: 28,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [poolsRes, cropsRes]: any = await Promise.all([
        api.get('/demand-pools'),
        api.get('/crops'),
      ]);

      if (poolsRes.success) {
        setPools(poolsRes.data);
      }
      if (cropsRes.success) {
        setCrops(cropsRes.data);
        if (cropsRes.data.length > 0 && !formData.cropId) {
          setFormData((prev) => ({
            ...prev,
            cropId: cropsRes.data[0].id,
            poolName: `Aggregated ${cropsRes.data[0].name} Hub Procurement`,
          }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching demand pools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cropId || formData.targetQuantity <= 0) return;

    try {
      setSubmitting(true);
      setError(null);
      const res: any = await api.post('/demand-pools', {
        ...formData,
        targetQuantity: Number(formData.targetQuantity),
        maxPricePerUnit: Number(formData.maxPricePerUnit),
        centerLatitude: Number(formData.centerLatitude),
        centerLongitude: Number(formData.centerLongitude),
        initialQuantity: Number(formData.initialQuantity),
        offeredPrice: Number(formData.offeredPrice),
      });

      if (res.success) {
        setModalOpen(false);
        fetchData();
      } else {
        setError(res.message || 'Failed to create demand pool');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating demand pool');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPools = pools.filter(
    (p) =>
      p.poolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.crop?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.deliveryDistrict.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-emerald-600" /> Buyer Demand Aggregation Pools
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pool purchasing orders with other restaurants and retailers to unlock bulk farm-gate discount pricing.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Start New Demand Pool
        </button>
      </div>

      {/* Explainer Card for Value Proposition 2 */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-950 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border border-teal-800">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Demand Aggregation Innovation
          </span>
          <h2 className="text-xl font-bold">Small orders together = Big wholesale purchasing power</h2>
          <p className="text-xs text-teal-100 leading-relaxed">
            By grouping individual requirement quantities (e.g. 100 kg + 150 kg + 250 kg), buyers collectively fulfill full truckload minimums, cutting out 2–3 layers of mandi middlemen commissions.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center flex-shrink-0">
          <span className="text-xs text-emerald-200 block uppercase font-semibold">Average Savings</span>
          <p className="text-2xl font-black text-white mt-1">18% - 25%</p>
          <span className="text-[10px] text-teal-200 block mt-0.5">vs Mandi Spot Rates</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search demand pools by crop, pool name, or district..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </div>

      {/* Pools Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200">
          <p className="font-semibold">{error}</p>
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Open Demand Pools</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Be the pioneer! Start a new collective demand pool for your target crop and invite peer businesses.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700"
          >
            Create Demand Pool
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map((pool) => {
            const pct = Math.min(100, Math.round((pool.currentQuantity / pool.targetQuantity) * 100));

            return (
              <div
                key={pool.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                      {pool.crop?.category} &bull; Grade {pool.qualityGrade}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        pool.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pool.status === 'TARGET_REACHED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {pool.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg text-slate-900 leading-snug">{pool.poolName}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Delivery: {pool.deliveryDistrict}, {pool.deliveryState}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                      <span>Aggregated Pool Demand</span>
                      <span className="font-bold text-slate-900">
                        {pool.currentQuantity} / {pool.targetQuantity} {pool.crop?.unit}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] text-slate-400 block text-right mt-1">{pct}% to wholesale quota</span>
                  </div>

                  {/* Pricing and Date Info */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Max Price Budget</span>
                      <span className="font-bold text-slate-800">₹{pool.maxPricePerUnit} /{pool.crop?.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Delivery Window</span>
                      <span className="font-bold text-slate-800">
                        {new Date(pool.deliveryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> {pool.members?.length || 1} Buyers Joined
                  </span>

                  <Link
                    to={`/buyer/pools/${pool.id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    View & Join <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-extrabold text-slate-900">Initiate Buyer Demand Pool</h3>
            <p className="text-xs text-slate-500 mt-1">
              Create a group order to pool demand with other restaurants, caterers, or grocery shops.
            </p>

            <form onSubmit={handleCreatePool} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pool Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.poolName}
                  onChange={(e) => setFormData({ ...formData, poolName: e.target.value })}
                  placeholder="e.g. Chennai Restaurants Collective Onion Lot"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Crop
                  </label>
                  <select
                    required
                    value={formData.cropId}
                    onChange={(e) => {
                      const c = crops.find((cr) => cr.id === e.target.value);
                      setFormData({
                        ...formData,
                        cropId: e.target.value,
                        poolName: c ? `${c.name} Bulk Demand Pool` : formData.poolName,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Bulk Quota (kg)
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={formData.targetQuantity}
                    onChange={(e) => setFormData({ ...formData, targetQuantity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Starting Order (kg)
                  </label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={formData.initialQuantity}
                    onChange={(e) => setFormData({ ...formData, initialQuantity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Rate Cap (₹/kg)
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Delivery Hub District
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
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
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
                  {submitting ? 'Creating...' : 'Start Demand Pool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
