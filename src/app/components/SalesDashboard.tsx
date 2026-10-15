import { Calendar, CheckCircle, FileText, DollarSign, MapPin } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useState } from 'react';
import { CreateBookingDialog } from './CreateBookingDialog';
import { CheckInDialog } from './CheckInDialog';
import { RescheduleVisitDialog } from './RescheduleVisitDialog';
import { SendProposalDialog } from './SendProposalDialog';
import { UpdateSalesLeadDialog } from './UpdateSalesLeadDialog';
import { LogVisitExecutionDialog } from './LogVisitExecutionDialog';

export function SalesDashboard() {
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showVisitExecutionDialog, setShowVisitExecutionDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [, setRefreshKey] = useState(0);

  const handleCheckIn = (visit?: any) => {
    if (visit) {
      setSelectedVisit(visit);
    }
    setShowCheckInDialog(true);
  };

  const handleReschedule = (visit: any) => {
    setSelectedVisit(visit);
    setShowRescheduleDialog(true);
  };

  const handleSendProposal = (lead: any) => {
    setSelectedLead(lead);
    setShowProposalDialog(true);
  };

  const handleUpdateLead = (lead: any) => {
    setSelectedLead(lead);
    setShowUpdateDialog(true);
  };

  const handleLogVisitExecution = () => {
    setShowVisitExecutionDialog(true);
  };

  const handleDialogSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const stats = [
    { label: 'Site Visits Today', value: 3, target: 4, icon: Calendar, color: 'blue' },
    { label: 'Proposals Sent', value: 8, target: 10, icon: FileText, color: 'purple' },
    { label: 'Bookings MTD', value: 5, target: 8, icon: CheckCircle, color: 'green' },
    { label: 'Revenue (₹L)', value: 185, target: 250, icon: DollarSign, color: 'orange' },
  ];

  const upcomingVisits = [
    { id: 'SV124', customer: 'Ramesh Kumar', mobile: '9876543210', project: 'Skyline Heights', time: '11:00 AM', status: 'Confirmed', address: 'Andheri West', priority: 'Hot' },
    { id: 'SV125', customer: 'Sneha Patel', mobile: '9876543213', project: 'Green Valley', time: '2:30 PM', status: 'Confirmed', address: 'Thane', priority: 'Hot' },
    { id: 'SV126', customer: 'Vikram Singh', mobile: '9876543214', project: 'Ocean View', time: '4:00 PM', status: 'Tentative', address: 'Navi Mumbai', priority: 'Warm' },
  ];

  const followupLeads = [
    { id: 'LD2843', customer: 'Vikram Singh', mobile: '9876543214', project: 'Metro Plaza', stage: 'Proposal Sent', lastVisit: '2 days ago', nextAction: 'Follow-up call', priority: 'Hot' },
    { id: 'LD2838', customer: 'Meera Iyer', mobile: '9876543217', project: 'Skyline Heights', stage: 'Negotiation', lastVisit: '3 days ago', nextAction: 'Price discussion', priority: 'Hot' },
    { id: 'LD2835', customer: 'Rahul Sharma', mobile: '9876543218', project: 'Green Valley', stage: 'Site Visit Done', lastVisit: '1 week ago', nextAction: 'Re-visit needed', priority: 'Warm' },
  ];

  const funnelData = [
    { stage: 'Site Visits', count: 42, color: '#3b82f6' },
    { stage: 'Proposals', count: 28, color: '#8b5cf6' },
    { stage: 'Negotiations', count: 15, color: '#f59e0b' },
    { stage: 'Bookings', count: 8, color: '#10b981' },
  ];

  const weeklyBookings = [
    { week: 'Week 1', visits: 12, bookings: 2 },
    { week: 'Week 2', visits: 14, bookings: 3 },
    { week: 'Week 3', visits: 10, bookings: 1 },
    { week: 'Week 4', visits: 16, bookings: 4 },
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-gray-900">Sales Executive Dashboard</h2>
          <p className="text-gray-600">Manage site visits, follow-ups, and bookings</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Monthly Target</div>
          <div className="text-gray-900 mt-1">5 / 8 Bookings</div>
          <div className="text-sm text-green-600">62.5% Complete</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
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
              <p className="text-xs text-gray-500 mt-2">{progress}% achieved</p>
            </div>
          );
        })}
      </div>

      {/* Today's Site Visits */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Today's Site Visits</h3>
            <p className="text-sm text-gray-600">Scheduled visits for today</p>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            onClick={() => handleCheckIn()}
          >
            Check-In at Site
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Visit ID</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Mobile</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Project</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Time</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Location</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Priority</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcomingVisits.map((visit) => (
                <tr key={visit.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="text-blue-600 hover:underline cursor-pointer">{visit.id}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{visit.customer}</td>
                  <td className="py-4 px-4 text-gray-600">{visit.mobile}</td>
                  <td className="py-4 px-4 text-gray-600">{visit.project}</td>
                  <td className="py-4 px-4 text-gray-900">{visit.time}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {visit.address}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${
                      visit.priority === 'Hot' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {visit.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${
                      visit.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {visit.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => handleCheckIn(visit)}>
                        Check-In
                      </button>
                      <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200" onClick={() => handleReschedule(visit)}>
                        Reschedule
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up Pipeline */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Post-Visit Follow-up Pipeline</h3>
          <p className="text-sm text-gray-600">Leads requiring action after site visit</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Lead ID</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Project</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Current Stage</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Last Visit</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Next Action</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Priority</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {followupLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="text-blue-600 hover:underline cursor-pointer">{lead.id}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{lead.customer}</td>
                  <td className="py-4 px-4 text-gray-600">{lead.project}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex px-2 py-1 rounded text-xs bg-purple-100 text-purple-700">
                      {lead.stage}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{lead.lastVisit}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">{lead.nextAction}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${
                      lead.priority === 'Hot' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700" onClick={() => handleSendProposal(lead)}>
                        Send Proposal
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

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Sales Funnel - This Month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={funnelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ stage, count }: any) => `${stage}: ${count}`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="count"
              >
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">Visit to Booking Conversion</div>
            <div className="text-gray-900 mt-1">19% (Target: 20%)</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Weekly Visits vs Bookings</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyBookings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="visits" fill="#3b82f6" name="Visits" />
              <Bar dataKey="bookings" fill="#10b981" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Visit Execution Form */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Log Site Visit Execution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Units Shown</label>
            <input
              type="text"
              placeholder="e.g., A-201, A-305"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Interest Level</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option>Very Interested</option>
              <option>Moderately Interested</option>
              <option>Not Interested</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-2">Objections / Concerns</label>
            <textarea
              rows={2}
              placeholder="Price, location, amenities, etc..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-2">Visit Notes</label>
            <textarea
              rows={2}
              placeholder="Key discussion points..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              onClick={handleLogVisitExecution}
            >
              Mark Visit Complete
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              onClick={() => {
                setSelectedLead(followupLeads[0]);
                handleSendProposal(followupLeads[0]);
              }}
            >
              Send Proposal
            </button>
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              onClick={() => {
                setSelectedVisit(upcomingVisits[0]);
                handleReschedule(upcomingVisits[0]);
              }}
            >
              Schedule Re-visit
            </button>
          </div>
        </div>
      </div>

      {showBookingDialog && (
        <CreateBookingDialog
          leadId={selectedLead?.id}
          customerName={selectedLead?.customer}
          customerMobile={selectedLead?.mobile}
          onSuccess={handleDialogSuccess}
          onClose={() => setShowBookingDialog(false)}
        />
      )}

      {showCheckInDialog && (
        <CheckInDialog
          visit={selectedVisit}
          onSuccess={handleDialogSuccess}
          onClose={() => setShowCheckInDialog(false)}
        />
      )}

      {showRescheduleDialog && selectedVisit && (
        <RescheduleVisitDialog
          visit={selectedVisit}
          onSuccess={handleDialogSuccess}
          onClose={() => setShowRescheduleDialog(false)}
        />
      )}

      {showProposalDialog && selectedLead && (
        <SendProposalDialog
          lead={selectedLead}
          onSuccess={handleDialogSuccess}
          onClose={() => setShowProposalDialog(false)}
        />
      )}

      {showUpdateDialog && selectedLead && (
        <UpdateSalesLeadDialog
          lead={selectedLead}
          onSuccess={handleDialogSuccess}
          onClose={() => setShowUpdateDialog(false)}
        />
      )}

      {showVisitExecutionDialog && (
        <LogVisitExecutionDialog
          onSuccess={handleDialogSuccess}
          onClose={() => setShowVisitExecutionDialog(false)}
        />
      )}
    </div>
  );
}
