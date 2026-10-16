import { useState } from 'react';
import { XCircle, Clock, CheckCircle, IndianRupee, Plus, Printer, ThumbsUp, ThumbsDown, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Cancellation, Approval, localDate, toastError } from '../lib/dataStore';
import { liveBookings, bookingFinance, canApprove } from '../lib/crm';
import { inr, inrShort, fmtDate, daysBetween } from '../lib/format';
import { printCancellationLetter } from '../lib/documents';
import { PageHeader, StatCard, Panel, Tabs, Badge, thCls, tdCls, btnPrimary, btnSecondary, btnSmall, btnSmallPrimary, inputCls, EmptyState, Modal, Field, Spinner } from './common';
import { BookingDetail } from './BookingParts';
import { DecideDialog } from './Approvals';

export function CancellationRefunds() {
  const store = getDataStore();
  const persona = store.getPersona();
  const [tab, setTab] = useState('open');
  const [create, setCreate] = useState(false);
  const [refund, setRefund] = useState<Cancellation | null>(null);
  const [decide, setDecide] = useState<{ a: Approval; approve: boolean } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const list = store.list<Cancellation>('cancellations');
  const approvals = store.list<Approval>('approvals').filter(a => a.type === 'Cancellation');
  const bookings = new Map(store.getBookings().map(b => [b.id, b]));
  const open = list.filter(c => ['Requested', 'Approved'].includes(c.status));
  const closed = list.filter(c => ['Refunded', 'Rejected'].includes(c.status));
  const rows = tab === 'open' ? open : closed;
  const canRefund = ['Admin', 'Finance'].includes(persona.role);

  return (
    <div className="space-y-6">
      <PageHeader title="Cancellations & Refunds" subtitle="Deductions follow the policy automatically. Every cancellation needs approval; the refund is posted to the ledger and the unit goes back on sale."
        actions={<button className={btnPrimary} onClick={() => setCreate(true)}><Plus className="w-4 h-4" />Request cancellation</button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Awaiting approval" value={list.filter(c => c.status === 'Requested').length} icon={Clock} tone="orange" />
        <StatCard label="Approved, refund due" value={list.filter(c => c.status === 'Approved').length} icon={IndianRupee} tone="blue" hint={inrShort(list.filter(c => c.status === 'Approved').reduce((s, c) => s + c.refundAmount, 0))} />
        <StatCard label="Refunded" value={inrShort(list.filter(c => c.status === 'Refunded').reduce((s, c) => s + c.refundAmount, 0))} icon={CheckCircle} tone="green" />
        <StatCard label="Deductions retained" value={inrShort(list.filter(c => ['Approved', 'Refunded'].includes(c.status)).reduce((s, c) => s + c.deductionAmount, 0))} icon={XCircle} tone="red" />
      </div>
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
        Policy: 10% of the amount paid is deducted if cancelled within 30 days of booking, 20% within 90 days, 25% after that. GST paid is refunded separately by credit note.
      </div>
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'open', label: 'Open', count: open.length }, { id: 'closed', label: 'Closed', count: closed.length }]} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>{['Request', 'Customer', 'Unit', 'Reason', 'Paid', 'Deduction', 'Refund', 'Status', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(c => {
                const b = bookings.get(c.bookingId);
                const ap = approvals.find(a => a.refId === c.id && a.status === 'Pending');
                return (
                  <tr key={c.id}>
                    <td className={tdCls}>{c.id}<div className="text-xs text-gray-500 whitespace-nowrap">{fmtDate(c.requestDate)} · {c.requestedBy}</div></td>
                    <td className={tdCls}><button className="hover:underline text-left" onClick={() => b && setDetail(b.id)}>{b?.customer}</button><div className="text-xs text-gray-500">{c.bookingId}</div></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{b?.unit}<div className="text-xs text-gray-500">{b?.project}</div></td>
                    <td className={`${tdCls} max-w-[220px]`}><span className="line-clamp-2" title={c.reason}>{c.reason}</span></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{inr(c.paidAmount)}</td>
                    <td className={`${tdCls} whitespace-nowrap text-red-700`}>{inr(c.deductionAmount)}<div className="text-xs">{c.deductionPct}%</div></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{inr(c.refundAmount)}</td>
                    <td className={tdCls}><Badge>{c.status}</Badge>{c.approvedBy && <div className="text-xs text-gray-500">by {c.approvedBy}</div>}{c.refundReference && <div className="text-xs text-gray-500">{c.refundReference}</div>}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      <span className="inline-flex flex-wrap gap-1">
                        {ap && canApprove(persona, ap) && <>
                          <button className={btnSmallPrimary} onClick={() => setDecide({ a: ap, approve: true })}><ThumbsUp className="w-3.5 h-3.5" />Approve</button>
                          <button className={btnSmall} onClick={() => setDecide({ a: ap, approve: false })}><ThumbsDown className="w-3.5 h-3.5" />Reject</button>
                        </>}
                        {ap && !canApprove(persona, ap) && <span className="text-xs text-gray-500">Waiting for MIS Head / Finance</span>}
                        {c.status === 'Approved' && canRefund && <button className={btnSmallPrimary} onClick={() => setRefund(c)}><Banknote className="w-3.5 h-3.5" />Pay refund</button>}
                        <button className={btnSmall} onClick={() => printCancellationLetter(c)}><Printer className="w-3.5 h-3.5" />Statement</button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState>Nothing here.</EmptyState>}
        </div>
      </Panel>
      {create && <RequestDialog onClose={() => setCreate(false)} />}
      {refund && <RefundDialog c={refund} onClose={() => setRefund(null)} />}
      {decide && <DecideDialog approval={decide.a} approve={decide.approve} onClose={() => setDecide(null)} />}
      {detail && <BookingDetail bookingId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function RequestDialog({ onClose }: { onClose: () => void }) {
  const store = getDataStore();
  const pending = new Set(store.list<Cancellation>('cancellations').filter(c => c.status !== 'Rejected').map(c => c.bookingId));
  const options = liveBookings().filter(b => !pending.has(b.id) && !['Possession Done', 'Completed'].includes(b.stage));
  const [bookingId, setBookingId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const b = options.find(x => x.id === bookingId);
  const f = b ? bookingFinance(b) : null;
  const age = b ? daysBetween(b.bookingDate, localDate()) : 0;
  const pct = age <= 30 ? 10 : age <= 90 ? 20 : 25;
  const save = async () => {
    if (!b) { toast.error('Choose a booking'); return; }
    if (reason.trim().length < 5) { toast.error('Enter the reason for cancellation'); return; }
    setBusy(true);
    try {
      const c = await store.insert<Cancellation>('cancellations', { bookingId: b.id, reason: reason.trim(), requestDate: localDate(), requestedBy: store.getPersona().name, status: 'Requested' });
      toast.success(`Cancellation ${c.id} requested: refund ${inr(c.refundAmount)} after ${c.deductionPct}% deduction. Sent for approval.`);
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="Request cancellation"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy && <Spinner />}Submit for approval</button></>}>
      <div className="space-y-4">
        <Field label="Booking" required>
          <select className={inputCls} value={bookingId} onChange={e => setBookingId(e.target.value)}>
            <option value="">Select booking</option>
            {options.map(o => <option key={o.id} value={o.id}>{o.customer} · {o.project} {o.unit} · {o.id}</option>)}
          </select>
        </Field>
        {b && f && (
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-2 rounded bg-gray-50"><div className="text-xs text-gray-500">Paid so far</div>{inr(f.paid)}</div>
            <div className="p-2 rounded bg-red-50"><div className="text-xs text-gray-500">Deduction ({pct}%, day {age})</div>{inr(Math.round(f.paid * pct / 100))}</div>
            <div className="p-2 rounded bg-green-50"><div className="text-xs text-gray-500">Estimated refund</div>{inr(f.paid - Math.round(f.paid * pct / 100))}</div>
          </div>
        )}
        <Field label="Reason" required><textarea rows={3} className={inputCls} value={reason} onChange={e => setReason(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function RefundDialog({ c, onClose }: { c: Cancellation; onClose: () => void }) {
  const store = getDataStore();
  const [ref, setRef] = useState('');
  const [date, setDate] = useState(localDate());
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!ref.trim()) { toast.error('Enter the UTR / cheque number of the refund'); return; }
    if (date > localDate()) { toast.error('Date cannot be in the future'); return; }
    setBusy(true);
    try {
      await store.patch('cancellations', c.id, { status: 'Refunded', refundReference: ref.trim(), refundDate: date });
      toast.success(`Refund of ${inr(c.refundAmount)} recorded and posted to the ledger`);
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="Pay refund" subtitle={`${c.id} · ${inr(c.refundAmount)}`} size="sm"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy && <Spinner />}Record refund</button></>}>
      <div className="space-y-4">
        <Field label="UTR / cheque no." required><input className={inputCls} value={ref} onChange={e => setRef(e.target.value)} /></Field>
        <Field label="Paid on" required><input type="date" max={localDate()} className={inputCls} value={date} onChange={e => setDate(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
