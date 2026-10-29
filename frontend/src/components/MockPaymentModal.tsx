import React, { useState } from 'react';
import { CreditCard, QrCode, Building, ShieldCheck, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import confetti from 'canvas-confetti';

interface MockPaymentModalProps {
  isOpen?: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  amount: number;
  cropName: string;
  quantityKg?: number;
  quantity?: number;
  unit?: string;
  onPaymentSuccess?: () => void;
  onSuccess?: () => void;
}

export const MockPaymentModal: React.FC<MockPaymentModalProps> = ({
  isOpen = true,
  onClose,
  orderId,
  orderNumber = orderId.slice(-6).toUpperCase(),
  amount,
  cropName,
  quantityKg,
  quantity,
  unit = 'kg',
  onPaymentSuccess,
  onSuccess,
}) => {
  const actualQuantity = quantityKg ?? quantity ?? 0;
  const triggerSuccess = onPaymentSuccess || onSuccess || (() => {});
  const [method, setMethod] = useState<'UPI' | 'NET_BANKING' | 'CARD' | 'ESCROW_WALLET'>('UPI');
  const [upiId, setUpiId] = useState('buyer.business@okaxis');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Simulate quick secure gateway handshake
      await new Promise((r) => setTimeout(r, 900));

      const res: any = await api.post('/payments/mock-checkout', {
        orderId,
        paymentMethod: method,
        upiId: method === 'UPI' ? upiId : undefined,
      });

      if (res.success) {
        setIsSuccess(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          triggerSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment processing failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">AgriBridge Secure Escrow Checkout</h3>
              <p className="text-slate-400 text-xs font-mono">Order #{orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-800/40 p-5 text-center">
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 dark:text-emerald-400">
            Escrow Deposit Amount
          </span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">
            ₹{amount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Produce: {quantityKg} kg {cropName} • Funds held in verified platform escrow until you confirm delivery
          </p>
        </div>

        {/* Payment Methods */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-xl font-bold text-slate-900">Escrow Payment Verified!</h4>
              <p className="text-xs text-slate-500">
                Transaction recorded. Payout will be disbursed directly to farmers upon your delivery inspection.
              </p>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Select Payment Mode (Simulated Provider)
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-semibold ${
                    method === 'UPI'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('NET_BANKING')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-semibold ${
                    method === 'NET_BANKING'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Building className="w-5 h-5 text-emerald-600" />
                  NetBanking
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-semibold ${
                    method === 'CARD'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Card
                </button>
              </div>

              {method === 'UPI' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Virtual Payment Address (VPA)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="yourname@upi"
                  />
                </div>
              )}

              {method === 'NET_BANKING' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  Simulating Corporate NetBanking Gateway (HDFC / ICICI / SBI Commercial).
                </div>
              )}

              {method === 'CARD' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  Simulating RuPay & Visa Commercial Agro-Credit Card Gateway.
                </div>
              )}

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Development Mode:</strong> Mock payment checkout. No actual bank deduction occurs. Pre-configured for Razorpay / UPI live integration.
                </span>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePay}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Securing Funds in Escrow...
                  </>
                ) : (
                  `Authorize Escrow Deposit (₹${amount.toLocaleString('en-IN')})`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
