import React, { useState } from 'react';
import { AlertTriangle, X, Send, Loader2 } from 'lucide-react';
import api from '../services/api';

interface DisputeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  onSuccess: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen = true,
  onClose,
  orderId,
  orderNumber,
  onSuccess,
}) => {
  const [reasonCategory, setReasonCategory] = useState<string>('QUANTITY_MISMATCH');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.length < 10) {
      setErrorMessage('Please provide a detailed description (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res: any = await api.post('/disputes', {
        orderId,
        reasonCategory,
        description,
      });

      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to file dispute');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-amber-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-base">Report Order Issue (Dispute)</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Filing a dispute for Order <strong className="text-slate-800">#{orderNumber}</strong>. Our mediation team reviews evidence within 24 hours.
          </p>

          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Issue Category
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="QUANTITY_MISMATCH">Quantity Mismatch (Actual weight differs)</option>
              <option value="QUALITY_ISSUE">Quality Issue (Grade / freshness defect)</option>
              <option value="DAMAGED_PRODUCE">Damaged Produce during transit</option>
              <option value="LATE_DELIVERY">Late Delivery / Pickup Delay</option>
              <option value="PAYMENT_ISSUE">Payment / Escrow Issue</option>
              <option value="OTHER">Other Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed Explanation
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the specific issue, discrepancy observed, or photos/weighment slip details..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Dispute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
