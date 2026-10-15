import { useState } from 'react';
import { X, UserPlus, CheckCircle } from 'lucide-react';
import { getDataStore } from '../lib/dataStore';
import { toast } from 'sonner';

interface AssignLeadDialogProps {
  lead: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignLeadDialog({ lead, onClose, onSuccess }: AssignLeadDialogProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const dataStore = getDataStore();

  // Get telecallers for assignment
  const telecallers = dataStore.getUsers().filter(u => u.role === 'Telecaller');

  const handleAssign = () => {
    if (!selectedUser) {
      toast.error('Please select a telecaller');
      return;
    }

    const user = telecallers.find(u => u.id === selectedUser);
    if (!user) {
      toast.error('Selected user not found');
      return;
    }

    // Update lead assignment
    dataStore.updateLead(lead.id, {
      assignedTo: user.name,
      status: 'New'
    });

    toast.success(`Lead ${lead.id} assigned to ${user.name}`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Assign Lead</h3>
            <p className="text-sm text-gray-600">{lead.name} ({lead.id})</p>
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
                <span className="text-gray-600">Source:</span>
                <span className="text-gray-900 ml-2">{lead.source}</span>
              </div>
              <div>
                <span className="text-gray-600">Project:</span>
                <span className="text-gray-900 ml-2">{lead.project}</span>
              </div>
              <div>
                <span className="text-gray-600">Priority:</span>
                <span className="text-gray-900 ml-2">{lead.priority}</span>
              </div>
              <div>
                <span className="text-gray-600">Mobile:</span>
                <span className="text-gray-900 ml-2">{lead.mobile}</span>
              </div>
            </div>
          </div>

          {/* Telecaller Selection */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Select Telecaller *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">-- Choose Telecaller --</option>
              {telecallers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - Target: {user.target}/month
                </option>
              ))}
            </select>
          </div>

          {/* Telecaller Stats */}
          {selectedUser && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-900">Selected Telecaller Details</span>
              </div>
              {(() => {
                const user = telecallers.find(u => u.id === selectedUser);
                const userLeads = dataStore.getLeads().filter(l => l.assignedTo === user?.name);
                return (
                  <div className="grid grid-cols-3 gap-3 mt-2 text-sm">
                    <div>
                      <div className="text-xs text-gray-600">Current Leads</div>
                      <div className="text-gray-900">{userLeads.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Monthly Target</div>
                      <div className="text-gray-900">{user?.target || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Capacity</div>
                      <div className={`${userLeads.length < (user?.target || 0) ? 'text-green-600' : 'text-orange-600'}`}>
                        {userLeads.length < (user?.target || 0) ? 'Available' : 'Near Limit'}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> The lead will be assigned to the selected telecaller and marked as "New" status.
              The telecaller will be notified via SMS/Email.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleAssign}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Assign Lead
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
