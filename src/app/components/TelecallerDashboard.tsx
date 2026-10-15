import { Phone, PhoneCall, Clock, CheckCircle, Calendar, TrendingUp, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { getDataStore } from '../lib/dataStore';
import { CallLogDialog } from './CallLogDialog';
import { ScheduleVisitDialog } from './ScheduleVisitDialog';
import { UpdateLeadDialog } from './UpdateLeadDialog';
import { ViewTargetsDialog } from './ViewTargetsDialog';
import { MyPerformanceDialog } from './MyPerformanceDialog';
import { toast } from 'sonner';

export function TelecallerDashboard() {
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showTargetsDialog, setShowTargetsDialog] = useState(false);
  const [showPerformanceDialog, setShowPerformanceDialog] = useState(false);
  const [, setRefreshKey] = useState(0);

  const dataStore = getDataStore();
  const myLeads: any[] = dataStore.getLeads().filter(l => l.assignedTo === 'Rajesh Kumar' || l.assignedTo === 'Sneha Reddy').slice(0, 5);

  const handleCall = (lead: any) => {
    setSelectedLead(lead);
    setShowCallDialog(true);
  };

  const handleUpdateLead = (lead: any) => {
    setSelectedLead(lead);
    setShowUpdateDialog(true);
  };

  const handleScheduleVisit = (lead?: any) => {
    if (lead) {
      setSelectedLead(lead);
    }
    setShowVisitDialog(true);
  };

  const handleViewTargets = () => {
    setShowTargetsDialog(true);
  };

  const handleViewPerformance = () => {
    setShowPerformanceDialog(true);
  };

  const handleDialogSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleStartCalling = () => {
    const newLeads = myLeads.filter(l => l.status === 'New');
    if (newLeads.length > 0) {
      handleCall(newLeads[0]);
    } else {
      toast.info('No new leads to call');
    }
  };

  const todayStats = [
    { label: 'New Leads', value: 12, target: 15, icon: Phone, color: 'blue' },
    { label: 'Calls Made', value: 45, target: 50, icon: PhoneCall, color: 'green' },
    { label: 'Connected', value: 33, target: 40, icon: CheckCircle, color: 'purple' },
    { label: 'Site Visits Fixed', value: 5, target: 8, icon: Calendar, color: 'orange' },
  ];

  const weeklyPerformance = [
    { day: 'Mon', calls: 42, connects: 31, visits: 4 },
    { day: 'Tue', calls: 48, connects: 35, visits: 6 },
    { day: 'Wed', calls: 45, connects: 33, visits: 5 },
    { day: 'Thu', calls: 38, connects: 28, visits: 3 },
    { day: 'Fri', calls: 51, connects: 38, visits: 7 },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
    };
    return colors[color];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Hot': return 'bg-red-100 text-red-700';
      case 'Warm': return 'bg-orange-100 text-orange-700';
      case 'Cold': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Contacted': return 'bg-green-100 text-green-700';
      case 'Follow-up': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-gray-900">Telecaller Dashboard</h2>
          <p className="text-gray-600">Track calls, connects, and site visit conversions</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Today's Target Progress</div>
          <div className="text-gray-900 mt-1">60% Complete</div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {todayStats.map((stat) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color);
          const progress = Math.round((stat.value / stat.target) * 100);

          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-gray-900 mt-2">{stat.value} <span className="text-sm text-gray-500">/ {stat.target}</span></p>
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${colors.bg.replace('50', '600')}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{progress}% of daily target</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleStartCalling}>
            <Phone className="w-4 h-4" />
            Start Calling
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => handleScheduleVisit()}>
            <Calendar className="w-4 h-4" />
            Schedule Visit
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={handleViewTargets}>
            <Target className="w-4 h-4" />
            View Targets
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={handleViewPerformance}>
            <TrendingUp className="w-4 h-4" />
            My Performance
          </button>
        </div>
      </div>

      {/* Weekly Performance Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">This Week's Performance</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="calls" fill="#3b82f6" name="Calls Made" />
            <Bar dataKey="connects" fill="#10b981" name="Connected" />
            <Bar dataKey="visits" fill="#f59e0b" name="Visits Fixed" />
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Contact Rate</div>
            <div className="text-gray-900 mt-1">73%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Avg Response Time</div>
            <div className="text-gray-900 mt-1">6 min</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Visit Fix Rate</div>
            <div className="text-gray-900 mt-1">24%</div>
          </div>
        </div>
      </div>

      {/* My Leads - Action Required */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">My Leads - Action Required</h3>
          <p className="text-sm text-gray-600">Leads requiring follow-up today</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Lead ID</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Mobile</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Project</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Priority</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Last Call</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Attempts</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Next Follow-up</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="text-blue-600 hover:underline cursor-pointer">{lead.id}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{lead.name}</td>
                  <td className="py-4 px-4 text-gray-600">{lead.mobile}</td>
                  <td className="py-4 px-4 text-gray-600">{lead.project}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${getPriorityColor(lead.priority)}`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleString() : '—'}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs text-gray-700">
                      {lead.callAttempts ?? 0}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-3 h-3" />
                      {lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleString() : '—'}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1" onClick={() => handleCall(lead)}>
                        <Phone className="w-3 h-3" />
                        Call
                      </button>
                      <button className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100" onClick={() => handleUpdateLead(lead)}>
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCallDialog && selectedLead && (
        <CallLogDialog
          leadId={selectedLead.id}
          customerName={selectedLead.name}
          onSuccess={handleDialogSuccess}
          onClose={() => setShowCallDialog(false)}
        />
      )}

      {showVisitDialog && (
        <ScheduleVisitDialog
          leadId={selectedLead?.id}
          customerName={selectedLead?.name}
          customerMobile={selectedLead?.mobile}
          project={selectedLead?.project}
          onSuccess={handleDialogSuccess}
          onClose={() => setShowVisitDialog(false)}
        />
      )}

      {showUpdateDialog && selectedLead && (
        <UpdateLeadDialog
          lead={selectedLead}
          onSuccess={handleDialogSuccess}
          onClose={() => setShowUpdateDialog(false)}
        />
      )}

      {showTargetsDialog && (
        <ViewTargetsDialog
          onClose={() => setShowTargetsDialog(false)}
        />
      )}

      {showPerformanceDialog && (
        <MyPerformanceDialog
          onClose={() => setShowPerformanceDialog(false)}
        />
      )}
    </div>
  );
}
