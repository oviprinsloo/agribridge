import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Scale,
  Calendar,
  MapPin,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import { SupplyPool, FarmerCrop, Crop } from '../../types';

export const FarmerPoolsPage: React.FC = () => {
  const [pools, setPools] = useState<SupplyPool[]>([]);
  const [myProduce, setMyProduce] = useState<FarmerCrop[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Join Pool Modal
  const [selectedPoolToJoin, setSelectedPoolToJoin] = useState<SupplyPool | null>(null);
  const [selectedCropIdToJoin, setSelectedCropIdToJoin] = useState('');
  const [contributeQty, setContributeQty] = useState('50');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Create Pool Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCropId, setCreateCropId] = useState('');
  const [poolName, setPoolName] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('500');
  const [avgPrice, setAvgPrice] = useState('32');
  const [district, setDistrict] = useState('Namakkal');
  const [state, setState] = useState('Tamil Nadu');
  const [initialProduceId, setInitialProduceId] = useState('');
  const [initialQty, setInitialQty] = useState('100');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [poolRes, prodRes, cropRes]: any[] = await Promise.all([
        api.get('/supply-pools'),
        api.get('/farmers/produce'),
        api.get('/crops'),
      ]);

      if (poolRes.success) setPools(poolRes.data);
      if (prodRes.success) setMyProduce(prodRes.data);
      if (cropRes.success) {
        setCrops(cropRes.data);
        if (cropRes.data.length > 0) setCreateCropId(cropRes.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openJoinModal = (pool: SupplyPool) => {
    setSelectedPoolToJoin(pool);
    setJoinError(null);
    // Find matching unallocated produce
    const compatible = myProduce.filter(
      (p) => p.cropId === pool.cropId && p.availableQuantity - p.allocatedQuantity > 0
    );
    if (compatible.length > 0) {
      setSelectedCropIdToJoin(compatible[0].id);
      const free = compatible[0].availableQuantity - compatible[0].allocatedQuantity;
      setContributeQty(Math.min(50, free).toString());
    } else {
      setSelectedCropIdToJoin('');
      setContributeQty('0');
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoolToJoin || !selectedCropIdToJoin) {
      setJoinError('Please select available produce to commit to this pool.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      await api.post(`/supply-pools/${selectedPoolToJoin.id}/join`, {
        farmerCropId: selectedCropIdToJoin,
        contributedQuantity: parseFloat(contributeQty),
      });

      setSelectedPoolToJoin(null);
      fetchData();
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join pool');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    const harvestStart = new Date().toISOString();
    const harvestEnd = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString();

    try {
      await api.post('/supply-pools', {
        cropId: createCropId,
        poolName,
        targetQuantity: parseFloat(targetQuantity),
        avgPricePerUnit: parseFloat(avgPrice),
        minPricePerUnit: parseFloat(avgPrice) - 2,
        maxPricePerUnit: parseFloat(avgPrice) + 2,
        qualityGrade: 'GRADE_A',
        harvestWindowStart: harvestStart,
        harvestWindowEnd: harvestEnd,
        district,
        state,
        centerLatitude: 11.2189,
        centerLongitude: 78.1674,
        initialFarmerCropId: initialProduceId || undefined,
        initialContributedQuantity: initialProduceId ? parseFloat(initialQty) : undefined,
      });

      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create supply pool');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Pooled Selling
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Active Supply Pools
          </h1>
          <p className="text-xs text-slate-500">
            Pool produce with nearby farms to fulfill large wholesale B2B buyer batches.
          </p>
        </div>

        <button
          onClick={() => {
            setPoolName(`Namakkal Regional ${crops[0]?.name || 'Produce'} Pool`);
            setIsCreateOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Supply Pool
        </button>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool) => {
          const percent = Math.min(100, Math.round((pool.currentQuantity / pool.targetQuantity) * 100));
          const membersCount = pool.members?.length || 0;

          return (
            <div
              key={pool.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {pool.crop.name}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      pool.status === 'TARGET_REACHED'
                        ? 'bg-amber-100 text-amber-800'
                        : pool.status === 'MATCHED'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {pool.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-3">
                  {pool.poolName}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {pool.district}, {pool.state}
                </p>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {pool.currentQuantity} kg{' '}
                      <span className="text-slate-400 font-normal">/ {pool.targetQuantity} kg</span>
                    </span>
                    <span className="font-bold text-emerald-600">{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Contributing Farmers</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {membersCount} Farmers
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Average Price</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      ₹{pool.avgPricePerUnit} / kg
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Link
                  to={`/farmer/pools/${pool.id}`}
                  className="flex-1 py-2 text-center text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  View Pool
                </Link>
                {['OPEN', 'TARGET_REACHED'].includes(pool.status) && (
                  <button
                    onClick={() => openJoinModal(pool)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    Join Pool
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Join Pool Modal */}
      {selectedPoolToJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Join Supply Pool</h3>
                <p className="text-xs text-emerald-200">{selectedPoolToJoin.poolName}</p>
              </div>
              <button
                onClick={() => setSelectedPoolToJoin(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="p-6 space-y-4">
              {joinError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {joinError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Your Produce Batch
                </label>
                {myProduce.filter((p) => p.cropId === selectedPoolToJoin.cropId).length > 0 ? (
                  <select
                    value={selectedCropIdToJoin}
                    onChange={(e) => setSelectedCropIdToJoin(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                  >
                    {myProduce
                      .filter((p) => p.cropId === selectedPoolToJoin.cropId)
                      .map((p) => {
                        const free = p.availableQuantity - p.allocatedQuantity;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.farm.farmName} — Free: {free} kg (@ ₹{p.expectedPricePerUnit}/kg)
                          </option>
                        );
                      })}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                    You have no unallocated {selectedPoolToJoin.crop.name} listed. Please{' '}
                    <Link to="/farmer/produce" className="font-bold underline">
                      add produce first
                    </Link>
                    .
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity to Contribute (kg)
                </label>
                <input
                  type="number"
                  value={contributeQty}
                  onChange={(e) => setContributeQty(e.target.value)}
                  min={1}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  System strictly checks that contribution cannot exceed your unallocated produce stock.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPoolToJoin(null)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !selectedCropIdToJoin}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Joining'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Pool Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Create New Supply Pool</h3>
                <p className="text-xs text-emerald-200">Establish an aggregation cluster in your district</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pool Name
                </label>
                <input
                  type="text"
                  value={poolName}
                  onChange={(e) => setPoolName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Crop
                  </label>
                  <select
                    value={createCropId}
                    onChange={(e) => setCreateCropId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Batch Quantity (kg)
                  </label>
                  <input
                    type="number"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(e.target.value)}
                    required
                    min={100}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Avg Price (₹/kg)
                  </label>
                  <input
                    type="number"
                    value={avgPrice}
                    onChange={(e) => setAvgPrice(e.target.value)}
                    required
                    min={1}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    District Cluster
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Launch Supply Pool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
