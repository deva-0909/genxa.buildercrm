import { useState } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, localDate } from '../lib/dataStore';

interface RescheduleVisitDialogProps {
  visit: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function RescheduleVisitDialog({ visit, onClose, onSuccess }: RescheduleVisitDialogProps) {
  const [formData, setFormData] = useState({
    newDate: '',
    newTime: '',
    reason: '',
    notifyCustomer: true
  });

  const handleReschedule = () => {
    if (!formData.newDate || !formData.newTime) {
      toast.error('Please select new date and time');
      return;
    }

    const dataStore = getDataStore();
    const updates: any = {
      date: formData.newDate,
      time: formData.newTime,
      status: 'Scheduled',
    };

    // Append reason to notes
    if (formData.reason) {
      const currentNotes = visit.notes || '';
      const newNote = `Rescheduled to ${formData.newDate} ${formData.newTime}. Reason: ${formData.reason}`;
      updates.notes = currentNotes ? `${currentNotes}\n${newNote}` : newNote;
    }

    dataStore.updateVisit(visit.id, updates);

    toast.success(`Visit ${visit.id} rescheduled to ${formData.newDate} at ${formData.newTime}`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Reschedule Site Visit</h3>
            <p className="text-sm text-gray-600">{visit.customer} - {visit.project}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Current Visit Details */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Current Schedule</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Visit ID:</span>
                <span className="text-gray-900 ml-2">{visit.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Scheduled Time:</span>
                <span className="text-gray-900 ml-2">{visit.time}</span>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="text-gray-900 ml-2">{visit.address}</span>
              </div>
              <div>
                <span className="text-gray-600">Mobile:</span>
                <span className="text-gray-900 ml-2">{visit.mobile}</span>
              </div>
            </div>
          </div>

          {/* New Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">New Date *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.newDate}
                  onChange={(e) => setFormData({...formData, newDate: e.target.value})}
                  min={localDate()}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">New Time *</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="time"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                  value={formData.newTime}
                  onChange={(e) => setFormData({...formData, newTime: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Reason for Rescheduling *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            >
              <option value="">Select reason...</option>
              <option value="Customer Request">Customer Request</option>
              <option value="Sales Executive Unavailable">Sales Executive Unavailable</option>
              <option value="Site Not Ready">Site Not Ready</option>
              <option value="Weather Conditions">Weather Conditions</option>
              <option value="Emergency">Emergency</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Notification */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.notifyCustomer}
                onChange={(e) => setFormData({...formData, notifyCustomer: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Send SMS/Email notification to customer</span>
            </label>
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="text-sm text-yellow-900">Important</div>
                <div className="text-xs text-yellow-700 mt-1">
                  Make sure to inform the customer about the rescheduling.
                  Frequent rescheduling may affect customer experience.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleReschedule}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Confirm Reschedule
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
