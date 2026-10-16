import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileCheck, FolderOpen, Landmark, Wallet, Key, Headphones, ArrowRight } from 'lucide-react';
import { getDataStore, Agreement, DocumentRecord, Loan, Possession, SupportTicket } from '../lib/dataStore';
import { liveBookings, bookingFinance } from '../lib/crm';
import { inr, inrShort, fmtDate, daysBetween, today, addDays } from '../lib/format';
import { PageHeader, Panel, Badge, thCls, tdCls, btnSmall, EmptyState, ContactButtons } from './common';
import { BookingDetail, REQUIRED_KYC } from './BookingParts';
import { ticketOverdue } from './PostSalesSupport';
import { ProjectUpdatesPanel } from './Portals';

export function CRMDashboard({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const store = getDataStore();
  const persona = store.getPersona();
  const [detail, setDetail] = useState<string | null>(null);
  const mineOnly = persona.role === 'CRM Executive';
  const bookings = liveBookings().filter(b => !mineOnly || !b.crmExec || b.crmExec === persona.name);
  const ids = new Set(bookings.map(b => b.id));
  const agreements = store.list<Agreement>('agreements').filter(a => ids.has(a.bookingId) && !['Signed', 'Registered'].includes(a.status));
  const docs = store.list<DocumentRecord>('documents');
  const kycMissing = bookings.filter(b => REQUIRED_KYC.some(t => !docs.some(d => d.bookingId === b.id && d.docType === t && d.status !== 'Rejected')));
  const loans = store.list<Loan>('loans').filter(l => ids.has(l.bookingId) && ['Applied', 'Documents Submitted', 'Sanctioned', 'Partially Disbursed'].includes(l.status));
  const fins = bookings.map(b => ({ b, f: bookingFinance(b) }));
  const overdue = fins.filter(x => x.f.overdue > 0);
  const possessions = store.list<Possession>('possessions').filter(p => ids.has(p.bookingId) && p.status !== 'Handed Over');
  const tickets = store.list<SupportTicket>('supportTickets').filter(t => ['Open', 'In Progress'].includes(t.status) && (!mineOnly || !t.assignedTo || t.assignedTo === persona.name));
  const stageCounts = ['Token Paid', 'Agreement Pending', 'Agreement Done', 'Documentation', 'Fully Paid', 'Possession Done'].map(s => ({ stage: s, count: bookings.filter(b => b.stage === s).length }));
  const t = today();

  const tiles = [
    { id: 'agreements', label: 'Agreements to complete', n: agreements.length, sub: `${agreements.filter(a => { const b = bookings.find(x => x.id === a.bookingId); return b && daysBetween(b.bookingDate, t) > 30; }).length} past 30 days`, icon: FileCheck, tone: 'text-blue-600 bg-blue-50' },
    { id: 'documentation', label: 'Bookings missing KYC', n: kycMissing.length, sub: `${docs.filter(d => d.status === 'Uploaded').length} documents to verify`, icon: FolderOpen, tone: 'text-orange-600 bg-orange-50' },
    { id: 'loans', label: 'Loans in progress', n: loans.length, sub: `${inrShort(loans.reduce((s, l) => s + Math.max(0, (l.sanctionedAmount || 0) - (l.disbursedAmount || 0)), 0))} to disburse`, icon: Landmark, tone: 'text-purple-600 bg-purple-50' },
    { id: 'payments', label: 'Customers overdue', n: overdue.length, sub: inrShort(overdue.reduce((s, x) => s + x.f.overdue, 0)), icon: Wallet, tone: 'text-red-600 bg-red-50' },
    { id: 'possession', label: 'Possessions in progress', n: possessions.length, sub: `${possessions.filter(p => p.scheduledDate && p.scheduledDate <= addDays(t, 14)).length} in the next 14 days`, icon: Key, tone: 'text-green-600 bg-green-50' },
    { id: 'support', label: 'Open tickets', n: tickets.length, sub: `${tickets.filter(ticketOverdue).length} past target time`, icon: Headphones, tone: 'text-gray-700 bg-gray-100' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="CRM Dashboard" subtitle={mineOnly ? `Post-booking work for ${persona.name}` : 'Post-booking work across all customers'} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {tiles.map(x => {
          const Icon = x.icon;
          return (
            <button key={x.id} onClick={() => onNavigate?.(x.id)} className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-blue-300 group">
              <div className="flex items-start justify-between">
                <div><p className="text-xs text-gray-600">{x.label}</p><p className="text-2xl text-gray-900 mt-1">{x.n}</p><p className="text-xs text-gray-500 mt-1">{x.sub}</p></div>
                <div className={`p-2 rounded-lg ${x.tone}`}><Icon className="w-5 h-5" /></div>
              </div>
              <div className="text-xs text-blue-700 mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100">Open <ArrowRight className="w-3 h-3" /></div>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Bookings by stage">
          <div className="p-4 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={stageCounts} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} /><YAxis dataKey="stage" type="category" width={120} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#2563eb" /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Overdue customers to call" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['Customer', 'Unit', 'Overdue', 'Oldest due', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {overdue.sort((a, b) => b.f.overdue - a.f.overdue).slice(0, 8).map(({ b, f }) => {
                  const oldest = f.schedule.find(s => s.status === 'Overdue');
                  return (
                    <tr key={b.id}>
                      <td className={tdCls}><button className="hover:underline" onClick={() => setDetail(b.id)}>{b.customer}</button></td>
                      <td className={`${tdCls} whitespace-nowrap`}>{b.unit}<div className="text-xs text-gray-500">{b.project}</div></td>
                      <td className={`${tdCls} text-red-700 whitespace-nowrap`}>{inr(f.overdue)}</td>
                      <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(oldest?.dueDate)}</td>
                      <td className={tdCls}><ContactButtons compact mobile={b.mobile} name={b.customer} relatedType="booking" relatedId={b.id} template="Payment Reminder"
                        message={`Dear ${b.customer}, ${inr(f.overdue)} is overdue on unit ${b.unit}, ${b.project}. Please arrange payment quoting booking ${b.id}.`} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {overdue.length === 0 && <EmptyState>No overdue customers.</EmptyState>}
          </div>
        </Panel>
      </div>
      <Panel title="Agreements waiting" actions={<button className={btnSmall} onClick={() => onNavigate?.('agreements')}>All agreements</button>}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>{['Customer', 'Unit', 'Booked', 'Agreement', 'Days'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {agreements.slice(0, 8).map(a => {
                const b = bookings.find(x => x.id === a.bookingId)!;
                const days = daysBetween(b.bookingDate, t);
                return (
                  <tr key={a.id}>
                    <td className={tdCls}><button className="hover:underline" onClick={() => setDetail(b.id)}>{b.customer}</button></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{b.project} {b.unit}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(b.bookingDate)}</td>
                    <td className={tdCls}><Badge>{a.status}</Badge></td>
                    <td className={`${tdCls} ${days > 30 ? 'text-red-700' : ''}`}>{days}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {agreements.length === 0 && <EmptyState>All agreements signed.</EmptyState>}
        </div>
      </Panel>
      <ProjectUpdatesPanel />
      {detail && <BookingDetail bookingId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
