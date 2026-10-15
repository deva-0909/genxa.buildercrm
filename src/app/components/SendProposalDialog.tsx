import { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SendProposalDialogProps {
  lead: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function SendProposalDialog({ lead, onClose, onSuccess }: SendProposalDialogProps) {
  const [formData, setFormData] = useState({
    unitNumber: '',
    tower: '',
    floorPlan: '3BHK',
    carpetArea: '',
    price: '',
    paymentPlan: 'Standard',
    specialOffer: '',
    validUntil: '',
    includeEOI: true,
    sendVia: 'both'
  });

  const handleSend = () => {
    if (!formData.unitNumber || !formData.price) {
      toast.error('Please fill in unit number and price');
      return;
    }

    toast.success(`Proposal sent to ${lead.customer} via ${formData.sendVia === 'both' ? 'Email & WhatsApp' : formData.sendVia}`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Send Project Proposal</h3>
            <p className="text-sm text-gray-600">{lead.customer} - {lead.project}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Lead Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Lead ID:</span>
                <span className="text-gray-900 ml-2">{lead.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Mobile:</span>
                <span className="text-gray-900 ml-2">{lead.mobile}</span>
              </div>
              <div>
                <span className="text-gray-600">Project:</span>
                <span className="text-gray-900 ml-2">{lead.project}</span>
              </div>
              <div>
                <span className="text-gray-600">Stage:</span>
                <span className="text-gray-900 ml-2">{lead.stage}</span>
              </div>
            </div>
          </div>

          {/* Unit Details */}
          <div>
            <h4 className="text-sm text-gray-700 mb-3">Unit Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Unit Number *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.unitNumber}
                  onChange={(e) => setFormData({...formData, unitNumber: e.target.value})}
                  placeholder="e.g., A-301"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Tower</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.tower}
                  onChange={(e) => setFormData({...formData, tower: e.target.value})}
                  placeholder="e.g., Tower A"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Floor Plan *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.floorPlan}
                  onChange={(e) => setFormData({...formData, floorPlan: e.target.value})}
                >
                  <option>1BHK</option>
                  <option>2BHK</option>
                  <option>3BHK</option>
                  <option>4BHK</option>
                  <option>Penthouse</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div>
            <h4 className="text-sm text-gray-700 mb-3">Pricing Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Carpet Area (sq.ft)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.carpetArea}
                  onChange={(e) => setFormData({...formData, carpetArea: e.target.value})}
                  placeholder="e.g., 1200"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Total Price (₹ Lakhs) *</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="e.g., 85"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Payment Plan</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.paymentPlan}
                  onChange={(e) => setFormData({...formData, paymentPlan: e.target.value})}
                >
                  <option value="Standard">Standard (20:80)</option>
                  <option value="Construction Linked">Construction Linked (30:70)</option>
                  <option value="Possession Linked">Possession Linked (40:60)</option>
                  <option value="Flexi">Flexi Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Valid Until</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Special Offer */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Special Offers / Discounts</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.specialOffer}
              onChange={(e) => setFormData({...formData, specialOffer: e.target.value})}
              placeholder="e.g., 2% discount on full payment, Free car parking..."
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.includeEOI}
                onChange={(e) => setFormData({...formData, includeEOI: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Include EOI (Expression of Interest) form</span>
            </label>
          </div>

          {/* Send Via */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Send Proposal Via</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="sendVia"
                  value="email"
                  checked={formData.sendVia === 'email'}
                  onChange={(e) => setFormData({...formData, sendVia: e.target.value})}
                />
                <span className="text-sm text-gray-700">Email Only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="sendVia"
                  value="whatsapp"
                  checked={formData.sendVia === 'whatsapp'}
                  onChange={(e) => setFormData({...formData, sendVia: e.target.value})}
                />
                <span className="text-sm text-gray-700">WhatsApp Only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="sendVia"
                  value="both"
                  checked={formData.sendVia === 'both'}
                  onChange={(e) => setFormData({...formData, sendVia: e.target.value})}
                />
                <span className="text-sm text-gray-700">Both Email & WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Success Info */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="text-sm text-green-900">Proposal will include:</div>
                <ul className="text-xs text-green-700 mt-1 list-disc list-inside space-y-1">
                  <li>Unit details and floor plan</li>
                  <li>Pricing breakdown and payment schedule</li>
                  <li>Project amenities and specifications</li>
                  <li>Location map and connectivity</li>
                  {formData.includeEOI && <li>EOI form for booking</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleSend}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Send className="w-4 h-4 inline mr-2" />
            Send Proposal
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
