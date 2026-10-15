import { Calendar, CheckCircle, FileText, DollarSign, MapPin, Users, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useState } from 'react';
import { getDataStore, isManagerRole, SiteVisit, localDate } from '../lib/dataStore';
import { CreateBookingDialog } from './CreateBookingDialog';
import { CheckInDialog } from './CheckInDialog';
import { RescheduleVisitDialog } from './RescheduleVisitDialog';
import { SendProposalDialog } from './SendProposalDialog';
import { UpdateSalesLeadDialog } from './UpdateSalesLeadDialog';
import { LogVisitExecutionDialog } from './LogVisitExecutionDialog';

const todayStr = () => localDate();
const daysAgo = (d: string) => Math.round((Date.now() - new Date(d).getTime()) / 86400000);

export function SalesDashboard() {
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showVisitExecutionDialog, setShowVisitExecutionDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [teamFilter, setTeamFilter] = useState('all');
  const [, setRefreshKey] = useState(0);

  const dataStore = getDataStore();
  const persona = dataStore.getPersona();
  const manager = isManagerRole(persona.role);
  const salesExecs = dataStore.getUsers().filter(u => u.role === 'Sales Executive');
  const scopeNames = manager
    ? (teamFilter === 'all' ? salesExecs.map(s => s.name) : [teamFilter])
    : [persona.name];

  const allVisits = dataStore.getVisits();
  const allBookings = dataStore.getBookings();
  const leads = dataStore.getLeads();
  const projects = dataStore.getProjects();
  const visits = allVisits.filter(v => scopeNames.includes(v.salesExec));
  const bookings = allBookings.filter(b => scopeNames.includes(b.salesExec));
  const bookedLeadIds = new Set(allBookings.map(b => b.leadId));

  const today = todayStr();
  const monthStart = today.slice(0, 7);
  const upcomingVisits = visits
    .filter(v => v.date >= today && ['Scheduled', 'Confirmed', 'Tentative'].includes(v.status))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const todaysVisits = upcomingVisits.filter(v => v.date === today);
  const missedVisits = visits.filter(v => v.date < today && ['Scheduled', 'Confirmed'].includes(v.status));

  // Post-visit pipeline: completed / no-show visits whose lead has not booked yet
  const followupLeads = visits
    .filter(v => ['Completed', 'No Show'].includes(v.status) && !bookedLeadIds.has(v.leadId))
    .map(v => {
      const lead = leads.find(l => l.id === v.leadId);
      return {
        id: v.leadId,
        visitId: v.id,
        customer: v.customer,
        mobile: v.mobile,
        project: v.project,
        salesExec: v.salesExec,
        stage: v.status === 'No Show' ? 'No Show' : v.outcome === 'Not Interested' ? 'Not Interested' : 'Site Visit Done',
        lastVisit: `${daysAgo(v.date)} day(s) ago`,
        nextAction: v.status === 'No Show' ? 'Reschedule visit' : v.outcome === 'Very Interested' ? 'Send proposal / close' : v.outcome === 'Interested' ? 'Follow-up call' : 'Nurture / mark lost',
        priority: lead?.priority ?? (v.outcome === 'Very Interested' ? 'Hot' : 'Warm'),
      };
    });

  const bookingsMTD = bookings.filter(b => (b.bookingDate || '').startsWith(monthStart));
  const revenueMTD = bookingsMTD.reduce((s, b) => s + (b.price - b.discount), 0);
  const target = manager
    ? (teamFilter === 'all' ? salesExecs.reduce((s, x) => s + x.target, 0) : salesExecs.find(s => s.name === teamFilter)?.target ?? 0)
    : salesExecs.find(s => s.name === persona.name)?.target ?? 0;

  const stats = [
    { label: 'Site Visits Today', value: todaysVisits.length, sub: `${upcomingVisits.length} upcoming`, icon: Calendar, color: 'blue' },
    { label: 'Post-Visit Follow-ups', value: followupLeads.length, sub: 'Visited, not booked', icon: FileText, color: 'purple' },
    { label: 'Bookings MTD', value: bookingsMTD.length, sub: `Target ${target}`, icon: CheckCircle, color: 'green' },
    { label: 'Revenue MTD (₹L)', value: (revenueMTD / 100000).toFixed(1), sub: `${bookings.length} bookings all-time`, icon: DollarSign, color: 'orange' },
  ];

  const completed = visits.filter(v => v.status === 'Completed').length;
  const funnelData = [
    { stage: 'Visits Planned', count: visits.length, color: '#3b82f6' },
    { stage: 'Visits Done', count: completed, color: '#8b5cf6' },
    { stage: 'No Show / Cancelled', count: visits.filter(v => ['No Show', 'Cancelled'].includes(v.status)).length, color: '#f59e0b' },
    { stage: 'Bookings', count: bookings.length, color: '#10b981' },
  ].filter(d => d.count > 0);

  const teamRows = salesExecs.map(s => {
    const sv = allVisits.filter(v => v.salesExec === s.name);
    const sb = allBookings.filter(b => b.salesExec === s.name);
    const done = sv.filter(v => v.status === 'Completed').length;
    return {
      name: s.name,
      visits: sv.length,
      done,
      noShow: sv.filter(v => v.status === 'No Show').length,
      cancelled: sv.filter(v => v.status === 'Cancelled').length,
      bookings: sb.length,
      revenue: +(sb.reduce((x, b) => x + (b.price - b.discount), 0) / 100000).toFixed(1),
      conversion: done ? Math.round((sb.length / done) * 100) : 0,
      target: s.target,
    };
  });

  const locationOf = (projectName: string) => projects.find(p => p.name === projectName)?.location ?? '';

  const handleCheckIn = (visit?: any) => { if (visit) setSelectedVisit(visit); setShowCheckInDialog(true); };
  const handleReschedule = (visit: any) => { setSelectedVisit(visit); setShowRescheduleDialog(true); };
  const handleSendProposal = (lead: any) => { setSelectedLead(lead); setShowProposalDialog(true); };
  const handleUpdateLead = (lead: any) => { setSelectedLead(lead); setShowUpdateDialog(true); };
  const handleBook = (lead: any) => { setSelectedLead(lead); setShowBookingDialog(true); };
  const handleLogVisit = (visit: SiteVisit) => { setSelectedVisit(visit); setShowVisitExecutionDialog(true); };
  const handleDialogSuccess = () => setRefreshKey(prev => prev + 1);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
    };
    return colors[color];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-gray-900">Sales Executive Dashboard</h2>
          <p className="text-gray-600">
            {manager ? 'Team view — site visits, follow-ups and bookings' : `${persona.name} — your site visits, follow-ups and bookings`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {manager && (
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="all">All sales executives</option>
              {salesExecs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          )}
          <div className="text-right">
            <div className="text-sm text-gray-600">Monthly Target</div>
            <div className="text-gray-900 mt-1">{bookingsMTD.length} / {target} Bookings</div>
            <div className={`text-sm ${target && bookingsMTD.length >= target ? 'text-green-600' : 'text-orange-600'}`}>
              {target ? Math.round((bookingsMTD.length / target) * 100) : 0}% Complete
            </div>
          </div>
        </div>
      </div>

      {missedVisits.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {missedVisits.length} past visit(s) were never marked completed or no-show. Log the outcome to keep the funnel accurate.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color);
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-gray-900 mt-2 text-xl">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Site Visits */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Upcoming Site Visits</h3>
            <p className="text-sm text-gray-600">Today first, then the coming days</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm" onClick={() => handleCheckIn(todaysVisits[0])}>
            Check-In at Site
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Visit ID', 'Customer', 'Mobile', 'Project', 'Date / Time', 'Location', ...(manager ? ['Sales Exec'] : []), 'Status'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-sm text-gray-600">{h}</th>
                ))}
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcomingVisits.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-gray-500">No upcoming site visits.</td></tr>
              )}
              {upcomingVisits.map((visit) => (
                <tr key={visit.id} className={`border-b border-gray-100 hover:bg-gray-50 ${visit.date === today ? 'bg-blue-50/40' : ''}`}>
                  <td className="py-4 px-4 text-blue-600">{visit.id}</td>
                  <td className="py-4 px-4 text-gray-900">{visit.customer}</td>
                  <td className="py-4 px-4 text-gray-600">{visit.mobile}</td>
                  <td className="py-4 px-4 text-gray-600">{visit.project}</td>
                  <td className="py-4 px-4 text-gray-900">{visit.date === today ? 'Today' : visit.date} · {visit.time}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {locationOf(visit.project)}
                    </div>
                  </td>
                  {manager && <td className="py-4 px-4 text-sm text-gray-600">{visit.salesExec}</td>}
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${visit.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {visit.status}{!visit.confirmationSent && ' · unconfirmed'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => handleCheckIn(visit)}>Check-In</button>
                      <button className="px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded hover:bg-purple-100" onClick={() => handleLogVisit(visit)}>Log Outcome</button>
                      <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200" onClick={() => handleReschedule(visit)}>Reschedule</button>
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
          <p className="text-sm text-gray-600">Customers who visited (or missed a visit) and have not booked yet</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Lead ID', 'Customer', 'Project', ...(manager ? ['Sales Exec'] : []), 'Current Stage', 'Last Visit', 'Next Action', 'Priority'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-sm text-gray-600">{h}</th>
                ))}
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {followupLeads.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-gray-500">No pending post-visit follow-ups.</td></tr>
              )}
              {followupLeads.map((lead) => (
                <tr key={lead.visitId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 text-blue-600">{lead.id}</td>
                  <td className="py-4 px-4 text-gray-900">{lead.customer}</td>
                  <td className="py-4 px-4 text-gray-600">{lead.project}</td>
                  {manager && <td className="py-4 px-4 text-sm text-gray-600">{lead.salesExec}</td>}
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${lead.stage === 'No Show' ? 'bg-red-100 text-red-700' : lead.stage === 'Not Interested' ? 'bg-gray-100 text-gray-700' : 'bg-purple-100 text-purple-700'}`}>
                      {lead.stage}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{lead.lastVisit}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">{lead.nextAction}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${lead.priority === 'Hot' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{lead.priority}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700" onClick={() => handleBook(lead)}>Book</button>
                      <button className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100" onClick={() => handleSendProposal(lead)}>Send Proposal</button>
                      <button className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100" onClick={() => handleUpdateLead(lead)}>Update</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Visit Funnel</h3>
          {funnelData.length === 0 ? (
            <p className="text-sm text-gray-500 py-16 text-center">No visits yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={funnelData} cx="50%" cy="50%" labelLine={false} label={({ stage, count }: any) => `${stage}: ${count}`} outerRadius={90} dataKey="count">
                  {funnelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">Visit to Booking Conversion</div>
            <div className="text-gray-900 mt-1">{completed ? Math.round((bookings.length / completed) * 100) : 0}% (Target: 20%)</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Sales Team Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={teamRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="visits" fill="#3b82f6" name="Visits" />
              <Bar dataKey="bookings" fill="#10b981" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {manager && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-gray-900">Sales Executive Leaderboard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Sales Exec', 'Visits', 'Completed', 'No Show', 'Cancelled', 'Bookings', 'Revenue (₹L)', 'Visit→Booking', 'Target'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-sm text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...teamRows].sort((a, b) => b.revenue - a.revenue).map(r => (
                  <tr key={r.name} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setTeamFilter(r.name)}>
                    <td className="py-3 px-4 text-gray-900">{r.name}</td>
                    <td className="py-3 px-4 text-gray-900">{r.visits}</td>
                    <td className="py-3 px-4 text-gray-600">{r.done}</td>
                    <td className={`py-3 px-4 ${r.noShow ? 'text-red-600' : 'text-gray-600'}`}>{r.noShow}</td>
                    <td className={`py-3 px-4 ${r.cancelled ? 'text-orange-600' : 'text-gray-600'}`}>{r.cancelled}</td>
                    <td className="py-3 px-4 text-gray-900">{r.bookings}</td>
                    <td className="py-3 px-4 text-gray-900">{r.revenue}</td>
                    <td className="py-3 px-4 text-gray-900">{r.conversion}%</td>
                    <td className="py-3 px-4 text-gray-600">{r.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
        <CheckInDialog visit={selectedVisit} onSuccess={handleDialogSuccess} onClose={() => setShowCheckInDialog(false)} />
      )}
      {showRescheduleDialog && selectedVisit && (
        <RescheduleVisitDialog visit={selectedVisit} onSuccess={handleDialogSuccess} onClose={() => setShowRescheduleDialog(false)} />
      )}
      {showProposalDialog && selectedLead && (
        <SendProposalDialog lead={selectedLead} onSuccess={handleDialogSuccess} onClose={() => setShowProposalDialog(false)} />
      )}
      {showUpdateDialog && selectedLead && (
        <UpdateSalesLeadDialog lead={selectedLead} onSuccess={handleDialogSuccess} onClose={() => setShowUpdateDialog(false)} />
      )}
      {showVisitExecutionDialog && (
        <LogVisitExecutionDialog visit={selectedVisit} onSuccess={handleDialogSuccess} onClose={() => setShowVisitExecutionDialog(false)} />
      )}
    </div>
  );
}
