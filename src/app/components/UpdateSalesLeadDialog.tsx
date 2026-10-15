import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface UpdateSalesLeadDialogProps {
  lead: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateSalesLeadDialog({ lead, onClose, onSuccess }: UpdateSalesLeadDialogProps) {
  const [formData, setFormData] = useState({
    stage: lead.stage || 'Site Visit Done',
    priority: lead.priority || 'Warm',
    nextAction: lead.nextAction || '',
    nextActionDate: '',
    notes: '',
    budget: '',
    preferredUnits: '',
    objections: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    toast.success(`Lead ${lead.id} updated successfully`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Update Sales Lead</h3>
            <p className="text-sm text-gray-600">{lead.customer} ({lead.id})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Lead Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Project:</span>
                <span className="text-gray-900 ml-2">{lead.project}</span>
              </div>
              <div>
                <span className="text-gray-600">Mobile:</span>
                <span className="text-gray-900 ml-2">{lead.mobile}</span>
              </div>
              <div>
                <span className="text-gray-600">Last Visit:</span>
                <span className="text-gray-900 ml-2">{lead.lastVisit}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Stage:</span>
                <span className="text-gray-900 ml-2">{lead.stage}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Sales Stage *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.stage}
                onChange={(e) => setFormData({...formData, stage: e.target.value})}
              >
                <option>Site Visit Done</option>
                <option>Proposal Sent</option>
                <option>Negotiation</option>
                <option>EOI Signed</option>
                <option>Booking in Progress</option>
                <option>Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Priority *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="Hot">Hot - Ready to Book</option>
                <option value="Warm">Warm - Considering</option>
                <option value="Cold">Cold - Long Term</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Next Action</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.nextAction}
                onChange={(e) => setFormData({...formData, nextAction: e.target.value})}
              >
                <option value="">Select action...</option>
                <option value="Follow-up call">Follow-up call</option>
                <option value="Send revised proposal">Send revised proposal</option>
                <option value="Schedule re-visit">Schedule re-visit</option>
                <option value="Price discussion">Price discussion</option>
                <option value="Close deal">Close deal</option>
                <option value="EOI collection">EOI collection</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Next Action Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.nextActionDate}
                onChange={(e) => setFormData({...formData, nextActionDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Budget Range (₹ Lakhs)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                placeholder="e.g., 80-100"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Preferred Units</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.preferredUnits}
                onChange={(e) => setFormData({...formData, preferredUnits: e.target.value})}
                placeholder="e.g., A-301, B-205"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Objections / Concerns</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.objections}
                onChange={(e) => setFormData({...formData, objections: e.target.value})}
                placeholder="Price too high, location concern, amenities..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Update Notes</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Add notes about recent interactions, customer feedback, next steps..."
              />
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
