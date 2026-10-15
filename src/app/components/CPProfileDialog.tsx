import { useState } from 'react';
import { X, Phone, Mail, MapPin, Star, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore } from '../lib/dataStore';

interface CPProfileDialogProps {
  cp: any;
  onClose: () => void;
}

export function CPProfileDialog({ cp, onClose }: CPProfileDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [rating, setRating] = useState<number>(cp.rating || 0);

  const pct = (num: number, den: number) => (den > 0 ? ((num / den) * 100).toFixed(1) : '0.0');

  const handleUpdateRating = (newRating: number) => {
    setRating(newRating);
    getDataStore().updateChannelPartner(cp.id, { rating: newRating });
    toast.success(`Rating updated to ${newRating} stars`);
  };

  const handleSendMessage = () => {
    toast.success(`Message sent to ${cp.contact}`);
  };

  const recentLeads = getDataStore().getLeads()
    .filter(l => (l.source || '').includes(cp.id) || (l.source || '').includes(cp.name))
    .slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h3 className="text-gray-900">{cp.name}</h3>
            <p className="text-sm text-gray-600">{cp.id} • {cp.contact}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-yellow-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 cursor-pointer ${star <= rating ? 'fill-current' : ''}`}
                    onClick={() => handleUpdateRating(star)}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-1">{rating}</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                cp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {cp.status}
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
            {(['overview', 'performance', 'commission'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm text-gray-600 mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Mobile</div>
                        <div className="text-gray-900">{cp.mobile}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="text-gray-900">{cp.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Location</div>
                        <div className="text-gray-900">{cp.location}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm text-gray-600 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600 mb-2" />
                      <div className="text-gray-900">{cp.leadsProvided}</div>
                      <div className="text-xs text-gray-600">Total Leads</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
                      <div className="text-gray-900">{cp.visits}</div>
                      <div className="text-xs text-gray-600">Site Visits</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-purple-600 mb-2" />
                      <div className="text-gray-900">{cp.bookings}</div>
                      <div className="text-xs text-gray-600">Bookings</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <Star className="w-5 h-5 text-orange-600 mb-2" />
                      <div className="text-gray-900">{pct(cp.bookings, cp.leadsProvided)}%</div>
                      <div className="text-xs text-gray-600">Conversion</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  Send Message
                </button>
                <a href={`tel:${cp.mobile}`} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Call
                </a>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-600">Leads Provided</div>
                  <div className="text-gray-900 mt-1">{cp.leadsProvided}</div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-600">Bookings</div>
                  <div className="text-gray-900 mt-1">{cp.bookings}</div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-600">Visit Conversion</div>
                  <div className="text-gray-900 mt-1">{pct(cp.visits, cp.leadsProvided)}%</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm text-gray-600 mb-3">Recent Leads</h4>
                <div className="space-y-2">
                  {recentLeads.length === 0 && <p className="text-sm text-gray-500">No leads from this partner yet.</p>}
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-900">Lead #{lead.id} - {lead.priority}</span>
                      <span className="text-xs text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Commission Tab */}
          {activeTab === 'commission' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Earned</div>
                  <div className="text-gray-900 mt-1">₹{(cp.commission / 1000).toFixed(0)}k</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm text-gray-600">Pending Payment</div>
                  <div className="text-gray-900 mt-1">₹{(cp.commission / 1000).toFixed(0)}k</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
