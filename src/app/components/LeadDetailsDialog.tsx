import { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Tag, FileText, Clock, TrendingUp } from 'lucide-react';

interface LeadDetailsDialogProps {
  lead: any;
  onClose: () => void;
}

export function LeadDetailsDialog({ lead, onClose }: LeadDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('details');

  const callHistory = [
    { date: '2026-01-04 14:30', outcome: 'Connected', duration: '5:30', notes: 'Very interested in 3BHK units' },
    { date: '2026-01-03 11:15', outcome: 'Not Answered', duration: '0:00', notes: 'Tried calling, no response' },
    { date: '2026-01-02 16:45', outcome: 'Connected', duration: '3:15', notes: 'Requested site visit details' }
  ];

  const activities = [
    { type: 'call', date: '2026-01-04 14:30', description: 'Call logged - Connected', user: 'Rajesh Kumar' },
    { type: 'status', date: '2026-01-04 14:32', description: 'Status changed to Follow-up', user: 'Rajesh Kumar' },
    { type: 'note', date: '2026-01-03 11:20', description: 'Added note: Customer prefers weekend visit', user: 'Rajesh Kumar' },
    { type: 'assignment', date: '2026-01-02 09:15', description: 'Lead assigned to Rajesh Kumar', user: 'System' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h3 className="text-gray-900">{lead.name}</h3>
            <p className="text-sm text-gray-600">{lead.id}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded text-xs ${
                lead.priority === 'Hot' ? 'bg-red-100 text-red-700' :
                lead.priority === 'Warm' ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {lead.priority}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                lead.status === 'New' ? 'bg-blue-100 text-blue-700' :
                lead.status === 'Contacted' ? 'bg-green-100 text-green-700' :
                lead.status === 'Qualified' ? 'bg-purple-100 text-purple-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {lead.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Call History
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Activity Log
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm text-gray-600 mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Mobile</div>
                        <div className="text-gray-900">{lead.mobile}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="text-gray-900">{lead.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Project Interest</div>
                        <div className="text-gray-900">{lead.project}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm text-gray-600 mb-3">Lead Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Source</div>
                        <div className="text-gray-900">{lead.source}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Assigned To</div>
                        <div className="text-gray-900">{lead.assignedTo || 'Not Assigned'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Created Date</div>
                        <div className="text-gray-900">{new Date(lead.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {lead.budget && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Budget Range</div>
                  <div className="text-gray-900 mt-1">{lead.budget}</div>
                </div>
              )}

              {lead.notes && (
                <div>
                  <h4 className="text-sm text-gray-600 mb-2">Notes</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 text-sm">{lead.notes}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600 mb-2" />
                  <div className="text-xs text-gray-600">Call Attempts</div>
                  <div className="text-gray-900 mt-1">{lead.callAttempts || 0}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-600 mb-2" />
                  <div className="text-xs text-gray-600">Last Contacted</div>
                  <div className="text-gray-900 mt-1">{lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleString() : 'Never'}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 mb-2" />
                  <div className="text-xs text-gray-600">Next Follow-up</div>
                  <div className="text-gray-900 mt-1">{lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleString() : 'Not Set'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Call History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">{callHistory.length} calls made</div>
              {callHistory.map((call, i) => (
                <div key={i} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{call.date}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      call.outcome === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {call.outcome}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Duration: {call.duration}</div>
                  <div className="text-sm text-gray-900">{call.notes}</div>
                </div>
              ))}
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activities.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'call' ? 'bg-green-100' :
                    activity.type === 'status' ? 'bg-blue-100' :
                    activity.type === 'note' ? 'bg-purple-100' :
                    'bg-gray-100'
                  }`}>
                    {activity.type === 'call' && <Phone className="w-4 h-4 text-green-600" />}
                    {activity.type === 'status' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'note' && <FileText className="w-4 h-4 text-purple-600" />}
                    {activity.type === 'assignment' && <User className="w-4 h-4 text-gray-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 text-sm">{activity.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {activity.date} • {activity.user}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
