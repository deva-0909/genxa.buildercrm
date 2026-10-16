import { Phone, PhoneCall, Clock, CheckCircle, Calendar, TrendingUp, Target, AlertTriangle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { getDataStore, isManagerRole, Lead, localDate } from '../lib/dataStore';
import { CallLogDialog } from './CallLogDialog';
import { ScheduleVisitDialog } from './ScheduleVisitDialog';
import { UpdateLeadDialog } from './UpdateLeadDialog';
import { ViewTargetsDialog } from './ViewTargetsDialog';
import { MyPerformanceDialog } from './MyPerformanceDialog';
import { toast } from 'sonner';
import { leadScore, slaBreaches } from '../lib/crm';
import { Badge, ContactButtons } from './common';

const todayStr = () => localDate();
const followUpDate = (l: Lead) => (l.nextFollowUp ? l.nextFollowUp.slice(0, 10) : null);
const isOverdue = (l: Lead) => { const d = followUpDate(l); return !!d && d < todayStr() && l.status !== 'Dead'; };
const isDueToday = (l: Lead) => followUpDate(l) === todayStr() && l.status !== 'Dead';
const isUntouched = (l: Lead) => l.status === 'New' && !l.callAttempts;

export function TelecallerDashboard() {
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showTargetsDialog, setShowTargetsDialog] = useState(false);
  const [showPerformanceDialog, setShowPerformanceDialog] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all');
  const [, setRefreshKey] = useState(0);

  const dataStore = getDataStore();
  const persona = dataStore.getPersona();
  const manager = isManagerRole(persona.role);
  const telecallers = dataStore.getUsers().filter(u => u.role === 'Telecaller');
  const allLeads = dataStore.getLeads();
  const visits = dataStore.getVisits();

  // Whose leads are shown: own leads for a telecaller, chosen telecaller (or whole team) for managers
  const scopeNames = manager
    ? (teamFilter === 'all' ? telecallers.map(t => t.name) : [teamFilter])
    : [persona.name];
  const scopedLeads = allLeads.filter(l => l.assignedTo && scopeNames.includes(l.assignedTo));
  const me = telecallers.find(t => t.name === persona.name);

  // Action list: overdue first, then due today, then untouched new leads, then everything else open
  const rank = (l: Lead) => (isOverdue(l) ? 0 : isDueToday(l) ? 1 : isUntouched(l) ? 2 : 3);
  const myLeads = scopedLeads
    .filter(l => l.status !== 'Dead' && l.status !== 'Booked')
    .map(l => ({ ...l, score: leadScore(l) }))
    .sort((a, b) => rank(a) - rank(b) || b.score.score - a.score.score);
  const sla = slaBreaches(scopedLeads);
  const monthKeyNow = todayStr().slice(0, 7);
  const visitsThisMonth = visits.filter(v => scopeNames.includes(v.telecaller) && localDate(new Date(v.createdAt)).startsWith(monthKeyNow)).length;
  const callsToday = dataStore.list<any>('callLogs').filter(c => scopeNames.includes(c.caller) && localDate(new Date(c.calledAt)) === todayStr()).length;

  const visitsFixed = visits.filter(v => scopeNames.includes(v.telecaller) && ['Scheduled', 'Confirmed', 'Completed'].includes(v.status)).length;
  const contacted = scopedLeads.filter(l => (l.callAttempts || 0) > 0).length;
  const target = manager
    ? (teamFilter === 'all' ? telecallers.filter(t => t.status === 'Active').reduce((s, t) => s + t.target, 0) : telecallers.find(t => t.name === teamFilter)?.target ?? 0)
    : me?.target ?? 0;

  const handleCall = (lead: any) => { setSelectedLead(lead); setShowCallDialog(true); };
  const handleUpdateLead = (lead: any) => { setSelectedLead(lead); setShowUpdateDialog(true); };
  const handleScheduleVisit = (lead?: any) => { if (lead) setSelectedLead(lead); setShowVisitDialog(true); };
  const handleDialogSuccess = () => setRefreshKey(prev => prev + 1);

  const handleStartCalling = () => {
    const next = myLeads.find(l => rank(l) <= 2);
    if (next) handleCall(next);
    else toast.info('No overdue, due-today or new leads to call');
  };

  const todayStats = [
    { label: 'Untouched New Leads', value: scopedLeads.filter(isUntouched).length, icon: Phone, color: 'blue', hint: `${sla.length} past the ${dataStore.settingNumber('lead_sla_minutes', 15)}-minute limit` },
    { label: 'Follow-ups Due Today', value: scopedLeads.filter(isDueToday).length, icon: PhoneCall, color: 'green', hint: 'Scheduled for today' },
    { label: 'Overdue Follow-ups', value: scopedLeads.filter(isOverdue).length, icon: AlertTriangle, color: 'red', hint: 'Past the promised call-back' },
    { label: 'Site Visits Fixed', value: visitsFixed, icon: Calendar, color: 'orange', hint: `Contact rate ${scopedLeads.length ? Math.round((contacted / scopedLeads.length) * 100) : 0}%` },
  ];

  // Team leaderboard for managers
  const teamRows = telecallers.map(t => {
    const tl = allLeads.filter(l => l.assignedTo === t.name);
    const fixed = visits.filter(v => v.telecaller === t.name && ['Scheduled', 'Confirmed', 'Completed'].includes(v.status)).length;
    return {
      name: t.name,
      status: t.status,
      target: t.target,
      assigned: tl.length,
      untouched: tl.filter(isUntouched).length,
      overdue: tl.filter(isOverdue).length,
      dead: tl.filter(l => l.status === 'Dead').length,
      visits: fixed,
      contactRate: tl.length ? Math.round((tl.filter(l => (l.callAttempts || 0) > 0).length / tl.length) * 100) : 0,
    };
  });

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', icon: 'text-green-600' },
      red: { bg: 'bg-red-50', icon: 'text-red-600' },
      orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
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
      case 'Qualified': return 'bg-purple-100 text-purple-700';
      case 'Follow-up': return 'bg-yellow-100 text-yellow-700';
      case 'Visit Scheduled': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const fmt = (d?: string) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-gray-900">Telecaller Dashboard</h2>
          <p className="text-gray-600">
            {manager ? 'Team view — calls, follow-ups and site visit conversions' : `${persona.name} — your calls, follow-ups and site visits`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {manager && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All telecallers</option>
              {telecallers.map(t => (
                <option key={t.id} value={t.name}>{t.name}{t.status === 'Inactive' ? ' (inactive)' : ''}</option>
              ))}
            </select>
          )}
          <div className="text-right">
            <div className="text-sm text-gray-600">Visits booked this month</div>
            <div className="text-gray-900 mt-1">{visitsThisMonth} / {target}</div>
            <div className="text-xs text-gray-500">{callsToday} calls logged today</div>
          </div>
        </div>
      </div>

      {!manager && me?.status === 'Inactive' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          This telecaller is marked inactive. Their open leads should be reassigned from the Lead Pool.
        </div>
      )}

      {sla.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
          <b>{sla.length} new lead{sla.length > 1 ? 's' : ''}</b> waiting more than {dataStore.settingNumber('lead_sla_minutes', 15)} minutes for a first call: {sla.slice(0, 4).map(l => l.name).join(', ')}{sla.length > 4 ? '…' : ''}. They are at the top of the list below.
        </div>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {todayStats.map((stat) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color);
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-gray-900 mt-2 text-xl">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.hint}</p>
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
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
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => setShowTargetsDialog(true)}>
            <Target className="w-4 h-4" />
            View Targets
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => setShowPerformanceDialog(true)}>
            <TrendingUp className="w-4 h-4" />
            My Performance
          </button>
        </div>
      </div>

      {/* Team leaderboard (managers only) */}
      {manager && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-gray-900">Telecaller Team Performance</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={teamRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" fill="#3b82f6" name="Assigned" />
                <Bar dataKey="overdue" fill="#ef4444" name="Overdue" />
                <Bar dataKey="visits" fill="#10b981" name="Visits Fixed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50">
                  {['Telecaller', 'Status', 'Assigned', 'Untouched', 'Overdue', 'Dead', 'Visits Fixed', 'Contact Rate', 'Target'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-sm text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamRows.map(r => (
                  <tr key={r.name} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setTeamFilter(r.name)}>
                    <td className="py-3 px-4 text-gray-900">{r.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${r.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{r.assigned}</td>
                    <td className={`py-3 px-4 ${r.untouched > 0 ? 'text-orange-600' : 'text-gray-600'}`}>{r.untouched}</td>
                    <td className={`py-3 px-4 ${r.overdue > 0 ? 'text-red-600' : 'text-gray-600'}`}>{r.overdue}</td>
                    <td className="py-3 px-4 text-gray-600">{r.dead}</td>
                    <td className="py-3 px-4 text-gray-900">{r.visits}</td>
                    <td className="py-3 px-4 text-gray-900">{r.contactRate}%</td>
                    <td className="py-3 px-4 text-gray-600">{r.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leads - Action Required */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">{manager ? 'Open Leads - Action Required' : 'My Leads - Action Required'}</h3>
          <p className="text-sm text-gray-600">Sorted by urgency: overdue, due today, untouched, then the rest</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Lead ID</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                {manager && <th className="text-left py-3 px-4 text-sm text-gray-600">Telecaller</th>}
                <th className="text-left py-3 px-4 text-sm text-gray-600">Mobile</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Project</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Score</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Last Call</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Attempts</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Next Follow-up</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myLeads.length === 0 && (
                <tr><td colSpan={11} className="py-8 text-center text-gray-500">No open leads assigned.</td></tr>
              )}
              {myLeads.slice(0, 100).map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="text-blue-600">{lead.id}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{lead.name}</td>
                  {manager && <td className="py-4 px-4 text-sm text-gray-600">{lead.assignedTo}</td>}
                  <td className="py-4 px-4 text-gray-600">{lead.mobile}</td>
                  <td className="py-4 px-4 text-gray-600">{lead.project}</td>
                  <td className="py-4 px-4">
                    <span title={lead.score.reasons.join('\n')}><Badge tone={lead.score.band === 'Hot' ? 'red' : lead.score.band === 'Warm' ? 'orange' : 'blue'}>{lead.score.score}</Badge></span>
                    <span className={`ml-1 inline-flex px-1.5 py-0.5 rounded text-[10px] ${getPriorityColor(lead.priority)}`}>{lead.priority}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${getStatusColor(lead.status)}`}>{lead.status}</span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{fmt(lead.lastContactedAt)}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs text-gray-700">
                      {lead.callAttempts ?? 0}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`flex items-center gap-1 text-sm ${isOverdue(lead) ? 'text-red-600' : isDueToday(lead) ? 'text-green-700' : 'text-gray-600'}`}>
                      <Clock className="w-3 h-3" />
                      {lead.nextFollowUp ? fmt(lead.nextFollowUp) : isUntouched(lead) ? 'Call now' : '—'}
                      {isOverdue(lead) && <span className="text-xs">(overdue)</span>}
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
                      <button className="px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded hover:bg-purple-100" onClick={() => handleScheduleVisit(lead)}>
                        Visit
                      </button>
                      <ContactButtons compact mobile={lead.mobile} name={lead.name} leadId={lead.id} message={`Hello ${lead.name}, this is ${persona.name} from ${dataStore.setting('company_name', 'GENXA Developers')} regarding ${lead.project}.`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <CheckCircle className="w-3 h-3" /> Figures update live from the database.
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
          telecaller={selectedLead?.assignedTo || (manager ? undefined : persona.name)}
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

      {showTargetsDialog && <ViewTargetsDialog onClose={() => setShowTargetsDialog(false)} />}
      {showPerformanceDialog && <MyPerformanceDialog onClose={() => setShowPerformanceDialog(false)} />}
    </div>
  );
}
