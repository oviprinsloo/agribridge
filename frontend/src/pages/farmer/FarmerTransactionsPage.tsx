import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowUpRight,
  CreditCard,
  Building,
  AlertCircle,
  Download,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface TransactionItem {
  id: string;
  orderNumber: string;
  cropName: string;
  quantity: number;
  unit: string;
  amount: number;
  status: string;
  date: string;
  referenceId?: string;
  mode: string;
}

export const FarmerTransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.get('/payments/farmer/my-transactions');
      if (res.success) {
        setTransactions(res.data);
      } else {
        // Fallback or derive from orders
        const ordersRes: any = await api.get('/orders/farmer/my-orders');
        if (ordersRes.success) {
          const derived = ordersRes.data.map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            cropName: o.crop?.name || 'Produce Lot',
            quantity: o.myQuantity || o.items?.[0]?.quantity || o.totalQuantity,
            unit: o.crop?.unit || 'kg',
            amount: o.mySharePrice || (o.items?.[0]?.subtotal ?? o.totalPrice),
            status: o.payment?.status || (o.status === 'COMPLETED' ? 'RELEASED_TO_FARMERS' : 'HELD_IN_ESCROW'),
            date: o.payment?.paidAt || o.createdAt,
            referenceId: o.payment?.providerPaymentId || `ESCROW-${o.orderNumber}`,
            mode: o.payment?.provider || 'Platform Escrow',
          }));
          setTransactions(derived);
        } else {
          setError(ordersRes.message || 'Failed to load transaction history');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const totalEarned = transactions
    .filter((t) => t.status === 'RELEASED_TO_FARMERS' || t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalInEscrow = transactions
    .filter((t) => t.status === 'HELD_IN_ESCROW' || t.status === 'CAPTURED')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Financial Ledger & Escrow Payouts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete transparency into escrow locks, verified handovers, and direct bank settlements.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Settled to Bank</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            ₹{totalEarned.toLocaleString()}
          </p>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">
            Paid directly via UPI / NEFT
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Protected in Escrow</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            ₹{totalInEscrow.toLocaleString()}
          </p>
          <span className="text-xs text-blue-600 font-medium mt-1 inline-block">
            Unlocks immediately upon buyer delivery receipt
          </span>
        </div>

        {/* Bank Account Info Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payout Destination</span>
              <Building className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="font-bold text-base mt-2">State Bank of India</p>
            <p className="font-mono text-xs text-slate-300 mt-0.5">A/C: ••••••••••4819</p>
          </div>
          <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs text-emerald-400">
            <span>UPI: farmer@oksbi</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 rounded font-bold">Verified</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
            <p className="text-xs text-slate-500">All lot settlements and escrow releases</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 font-semibold">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <DollarSign className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No transaction records found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Reference & Date</th>
                  <th className="px-6 py-3.5">Order / Crop</th>
                  <th className="px-6 py-3.5 text-right">Quantity</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-700 block">
                        {tx.referenceId || tx.id.slice(0, 12)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(tx.date).toLocaleDateString()} &bull; {tx.mode}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{tx.cropName}</p>
                      <span className="text-xs text-slate-400">Order #{tx.orderNumber}</span>
                    </td>

                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {tx.quantity} {tx.unit}
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-emerald-700 text-base">
                      +₹{tx.amount.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          tx.status === 'RELEASED_TO_FARMERS' || tx.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : tx.status === 'HELD_IN_ESCROW'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {tx.status === 'RELEASED_TO_FARMERS' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Settled
                          </>
                        ) : tx.status === 'HELD_IN_ESCROW' ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-blue-600" /> Escrow Locked
                          </>
                        ) : (
                          tx.status
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
