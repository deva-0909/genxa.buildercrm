import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Landmark, Plus, CheckCircle, Clock, IndianRupee, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Loan, Booking, localDate, toastError } from '../lib/dataStore';
import { liveBookings, bookingFinance } from '../lib/crm';
import { inr, inrShort, fmtDate } from '../lib/format';
import { PageHeader, StatCard, Panel, Tabs, Badge, thCls, tdCls, btnPrimary, btnSecondary, btnSmall, btnSmallPrimary, inputCls, EmptyState, Modal, Field, Spinner, ContactButtons } from './common';
import { BookingDetail } from './BookingParts';

export const BANKS = ['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'LIC Housing Finance', 'Bank of Baroda', 'PNB Housing'];
const OPEN = ['Applied', 'Documents Submitted', 'Sanctioned', 'Partially Disbursed'];

export function LoanProcessing() {
  const store = getDataStore();
  const [tab, setTab] = useState('open');
  const [create, setCreate] = useState(false);
  const [action, setAction] = useState<{ loan: Loan; kind: 'advance' | 'sanction' | 'disburse' | 'reject' } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const bookings = new Map(store.getBookings().map(b => [b.id, b]));
  const loans = store.list<Loan>('loans').filter(l => bookings.get(l.bookingId)?.stage !== 'Cancelled');
  const list = tab === 'open' ? loans.filter(l => OPEN.includes(l.status)) : tab === 'done' ? loans.filter(l => l.status === 'Disbursed') : loans.filter(l => l.status === 'Rejected');
  const byBank = BANKS.map(bank => ({ bank: bank.replace(' Bank', ''), Sanctioned: Math.round(loans.filter(l => l.bank === bank).reduce((s, l) => s + (l.sanctionedAmount || 0), 0) / 1e5), Disbursed: Math.round(loans.filter(l => l.bank === bank).reduce((s, l) => s + (l.disbursedAmount || 0), 0) / 1e5) })).filter(x => x.Sanctioned || x.Disbursed);

  return (
    <div className="space-y-6">
      <PageHeader title="Loan Processing" subtitle="Track home loans from application to disbursement. Each disbursement is posted to the booking as a receipt."
        actions={<button className={btnPrimary} onClick={() => setCreate(true)}><Plus className="w-4 h-4" />New loan file</button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open loan files" value={loans.filter(l => OPEN.includes(l.status)).length} icon={Clock} tone="orange" />
        <StatCard label="Sanctioned" value={inrShort(loans.reduce((s, l) => s + (l.sanctionedAmount || 0), 0))} icon={CheckCircle} tone="blue" />
        <StatCard label="Disbursed" value={inrShort(loans.reduce((s, l) => s + (l.disbursedAmount || 0), 0))} icon={IndianRupee} tone="green" />
        <StatCard label="Pending disbursement" value={inrShort(loans.filter(l => l.status !== 'Rejected').reduce((s, l) => s + Math.max(0, (l.sanctionedAmount || 0) - (l.disbursedAmount || 0)), 0))} icon={Landmark} tone="purple" />
      </div>
      {byBank.length > 0 && (
        <Panel title="By bank (₹ lakh)">
          <div className="p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBank}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="bank" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip />
                <Bar dataKey="Sanctioned" fill="#93c5fd" /><Bar dataKey="Disbursed" fill="#16a34a" /></BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'open', label: 'In progress', count: loans.filter(l => OPEN.includes(l.status)).length }, { id: 'done', label: 'Fully disbursed', count: loans.filter(l => l.status === 'Disbursed').length }, { id: 'rejected', label: 'Rejected', count: loans.filter(l => l.status === 'Rejected').length }]} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>{['Loan', 'Customer', 'Bank', 'Applied for', 'Sanctioned', 'Disbursed', 'Status', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {list.map(l => {
                const b = bookings.get(l.bookingId);
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className={tdCls}>{l.id}<div className="text-xs text-gray-500">{fmtDate(l.applicationDate)}</div></td>
                    <td className={tdCls}><button className="hover:underline text-left" onClick={() => b && setDetail(b.id)}>{b?.customer}</button><div className="text-xs text-gray-500 whitespace-nowrap">{b?.project} {b?.unit}</div></td>
                    <td className={tdCls}>{l.bank}<div className="text-xs text-gray-500">{l.loanOfficer || ''}</div></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{inr(l.loanAmount)}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{l.sanctionedAmount ? inr(l.sanctionedAmount) : '—'}<div className="text-xs text-gray-500">{fmtDate(l.sanctionDate)}</div></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{l.disbursedAmount ? inr(l.disbursedAmount) : '—'}<div className="text-xs text-gray-500">{l.disbursementDate ? fmtDate(l.disbursementDate) : ''}</div></td>
                    <td className={tdCls}><Badge>{l.status}</Badge>{l.notes && <div className="text-xs text-gray-500 max-w-[180px] truncate" title={l.notes}>{l.notes}</div>}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      <span className="inline-flex gap-1">
                        {l.status === 'Applied' && <button className={btnSmallPrimary} onClick={() => setAction({ loan: l, kind: 'advance' })}><ArrowRight className="w-3.5 h-3.5" />Docs submitted</button>}
                        {['Applied', 'Documents Submitted'].includes(l.status) && <button className={btnSmallPrimary} onClick={() => setAction({ loan: l, kind: 'sanction' })}><CheckCircle className="w-3.5 h-3.5" />Sanction</button>}
                        {['Sanctioned', 'Partially Disbursed'].includes(l.status) && <button className={btnSmallPrimary} onClick={() => setAction({ loan: l, kind: 'disburse' })}><IndianRupee className="w-3.5 h-3.5" />Disburse</button>}
                        {OPEN.includes(l.status) && <button className={btnSmall} onClick={() => setAction({ loan: l, kind: 'reject' })}><XCircle className="w-3.5 h-3.5" />Reject</button>}
                        {b && <ContactButtons compact mobile={b.mobile} name={b.customer} relatedType="booking" relatedId={b.id} />}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <EmptyState>No loan files here.</EmptyState>}
        </div>
      </Panel>
      {create && <NewLoanDialog onClose={() => setCreate(false)} />}
      {action && <LoanActionDialog {...action} onClose={() => setAction(null)} />}
      {detail && <BookingDetail bookingId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function NewLoanDialog({ onClose }: { onClose: () => void }) {
  const store = getDataStore();
  const existing = new Set(store.list<Loan>('loans').filter(l => l.status !== 'Rejected').map(l => l.bookingId));
  const options = liveBookings().filter(b => !existing.has(b.id) && !['Fully Paid', 'Possession Done', 'Completed'].includes(b.stage));
  const [bookingId, setBookingId] = useState(options[0]?.id || '');
  const b = options.find(x => x.id === bookingId);
  const fin = b ? bookingFinance(b) : null;
  const max = fin ? Math.round(fin.net * 0.8) : 0;
  const [f, setF] = useState({ bank: BANKS[0], loanAmount: 0, loanOfficer: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!b) { toast.error('Choose a booking'); return; }
    if (!(f.loanAmount > 0) || f.loanAmount > max) { toast.error(`Loan amount should be up to 80% of the agreement value (${inr(max)})`); return; }
    setBusy(true);
    try {
      await store.insert('loans', { bookingId: b.id, bank: f.bank, loanAmount: f.loanAmount, status: 'Applied', applicationDate: localDate(), loanOfficer: f.loanOfficer || undefined, notes: f.notes || undefined, disbursedAmount: 0 });
      toast.success(`Loan file opened with ${f.bank} for ${b.customer}`);
      onClose();
    } catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="New loan file" footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy && <Spinner />}Save</button></>}>
      <div className="space-y-4">
        <Field label="Booking" required>
          <select className={inputCls} value={bookingId} onChange={e => setBookingId(e.target.value)}>
            {options.map(o => <option key={o.id} value={o.id}>{o.customer} · {o.project} {o.unit} · {o.id}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Bank" required><select className={inputCls} value={f.bank} onChange={e => setF({ ...f, bank: e.target.value })}>{BANKS.map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Loan amount (₹)" required hint={fin ? `Max 80% of ${inr(fin.net)} = ${inr(max)}` : undefined}><input type="number" className={inputCls} value={f.loanAmount || ''} onChange={e => setF({ ...f, loanAmount: Number(e.target.value) })} /></Field>
          <Field label="Bank loan officer"><input className={inputCls} value={f.loanOfficer} onChange={e => setF({ ...f, loanOfficer: e.target.value })} /></Field>
          <Field label="Notes"><input className={inputCls} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  );
}

function LoanActionDialog({ loan, kind, onClose }: { loan: Loan; kind: 'advance' | 'sanction' | 'disburse' | 'reject'; onClose: () => void }) {
  const store = getDataStore();
  const b = store.getBookings().find(x => x.id === loan.bookingId) as Booking;
  const remaining = Math.max(0, (loan.sanctionedAmount || 0) - (loan.disbursedAmount || 0));
  const [amount, setAmount] = useState(kind === 'sanction' ? loan.loanAmount : kind === 'disburse' ? remaining : 0);
  const [date, setDate] = useState(localDate());
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const title = { advance: 'Documents submitted to bank', sanction: 'Record sanction', disburse: 'Record disbursement', reject: 'Reject loan' }[kind];
  const save = async () => {
    if (date > localDate()) { toast.error('Date cannot be in the future'); return; }
    const appendNote = notes ? `${loan.notes ? loan.notes + ' | ' : ''}${notes}` : loan.notes;
    let updates: Partial<Loan> = {};
    if (kind === 'advance') updates = { status: 'Documents Submitted', notes: appendNote };
    if (kind === 'sanction') {
      if (!(amount > 0)) { toast.error('Enter the sanctioned amount'); return; }
      updates = { status: 'Sanctioned', sanctionedAmount: amount, sanctionDate: date, notes: appendNote };
    }
    if (kind === 'disburse') {
      if (!(amount > 0) || amount > remaining) { toast.error(`Disbursement must be between 1 and ${inr(remaining)}`); return; }
      const total = (loan.disbursedAmount || 0) + amount;
      updates = { status: total >= (loan.sanctionedAmount || 0) ? 'Disbursed' : 'Partially Disbursed', disbursedAmount: total, disbursementDate: date, notes: appendNote };
    }
    if (kind === 'reject') {
      if (!notes.trim()) { toast.error('Enter the reason'); return; }
      updates = { status: 'Rejected', notes: `${loan.notes ? loan.notes + ' | ' : ''}Rejected: ${notes}` };
    }
    setBusy(true);
    try {
      await store.patch('loans', loan.id, updates);
      toast.success(kind === 'disburse' ? `${inr(amount)} disbursed and posted as a receipt on ${b.id}` : `${title}: saved`);
      onClose();
    } catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={title} subtitle={`${loan.id} · ${loan.bank} · ${b?.customer}`} size="sm"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy && <Spinner />}Save</button></>}>
      <div className="space-y-4">
        {(kind === 'sanction' || kind === 'disburse') && (
          <Field label={kind === 'sanction' ? 'Sanctioned amount (₹)' : 'Amount disbursed now (₹)'} required hint={kind === 'disburse' ? `Remaining to disburse ${inr(remaining)}` : `Applied for ${inr(loan.loanAmount)}`}>
            <input type="number" className={inputCls} value={amount || ''} onChange={e => setAmount(Number(e.target.value))} />
          </Field>
        )}
        {(kind === 'sanction' || kind === 'disburse') && <Field label="Date" required><input type="date" max={localDate()} className={inputCls} value={date} onChange={e => setDate(e.target.value)} /></Field>}
        <Field label={kind === 'reject' ? 'Reason' : 'Notes'} required={kind === 'reject'}><textarea rows={2} className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
