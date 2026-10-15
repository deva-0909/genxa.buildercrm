import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { getDataStore, localDate } from '../lib/dataStore';
import { toast } from 'sonner';

interface CreateBookingDialogProps {
  leadId?: string;
  customerName?: string;
  customerMobile?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBookingDialog({
  leadId,
  customerName,
  customerMobile,
  onClose,
  onSuccess
}: CreateBookingDialogProps) {
  const [formData, setFormData] = useState({
    customer: customerName || '',
    mobile: customerMobile || '',
    project: '',
    unit: '',
    unitType: '2 BHK',
    price: 0,
    discount: 0,
    tokenAmount: 0,
    salesExec: getDataStore().getPersona().role === 'Sales Executive' ? getDataStore().getPersona().name : ''
  });

  const dataStore = getDataStore();
  const projects = dataStore.getProjects();
  const salesExecs = dataStore.getUsers().filter(u => u.role === 'Sales Executive' && u.status === 'Active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer || !formData.mobile || !formData.project || !formData.unit || !formData.salesExec) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.price <= 0 || formData.tokenAmount <= 0) {
      toast.error('Please enter valid price and token amount');
      return;
    }

    // Create booking
    const booking = dataStore.addBooking({
      leadId: leadId || 'DIRECT',
      customer: formData.customer,
      mobile: formData.mobile,
      project: formData.project,
      unit: formData.unit,
      unitType: formData.unitType,
      price: formData.price,
      discount: formData.discount,
      tokenAmount: formData.tokenAmount,
      totalPaid: formData.tokenAmount,
      stage: 'Token Paid',
      salesExec: formData.salesExec,
      bookingDate: localDate()
    });

    // Update lead status if leadId provided
    if (leadId) {
      dataStore.updateLead(leadId, {
        status: 'Visit Scheduled'
      });
    }

    toast.success(`Booking ${booking.id} created successfully!`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Create New Booking</h3>
            <p className="text-sm text-gray-600">Enter booking details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm text-gray-700 mb-2">Mobile Number *</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                placeholder="10-digit mobile"
              />
            </div>

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

            <div>
              <label className="block text-sm text-gray-700 mb-2">Unit Number *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                placeholder="e.g., A-201"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Unit Type *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.unitType}
                onChange={(e) => setFormData({...formData, unitType: e.target.value})}
              >
                <option>1 BHK</option>
                <option>2 BHK</option>
                <option>3 BHK</option>
                <option>4 BHK</option>
                <option>Penthouse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Sales Executive *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.salesExec}
                onChange={(e) => setFormData({...formData, salesExec: e.target.value})}
              >
                <option value="">Select sales executive</option>
                {salesExecs.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Unit Price (₹) *</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.price || ''}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Discount (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.discount || ''}
                onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Token Amount (₹) *</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.tokenAmount || ''}
                onChange={(e) => setFormData({...formData, tokenAmount: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Net Amount:</span>
                <span className="text-gray-900">₹{(formData.price - formData.discount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-700">Pending Amount:</span>
                <span className="text-gray-900">₹{(formData.price - formData.discount - formData.tokenAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Create Booking
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
