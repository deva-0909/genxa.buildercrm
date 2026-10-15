import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { getDataStore } from '../lib/dataStore';
import { toast } from 'sonner';

interface ScheduleVisitDialogProps {
  leadId?: string;
  customerName?: string;
  customerMobile?: string;
  project?: string;
  telecaller?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScheduleVisitDialog({
  leadId,
  customerName,
  customerMobile,
  project,
  telecaller,
  onClose,
  onSuccess
}: ScheduleVisitDialogProps) {
  const persona = getDataStore().getPersona();
  const [formData, setFormData] = useState({
    customer: customerName || '',
    mobile: customerMobile || '',
    project: project || '',
    date: '',
    time: '',
    telecaller: telecaller || (persona.role === 'Telecaller' ? persona.name : ''),
    salesExec: '',
    notes: ''
  });

  const dataStore = getDataStore();
  const projects = dataStore.getProjects();
  const users = dataStore.getUsers();
  const salesExecs = users.filter(u => u.role === 'Sales Executive');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer || !formData.mobile || !formData.project || !formData.date || !formData.time || !formData.salesExec) {
      toast.error('Please fill all required fields');
      return;
    }

    // Create site visit
    const visit = dataStore.addVisit({
      leadId: leadId || 'NEW',
      customer: formData.customer,
      mobile: formData.mobile,
      project: formData.project,
      date: formData.date,
      time: formData.time,
      status: 'Scheduled',
      telecaller: formData.telecaller || 'N/A',
      salesExec: formData.salesExec,
      confirmationSent: false,
      notes: formData.notes
    });

    // Update lead status if leadId provided
    if (leadId) {
      dataStore.updateLead(leadId, {
        status: 'Visit Scheduled',
        nextFollowUp: `${formData.date} ${formData.time}`
      });
    }

    toast.success(`Site visit ${visit.id} scheduled successfully!`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Schedule Site Visit</h3>
            <p className="text-sm text-gray-600">Book a visit with sales executive</p>
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
              <label className="block text-sm text-gray-700 mb-2">Visit Date *</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Visit Time *</label>
              <input
                type="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Notes</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any special requirements or notes..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Schedule Visit
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
