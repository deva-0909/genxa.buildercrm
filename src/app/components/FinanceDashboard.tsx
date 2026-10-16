import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { IndianRupee, Wallet, AlertCircle, TrendingUp } from 'lucide-react';
import { getDataStore, CommissionPayout } from '../lib/dataStore';
import { monthlySeries, sourcePerformance } from '../lib/analytics';
import { liveBookings, bookingFinance, forecast } from '../lib/crm';
import { inr, inrShort, downloadCSV, today } from '../lib/format';
import { PageHeader, StatCard, Panel, thCls, tdCls, inputCls, Badge, btnSecondary } from './common';
import { BookingDetail } from './BookingParts';

export function FinanceDashboard() {
  const store = getDataStore();
  const [project, setProject] = useState('');
  const [detail, setDetail] = useState<string | null>(null);
  const bookings = liveBookings().filter(b => !project || b.project === project);
  const fins = bookings.map(b => ({ b, f: bookingFinance(b) }));
  const months = monthlySeries(6, project);
  const sources = sourcePerformance(project);
  const fc = forecast();
  const value = fins.reduce((s, x) => s + x.f.net, 0);
  const gst = fins.reduce((s, x) => s + x.f.gstTotal, 0);
  const paid = fins.reduce((s, x) => s + x.f.paid, 0);
  const outstanding = fins.reduce((s, x) => s + x.f.outstanding, 0);
  const overdue = fins.reduce((s, x) => s + x.f.overdue, 0);
  const interest = fins.reduce((s, x) => s + x.f.interest, 0);
  const spend = sources.reduce((s, r) => s + r.spend, 0);
  const commissionPaid = store.list<CommissionPayout>('commissionPayouts').reduce((s, p) => s + p.amount, 0);
  const cur = months[months.length - 1];
  const byProject = store.getProjects().filter(p => !project || p.name === project).map(p => {
    const list = fins.filter(x => x.b.project === p.name);
    return { project: p.name, Booked: Math.round(list.reduce((s, x) => s + x.f.net, 0) / 1e5), Collected: Math.round(list.reduce((s, x) => s + x.f.paid, 0) / 1e5), Overdue: Math.round(list.reduce((s, x) => s + x.f.overdue, 0) / 1e5) };
  });
  const ageing = [
    { bucket: '0–30 days', amount: 0 }, { bucket: '31–60 days', amount: 0 }, { bucket: '61–90 days', amount: 0 }, { bucket: '90+ days', amount: 0 },
  ];
  fins.forEach(({ f }) => f.schedule.filter(s => s.status === 'Overdue' && s.dueDate).forEach(s => {
    const d = Math.round((Date.now() - new Date(`${s.dueDate}T00:00:00`).getTime()) / 86400000);
    const i = d <= 30 ? 0 : d <= 60 ? 1 : d <= 90 ? 2 : 3;
    ageing[i].amount += s.amount + s.gst - s.paid;
  }));
  const defaulters = fins.filter(x => x.f.overdue > 0).sort((a, b) => b.f.overdue - a.f.overdue).slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader title="Finance & ROI" subtitle="Bookings, collections, receivables ageing and marketing return, from the payment ledger."
        actions={<>
          <select className={`${inputCls} sm:max-w-[13rem]`} value={project} onChange={e => setProject(e.target.value)} aria-label="Project"><option value="">All projects</option>{store.getProjects().map(p => <option key={p.id}>{p.name}</option>)}</select>
          <button className={btnSecondary} onClick={() => downloadCSV(`receivables-summary-${today()}.csv`, fins.map(({ b, f }) => ({ booking: b.id, customer: b.customer, project: b.project, unit: b.unit, agreement_value: f.net, gst: f.gstTotal, total: f.grandTotal, paid: f.paid, outstanding_demanded: f.outstanding, overdue: f.overdue, interest: f.interest, balance: f.grandTotal - f.paid })))}>Export</button>
        </>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Booking value (excl. GST)" value={inrShort(value)} icon={IndianRupee} tone="purple" hint={`GST ${inrShort(gst)} · ${bookings.length} bookings`} />
        <StatCard label="Collected to date" value={inrShort(paid)} icon={Wallet} tone="green" hint={`${value + gst ? Math.round(paid / (value + gst) * 100) : 0}% of total payable · ${inrShort((cur?.collectedL || 0) * 1e5)} this month`} />
        <StatCard label="Demanded, unpaid" value={inrShort(outstanding)} icon={AlertCircle} tone="orange" hint={`${inrShort(overdue)} overdue · interest ${inrShort(interest)}`} />
        <StatCard label="Marketing return" value={spend ? `${(value / spend).toFixed(0)}×` : '—'} icon={TrendingUp} tone="blue" hint={`${inrShort(spend)} lead spend · ${inrShort(commissionPaid)} commission paid`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Monthly booked, demanded and collected (₹ lakh)">
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={months.map(m => ({ ...m, bookedL: Math.round(m.bookingValueCr * 100) }))}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                <Bar dataKey="bookedL" name="Booked" fill="#c4b5fd" /><Bar dataKey="collectedL" name="Collected" fill="#16a34a" /><Line dataKey="demandedL" name="Demanded" stroke="#f59e0b" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="By project (₹ lakh)">
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byProject}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="project" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                <Bar dataKey="Booked" fill="#8b5cf6" /><Bar dataKey="Collected" fill="#16a34a" /><Bar dataKey="Overdue" fill="#ef4444" /></BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Overdue ageing">
          <div className="p-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageing.map(a => ({ ...a, Lakh: Math.round(a.amount / 1e5 * 10) / 10 }))}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="bucket" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v: any) => `₹${v} L`} />
                <Bar dataKey="Lakh" fill="#ef4444" /></BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Collections forecast">
          <div className="p-4 space-y-2 text-sm">
            {fc.collections.map(c => <div key={c.label} className="flex justify-between border-b border-gray-50 pb-1"><span className="text-gray-600">{c.label}</span><span className={c.label.startsWith('Overdue') ? 'text-red-700' : 'text-gray-900'}>{inr(c.amount)}</span></div>)}
            <p className="text-xs text-gray-500 pt-1">From instalments already demanded. Future milestones are demanded when a construction stage is marked complete.</p>
          </div>
        </Panel>
      </div>
      <Panel title="Marketing spend and return by source">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>{['Source', 'Leads', 'Visits', 'Bookings', 'Conversion', 'Spend', 'Cost / booking', 'Booking value', 'Return'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {sources.map(s => (
                <tr key={s.source}>
                  <td className={tdCls}>{s.source}<div className="text-xs text-gray-500">{s.type}{s.cpl ? ` · ${inr(s.cpl)}/lead` : ''}</div></td>
                  <td className={tdCls}>{s.leads}</td><td className={tdCls}>{s.visits}</td><td className={tdCls}>{s.bookings}</td>
                  <td className={tdCls}>{s.conversion.toFixed(1)}%</td><td className={`${tdCls} whitespace-nowrap`}>{s.spend ? inrShort(s.spend) : '—'}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>{s.cpb ? inrShort(s.cpb) : '—'}</td><td className={`${tdCls} whitespace-nowrap`}>{inrShort(s.value)}</td>
                  <td className={tdCls}>{s.roi ? <Badge tone={s.roi > 50 ? 'green' : 'blue'}>{s.roi.toFixed(0)}×</Badge> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Largest overdue accounts">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>{['Customer', 'Unit', 'Total payable', 'Paid', 'Overdue', 'Interest'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {defaulters.map(({ b, f }) => (
                <tr key={b.id}>
                  <td className={tdCls}><button className="hover:underline" onClick={() => setDetail(b.id)}>{b.customer}</button><div className="text-xs text-gray-500">{b.id}</div></td>
                  <td className={`${tdCls} whitespace-nowrap`}>{b.unit}<div className="text-xs text-gray-500">{b.project}</div></td>
                  <td className={`${tdCls} whitespace-nowrap`}>{inr(f.grandTotal)}</td><td className={`${tdCls} whitespace-nowrap`}>{inr(f.paid)}</td>
                  <td className={`${tdCls} whitespace-nowrap text-red-700`}>{inr(f.overdue)}</td><td className={`${tdCls} whitespace-nowrap`}>{inr(f.interest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {defaulters.length === 0 && <p className="text-sm text-gray-500 p-6 text-center">No overdue accounts.</p>}
        </div>
      </Panel>
      {detail && <BookingDetail bookingId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

