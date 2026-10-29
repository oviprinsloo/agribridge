import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  Truck,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
} from 'lucide-react';
import api from '../../services/api';
import { Order } from '../../types';
import { DisputeModal } from '../../components/DisputeModal';

export const FarmerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dispute modal state
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState<Order | null>(null);

  // Pickup confirmation state
  const [confirmingPickupId, setConfirmingPickupId] = useState<string | null>(null);
  const [pickupSuccess, setPickupSuccess] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.get('/orders/farmer/my-orders');
      if (res.success) {
        setOrders(res.data);
      } else {
        setError(res.message || 'Failed to fetch orders');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmPickup = async (orderId: string) => {
    try {
      setConfirmingPickupId(orderId);
      const res: any = await api.post(`/orders/${orderId}/farmer-confirm-pickup`);
      if (res.success) {
        setPickupSuccess(`Produce pickup successfully verified for order #${orderId.slice(-6)}.`);
        fetchOrders();
      } else {
        alert(res.message || 'Failed to confirm pickup');
      }
    } catch (err: any) {
      alert(err.message || 'Error confirming pickup');
    } finally {
      setConfirmingPickupId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'ACTIVE'
        ? ['CONFIRMED', 'LOGISTICS_ASSIGNED', 'IN_TRANSIT'].includes(order.status)
        : order.status === filterStatus;

    const matchesSearch =
      searchQuery === '' ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.crop?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerProfile?.businessName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Bulk Orders & Shipments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track farm-gate pickups, delivery status, and escrow payment release.
          </p>
        </div>
      </div>

      {pickupSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">{pickupSuccess}</span>
          </div>
          <button onClick={() => setPickupSuccess(null)} className="text-emerald-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, crop, buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {['ALL', 'ACTIVE', 'DELIVERED', 'COMPLETED', 'DISPUTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Orders Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            You don't have any orders matching the selected filter. Join open supply pools or check matches to receive bulk purchase orders.
          </p>
          <Link
            to="/farmer/pools"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700"
          >
            Explore Supply Pools
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const myQuantity = order.myQuantity || order.items?.[0]?.quantity || 0;
            const myPayout = order.mySharePrice || myQuantity * order.unitPrice;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Left: Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                        {order.orderNumber}
                      </span>

                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          order.status === 'COMPLETED' || order.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : order.status === 'IN_TRANSIT'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : order.status === 'DISPUTED'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>

                      {order.payment && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Escrow:{' '}
                          {order.payment.status === 'HELD_IN_ESCROW'
                            ? 'Locked in Escrow'
                            : order.payment.status === 'RELEASED_TO_FARMERS'
                            ? 'Paid Out'
                            : order.payment.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-black text-emerald-800 text-base">
                        {order.crop?.name ? order.crop.name.slice(0, 2).toUpperCase() : 'AG'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{order.crop?.name} Bulk Order</h3>
                        <p className="text-xs text-slate-500">
                          Buyer: <strong>{order.buyerProfile?.businessName || 'Verified Institutional Buyer'}</strong> &bull; Ordered on{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Order details chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-1">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">Your Farm Lot</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {myQuantity} {order.crop?.unit}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">Your Net Payout</span>
                        <span className="font-bold text-emerald-700 text-sm">₹{myPayout.toLocaleString()}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">Farm-Gate Pickup</span>
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                          {order.farmerPickupConfirmed ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Confirmed
                            </span>
                          ) : (
                            <span className="text-amber-600">Pending Arrival</span>
                          )}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">Buyer Hub Delivery</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {order.buyerDeliveryConfirmed ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Received
                            </span>
                          ) : (
                            <span className="text-slate-500">In Pipeline</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-48 flex-shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                    <Link
                      to={`/farmer/orders/${order.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      View Order & Route <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {!order.farmerPickupConfirmed && ['CONFIRMED', 'LOGISTICS_ASSIGNED', 'IN_TRANSIT'].includes(order.status) && (
                      <button
                        onClick={() => handleConfirmPickup(order.id)}
                        disabled={confirmingPickupId === order.id}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {confirmingPickupId === order.id ? 'Confirming...' : 'Confirm Farm Pickup'}
                      </button>
                    )}

                    {['CONFIRMED', 'LOGISTICS_ASSIGNED', 'IN_TRANSIT', 'DELIVERED'].includes(order.status) && (
                      <button
                        onClick={() => {
                          setSelectedOrderForDispute(order);
                          setDisputeModalOpen(true);
                        }}
                        className="w-full inline-flex items-center justify-center gap-1 px-4 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Raise Dispute
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModalOpen && selectedOrderForDispute && (
        <DisputeModal
          orderId={selectedOrderForDispute.id}
          orderNumber={selectedOrderForDispute.orderNumber}
          onClose={() => {
            setDisputeModalOpen(false);
            setSelectedOrderForDispute(null);
          }}
          onSuccess={() => {
            setDisputeModalOpen(false);
            setSelectedOrderForDispute(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};
