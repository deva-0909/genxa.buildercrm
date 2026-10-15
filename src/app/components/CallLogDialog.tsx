import { useState } from 'react';
import { X, Phone } from 'lucide-react';
import { getDataStore } from '../lib/dataStore';
import { toast } from 'sonner';

interface CallLogDialogProps {
  leadId: string;
  customerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CallLogDialog({ leadId, customerName, onClose, onSuccess }: CallLogDialogProps) {
  const [formData, setFormData] = useState({
    outcome: 'Connected',
    interestLevel: 'Warm',
    nextFollowup: '',
    notes: '',
    scheduleVisit: false
  });

  const dataStore = getDataStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Update lead with call log
    const lead = dataStore.getLeads().find(l => l.id === leadId);
    if (lead) {
      const updates: any = {
        lastContactedAt: new Date().toISOString(),
        callAttempts: (lead.callAttempts || 0) + 1,
        notes: formData.notes
      };

      if (formData.outcome === 'Connected') {
        updates.status = 'Contacted';
        updates.priority = formData.interestLevel;
      }

      if (formData.nextFollowup) {
        updates.nextFollowUp = formData.nextFollowup;
      }

      dataStore.updateLead(leadId, updates);

      toast.success(`Call logged for ${customerName}`);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Log Call - {customerName}</h3>
            <p className="text-sm text-gray-600">Lead ID: {leadId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Call Outcome *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.outcome}
                onChange={(e) => setFormData({...formData, outcome: e.target.value})}
              >
                <option>Connected</option>
                <option>Not Answered</option>
                <option>Busy</option>
                <option>Switched Off</option>
                <option>Wrong Number</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Interest Level</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.interestLevel}
                onChange={(e) => setFormData({...formData, interestLevel: e.target.value})}
                disabled={formData.outcome !== 'Connected'}
              >
                <option value="Hot">Hot - Very Interested</option>
                <option value="Warm">Warm - Maybe</option>
                <option value="Cold">Cold - Not Interested</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Next Follow-up Date/Time</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.nextFollowup}
                onChange={(e) => setFormData({...formData, nextFollowup: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Call Notes</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter conversation details, requirements, objections..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.scheduleVisit}
                  onChange={(e) => setFormData({...formData, scheduleVisit: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Schedule Site Visit</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Phone className="w-4 h-4 inline mr-2" />
              Save Call Log
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
