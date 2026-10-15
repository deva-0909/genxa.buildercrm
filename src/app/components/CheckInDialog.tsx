import { useState } from 'react';
import { X, MapPin, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface CheckInDialogProps {
  visit?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckInDialog({ visit, onClose, onSuccess }: CheckInDialogProps) {
  const [formData, setFormData] = useState({
    location: '',
    notes: '',
    customerPresent: true,
    checkInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  });

  const handleCheckIn = () => {
    // Simulate geolocation check
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          toast.success(`Checked in successfully at ${visit?.project || 'site'}`);
          onSuccess();
          onClose();
        },
        () => {
          toast.success(`Checked in at ${visit?.project || 'site'} (Manual location)`);
          onSuccess();
          onClose();
        }
      );
    } else {
      toast.success(`Checked in at ${visit?.project || 'site'}`);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Check-In at Site</h3>
            {visit && (
              <p className="text-sm text-gray-600">{visit.customer} - {visit.project}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Visit Details */}
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
                  <span className="text-gray-600">Location:</span>
                  <span className="text-gray-900 ml-2">{visit.address}</span>
                </div>
                <div>
                  <span className="text-gray-600">Mobile:</span>
                  <span className="text-gray-900 ml-2">{visit.mobile}</span>
                </div>
              </div>
            </div>
          )}

          {/* Location Info */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="text-sm text-green-900">Location will be captured automatically</div>
                <div className="text-xs text-green-700 mt-1">
                  Ensure you are at the site location before checking in
                </div>
              </div>
            </div>
          </div>

          {/* Check-in Time */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-600" />
            <div>
              <div className="text-sm text-gray-600">Check-in Time</div>
              <div className="text-gray-900">{formData.checkInTime}</div>
            </div>
          </div>

          {/* Customer Present */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.customerPresent}
                onChange={(e) => setFormData({...formData, customerPresent: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Customer is present at the site</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Check-in Notes (Optional)</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any special notes about arrival, customer mood, etc..."
            />
          </div>

          {/* Info */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> After check-in, you can log visit execution details including
              units shown, customer interest level, and objections.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleCheckIn}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Check-In Now
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
