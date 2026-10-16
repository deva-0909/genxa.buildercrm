import { useState } from 'react';
import { FileText, Send, PenLine, Stamp, CheckCircle, Clock, AlertTriangle, Printer, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Agreement, Booking, localDate, toastError } from '../lib/dataStore';
import { inr, inrShort, fmtDate, daysBetween, today, waLink } from '../lib/format';
import { printAgreement, printAllotmentLetter, printCostSheet } from '../lib/documents';
import { PageHeader, StatCard, Panel, Tabs, Badge, thCls, tdCls, btnSmall, btnSmallPrimary, inputCls, EmptyState, Modal, Field, btnPrimary, btnSecondary, Spinner } from './common';
import { ESignDialog, BookingDetail } from './BookingParts';

const FLOW = ['Draft', 'Generated', 'Sent for Signature', 'Signed', 'Registered'];

export function AgreementManagement() {
  const store = getDataStore();
  const persona = store.getPersona();
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [sign, setSign] = useState<{ a: Agreement; b: Booking } | null>(null);
  const [register, setRegister] = useState<{ a: Agreement; b: Booking } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const bookings = new Map(store.getBookings().map(b => [b.id, b]));
  const rows = store.list<Agreement>('agreements')
    .map(a => ({ a, b: bookings.get(a.bookingId)! }))
    .filter(x => x.b && x.b.stage !== 'Cancelled')
    .filter(x => !q || `${x.b.customer} ${x.b.unit} ${x.a.id} ${x.b.id}`.toLowerCase().includes(q.toLowerCase()));
  const pending = rows.filter(x => !['Signed', 'Registered'].includes(x.a.status));
  const signed = rows.filter(x => x.a.status === 'Signed');
  const registered = rows.filter(x => x.a.status === 'Registered');
  const late = pending.filter(x => daysBetween(x.b.bookingDate, today()) > 30);
  const list = tab === 'pending' ? pending : tab === 'signed' ? signed : registered;

  const generate = async (a: Agreement, b: Booking) => {
    try {
      await store.patch('agreements', a.id, { status: 'Generated', generatedAt: new Date().toISOString() });
      toast.success(`Agreement ${a.id} generated`);
      printAgreement(b, { ...a, generatedAt: new Date().toISOString() });
    } catch (e) { toastError(e); }
  };
  const send = async (a: Agreement, b: Booking) => {
    const msg = `Dear ${b.customer}, your agreement for sale for unit ${b.unit}, ${b.project} (value ${inr(a.agreementValue)}) is ready. Please review and sign it in the buyer portal or visit our office. - ${store.setting('company_name', 'GENXA Developers')}`;
    try {
      await store.patch('agreements', a.id, { status: 'Sent for Signature', sentAt: new Date().toISOString(), generatedAt: a.generatedAt || new Date().toISOString() });
      await store.insert('notifications', { channel: 'WhatsApp', recipientName: b.customer, recipientContact: b.mobile, template: 'Agreement for e-Signature', message: msg, status: 'Sent', relatedType: 'booking', relatedId: b.id, sentBy: persona.name, sentAt: new Date().toISOString() });
      window.open(waLink(b.mobile, msg), '_blank');
      toast.success(`Agreement sent to ${b.customer} for signature`);
    } catch (e) { toastError(e); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Agreements" subtitle="Generate, send, e-sign and register agreements for sale. Signing moves the booking to Agreement Done automatically." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Awaiting signature" value={pending.length} icon={Clock} tone="orange" hint={`${pending.filter(x => x.a.status === 'Draft').length} still in draft`} />
        <StatCard label="Signed, to register" value={signed.length} icon={PenLine} tone="blue" />
        <StatCard label="Registered" value={registered.length} icon={CheckCircle} tone="green" hint={inrShort(registered.reduce((s, x) => s + x.a.agreementValue, 0))} />
        <StatCard label="Past 30 days unsigned" value={late.length} icon={AlertTriangle} tone="red" hint="RERA expects execution within 30 days" />
      </div>
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'pending', label: 'Pending', count: pending.length }, { id: 'signed', label: 'Signed', count: signed.length }, { id: 'registered', label: 'Registered', count: registered.length }]} />
        <div className="p-3"><input className={`${inputCls} max-w-xs`} placeholder="Search customer, unit, ID" value={q} onChange={e => setQ(e.target.value)} aria-label="Search agreements" /></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>{['Agreement', 'Customer', 'Unit', 'Value', 'Stamp + reg.', 'Status', 'Progress', 'Actions'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {list.map(({ a, b }) => {
                const age = daysBetween(b.bookingDate, today());
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className={tdCls}>{a.id}<div className="text-xs text-gray-500">{b.id}</div></td>
                    <td className={tdCls}><button className="hover:underline text-left" onClick={() => setDetail(b.id)}>{b.customer}</button><div className="text-xs text-gray-500">{b.mobile}</div></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{b.unit}<div className="text-xs text-gray-500">{b.project}</div></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{inr(a.agreementValue)}</td>
                    <td className={`${tdCls} whitespace-nowrap text-gray-600`}>{inr(a.stampDuty)}<div className="text-xs">+ {inr(a.registrationFee)}</div></td>
                    <td className={tdCls}><Badge>{a.status}</Badge>
                      <div className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
                        {a.status === 'Registered' ? `${a.registrationNumber} · ${fmtDate(a.registeredDate)}` : a.status === 'Signed' ? `by ${a.signerName} · ${fmtDate(a.signedAt)}` : `${age} days since booking`}
                      </div>
                    </td>
                    <td className={tdCls}>
                      <div className="flex gap-0.5" aria-label={`Step ${FLOW.indexOf(a.status) + 1} of 5`}>
                        {FLOW.map((s, i) => <span key={s} title={s} className={`h-1.5 w-5 rounded ${i <= FLOW.indexOf(a.status) ? 'bg-green-500' : 'bg-gray-200'}`} />)}
                      </div>
                    </td>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      <span className="inline-flex flex-wrap gap-1">
                        {a.status === 'Draft' && <button className={btnSmallPrimary} onClick={() => generate(a, b)}><FilePlus className="w-3.5 h-3.5" />Generate</button>}
                        {a.status === 'Generated' && <button className={btnSmallPrimary} onClick={() => send(a, b)}><Send className="w-3.5 h-3.5" />Send to sign</button>}
                        {['Generated', 'Sent for Signature'].includes(a.status) && <button className={btnSmall} onClick={() => setSign({ a, b })}><PenLine className="w-3.5 h-3.5" />Sign now</button>}
                        {a.status === 'Signed' && <button className={btnSmallPrimary} onClick={() => setRegister({ a, b })}><Stamp className="w-3.5 h-3.5" />Register</button>}
                        <button className={btnSmall} onClick={() => printAgreement(b, a)}><Printer className="w-3.5 h-3.5" />Agreement</button>
                        {a.status === 'Draft' && <button className={btnSmall} onClick={() => printAllotmentLetter(b)}><FileText className="w-3.5 h-3.5" />Allotment</button>}
                        {a.status === 'Draft' && <button className={btnSmall} onClick={() => printCostSheet(b)}><FileText className="w-3.5 h-3.5" />Cost sheet</button>}
                        {a.signatureUrl && <a className={btnSmall} href={a.signatureUrl} target="_blank" rel="noreferrer">Signature</a>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <EmptyState>Nothing here.</EmptyState>}
        </div>
      </Panel>
      {sign && <ESignDialog agreement={sign.a} booking={sign.b} onClose={() => setSign(null)} />}
      {register && <RegisterDialog a={register.a} b={register.b} onClose={() => setRegister(null)} />}
      {detail && <BookingDetail bookingId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function RegisterDialog({ a, b, onClose }: { a: Agreement; b: Booking; onClose: () => void }) {
  const store = getDataStore();
  const [no, setNo] = useState('');
  const [date, setDate] = useState(localDate());
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!no.trim()) { toast.error('Enter the registration document number'); return; }
    if (date > localDate()) { toast.error('Registration date cannot be in the future'); return; }
    setBusy(true);
    try {
      await store.patch('agreements', a.id, { status: 'Registered', registrationNumber: no.trim(), registeredDate: date });
      toast.success(`Agreement ${a.id} registered`);
      onClose();
    } catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="Record registration" subtitle={`${b.customer} · ${b.project} ${b.unit}`} size="sm"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy && <Spinner />}Save</button></>}>
      <div className="space-y-4">
        <Field label="Registration document no." required><input className={inputCls} value={no} onChange={e => setNo(e.target.value)} placeholder="e.g. TNN-4/12345/2026" /></Field>
        <Field label="Registered on" required><input type="date" max={localDate()} className={inputCls} value={date} onChange={e => setDate(e.target.value)} /></Field>
        <p className="text-xs text-gray-500">Stamp duty {inr(a.stampDuty)} and registration fee {inr(a.registrationFee)} as per the agreement.</p>
      </div>
    </Modal>
  );
}
