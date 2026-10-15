import { useState } from 'react';
import { X, Briefcase } from 'lucide-react';
import { getDataStore } from '../lib/dataStore';
import { toast } from 'sonner';

interface OnboardCPDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function OnboardCPDialog({ onClose, onSuccess }: OnboardCPDialogProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    location: '',
    reraNumber: '',
    commissionRate: 2,
    commissionType: 'Percentage of Deal Value',
    paymentTerms: 'On Booking',
    bankDetails: '',
    remarks: ''
  });

  const dataStore = getDataStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.contactPerson || !formData.mobile || !formData.email) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const cp = dataStore.addChannelPartner({
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      mobile: formData.mobile,
      email: formData.email,
      location: formData.location,
      reraNumber: formData.reraNumber,
      commissionRate: formData.commissionRate,
      commissionType: formData.commissionType,
      paymentTerms: formData.paymentTerms,
      bankDetails: formData.bankDetails,
      remarks: formData.remarks,
      status: 'Active',
      rating: 0,
      onboardedDate: new Date().toISOString().split('T')[0]
    });

    toast.success(`Channel Partner ${cp.id} onboarded successfully!`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Onboard New Channel Partner</h3>
            <p className="text-sm text-gray-600">Enter CP details and commission structure</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                placeholder="ABC Properties Pvt. Ltd."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Contact Person *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                placeholder="Full name"
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
              <label className="block text-sm text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="contact@company.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Andheri, Mumbai"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">RERA Registration</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.reraNumber}
                onChange={(e) => setFormData({...formData, reraNumber: e.target.value})}
                placeholder="RERA number"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Commission Rate (%)</label>
              <input
                type="number"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.commissionRate}
                onChange={(e) => setFormData({...formData, commissionRate: parseFloat(e.target.value) || 0})}
                placeholder="e.g., 2.5"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Commission Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.commissionType}
                onChange={(e) => setFormData({...formData, commissionType: e.target.value})}
              >
                <option>Percentage of Deal Value</option>
                <option>Fixed Amount per Booking</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Payment Terms</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
              >
                <option>On Booking</option>
                <option>On Agreement</option>
                <option>On Possession</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-gray-700 mb-2">Bank Details</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.bankDetails}
                onChange={(e) => setFormData({...formData, bankDetails: e.target.value})}
                placeholder="Account number, IFSC, bank name..."
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-gray-700 mb-2">Remarks / Notes</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                placeholder="Any additional information..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Briefcase className="w-4 h-4 inline mr-2" />
              Onboard Channel Partner
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
