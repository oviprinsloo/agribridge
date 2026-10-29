import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Calendar,
  Truck,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Clock,
  DollarSign,
  User,
  Phone,
} from 'lucide-react';
import api from '../../services/api';
import { Order } from '../../types';
import { MapRouteView } from '../../components/MapRouteView';
import { DisputeModal } from '../../components/DisputeModal';

export const FarmerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.get(`/orders/${id}`);
      if (res.success) {
        setOrder(res.data);
      } else {
        setError(res.message || 'Order not found');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const handleConfirmPickup = async () => {
    if (!order) return;
    try {
      setConfirmingPickup(true);
      const res: any = await api.post(`/orders/${order.id}/farmer-confirm-pickup`);
      if (res.success) {
        setActionSuccess('Farm-gate produce pickup confirmed successfully!');
        fetchOrderDetail();
      } else {
        alert(res.message || 'Failed to confirm pickup');
      }
    } catch (err: any) {
      alert(err.message || 'Error confirming pickup');
    } finally {
      setConfirmingPickup(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Unable to load order</h3>
            <p className="text-sm">{error || 'Order not found.'}</p>
            <button
              onClick={() => navigate('/farmer/orders')}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top back & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/farmer/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              order.status === 'COMPLETED' || order.status === 'DELIVERED'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : order.status === 'IN_TRANSIT'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : order.status === 'DISPUTED'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            Status: {order.status.replace('_', ' ')}
          </span>

          {!order.farmerPickupConfirmed && ['CONFIRMED', 'LOGISTICS_ASSIGNED', 'IN_TRANSIT'].includes(order.status) && (
            <button
              onClick={handleConfirmPickup}
              disabled={confirmingPickup}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {confirmingPickup ? 'Confirming...' : 'Confirm Pickup at Farm'}
            </button>
          )}

          <button
            onClick={() => setDisputeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Raise Dispute
          </button>
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
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                {order.orderNumber}
              </span>
              <span className="text-xs text-slate-400">Created on {new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {order.crop?.name} Wholesale Batch
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Institutional Buyer: <strong>{order.buyerProfile?.businessName || 'Verified Buyer'}</strong> &bull; Contact:{' '}
              {order.buyerProfile?.user?.phone || 'Confidential Buyer Desk'}
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-center gap-6">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Quantity</span>
              <p className="text-2xl font-black text-emerald-950">
                {order.totalQuantity.toLocaleString()} <span className="text-sm font-normal">{order.crop?.unit}</span>
              </p>
            </div>
            <div className="border-l border-emerald-200 pl-6">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Contract Value</span>
              <p className="text-2xl font-black text-emerald-950">
                ₹{order.totalPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Party Dual Confirmation Status Tracker */}
        <div className="mt-6 pt-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Dual Confirmation & Escrow Release Protocol
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-xl border ${
                order.payment?.status === 'HELD_IN_ESCROW' || order.payment?.status === 'RELEASED_TO_FARMERS'
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm">1. Buyer Funded Escrow</span>
              </div>
              <p className="text-xs mt-1 text-slate-600">
                {order.payment?.status === 'HELD_IN_ESCROW'
                  ? '100% Funds locked safely in AgriBridge platform escrow'
                  : order.payment?.status === 'RELEASED_TO_FARMERS'
                  ? 'Payment completed and released to bank accounts'
                  : 'Pending buyer payment lock'}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                order.farmerPickupConfirmed
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${order.farmerPickupConfirmed ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="font-bold text-sm">2. Farm-Gate Handover</span>
              </div>
              <p className="text-xs mt-1 text-slate-600">
                {order.farmerPickupConfirmed
                  ? 'Confirmed by farmer: produce collected by logistics'
                  : 'Waiting for vehicle pickup at farm'}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                order.buyerDeliveryConfirmed
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${order.buyerDeliveryConfirmed ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="font-bold text-sm">3. Buyer Hub Receipt</span>
              </div>
              <p className="text-xs mt-1 text-slate-600">
                {order.buyerDeliveryConfirmed
                  ? 'Received & inspected at buyer hub; escrow unlocked'
                  : 'In transit to buyer facility'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Route & Map Section */}
      {order.pickupRoute && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" /> Multi-Stop Aggregation Route
              </h2>
              <p className="text-xs text-slate-500">
                Optimized TSP route picking up smallholder produce across participating farms.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
              Vehicle: {order.pickupRoute.vehicleType} ({order.pickupRoute.vehicleCapacityKg} kg cap)
            </span>
          </div>

          <MapRouteView
            stops={order.pickupRoute.stops}
            destination={
              order.delivery
                ? {
                    latitude: order.delivery.latitude,
                    longitude: order.delivery.longitude,
                    name: order.delivery.destinationName,
                    address: order.delivery.destinationAddress,
                  }
                : undefined
            }
            totalDistanceKm={order.pickupRoute.totalDistanceKm}
            estimatedDurationMins={order.pickupRoute.estimatedDurationMins}
            estimatedTransportCost={order.pickupRoute.estimatedTransportCost}
          />
        </div>
      )}

      {/* Participating Farm Items Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Lot Breakdown by Farm</h3>
        {order.items && order.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Farm / Location</th>
                  <th className="pb-3">Farmer</th>
                  <th className="pb-3 text-right">Quantity</th>
                  <th className="pb-3 text-right">Unit Rate</th>
                  <th className="pb-3 text-right">Farmer Subtotal</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="py-3">
                      <p className="font-semibold text-slate-800">{item.farm?.farmName || `Farm #${idx + 1}`}</p>
                      <span className="text-xs text-slate-400">
                        {item.farm?.village}, {item.farm?.district}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">
                      {item.farmerProfile?.user?.name || 'Verified Farmer'}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-800">
                      {item.quantity} {order.crop?.unit}
                    </td>
                    <td className="py-3 text-right text-slate-600">₹{item.unitPrice}</td>
                    <td className="py-3 text-right font-bold text-emerald-700">₹{item.subtotal.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No lot breakdown available.</p>
        )}
      </div>

      {/* Dispute Modal */}
      {disputeModalOpen && (
        <DisputeModal
          orderId={order.id}
          orderNumber={order.orderNumber}
          onClose={() => setDisputeModalOpen(false)}
          onSuccess={() => {
            setDisputeModalOpen(false);
            fetchOrderDetail();
          }}
        />
      )}
    </div>
  );
};
