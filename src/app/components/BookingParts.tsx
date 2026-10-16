// Shared booking pieces: booking 360 view, payment entry, KYC upload,
// e-signature capture and the audit timeline.
import { useEffect, useRef, useState } from 'react';
import { Receipt, FileText, Printer, Upload, History, PenLine, Eraser, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
  getDataStore, Booking, Payment, ScheduleItem, DocumentRecord, Agreement, AuditEntry, localDate, toastError,
} from '../lib/dataStore';
import { bookingFinance, interestOn, unitFor, PAYMENT_MODES } from '../lib/crm';
import { inr, fmtDate, fmtDateTime } from '../lib/format';
import {
  printReceipt, printDemandLetter, printCostSheet, printStatement, printAllotmentLetter, printAgreement,
} from '../lib/documents';
import {
  Modal, Field, inputCls, btnPrimary, btnSecondary, btnSmall, Badge, Tabs, thCls, tdCls, ContactButtons, Spinner, EmptyState, ProgressBar,
} from './common';

export const KYC_TYPES = ['PAN Card', 'Aadhaar Card', 'Address Proof', 'Photograph', 'Bank Statement', 'Salary Slips', 'Allotment Letter', 'Agreement Copy', 'Other'];
export const REQUIRED_KYC = ['PAN Card', 'Aadhaar Card', 'Address Proof', 'Photograph'];

// ---------------------------------------------------------------------------

export function RecordPaymentDialog({ booking, onClose, presetAmount }: { booking: Booking; onClose: () => void; presetAmount?: number }) {
  const store = getDataStore();
  const fin = bookingFinance(booking);
  const [f, setF] = useState({
    amount: presetAmount || (fin.nextDue ? fin.nextDue.amount + fin.nextDue.gst - fin.nextDue.paid : 0),
    mode: 'NEFT', reference: '', receivedDate: localDate(), remarks: '',
  });
  const [busy, setBusy] = useState(false);
  const balance = fin.grandTotal - fin.paid;

  const submit = async () => {
    if (!(f.amount > 0)) { toast.error('Enter an amount greater than zero'); return; }
    if (f.amount > balance + 1) { toast.error(`That is more than the balance of ${inr(balance)}`); return; }
    if (f.receivedDate > localDate()) { toast.error('The payment date cannot be in the future'); return; }
    if (f.mode !== 'Cash' && !f.reference.trim()) { toast.error('Enter the cheque / UTR / transaction number'); return; }
    setBusy(true);
    try {
      const p = await store.insert<Payment>('payments', {
        bookingId: booking.id, type: 'Receipt', amount: f.amount, mode: f.mode, reference: f.reference.trim() || undefined,
        receivedDate: f.receivedDate, remarks: f.remarks || undefined, createdBy: store.getPersona().name,
      });
      toast.success(`Receipt ${p.receiptNo} saved for ${inr(p.amount)}`, { action: { label: 'Print', onClick: () => printReceipt(p) } });
      onClose();
    } catch (err) {
      toastError(err, 'Payment not saved');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Record payment · ${booking.customer}`} subtitle={`${booking.id} · ${booking.project} ${booking.unit}`}
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={submit} disabled={busy}>{busy ? <Spinner /> : <Receipt className="w-4 h-4" />}Save &amp; issue receipt</button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="p-2 rounded bg-gray-50"><div className="text-xs text-gray-500">Demanded &amp; unpaid</div>{inr(fin.outstanding)}</div>
          <div className="p-2 rounded bg-red-50"><div className="text-xs text-gray-500">Overdue</div>{inr(fin.overdue)}</div>
          <div className="p-2 rounded bg-gray-50"><div className="text-xs text-gray-500">Total balance</div>{inr(balance)}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Amount (₹)" required hint="Allocated to the oldest unpaid instalment first">
            <input type="number" min={1} className={inputCls} value={f.amount || ''} onChange={e => setF({ ...f, amount: Number(e.target.value) })} />
          </Field>
          <Field label="Received on" required>
            <input type="date" max={localDate()} className={inputCls} value={f.receivedDate} onChange={e => setF({ ...f, receivedDate: e.target.value })} />
          </Field>
          <Field label="Mode" required>
            <select className={inputCls} value={f.mode} onChange={e => setF({ ...f, mode: e.target.value })}>{PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}</select>
          </Field>
          <Field label="Cheque / UTR / transaction no." required={f.mode !== 'Cash'}>
            <input className={inputCls} value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} />
          </Field>
        </div>
        <Field label="Remarks"><input className={inputCls} value={f.remarks} onChange={e => setF({ ...f, remarks: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

export function KycUploadDialog({ booking, leadId, customer, onClose, defaultType }: {
  booking?: Booking; leadId?: string; customer?: string; onClose: () => void; defaultType?: string;
}) {
  const store = getDataStore();
  const [docType, setDocType] = useState(defaultType || 'PAN Card');
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const name = booking?.customer || customer || '';

  const submit = async () => {
    if (!file) { toast.error('Choose a file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Files must be under 10 MB'); return; }
    if (!/^(image\/|application\/pdf)/.test(file.type)) { toast.error('Upload a PDF or an image'); return; }
    setBusy(true);
    try {
      const url = await store.uploadFile(`kyc/${booking?.id || leadId || 'misc'}`, file);
      await store.insert<DocumentRecord>('documents', {
        bookingId: booking?.id, leadId: booking?.leadId || leadId, customer: name, docType, fileName: file.name, fileUrl: url,
        status: 'Uploaded', uploadedBy: store.getPersona().name, uploadedAt: new Date().toISOString(), remarks: remarks || undefined,
      });
      toast.success(`${docType} uploaded for ${name}`);
      onClose();
    } catch (err) {
      toastError(err, 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Upload KYC document" subtitle={`${name}${booking ? ` · ${booking.id}` : ''}`} size="sm"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={submit} disabled={busy}>{busy ? <Spinner /> : <Upload className="w-4 h-4" />}Upload</button></>}>
      <div className="space-y-4">
        <Field label="Document type" required>
          <select className={inputCls} value={docType} onChange={e => setDocType(e.target.value)}>{KYC_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </Field>
        <Field label="File (PDF or image, up to 10 MB)" required>
          <input type="file" accept="application/pdf,image/*" className={inputCls} onChange={e => setFile(e.target.files?.[0] || null)} aria-label="Document file" />
        </Field>
        <Field label="Remarks"><input className={inputCls} value={remarks} onChange={e => setRemarks(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

/** Signature pad. Saves a PNG to storage and marks the agreement as signed. */
export function ESignDialog({ agreement, booking, onClose }: { agreement: Agreement; booking: Booking; onClose: () => void }) {
  const store = getDataStore();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [signer, setSigner] = useState(booking.customer);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111827';
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.current!.width / r.width), y: (e.clientY - r.top) * (canvas.current!.height / r.height) };
  };
  const down = (e: React.PointerEvent) => { drawing.current = true; const p = pos(e); const ctx = canvas.current!.getContext('2d')!; ctx.beginPath(); ctx.moveTo(p.x, p.y); (e.target as Element).setPointerCapture(e.pointerId); };
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; const p = pos(e); const ctx = canvas.current!.getContext('2d')!; ctx.lineTo(p.x, p.y); ctx.stroke(); setHasInk(true); };
  const up = () => { drawing.current = false; };
  const clear = () => { const c = canvas.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setHasInk(false); };

  const submit = async () => {
    if (!hasInk) { toast.error('Please sign in the box'); return; }
    if (!signer.trim() || !agree) { toast.error('Enter the signer name and accept the declaration'); return; }
    setBusy(true);
    try {
      const blob: Blob = await new Promise(res => canvas.current!.toBlob(b => res(b!), 'image/png'));
      const url = await store.uploadFile(`signatures/${booking.id}`, blob, `signature_${agreement.id}.png`);
      await store.patch('agreements', agreement.id, { status: 'Signed', signerName: signer.trim(), signedAt: new Date().toISOString(), signatureUrl: url });
      toast.success(`Agreement ${agreement.id} signed by ${signer}`);
      onClose();
    } catch (err) {
      toastError(err, 'Could not save the signature');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Sign agreement" subtitle={`${agreement.id} · ${booking.project} ${booking.unit} · ${inr(agreement.agreementValue)}`}
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={submit} disabled={busy}>{busy ? <Spinner /> : <PenLine className="w-4 h-4" />}Sign agreement</button></>}>
      <div className="space-y-3">
        <button className={btnSmall} onClick={() => printAgreement(booking, agreement)}><FileText className="w-3.5 h-3.5" />Read the agreement</button>
        <Field label="Signer name" required><input className={inputCls} value={signer} onChange={e => setSigner(e.target.value)} /></Field>
        <div>
          <div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-700">Signature</span><button className={btnSmall} onClick={clear}><Eraser className="w-3.5 h-3.5" />Clear</button></div>
          <canvas ref={canvas} width={560} height={160} className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-white touch-none cursor-crosshair"
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} aria-label="Signature pad" />
        </div>
        <label className="flex gap-2 text-sm text-gray-700"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
          I have read the agreement for sale and sign it electronically. Time, name and signature are recorded in the audit trail.</label>
        <p className="text-xs text-gray-500">For Aadhaar e-sign (legally equivalent to wet ink), connect an e-sign provider such as Leegality or Digio; this signature pad covers in-office and buyer-portal signing.</p>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

const FIELD_LABEL = (k: string) => k.replace(/_/g, ' ');

export function AuditTimeline({ table, rowId, limit = 50 }: { table?: string; rowId?: string; limit?: number }) {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  useEffect(() => {
    let live = true;
    getDataStore().fetchAudit({ table, rowId, limit }).then(r => { if (live) setRows(r); }).catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [table, rowId, limit]);
  if (!rows) return <div className="py-6 flex justify-center"><Spinner /></div>;
  if (rows.length === 0) return <EmptyState>No changes recorded yet.</EmptyState>;
  return (
    <ol className="space-y-3">
      {rows.map(r => (
        <li key={r.id} className="flex gap-3 text-sm">
          <History className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-gray-900"><b>{r.actor}</b> {r.action === 'INSERT' ? 'created' : r.action === 'DELETE' ? 'deleted' : 'changed'} {r.tableName.replace(/_/g, ' ')} {r.rowId}</div>
            <div className="text-xs text-gray-500">{fmtDateTime(r.createdAt)}</div>
            {r.action === 'UPDATE' && r.changes && (
              <ul className="mt-1 text-xs text-gray-700 space-y-0.5">
                {Object.entries(r.changes).slice(0, 8).map(([k, v]: [string, any]) => {
                  const [o, n] = Array.isArray(v) ? v : [v?.old, v?.new];
                  const show = (x: any) => x === null || x === undefined || x === '' ? '—' : typeof x === 'object' ? JSON.stringify(x).slice(0, 60) : String(x);
                  return <li key={k}><span className="text-gray-500">{FIELD_LABEL(k)}:</span> {show(o)} → <b>{show(n)}</b></li>;
                })}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------

export function ScheduleTable({ booking, items, onPay }: { booking: Booking; items: ScheduleItem[]; onPay?: (amount: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50"><tr>
          {['#', 'Milestone', 'Amount + GST', 'Demand', 'Due', 'Paid', 'Status', 'Interest', ''].map(h => <th key={h} className={thCls}>{h}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(i => {
            const int = interestOn(i);
            const bal = i.amount + i.gst - i.paid;
            return (
              <tr key={i.id}>
                <td className={tdCls}>{i.seq}</td>
                <td className={tdCls}>{i.stageName} <span className="text-xs text-gray-500">({i.percent}%)</span></td>
                <td className={`${tdCls} whitespace-nowrap`}>{inr(i.amount + i.gst)}<div className="text-xs text-gray-500">GST {inr(i.gst)}</div></td>
                <td className={`${tdCls} whitespace-nowrap text-gray-600`}>{fmtDate(i.demandDate)}</td>
                <td className={`${tdCls} whitespace-nowrap text-gray-600`}>{i.dueDate ? fmtDate(i.dueDate) : 'On completion'}</td>
                <td className={`${tdCls} whitespace-nowrap`}>{inr(i.paid)}</td>
                <td className={tdCls}><Badge>{i.status}</Badge></td>
                <td className={`${tdCls} whitespace-nowrap text-red-700`}>{int.amount ? `${inr(int.amount)} · ${int.days}d` : ''}</td>
                <td className={`${tdCls} whitespace-nowrap`}>
                  {i.status !== 'Not Due' && i.status !== 'Paid' && (
                    <span className="inline-flex gap-1">
                      <button className={btnSmall} onClick={() => printDemandLetter(booking, i)} title="Demand letter"><Printer className="w-3.5 h-3.5" />Letter</button>
                      {onPay && <button className={btnSmall} onClick={() => onPay(bal)}>Pay</button>}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LedgerTable({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) return <EmptyState>No payments yet.</EmptyState>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50"><tr>{['Date', 'Receipt', 'Type', 'Mode', 'Reference', 'Amount', 'By', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {payments.map(p => (
            <tr key={p.id}>
              <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(p.receivedDate)}</td>
              <td className={tdCls}>{p.receiptNo}</td>
              <td className={tdCls}><Badge>{p.type}</Badge></td>
              <td className={tdCls}>{p.mode}</td>
              <td className={`${tdCls} text-gray-600`}>{p.reference || '—'}</td>
              <td className={`${tdCls} whitespace-nowrap ${p.type === 'Refund' ? 'text-red-700' : ''}`}>{p.type === 'Refund' ? '− ' : ''}{inr(p.amount)}</td>
              <td className={`${tdCls} text-gray-600`}>{p.createdBy || '—'}</td>
              <td className={tdCls}><button className={btnSmall} onClick={() => printReceipt(p)}><Printer className="w-3.5 h-3.5" />Receipt</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Everything about one booking in one place. */
export function BookingDetail({ bookingId, onClose, readOnly }: { bookingId: string; onClose: () => void; readOnly?: boolean }) {
  const store = getDataStore();
  const booking = store.getBookings().find(b => b.id === bookingId);
  const [tab, setTab] = useState('overview');
  const [pay, setPay] = useState<number | null>(null);
  const [kyc, setKyc] = useState(false);
  if (!booking) return null;
  const fin = bookingFinance(booking);
  const unit = unitFor(booking);
  const docs = store.list<DocumentRecord>('documents').filter(d => d.bookingId === booking.id);
  const ag = store.list<Agreement>('agreements').find(a => a.bookingId === booking.id);
  const cp = booking.cpId ? store.getChannelPartners().find(c => c.id === booking.cpId) : undefined;
  const reminder = fin.nextDue
    ? `Dear ${booking.customer}, a payment of ${inr(fin.nextDue.amount + fin.nextDue.gst - fin.nextDue.paid)} for ${fin.nextDue.stageName} on unit ${booking.unit}, ${booking.project} is due by ${fmtDate(fin.nextDue.dueDate)}. Please quote booking ${booking.id} when paying. - ${store.setting('company_name', 'GENXA Developers')}`
    : `Dear ${booking.customer}, thank you for your booking of ${booking.unit} at ${booking.project}.`;

  return (
    <Modal open onClose={onClose} size="xl" title={`${booking.customer} · ${booking.project} ${booking.unit}`} subtitle={`${booking.id} · booked ${fmtDate(booking.bookingDate)} · ${booking.salesExec}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{booking.stage}</Badge>
          {booking.discountStatus && booking.discountStatus !== 'Approved' && <Badge tone="orange">Discount {booking.discountStatus}</Badge>}
          {fin.overdue > 0 && <Badge tone="red">Overdue {inr(fin.overdue)}</Badge>}
          <span className="flex-1" />
          <ContactButtons mobile={booking.mobile} name={booking.customer} message={reminder} relatedType="booking" relatedId={booking.id} template={fin.nextDue ? 'Payment Reminder' : 'Manual message'} />
          {!readOnly && <button className={btnSmall} onClick={() => setPay(0)}><Receipt className="w-3.5 h-3.5" />Record payment</button>}
        </div>
        <Tabs active={tab} onChange={setTab} tabs={[
          { id: 'overview', label: 'Overview' }, { id: 'schedule', label: 'Schedule', count: fin.schedule.length },
          { id: 'ledger', label: 'Payments', count: fin.payments.length }, { id: 'docs', label: 'Documents', count: docs.length },
          { id: 'history', label: 'Change log' },
        ]} />
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <Row k="Unit" v={unit ? `${unit.unitNumber} · ${unit.unitType} · ${unit.carpetArea} sq ft · floor ${unit.floor} · ${unit.facing || ''}` : `${booking.unit} · ${booking.unitType}`} />
              <Row k="List price" v={inr(booking.price)} />
              <Row k="Discount" v={`${inr(booking.discount)}${booking.discountStatus ? ` (${booking.discountStatus})` : ''}`} />
              <Row k="Agreement value" v={inr(fin.net)} />
              <Row k={`GST (${booking.gstRate ?? 5}%)`} v={inr(fin.gstTotal)} />
              <Row k="Total payable" v={<b>{inr(fin.grandTotal)}</b>} />
              <Row k="Payment plan" v={booking.paymentPlan || 'Construction Linked'} />
            </div>
            <div className="space-y-2">
              <Row k="Received" v={inr(fin.received)} />
              {fin.refunded > 0 && <Row k="Refunded" v={inr(fin.refunded)} />}
              <Row k="Demanded & unpaid" v={inr(fin.outstanding)} />
              <Row k="Overdue" v={<span className={fin.overdue ? 'text-red-700' : ''}>{inr(fin.overdue)}</span>} />
              <Row k="Late interest" v={inr(fin.interest)} />
              <div><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Paid</span><span>{fin.percentPaid}%</span></div><ProgressBar value={fin.percentPaid} tone="green" /></div>
              <Row k="Mobile" v={booking.mobile} />
              <Row k="CRM executive" v={booking.crmExec || '—'} />
              <Row k="Channel partner" v={cp ? cp.companyName : 'Direct'} />
              <Row k="Agreement" v={ag ? ag.status : '—'} />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <button className={btnSmall} onClick={() => printCostSheet(booking)}><FileText className="w-3.5 h-3.5" />Cost sheet</button>
              <button className={btnSmall} onClick={() => printAllotmentLetter(booking)}><FileText className="w-3.5 h-3.5" />Allotment letter</button>
              {ag && <button className={btnSmall} onClick={() => printAgreement(booking, ag)}><FileText className="w-3.5 h-3.5" />Agreement</button>}
              <button className={btnSmall} onClick={() => printStatement(booking)}><FileText className="w-3.5 h-3.5" />Statement of account</button>
              <a className={btnSmall} href={`mailto:?subject=${encodeURIComponent(`Booking ${booking.id} - ${booking.project} ${booking.unit}`)}&body=${encodeURIComponent(reminder)}`}><Mail className="w-3.5 h-3.5" />Email</a>
            </div>
          </div>
        )}
        {tab === 'schedule' && <ScheduleTable booking={booking} items={fin.schedule} onPay={readOnly ? undefined : (a) => setPay(a)} />}
        {tab === 'ledger' && <LedgerTable payments={fin.payments} />}
        {tab === 'docs' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              {REQUIRED_KYC.map(t => {
                const d = docs.find(x => x.docType === t && x.status !== 'Rejected');
                return <Badge key={t} tone={d?.status === 'Verified' ? 'green' : d ? 'blue' : 'red'}>{t}: {d ? d.status : 'Missing'}</Badge>;
              })}
              <span className="flex-1" />
              {!readOnly && <button className={btnSmall} onClick={() => setKyc(true)}><Upload className="w-3.5 h-3.5" />Upload</button>}
            </div>
            <DocList docs={docs} />
          </div>
        )}
        {tab === 'history' && <AuditTimeline rowId={booking.id} />}
      </div>
      {pay !== null && <RecordPaymentDialog booking={booking} presetAmount={pay || undefined} onClose={() => setPay(null)} />}
      {kyc && <KycUploadDialog booking={booking} onClose={() => setKyc(false)} />}
    </Modal>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return <div className="flex justify-between gap-3 border-b border-gray-50 pb-1"><span className="text-gray-500">{k}</span><span className="text-gray-900 text-right">{v}</span></div>;
}

export function DocList({ docs, actions }: { docs: DocumentRecord[]; actions?: (d: DocumentRecord) => React.ReactNode }) {
  if (docs.length === 0) return <EmptyState>No documents uploaded.</EmptyState>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50"><tr>{['Document', 'Customer', 'File', 'Status', 'Uploaded', 'Verified', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {docs.map(d => (
            <tr key={d.id}>
              <td className={tdCls}>{d.docType}<div className="text-xs text-gray-500">{d.id}{d.bookingId ? ` · ${d.bookingId}` : ''}</div></td>
              <td className={tdCls}>{d.customer}</td>
              <td className={`${tdCls} max-w-[200px] truncate`}>{d.fileUrl ? <a className="text-blue-700 hover:underline" href={d.fileUrl} target="_blank" rel="noreferrer">{d.fileName || 'Open'}</a> : <span className="text-gray-400">{d.fileName || 'Paper copy'}</span>}</td>
              <td className={tdCls}><Badge>{d.status}</Badge>{d.remarks && <div className="text-xs text-gray-500 max-w-[180px] truncate" title={d.remarks}>{d.remarks}</div>}</td>
              <td className={`${tdCls} text-xs text-gray-600 whitespace-nowrap`}>{fmtDate(d.uploadedAt)}<div>{d.uploadedBy}</div></td>
              <td className={`${tdCls} text-xs text-gray-600 whitespace-nowrap`}>{d.verifiedAt ? <>{fmtDate(d.verifiedAt)}<div>{d.verifiedBy}</div></> : '—'}</td>
              <td className={`${tdCls} whitespace-nowrap`}>{actions?.(d)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

