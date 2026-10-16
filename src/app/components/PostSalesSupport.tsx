import { useState } from 'react';
import { Headphones, AlertTriangle, CheckCircle, Clock, Plus, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, SupportTicket, Booking, toastError } from '../lib/dataStore';
import { liveBookings } from '../lib/crm';
import { fmtDateTime } from '../lib/format';
import { PageHeader, StatCard, Panel, Tabs, Badge, thCls, tdCls, btnPrimary, btnSecondary, btnSmall, inputCls, EmptyState, Modal, Field, Spinner, ContactButtons } from './common';

export const TICKET_CATEGORIES = ['Payment', 'Documentation', 'Loan', 'Construction', 'Possession', 'Snag', 'Other'];
const SLA_HOURS: Record<string, number> = { Critical: 4, High: 24, Medium: 72, Low: 168 };

export function ticketOverdue(t: SupportTicket): boolean {
  if (['Resolved', 'Closed'].includes(t.status)) return false;
  return Date.now() - new Date(t.createdAt).getTime() > (SLA_HOURS[t.priority] || 72) * 3600000;
}

export function PostSalesSupport() {
  const store = getDataStore();
  const persona = store.getPersona();
  const [tab, setTab] = useState('open');
  const [create, setCreate] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState({ category: '', priority: '', q: '' });
  const all = store.list<SupportTicket>('supportTickets');
  const mine = persona.role === 'CRM Executive' ? all.filter(t => !t.assignedTo || t.assignedTo === persona.name) : all;
  const openList = mine.filter(t => ['Open', 'In Progress'].includes(t.status));
  const rows = (tab === 'open' ? openList : mine.filter(t => ['Resolved', 'Closed'].includes(t.status)))
    .filter(t => (!filter.category || t.category === filter.category) && (!filter.priority || t.priority === filter.priority)
      && (!filter.q || `${t.id} ${t.customer} ${t.issue} ${t.unit}`.toLowerCase().includes(filter.q.toLowerCase())));
  const resolved = all.filter(t => t.resolvedAt);
  const avgHrs = resolved.length ? resolved.reduce((s, t) => s + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / 3600000, 0) / resolved.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Post-Sales Support" subtitle="Customer complaints and requests with response targets: Critical 4h, High 24h, Medium 3 days, Low 7 days."
        actions={<button className={btnPrimary} onClick={() => setCreate(true)}><Plus className="w-4 h-4" />New ticket</button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open tickets" value={openList.length} icon={Headphones} tone="orange" />
        <StatCard label="Past target time" value={openList.filter(ticketOverdue).length} icon={AlertTriangle} tone="red" />
        <StatCard label="Resolved" value={resolved.length} icon={CheckCircle} tone="green" />
        <StatCard label="Average resolution" value={avgHrs ? (avgHrs < 48 ? `${avgHrs.toFixed(1)} h` : `${(avgHrs / 24).toFixed(1)} days`) : '—'} icon={Clock} />
      </div>
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'open', label: 'Open', count: openList.length }, { id: 'closed', label: 'Resolved / closed', count: mine.length - openList.length }]} />
        <div className="flex flex-wrap gap-2 p-3">
          <input className={`${inputCls} max-w-xs`} placeholder="Search tickets" value={filter.q} onChange={e => setFilter({ ...filter, q: e.target.value })} aria-label="Search tickets" />
          <select className={`${inputCls} max-w-[170px]`} value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })} aria-label="Category"><option value="">All categories</option>{TICKET_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
          <select className={`${inputCls} max-w-[150px]`} value={filter.priority} onChange={e => setFilter({ ...filter, priority: e.target.value })} aria-label="Priority"><option value="">All priorities</option>{Object.keys(SLA_HOURS).map(c => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>{['Ticket', 'Customer', 'Issue', 'Category', 'Priority', 'Owner', 'Status', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className={tdCls}>{t.id}<div className="text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(t.createdAt)}</div></td>
                  <td className={tdCls}>{t.customer}<div className="text-xs text-gray-500 whitespace-nowrap">{t.project} {t.unit}</div></td>
                  <td className={`${tdCls} max-w-[280px]`}><button className="text-left hover:underline" onClick={() => setOpen(t.id)}>{t.issue}</button></td>
                  <td className={tdCls}>{t.category}</td>
                  <td className={tdCls}><Badge>{t.priority}</Badge>{ticketOverdue(t) && <div className="text-xs text-red-700">past target</div>}</td>
                  <td className={`${tdCls} text-gray-600`}>{t.assignedTo || '—'}</td>
                  <td className={tdCls}><Badge>{t.status}</Badge></td>
                  <td className={`${tdCls} whitespace-nowrap`}>
                    <span className="inline-flex gap-1">
                      <button className={btnSmall} onClick={() => setOpen(t.id)}><MessageSquare className="w-3.5 h-3.5" />Open</button>
                      <ContactButtons compact mobile={t.mobile} name={t.customer} relatedType="ticket" relatedId={t.id} message={`Dear ${t.customer}, regarding your request ${t.id} (${t.issue}): `} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState>No tickets here.</EmptyState>}
        </div>
      </Panel>
      {create && <NewTicketDialog onClose={() => setCreate(false)} />}
      {open && <TicketDialog id={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

export function NewTicketDialog({ onClose, booking, raisedBy = 'Phone' }: { onClose: () => void; booking?: Booking; raisedBy?: string }) {
  const store = getDataStore();
  const crm = store.getUsers().filter(u => u.role === 'CRM Executive' && u.status === 'Active');
  const [bookingId, setBookingId] = useState(booking?.id || '');
  const [f, setF] = useState({ category: 'Payment', issue: '', description: '', priority: 'Medium', assignedTo: crm[0]?.name || '' });
  const [busy, setBusy] = useState(false);
  const isBuyer = store.getPersona().role === 'Buyer';
  const save = async () => {
    const b = booking || liveBookings().find(x => x.id === bookingId);
    if (!b) { toast.error('Choose the booking'); return; }
    if (f.issue.trim().length < 5) { toast.error('Describe the issue in a few words'); return; }
    setBusy(true);
    try {
      const t = await store.insert<SupportTicket>('supportTickets', {
        bookingId: b.id, customer: b.customer, mobile: b.mobile, project: b.project, unit: b.unit, category: f.category, issue: f.issue.trim(),
        description: f.description.trim() || undefined, priority: f.priority, status: 'Open', assignedTo: f.assignedTo || undefined, raisedBy, notes: [],
      });
      toast.success(`Ticket ${t.id} created${t.assignedTo ? ` and assigned to ${t.assignedTo}` : ''}`);
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={isBuyer ? 'Raise a request' : 'New support ticket'}
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy && <Spinner />}Create</button></>}>
      <div className="space-y-4">
        {!booking && (
          <Field label="Booking" required>
            <select className={inputCls} value={bookingId} onChange={e => setBookingId(e.target.value)}>
              <option value="">Select booking</option>
              {liveBookings().map(b => <option key={b.id} value={b.id}>{b.customer} · {b.project} {b.unit}</option>)}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Category"><select className={inputCls} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{TICKET_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Priority"><select className={inputCls} value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}>{Object.keys(SLA_HOURS).map(c => <option key={c}>{c}</option>)}</select></Field>
        </div>
        <Field label="Issue" required><input className={inputCls} value={f.issue} onChange={e => setF({ ...f, issue: e.target.value })} /></Field>
        <Field label="Details"><textarea rows={3} className={inputCls} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
        {!isBuyer && <Field label="Assign to"><select className={inputCls} value={f.assignedTo} onChange={e => setF({ ...f, assignedTo: e.target.value })}><option value="">Unassigned</option>{crm.map(u => <option key={u.id}>{u.name}</option>)}</select></Field>}
      </div>
    </Modal>
  );
}

export function TicketDialog({ id, onClose, readOnly }: { id: string; onClose: () => void; readOnly?: boolean }) {
  const store = getDataStore();
  const persona = store.getPersona();
  const t = store.list<SupportTicket>('supportTickets').find(x => x.id === id);
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState(false);
  if (!t) return null;
  const notes = Array.isArray(t.notes) ? t.notes : [];
  const crm = store.getUsers().filter(u => u.role === 'CRM Executive');
  const update = async (updates: Partial<SupportTicket>, msg: string) => {
    setBusy(true);
    try { await store.patch('supportTickets', t.id, updates); toast.success(msg); } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  const addNote = () => {
    if (!note.trim()) return;
    update({ notes: [...notes, { at: new Date().toISOString(), by: persona.name, text: note.trim() }], status: t.status === 'Open' && persona.role !== 'Buyer' ? 'In Progress' : t.status }, 'Note added');
    setNote('');
  };
  const resolve = () => {
    if (!resolution.trim()) { toast.error('Describe how it was resolved'); return; }
    update({ status: 'Resolved', resolution: resolution.trim(), resolvedAt: new Date().toISOString(), notes: [...notes, { at: new Date().toISOString(), by: persona.name, text: `Resolved: ${resolution.trim()}` }] }, 'Ticket resolved');
  };
  return (
    <Modal open onClose={onClose} title={`${t.id} · ${t.issue}`} subtitle={`${t.customer} · ${t.project} ${t.unit} · ${t.category} · raised via ${t.raisedBy || '—'}`} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{t.status}</Badge><Badge>{t.priority}</Badge>{ticketOverdue(t) && <Badge tone="red">Past target time</Badge>}
          <span className="flex-1" />
          {!readOnly && (
            <select className={`${inputCls} max-w-[200px]`} value={t.assignedTo || ''} onChange={e => update({ assignedTo: e.target.value || undefined }, 'Reassigned')} aria-label="Assigned to">
              <option value="">Unassigned</option>{crm.map(u => <option key={u.id}>{u.name}</option>)}
            </select>
          )}
        </div>
        {t.description && <p className="text-sm text-gray-700 whitespace-pre-line">{t.description}</p>}
        <div className="space-y-2">
          {notes.length === 0 && <p className="text-sm text-gray-500">No updates yet.</p>}
          {notes.map((n, i) => (
            <div key={i} className={`p-2.5 rounded-lg text-sm ${n.by === t.customer ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <div className="text-xs text-gray-500">{n.by} · {fmtDateTime(n.at)}</div>
              <div className="text-gray-900 whitespace-pre-line">{n.text}</div>
            </div>
          ))}
        </div>
        {!['Closed'].includes(t.status) && (
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Add an update" value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addNote(); }} aria-label="Add update" />
            <button className={btnSecondary} onClick={addNote} disabled={busy || !note.trim()}><Send className="w-4 h-4" />Add</button>
          </div>
        )}
        {!readOnly && ['Open', 'In Progress'].includes(t.status) && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <input className={inputCls} placeholder="Resolution" value={resolution} onChange={e => setResolution(e.target.value)} aria-label="Resolution" />
            <button className={btnPrimary} onClick={resolve} disabled={busy}><CheckCircle className="w-4 h-4" />Resolve</button>
          </div>
        )}
        {!readOnly && t.status === 'Resolved' && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button className={btnSecondary} onClick={() => update({ status: 'Closed' }, 'Ticket closed')}>Close ticket</button>
            <button className={btnSecondary} onClick={() => update({ status: 'In Progress', resolvedAt: null as any }, 'Ticket reopened')}>Reopen</button>
          </div>
        )}
        {t.resolution && <p className="text-sm text-green-800 bg-green-50 rounded p-2">Resolution: {t.resolution}</p>}
      </div>
    </Modal>
  );
}
