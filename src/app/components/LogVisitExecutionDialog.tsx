import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore } from '../lib/dataStore';

interface LogVisitExecutionDialogProps {
  visit?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function LogVisitExecutionDialog({ visit, onClose, onSuccess }: LogVisitExecutionDialogProps) {
  const [formData, setFormData] = useState({
    unitsShown: '',
    interestLevel: 'Very Interested',
    objections: '',
    visitNotes: '',
    nextAction: '',
    sendProposal: false,
    scheduleRevisit: false,
    revisitDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.unitsShown) {
      toast.error('Please enter units shown');
      return;
    }

    const dataStore = getDataStore();

    // Convert UI interest level to data model outcome type
    let outcome: 'Very Interested' | 'Interested' | 'Not Interested' = 'Interested';
    if (formData.interestLevel === 'Very Interested') outcome = 'Very Interested';
    else if (formData.interestLevel === 'Not Interested') outcome = 'Not Interested';
    else outcome = 'Interested';

    if (visit) {
      const currentNotes = visit.notes || '';
      const executionNotes = `
        Visit Execution Log:
        Units Shown: ${formData.unitsShown}
        Interest Level: ${formData.interestLevel}
        Objections: ${formData.objections}
        Visit Notes: ${formData.visitNotes}
        Next Action: ${formData.nextAction}
        `;

      dataStore.updateVisit(visit.id, {
        status: 'Completed',
        outcome: outcome,
        unitsShown: formData.unitsShown,
        notes: currentNotes + executionNotes
      });

      if (visit.leadId && visit.leadId !== 'NEW') {
        if (formData.scheduleRevisit && formData.revisitDate) {
          dataStore.updateLead(visit.leadId, {
            status: 'Follow-up',
            nextFollowUp: formData.revisitDate
          });
        }
      }
    }

    toast.success('Visit execution logged successfully');

    if (formData.sendProposal) {
      toast.info('Proposal will be sent to customer');
    }

    if (formData.scheduleRevisit) {
      toast.info('Re-visit scheduled successfully');
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Log Site Visit Execution</h3>
            {visit && (
              <p className="text-sm text-gray-600">{visit.customer} - {visit.project}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Visit Info */}
          {visit && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Visit ID:</span>
                  <span className="text-gray-900 ml-2">{visit.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Time:</span>
                  <span className="text-gray-900 ml-2">{visit.time}</span>
                </div>
                <div>
                  <span className="text-gray-600">Mobile:</span>
                  <span className="text-gray-900 ml-2">{visit.mobile}</span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="text-gray-900 ml-2">{visit.address}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Units Shown *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.unitsShown}
                onChange={(e) => setFormData({...formData, unitsShown: e.target.value})}
                placeholder="e.g., A-201, A-305"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Interest Level *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.interestLevel}
                onChange={(e) => setFormData({...formData, interestLevel: e.target.value})}
              >
                <option>Very Interested</option>
                <option>Moderately Interested</option>
                <option>Not Interested</option>
                <option>Needs Time to Decide</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Objections / Concerns</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.objections}
                onChange={(e) => setFormData({...formData, objections: e.target.value})}
                placeholder="Price, location, amenities, etc..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Visit Notes *</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.visitNotes}
                onChange={(e) => setFormData({...formData, visitNotes: e.target.value})}
                placeholder="Key discussion points, customer reactions, special requests..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Recommended Next Action</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.nextAction}
                onChange={(e) => setFormData({...formData, nextAction: e.target.value})}
              >
                <option value="">Select action...</option>
                <option value="Send Proposal">Send Proposal</option>
                <option value="Schedule Re-visit">Schedule Re-visit</option>
                <option value="Follow-up Call">Follow-up Call</option>
                <option value="Price Negotiation">Price Negotiation</option>
                <option value="Collect EOI">Collect EOI</option>
                <option value="No Further Action">No Further Action</option>
              </select>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendProposal"
                checked={formData.sendProposal}
                onChange={(e) => setFormData({...formData, sendProposal: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="sendProposal" className="text-sm text-gray-700">
                Send proposal immediately after logging visit
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scheduleRevisit"
                checked={formData.scheduleRevisit}
                onChange={(e) => setFormData({...formData, scheduleRevisit: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="scheduleRevisit" className="text-sm text-gray-700">
                Schedule re-visit with customer
              </label>
            </div>

            {formData.scheduleRevisit && (
              <div className="ml-6">
                <label className="block text-sm text-gray-600 mb-2">Re-visit Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.revisitDate}
                  onChange={(e) => setFormData({...formData, revisitDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>

          {/* Success Info */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="text-sm text-green-900">Visit Completion</div>
                <div className="text-xs text-green-700 mt-1">
                  Logging this visit will update the lead status and trigger follow-up workflows.
                  Customer will receive a thank you SMS.
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Mark Visit Complete
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
