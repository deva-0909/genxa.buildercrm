import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProcessCommissionDialogProps {
  cp: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProcessCommissionDialog({ cp, onClose, onSuccess }: ProcessCommissionDialogProps) {
  const [formData, setFormData] = useState({
    amount: cp.commission,
    paymentMode: 'Bank Transfer',
    transactionId: '',
    remarks: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.transactionId) {
      toast.error('Please enter transaction ID');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Please enter valid amount');
      return;
    }

    toast.success(`Commission payment of ₹${formData.amount.toLocaleString()} processed for ${cp.name}`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Process Commission Payment</h3>
            <p className="text-sm text-gray-600">{cp.name} ({cp.id})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Total Bookings This Month</span>
              <span className="text-gray-900">{cp.bookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Commission Due</span>
              <span className="text-gray-900">₹{cp.commission.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Payment Amount (₹) *</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Payment Mode *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.paymentMode}
                onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
              >
                <option>Bank Transfer</option>
                <option>NEFT/RTGS</option>
                <option>Cheque</option>
                <option>UPI</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Transaction ID / Reference *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.transactionId}
                onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                placeholder="Enter transaction/reference number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Payment Remarks</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                placeholder="Any notes about this payment..."
              />
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Payment will be recorded and confirmation will be sent to {cp.email}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Process Payment
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
