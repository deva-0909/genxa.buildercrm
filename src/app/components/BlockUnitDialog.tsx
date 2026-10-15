import { useState } from 'react';
import { X, Lock, AlertCircle } from 'lucide-react';
import { getDataStore, localDate } from '../lib/dataStore';
import { toast } from 'sonner';

interface BlockUnitDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function BlockUnitDialog({ onClose, onSuccess }: BlockUnitDialogProps) {
  const [formData, setFormData] = useState({
    project: '',
    unit: '',
    customer: '',
    salesExec: '',
    days: 3,
    notes: ''
  });

  const dataStore = getDataStore();
  const projects = dataStore.getProjects();
  const salesExecs = dataStore.getUsers().filter(u => u.role === 'Sales Executive');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.project || !formData.unit || !formData.customer || !formData.salesExec) {
      toast.error('Please fill all required fields');
      return;
    }

    // Check if unit is already blocked or booked
    const bookings = dataStore.getBookings();
    const blocked = dataStore.getBlockedUnits();

    const isBooked = bookings.some(b => b.project === formData.project && b.unit === formData.unit);
    const isBlocked = blocked.some(b => b.project === formData.project && b.unit === formData.unit && b.status === 'Active');

    if (isBooked) {
      toast.error('This unit is already booked/sold');
      return;
    }

    if (isBlocked) {
      toast.error('This unit is already blocked');
      return;
    }

    const today = new Date();
    const expiry = new Date(today);
    expiry.setDate(today.getDate() + formData.days);

    dataStore.addBlockedUnit({
      project: formData.project,
      unit: formData.unit,
      customer: formData.customer,
      salesExec: formData.salesExec,
      blockedDate: localDate(today),
      expiryDate: localDate(expiry),
      status: 'Active',
      notes: formData.notes
    });

    toast.success(`Unit ${formData.unit} blocked for ${formData.days} days`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Block Unit
            </h3>
            <p className="text-sm text-gray-600">Temporarily reserve a unit for a customer</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Project *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.project}
                onChange={(e) => setFormData({...formData, project: e.target.value})}
              >
                <option value="">Select project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Unit Number *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  placeholder="e.g., A-101"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.days}
                  onChange={(e) => setFormData({...formData, days: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Customer Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.customer}
                onChange={(e) => setFormData({...formData, customer: e.target.value})}
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Sales Executive *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.salesExec}
                onChange={(e) => setFormData({...formData, salesExec: e.target.value})}
              >
                <option value="">Select executive</option>
                {salesExecs.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Notes</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Reason for blocking..."
              />
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <div className="text-sm text-yellow-800">
                Unit will be automatically unblocked after {formData.days} days if not converted to booking.
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Block Unit
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
