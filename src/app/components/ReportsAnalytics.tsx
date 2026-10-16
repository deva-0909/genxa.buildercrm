import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { getDataStore, Lead } from '../lib/dataStore';
import { monthlySeries } from '../lib/analytics';
import { leadScore, forecast, bookingFinance } from '../lib/crm';
import { inrShort, downloadCSV, today, addDays, monthKey } from '../lib/format';
import { PageHeader, Panel, thCls, tdCls, inputCls, btnSecondary, Badge, ProgressBar } from './common';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#84cc16'];

const RANGES: Record<string, { label: string; from: () => string }> = {
  month: { label: 'This month', from: () => `${today().slice(0, 7)}-01` },
  '90': { label: 'Last 90 days', from: () => addDays(today(), -90) },
  '180': { label: 'Last 6 months', from: () => addDays(today(), -180) },
  fy: { label: 'This financial year', from: () => { const t = today(); const y = Number(t.slice(0, 4)) - (Number(t.slice(5, 7)) < 4 ? 1 : 0); return `${y}-04-01`; } },
  all: { label: 'All time', from: () => '2000-01-01' },
};

const REPORTS = [
  { id: 'funnel', name: 'Sales funnel', description: 'Stage-by-stage conversion' },
  { id: 'source', name: 'Source performance', description: 'Leads, bookings and cost by source' },
  { id: 'project', name: 'Project-wise', description: 'Demand and sales by project' },
  { id: 'team', name: 'Team performance', description: 'Telecallers and sales executives' },
  { id: 'scoring', name: 'Lead scores', description: 'Where the hot leads are' },
  { id: 'trend', name: 'Monthly trend', description: '12 months of activity' },
];

export function ReportsAnalytics() {
  const store = getDataStore();
  const [report, setReport] = useState('funnel');
  const [range, setRange] = useState('180');
  const from = RANGES[range].from();
  const inRange = (d?: string) => !!d && (d.length === 10 ? d : d.slice(0, 10)) >= from;
  const leads = store.getLeads().filter(l => inRange(l.createdAt));
  const leadIds = new Set(leads.map(l => l.id));
  const visits = store.getVisits().filter(v => leadIds.has(v.leadId));
  const bookings = store.getBookings().filter(b => b.stage !== 'Cancelled' && b.leadId && leadIds.has(b.leadId));
  const proposalsSent = store.list<any>('notifications').filter(n => n.template === 'Proposal' && leadIds.has(n.relatedId)).length;

  const funnel = [
    { stage: 'Leads', count: leads.length },
    { stage: 'Contacted', count: leads.filter(l => (l.callAttempts || 0) > 0 || l.status !== 'New').length },
    { stage: 'Qualified', count: leads.filter(l => ['Qualified', 'Visit Scheduled', 'Booked'].includes(l.status)).length },
    { stage: 'Visit scheduled', count: new Set(visits.map(v => v.leadId)).size },
    { stage: 'Visit done', count: new Set(visits.filter(v => v.status === 'Completed').map(v => v.leadId)).size },
    { stage: 'Booked', count: bookings.length },
  ].map((r, i, arr) => ({ ...r, ofLeads: arr[0].count ? +(r.count / arr[0].count * 100).toFixed(1) : 0, ofPrev: i && arr[i - 1].count ? +(r.count / arr[i - 1].count * 100).toFixed(1) : 100 }));

  const cost = new Map(store.getSources().map(s => [s.name, s.costPerLead || 0]));
  const sourceRows = store.getSources().map(s => {
    const sl = leads.filter(l => l.source === s.name);
    const sb = bookings.filter(b => sl.some(l => l.id === b.leadId));
    const spend = sl.length * (cost.get(s.name) || 0);
    const value = sb.reduce((a, b) => a + b.price - b.discount, 0);
    return { source: s.name, leads: sl.length, visits: new Set(visits.filter(v => v.status === 'Completed' && sl.some(l => l.id === v.leadId)).map(v => v.leadId)).size, bookings: sb.length, spend, value, conversion: sl.length ? +(sb.length / sl.length * 100).toFixed(2) : 0, costPerBooking: sb.length ? Math.round(spend / sb.length) : 0 };
  }).filter(r => r.leads);

  const projectRows = store.getProjects().map(p => {
    const pb = bookings.filter(b => b.project === p.name);
    const units = store.getUnits().filter(u => u.project === p.name);
    return { project: p.name, leads: leads.filter(l => l.project === p.name).length, visits: visits.filter(v => v.project === p.name && v.status === 'Completed').length, bookings: pb.length, value: pb.reduce((a, b) => a + b.price - b.discount, 0), collected: pb.reduce((a, b) => a + bookingFinance(b).paid, 0), unsold: units.filter(u => u.status === 'Available').length };
  });

  const team = store.getUsers().filter(u => ['Telecaller', 'Sales Executive'].includes(u.role)).map(u => {
    const months = Math.max(1, Math.round((Date.now() - new Date(from).getTime()) / (30 * 86400000)));
    if (u.role === 'Telecaller') {
      const mine = leads.filter(l => l.assignedTo === u.name);
      const vb = visits.filter(v => v.telecaller === u.name).length;
      const calls = store.list<any>('callLogs').filter(c => c.caller === u.name && inRange(c.calledAt)).length;
      return { name: u.name, role: u.role, status: u.status, leads: mine.length, calls, visits: vb, bookings: bookings.filter(b => mine.some(l => l.id === b.leadId)).length, value: 0, target: u.target * Math.min(months, 12), achieved: vb };
    }
    const vd = visits.filter(v => v.salesExec === u.name && v.status === 'Completed').length;
    const mb = store.getBookings().filter(b => b.salesExec === u.name && b.stage !== 'Cancelled' && inRange(b.bookingDate));
    return { name: u.name, role: u.role, status: u.status, leads: 0, calls: 0, visits: vd, bookings: mb.length, value: mb.reduce((a, b) => a + b.price - b.discount, 0), target: u.target * Math.min(months, 12), achieved: mb.length };
  });

  const scored = store.getLeads().filter(l => !['Dead', 'Booked'].includes(l.status)).map(l => ({ l, s: leadScore(l) }));
  const bands = ['Hot', 'Warm', 'Cold'].map(b => ({ band: b, count: scored.filter(x => x.s.band === b).length }));
  const fc = forecast();
  const trend = monthlySeries(12);

  const exportCurrent = () => {
    const rows: Record<string, any>[] = report === 'funnel' ? funnel : report === 'source' ? sourceRows : report === 'project' ? projectRows : report === 'team' ? team
      : report === 'scoring' ? scored.sort((a, b) => b.s.score - a.s.score).map(({ l, s }) => ({ id: l.id, name: l.name, mobile: l.mobile, project: l.project, source: l.source, status: l.status, owner: l.assignedTo, score: s.score, band: s.band, reasons: s.reasons.join('; ') })) : trend;
    downloadCSV(`${report}-report-${today()}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Every report is computed from live CRM data and can be exported."
        actions={<>
          <select className={`${inputCls} sm:max-w-[12rem]`} value={range} onChange={e => setRange(e.target.value)} aria-label="Date range">{Object.entries(RANGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          <button className={btnSecondary} onClick={exportCurrent}><Download className="w-4 h-4" />Export CSV</button>
        </>} />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {REPORTS.map(r => (
          <button key={r.id} onClick={() => setReport(r.id)} className={`p-3 rounded-lg border-2 text-left ${report === r.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className="text-sm text-gray-900">{r.name}</div><div className="text-xs text-gray-500">{r.description}</div>
          </button>
        ))}
      </div>

      {report === 'funnel' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title={`Funnel · leads created ${RANGES[range].label.toLowerCase()}`}>
            <div className="p-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={funnel} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fontSize: 12 }} /><YAxis dataKey="stage" type="category" width={110} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="count" fill="#2563eb" label={{ position: 'right', fontSize: 12 }} /></BarChart></ResponsiveContainer></div>
          </Panel>
          <Panel title="Conversion">
            <table className="w-full"><thead className="bg-gray-50"><tr>{['Stage', 'Count', '% of leads', '% of previous'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">{funnel.map(f => <tr key={f.stage}><td className={tdCls}>{f.stage}</td><td className={tdCls}>{f.count}</td><td className={tdCls}>{f.ofLeads}%</td><td className={tdCls}>{f.ofPrev}%</td></tr>)}</tbody></table>
            <p className="text-xs text-gray-500 p-3">Proposals sent from the CRM in this period: {proposalsSent}.</p>
          </Panel>
        </div>
      )}

      {report === 'source' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Leads by source"><div className="p-4 h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sourceRows} dataKey="leads" nameKey="source" outerRadius={90} label={(e: any) => e.source}>{sourceRows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></Panel>
            <Panel title="Conversion by source (%)"><div className="p-4 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={sourceRows}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="source" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="conversion" fill="#16a34a" /></BarChart></ResponsiveContainer></div></Panel>
          </div>
          <Panel title="Source details">
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{['Source', 'Leads', 'Visits done', 'Bookings', 'Conversion', 'Spend', 'Cost / booking', 'Booking value'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">{sourceRows.map(r => <tr key={r.source}><td className={tdCls}>{r.source}</td><td className={tdCls}>{r.leads}</td><td className={tdCls}>{r.visits}</td><td className={tdCls}>{r.bookings}</td><td className={tdCls}>{r.conversion}%</td><td className={tdCls}>{r.spend ? inrShort(r.spend) : '—'}</td><td className={tdCls}>{r.costPerBooking ? inrShort(r.costPerBooking) : '—'}</td><td className={tdCls}>{inrShort(r.value)}</td></tr>)}</tbody></table></div>
          </Panel>
        </>
      )}

      {report === 'project' && (
        <>
          <Panel title="Projects compared"><div className="p-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={projectRows}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="project" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend /><Bar dataKey="leads" name="Leads" fill="#93c5fd" /><Bar dataKey="visits" name="Visits done" fill="#2563eb" /><Bar dataKey="bookings" name="Bookings" fill="#1e3a8a" /></BarChart></ResponsiveContainer></div></Panel>
          <Panel title="Project details"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{['Project', 'Leads', 'Visits done', 'Bookings', 'Booking value', 'Collected', 'Unsold units'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">{projectRows.map(r => <tr key={r.project}><td className={tdCls}>{r.project}</td><td className={tdCls}>{r.leads}</td><td className={tdCls}>{r.visits}</td><td className={tdCls}>{r.bookings}</td><td className={tdCls}>{inrShort(r.value)}</td><td className={tdCls}>{inrShort(r.collected)}</td><td className={tdCls}>{r.unsold}</td></tr>)}</tbody></table></div></Panel>
        </>
      )}

      {report === 'team' && (
        <Panel title={`Team · ${RANGES[range].label.toLowerCase()}`}>
          <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{['Name', 'Role', 'Leads', 'Calls', 'Visits', 'Bookings', 'Value', 'Target progress'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">{team.map(r => { const pct = r.target ? Math.round(r.achieved / r.target * 100) : 0; return (
              <tr key={r.name}><td className={tdCls}>{r.name} {r.status === 'Inactive' && <Badge tone="gray">Inactive</Badge>}</td><td className={`${tdCls} text-gray-600`}>{r.role}</td><td className={tdCls}>{r.leads || '—'}</td><td className={tdCls}>{r.calls || '—'}</td><td className={tdCls}>{r.visits}</td><td className={tdCls}>{r.bookings}</td><td className={tdCls}>{r.value ? inrShort(r.value) : '—'}</td>
                <td className={`${tdCls} min-w-[160px]`}><div className="text-xs text-gray-600 mb-1">{r.achieved} / {r.target} ({pct}%)</div><ProgressBar value={pct} tone={pct >= 100 ? 'green' : 'blue'} /></td></tr>); })}</tbody></table></div>
        </Panel>
      )}

      {report === 'scoring' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="Open leads by score">
            <div className="p-4 h-60"><ResponsiveContainer width="100%" height="100%"><BarChart data={bands}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="band" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count">{bands.map((b, i) => <Cell key={i} fill={b.band === 'Hot' ? '#ef4444' : b.band === 'Warm' ? '#f59e0b' : '#3b82f6'} />)}</Bar></BarChart></ResponsiveContainer></div>
            <div className="px-4 pb-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-600">Expected bookings</span><b>{fc.expectedBookings.toFixed(1)}</b></div>
              <div className="flex justify-between"><span className="text-gray-600">Expected value</span><b>{inrShort(fc.expectedRevenue)}</b></div>
              <p className="text-xs text-gray-500">Score = budget fit + source quality + stage + site-visit interest + recency.</p>
            </div>
          </Panel>
          <Panel title="Top 15 leads to work today" className="lg:col-span-2">
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{['Lead', 'Project', 'Status', 'Owner', 'Score', 'Why'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">{scored.sort((a, b) => b.s.score - a.s.score).slice(0, 15).map(({ l, s }: { l: Lead; s: any }) => (
                <tr key={l.id}><td className={tdCls}>{l.name}<div className="text-xs text-gray-500">{l.id} · {l.source}</div></td><td className={tdCls}>{l.project}</td><td className={tdCls}><Badge tone="blue">{l.status}</Badge></td><td className={`${tdCls} text-gray-600`}>{l.assignedTo || '—'}</td>
                  <td className={tdCls}><Badge tone={s.band === 'Hot' ? 'red' : s.band === 'Warm' ? 'orange' : 'blue'}>{s.score}</Badge></td><td className={`${tdCls} text-xs text-gray-600 max-w-[280px]`}>{s.reasons.slice(0, 3).join(' · ')}</td></tr>))}</tbody></table></div>
          </Panel>
        </div>
      )}

      {report === 'trend' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Leads, visits and bookings · 12 months"><div className="p-4 h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend /><Line dataKey="leads" name="Leads" stroke="#2563eb" strokeWidth={2} /><Line dataKey="visits" name="Visits done" stroke="#16a34a" strokeWidth={2} /><Line dataKey="bookings" name="Bookings" stroke="#7c3aed" strokeWidth={2} /></LineChart></ResponsiveContainer></div></Panel>
          <Panel title="Booking value and collections (₹ Cr)"><div className="p-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend.map(m => ({ ...m, collectedCr: +(m.collectedL / 100).toFixed(2) }))}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend /><Bar dataKey="bookingValueCr" name="Booked" fill="#8b5cf6" /><Bar dataKey="collectedCr" name="Collected" fill="#16a34a" /></BarChart></ResponsiveContainer></div></Panel>
        </div>
      )}
      <p className="text-xs text-gray-400">Data as of {today()} · {monthKey(today())}</p>
    </div>
  );
}
