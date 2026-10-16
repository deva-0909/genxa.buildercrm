import { useState } from 'react';
import { BarChart, Bar, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Users, Calendar, Building2, IndianRupee, PhoneMissed, Target, ShieldCheck, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
import { getDataStore, Approval } from '../lib/dataStore';
import { monthlySeries, sourcePerformance } from '../lib/analytics';
import { forecast, slaBreaches, liveBookings, bookingFinance } from '../lib/crm';
import { inrShort, today } from '../lib/format';
import { PageHeader, StatCard, Panel, thCls, tdCls, inputCls, Badge } from './common';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b', '#ec4899', '#84cc16'];

export function ManagementDashboard({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const store = getDataStore();
  const [project, setProject] = useState('');
  const leads = store.getLeads().filter(l => !project || l.project === project);
  const visits = store.getVisits().filter(v => !project || v.project === project);
  const bookings = liveBookings().filter(b => !project || b.project === project);
  const months = monthlySeries(6, project);
  const sources = sourcePerformance(project);
  const fc = forecast();
  const sla = slaBreaches(leads);
  const approvals = store.list<Approval>('approvals').filter(a => a.status === 'Pending');
  const fin = bookings.map(bookingFinance);
  const value = bookings.reduce((s, b) => s + b.price - b.discount, 0);
  const collected = fin.reduce((s, f) => s + f.paid, 0);
  const overdue = fin.reduce((s, f) => s + f.overdue, 0);
  const completed = visits.filter(v => v.status === 'Completed').length;
  const contacted = leads.filter(l => (l.callAttempts || 0) > 0 || l.status !== 'New').length;
  const spend = sources.reduce((s, r) => s + r.spend, 0);
  const t = today();
  const followOverdue = leads.filter(l => l.nextFollowUp && l.nextFollowUp.slice(0, 10) < t && !['Dead', 'Booked'].includes(l.status)).length;
  const cur = months[months.length - 1];
  const prev = months[months.length - 2];
  const delta = (a: number, b: number) => b ? `${a >= b ? '▲' : '▼'} ${Math.abs(Math.round((a - b) / b * 100))}% vs last month` : '';

  const funnel = [
    { stage: 'Leads', count: leads.length },
    { stage: 'Contacted', count: contacted },
    { stage: 'Qualified+', count: leads.filter(l => ['Qualified', 'Visit Scheduled', 'Booked'].includes(l.status)).length },
    { stage: 'Visit done', count: new Set(visits.filter(v => v.status === 'Completed').map(v => v.leadId)).size },
    { stage: 'Booked', count: bookings.length },
  ];
  const projects = store.getProjects().filter(p => !project || p.name === project).map(p => {
    const units = store.getUnits().filter(u => u.project === p.name);
    const pb = liveBookings().filter(b => b.project === p.name);
    return {
      project: p.name, leads: store.getLeads().filter(l => l.project === p.name).length, bookings: pb.length,
      sold: units.length ? Math.round(units.filter(u => u.status === 'Booked').length / units.length * 100) : 0,
      value: pb.reduce((s, b) => s + b.price - b.discount, 0), collected: pb.reduce((s, b) => s + bookingFinance(b).paid, 0),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Management Dashboard" subtitle="Lead → visit → booking → collection, live from the CRM."
        actions={<select className={`${inputCls} sm:max-w-[13rem]`} value={project} onChange={e => setProject(e.target.value)} aria-label="Project"><option value="">All projects</option>{store.getProjects().map(p => <option key={p.id}>{p.name}</option>)}</select>} />

      {(sla.length > 0 || approvals.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sla.length > 0 && (
            <button onClick={() => onNavigate?.('lead-pool')} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-left">
              <PhoneMissed className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-900"><b>{sla.length} new lead{sla.length > 1 ? 's' : ''}</b> not called within {store.settingNumber('lead_sla_minutes', 15)} minutes. Open Lead Pool.</span>
            </button>
          )}
          {approvals.length > 0 && (
            <button onClick={() => onNavigate?.('approvals')} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200 text-left">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-orange-900"><b>{approvals.length} approval{approvals.length > 1 ? 's' : ''}</b> waiting: {approvals.filter(a => a.type === 'Discount').length} discount, {approvals.filter(a => a.type === 'Cancellation').length} cancellation.</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Leads this month" value={cur?.leads ?? 0} icon={Users} hint={prev ? delta(cur.leads, prev.leads) : undefined} />
        <StatCard label="Visits done this month" value={cur?.visits ?? 0} icon={Calendar} tone="green" hint={prev ? delta(cur.visits, prev.visits) : undefined} />
        <StatCard label="Bookings this month" value={cur?.bookings ?? 0} icon={Building2} tone="purple" hint={`₹${cur?.bookingValueCr ?? 0} Cr · ${bookings.length} live in total`} />
        <StatCard label="Collected this month" value={`₹${((cur?.collectedL ?? 0) / 100).toFixed(2)} Cr`} icon={Wallet} tone="orange" hint={prev ? delta(cur.collectedL, prev.collectedL) : undefined} />
        <StatCard label="Booking value (live)" value={inrShort(value)} icon={IndianRupee} tone="blue" hint={`${inrShort(collected)} collected · ${inrShort(overdue)} overdue`} />
        <StatCard label="Lead → booking" value={`${leads.length ? (bookings.length / leads.length * 100).toFixed(1) : 0}%`} icon={Target} tone="purple" hint={`${completed ? (bookings.length / completed * 100).toFixed(0) : 0}% of completed visits`} />
        <StatCard label="Overdue follow-ups" value={followOverdue} icon={AlertTriangle} tone="red" hint="Promised call-backs missed" />
        <StatCard label="Cost per booking" value={bookings.length ? inrShort(spend / bookings.length) : '—'} icon={TrendingUp} hint={`${inrShort(spend)} on paid leads`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Monthly trend">
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={months}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 12 }} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                <Bar yAxisId="l" dataKey="leads" name="Leads" fill="#bfdbfe" /><Line yAxisId="r" dataKey="visits" name="Visits done" stroke="#16a34a" strokeWidth={2} />
                <Line yAxisId="r" dataKey="bookings" name="Bookings" stroke="#7c3aed" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Booked vs collected (₹ lakh)">
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months.map(m => ({ ...m, bookedL: Math.round(m.bookingValueCr * 100) }))}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                <Bar dataKey="bookedL" name="Booked" fill="#8b5cf6" /><Bar dataKey="demandedL" name="Demanded" fill="#cbd5e1" /><Bar dataKey="collectedL" name="Collected" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Funnel">
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fontSize: 12 }} /><YAxis dataKey="stage" type="category" width={90} tick={{ fontSize: 12 }} /><Tooltip />
                <Bar dataKey="count" fill="#2563eb" label={{ position: 'right', fontSize: 12 }} /></BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Leads by source">
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={sources} dataKey="leads" nameKey="source" outerRadius={90} label={(e: any) => e.source}>
                {sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Pipeline forecast" className="lg:col-span-1">
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Expected bookings from open leads</span><b>{fc.expectedBookings.toFixed(1)}</b></div>
            <div className="flex justify-between"><span className="text-gray-600">Expected booking value</span><b>{inrShort(fc.expectedRevenue)}</b></div>
            <div className="border-t border-gray-100 pt-2 text-xs text-gray-500">Collections expected</div>
            {fc.collections.map(c => <div key={c.label} className="flex justify-between"><span className="text-gray-600">{c.label}</span><span className={c.label.startsWith('Overdue') ? 'text-red-700' : ''}>{inrShort(c.amount)}</span></div>)}
            <p className="text-xs text-gray-500">Each open lead is weighted by its stage and lead score; collections come from the payment schedules.</p>
          </div>
        </Panel>
        <Panel title="Projects" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['Project', 'Leads', 'Bookings', 'Sold', 'Value', 'Collected', 'Forecast'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map(p => (
                  <tr key={p.project}>
                    <td className={tdCls}>{p.project}</td><td className={tdCls}>{p.leads}</td><td className={tdCls}>{p.bookings}</td>
                    <td className={tdCls}><Badge tone={p.sold > 50 ? 'green' : 'blue'}>{p.sold}%</Badge></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{inrShort(p.value)}</td><td className={`${tdCls} whitespace-nowrap`}>{inrShort(p.collected)}</td>
                    <td className={`${tdCls} whitespace-nowrap text-gray-600`}>{(fc.byProject.find(x => x.project === p.project)?.expectedBookings || 0).toFixed(1)} bookings</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

