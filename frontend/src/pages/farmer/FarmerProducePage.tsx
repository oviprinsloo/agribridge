import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Scale,
  X,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import { FarmerCrop, Crop, Farm } from '../../types';

export const FarmerProducePage: React.FC = () => {
  const [produceList, setProduceList] = useState<FarmerCrop[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduce, setEditingProduce] = useState<FarmerCrop | null>(null);
  const [farmId, setFarmId] = useState('');
  const [cropId, setCropId] = useState('');
  const [availableQuantity, setAvailableQuantity] = useState('100');
  const [expectedPricePerUnit, setExpectedPricePerUnit] = useState('32');
  const [harvestDate, setHarvestDate] = useState(
    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [qualityGrade, setQualityGrade] = useState('GRADE_A');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [prodRes, cropsRes, farmsRes]: any[] = await Promise.all([
        api.get('/farmers/produce'),
        api.get('/crops'),
        api.get('/farmers/farms'),
      ]);

      if (prodRes.success) setProduceList(prodRes.data);
      if (cropsRes.success) setCrops(cropsRes.data);
      if (farmsRes.success) {
        setFarms(farmsRes.data);
        if (farmsRes.data.length > 0) setFarmId(farmsRes.data[0].id);
      }
      if (cropsRes.data?.length > 0) setCropId(cropsRes.data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingProduce(null);
    setAvailableQuantity('100');
    setExpectedPricePerUnit('32');
    setNotes('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: FarmerCrop) => {
    setEditingProduce(p);
    setFarmId(p.farmId);
    setCropId(p.cropId);
    setAvailableQuantity(p.availableQuantity.toString());
    setExpectedPricePerUnit(p.expectedPricePerUnit.toString());
    setHarvestDate(new Date(p.harvestDate).toISOString().split('T')[0]);
    setQualityGrade(p.qualityGrade);
    setNotes(p.notes || '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      farmId,
      cropId,
      availableQuantity: parseFloat(availableQuantity),
      expectedPricePerUnit: parseFloat(expectedPricePerUnit),
      harvestDate: new Date(harvestDate).toISOString(),
      qualityGrade,
      notes,
    };

    try {
      if (editingProduce) {
        await api.patch(`/farmers/produce/${editingProduce.id}`, payload);
      } else {
        await api.post('/farmers/produce', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save produce');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduce = async (id: string) => {
    if (!confirm('Are you sure you want to remove this produce listing?')) return;
    try {
      await api.delete(`/farmers/produce/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Cannot delete produce that is currently allocated in a pool.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Farm Inventory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            My Harvest & Produce Listings
          </h1>
          <p className="text-xs text-slate-500">
            Rule: A farmer cannot allocate or sell more quantity than actually available.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Produce Listing
        </button>
      </div>

      {/* Produce Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {produceList.map((item) => {
          const unallocated = item.availableQuantity - item.allocatedQuantity;
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {item.qualityGrade.replace('_', ' ')}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'PARTIALLY_ALLOCATED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
                  {item.crop.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{item.farm.farmName} • {item.farm.village}</p>

                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Quantity</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {item.availableQuantity} {item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Expected Price</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                      ₹{item.expectedPricePerUnit} / {item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Allocated in Pools</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {item.allocatedQuantity} {item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Free to Allocate</span>
                    <span className="font-bold text-sky-700 dark:text-sky-400">
                      {unallocated} {item.unit}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Harvest Date: {new Date(item.harvestDate).toLocaleDateString()}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => openEditModal(item)}
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                {item.allocatedQuantity === 0 && (
                  <button
                    onClick={() => handleDeleteProduce(item.id)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Produce Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingProduce ? 'Update Produce Listing' : 'List Farm Produce'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduce} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Crop Variety
                </label>
                <select
                  value={cropId}
                  onChange={(e) => setCropId(e.target.value)}
                  disabled={!!editingProduce}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Farm Location
                </label>
                <select
                  value={farmId}
                  onChange={(e) => setFarmId(e.target.value)}
                  disabled={!!editingProduce}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farmName} ({f.village}, {f.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Available Quantity (kg)
                  </label>
                  <input
                    type="number"
                    value={availableQuantity}
                    onChange={(e) => setAvailableQuantity(e.target.value)}
                    required
                    min={editingProduce ? editingProduce.allocatedQuantity : 1}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Price (₹/kg)
                  </label>
                  <input
                    type="number"
                    value={expectedPricePerUnit}
                    onChange={(e) => setExpectedPricePerUnit(e.target.value)}
                    required
                    min={1}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harvest Date
                  </label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                  >
                    <option value="GRADE_A">Grade A (Premium / Export / Direct Retail)</option>
                    <option value="GRADE_B">Grade B (Standard Market Quality)</option>
                    <option value="GRADE_C">Grade C (Processing / Pulp Grade)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Organic certified, drip irrigated"
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Produce'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
