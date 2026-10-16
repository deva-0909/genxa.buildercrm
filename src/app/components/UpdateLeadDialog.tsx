import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { getDataStore } from '../lib/dataStore';
import { localDate } from '../lib/dataStore';
import { toast } from 'sonner';

interface UpdateLeadDialogProps {
  lead: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateLeadDialog({ lead, onClose, onSuccess }: UpdateLeadDialogProps) {
  const [formData, setFormData] = useState({
    status: lead.status || 'New',
    priority: lead.priority || 'Warm',
    budget: lead.budget || '',
    notes: lead.notes || '',
    nextFollowUp: lead.nextFollowUp || ''
  });

  const dataStore = getDataStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fu = (formData.nextFollowUp || '').slice(0, 10);
    if (fu && fu < localDate() && fu !== (lead.nextFollowUp || '').slice(0, 10)) {
      toast.error('Next follow-up cannot be in the past');
      return;
    }

    dataStore.updateLead(lead.id, {
      status: formData.status,
      priority: formData.priority,
      budget: formData.budget,
      notes: formData.notes,
      nextFollowUp: formData.nextFollowUp
    });

    toast.success(`Lead ${lead.id} updated successfully`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Update Lead</h3>
            <p className="text-sm text-gray-600">{lead.name} ({lead.id})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Status *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option>New</option>
                <option>Contacted</option>
                <option>Qualified</option>
                <option>Follow-up</option>
                <option>Visit Scheduled</option>
                <option>Dead</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Priority *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="Hot">Hot - Very Interested</option>
                <option value="Warm">Warm - Maybe</option>
                <option value="Cold">Cold - Not Interested</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Budget Range</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                placeholder="e.g., 50L - 75L"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Next Follow-up</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.nextFollowUp}
                onChange={(e) => setFormData({...formData, nextFollowUp: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Notes</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Add notes about the lead, requirements, preferences..."
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-700">Lead Information:</div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div className="text-gray-600">Mobile: {lead.mobile}</div>
              <div className="text-gray-600">Email: {lead.email}</div>
              <div className="text-gray-600">Source: {lead.source}</div>
              <div className="text-gray-600">Project: {lead.project}</div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Update Lead
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
