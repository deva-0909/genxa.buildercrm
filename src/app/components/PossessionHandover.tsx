import { useState } from 'react';
import { Key, CalendarCheck, ClipboardCheck, Home, AlertTriangle, Printer, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Possession, Booking, Agreement, localDate, toastError } from '../lib/dataStore';
import { bookingFinance, liveBookings } from '../lib/crm';
import { inr, fmtDate, escapeHtml as e, printDocument } from '../lib/format';
import { PageHeader, StatCard, Panel, Tabs, Badge, thCls, tdCls, btnSmall, btnSmallPrimary, inputCls, EmptyState, Modal, Field, btnPrimary, btnSecondary, Spinner, ContactButtons } from './common';
import { BookingDetail } from './BookingParts';

export function PossessionHandover() {
  const store = getDataStore();
  const [tab, setTab] = useState('progress');
  const [schedule, setSchedule] = useState<Booking | null>(null);
  const [act, setAct] = useState<{ p: Possession; kind: 'inspect' | 'handover' } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const possessions = store.list<Possession>('possessions');
  const bookings = new Map(store.getBookings().map(b => [b.id, b]));
  const withPossession = new Set(possessions.map(p => p.bookingId));
  const ready = liveBookings().filter(b => !withPossession.has(b.id) && ['Fully Paid', 'Agreement Done', 'Documentation'].includes(b.stage))
    .sort((a, b) => bookingFinance(b).percentPaid - bookingFinance(a).percentPaid);
  const inProgress = possessions.filter(p => p.status !== 'Handed Over');
  const done = possessions.filter(p => p.status === 'Handed Over');

  const markOC = async (p: Possession) => {
    try { await store.patch('possessions', p.id, { ocReceived: true }); toast.success('Occupancy certificate marked as received'); } catch (err) { toastError(err); }
  };
  const markReady = async (p: Possession) => {
    try { await store.patch('possessions', p.id, { status: 'Ready for Handover', snagsCount: 0 }); toast.success('Snags closed. Unit ready for handover.'); } catch (err) { toastError(err); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Possession & Handover" subtitle="Schedule inspections, close snags and hand over keys. Handover is allowed only when dues are cleared and the OC is in." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ready to schedule" value={ready.filter(b => b.stage === 'Fully Paid').length} icon={CalendarPlus} tone="blue" hint={`${ready.length} eligible incl. part-paid`} />
        <StatCard label="In progress" value={inProgress.length} icon={CalendarCheck} tone="orange" />
        <StatCard label="Open snags" value={inProgress.reduce((s, p) => s + (p.snagsCount || 0), 0)} icon={AlertTriangle} tone="red" />
        <StatCard label="Handed over" value={done.length} icon={Key} tone="green" />
      </div>
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'progress', label: 'In progress', count: inProgress.length }, { id: 'ready', label: 'Eligible bookings', count: ready.length }, { id: 'done', label: 'Handed over', count: done.length }]} />
        {tab === 'ready' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['Booking', 'Customer', 'Unit', 'Stage', 'Paid', 'Balance', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {ready.map(b => { const f = bookingFinance(b); return (
                  <tr key={b.id}>
                    <td className={tdCls}>{b.id}</td>
                    <td className={tdCls}><button className="hover:underline" onClick={() => setDetail(b.id)}>{b.customer}</button></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{b.unit}<div className="text-xs text-gray-500">{b.project}</div></td>
                    <td className={tdCls}><Badge>{b.stage}</Badge></td>
                    <td className={tdCls}>{f.percentPaid}%</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{inr(f.grandTotal - f.paid)}</td>
                    <td className={tdCls}><button className={btnSmallPrimary} onClick={() => setSchedule(b)}><CalendarPlus className="w-3.5 h-3.5" />Schedule</button></td>
                  </tr>
                ); })}
              </tbody>
            </table>
            {ready.length === 0 && <EmptyState>No bookings are ready for possession yet.</EmptyState>}
          </div>
        )}
        {(tab === 'progress' || tab === 'done') && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['Customer', 'Unit', 'Scheduled', 'Inspection', 'Snags', 'OC', 'Dues', 'Status', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {(tab === 'progress' ? inProgress : done).map(p => {
                  const b = bookings.get(p.bookingId);
                  if (!b) return null;
                  const f = bookingFinance(b);
                  const dues = Math.max(0, f.grandTotal - f.paid);
                  return (
                    <tr key={p.id}>
                      <td className={tdCls}><button className="hover:underline text-left" onClick={() => setDetail(b.id)}>{b.customer}</button><div className="text-xs text-gray-500">{p.id}</div></td>
                      <td className={`${tdCls} whitespace-nowrap`}>{b.unit}<div className="text-xs text-gray-500">{b.project}</div></td>
                      <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(p.scheduledDate)}</td>
                      <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(p.inspectionDate)}</td>
                      <td className={tdCls}>{p.snagsCount ? <span title={p.snagNotes} className="text-red-700">{p.snagsCount} open</span> : <span className="text-gray-400">0</span>}</td>
                      <td className={tdCls}>{p.ocReceived ? <Badge tone="green">Received</Badge> : <Badge tone="orange">Awaited</Badge>}</td>
                      <td className={`${tdCls} whitespace-nowrap ${dues > 0 ? 'text-red-700' : 'text-green-700'}`}>{dues > 0 ? inr(dues) : 'Cleared'}</td>
                      <td className={tdCls}><Badge>{p.status}</Badge>{p.handedOverDate && <div className="text-xs text-gray-500">{fmtDate(p.handedOverDate)} by {p.keysHandedBy}</div>}</td>
                      <td className={`${tdCls} whitespace-nowrap`}>
                        <span className="inline-flex flex-wrap gap-1">
                          {p.status === 'Scheduled' && <button className={btnSmallPrimary} onClick={() => setAct({ p, kind: 'inspect' })}><ClipboardCheck className="w-3.5 h-3.5" />Inspection</button>}
                          {p.status === 'Inspection Done' && (p.snagsCount || 0) > 0 && <button className={btnSmall} onClick={() => markReady(p)}>Snags fixed</button>}
                          {p.status === 'Inspection Done' && !(p.snagsCount) && <button className={btnSmall} onClick={() => markReady(p)}>Mark ready</button>}
                          {!p.ocReceived && p.status !== 'Handed Over' && <button className={btnSmall} onClick={() => markOC(p)}>OC received</button>}
                          {p.status === 'Ready for Handover' && <button className={btnSmallPrimary} onClick={() => setAct({ p, kind: 'handover' })}><Key className="w-3.5 h-3.5" />Hand over</button>}
                          <button className={btnSmall} onClick={() => printPossessionLetter(b, p)}><Printer className="w-3.5 h-3.5" />Letter</button>
                          <ContactButtons compact mobile={b.mobile} name={b.customer} relatedType="booking" relatedId={b.id} template="Possession Intimation"
                            message={`Dear ${b.customer}, possession of unit ${b.unit}, ${b.project} is scheduled on ${fmtDate(p.scheduledDate)}. Please bring your ID and the allotment letter.`} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(tab === 'progress' ? inProgress : done).length === 0 && <EmptyState>Nothing here.</EmptyState>}
          </div>
        )}
      </Panel>
      {schedule && <ScheduleDialog b={schedule} onClose={() => setSchedule(null)} />}
      {act && <ActionDialog {...act} onClose={() => setAct(null)} />}
      {detail && <BookingDetail bookingId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function ScheduleDialog({ b, onClose }: { b: Booking; onClose: () => void }) {
  const store = getDataStore();
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!date || date < localDate()) { toast.error('Choose a date from today onwards'); return; }
    setBusy(true);
    try {
      await store.insert('possessions', { bookingId: b.id, scheduledDate: date, status: 'Scheduled', snagsCount: 0, ocReceived: false });
      toast.success(`Possession for ${b.customer} scheduled on ${fmtDate(date)}`);
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="Schedule possession" subtitle={`${b.customer} · ${b.project} ${b.unit}`} size="sm"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy && <Spinner />}Schedule</button></>}>
      <Field label="Possession / inspection date" required><input type="date" min={localDate()} className={inputCls} value={date} onChange={ev => setDate(ev.target.value)} /></Field>
    </Modal>
  );
}

function ActionDialog({ p, kind, onClose }: { p: Possession; kind: 'inspect' | 'handover'; onClose: () => void }) {
  const store = getDataStore();
  const b = store.getBookings().find(x => x.id === p.bookingId)!;
  const f = bookingFinance(b);
  const dues = Math.max(0, f.grandTotal - f.paid);
  const [date, setDate] = useState(localDate());
  const [snags, setSnags] = useState(p.snagNotes || '');
  const [keysBy, setKeysBy] = useState(store.getPersona().name);
  const [busy, setBusy] = useState(false);
  const blockers = kind === 'handover' ? [
    dues > 0 && `Outstanding dues of ${inr(dues)}`,
    !p.ocReceived && 'Occupancy certificate not received',
    (p.snagsCount || 0) > 0 && `${p.snagsCount} snag(s) still open`,
  ].filter(Boolean) as string[] : [];
  const save = async () => {
    if (date > localDate()) { toast.error('Date cannot be in the future'); return; }
    setBusy(true);
    try {
      if (kind === 'inspect') {
        const count = snags.split('\n').map(s => s.trim()).filter(Boolean).length;
        await store.patch('possessions', p.id, { status: 'Inspection Done', inspectionDate: date, snagsCount: count, snagNotes: snags.trim() || undefined });
        toast.success(count ? `Inspection saved with ${count} snag(s)` : 'Inspection saved, no snags');
      } else {
        if (blockers.length) { toast.error(blockers[0]); setBusy(false); return; }
        await store.patch('possessions', p.id, { status: 'Handed Over', handedOverDate: date, keysHandedBy: keysBy });
        toast.success(`Keys handed over to ${b.customer}`);
      }
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={kind === 'inspect' ? 'Record inspection' : 'Hand over keys'} subtitle={`${b.customer} · ${b.project} ${b.unit}`}
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy || blockers.length > 0}>{busy && <Spinner />}{kind === 'inspect' ? 'Save inspection' : 'Confirm handover'}</button></>}>
      <div className="space-y-4">
        <Field label="Date" required><input type="date" max={localDate()} className={inputCls} value={date} onChange={ev => setDate(ev.target.value)} /></Field>
        {kind === 'inspect' && <Field label="Snags found (one per line)" hint="Leave empty if the unit is ready"><textarea rows={5} className={inputCls} value={snags} onChange={ev => setSnags(ev.target.value)} placeholder={'Bathroom tile chipped\nBalcony door alignment'} /></Field>}
        {kind === 'handover' && (
          <>
            <Field label="Keys handed by"><input className={inputCls} value={keysBy} onChange={ev => setKeysBy(ev.target.value)} /></Field>
            {blockers.length > 0 ? (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                <p className="mb-1">Handover is blocked:</p><ul className="list-disc pl-5">{blockers.map(x => <li key={x}>{x}</li>)}</ul>
              </div>
            ) : <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 flex gap-2"><Home className="w-4 h-4" />Dues cleared, OC received and no open snags.</div>}
          </>
        )}
      </div>
    </Modal>
  );
}

function printPossessionLetter(b: Booking, p: Possession) {
  const store = getDataStore();
  const ag = store.list<Agreement>('agreements').find(a => a.bookingId === b.id);
  const handed = p.status === 'Handed Over';
  printDocument(`Possession ${b.id}`, `
    <p>Date: ${e(fmtDate(new Date().toISOString()))}</p><p>To,<br><b>${e(b.customer)}</b></p>
    <h1>${handed ? 'Possession Certificate' : 'Possession Intimation'}</h1>
    <p>${handed
      ? `This is to certify that peaceful possession of unit <b>${e(b.unit)}</b> in <b>${e(b.project)}</b> was handed over to ${e(b.customer)} on ${e(fmtDate(p.handedOverDate))}, together with the keys, by ${e(p.keysHandedBy || '')}.`
      : `We are pleased to inform you that unit <b>${e(b.unit)}</b> in <b>${e(b.project)}</b> is ready. Possession is scheduled on <b>${e(fmtDate(p.scheduledDate))}</b>. Please clear any dues and bring photo ID and the allotment letter.`}</p>
    <table><tr><th>Agreement</th><td>${e(ag?.registrationNumber || ag?.id || '—')}</td><th>Occupancy certificate</th><td>${p.ocReceived ? 'Received' : 'Awaited'}</td></tr>
    <tr><th>Inspection</th><td>${e(fmtDate(p.inspectionDate))}</td><th>Snags</th><td>${p.snagsCount || 0}</td></tr></table>
    <p class="muted">Maintenance charges apply from the date of possession. Defect liability as per RERA: 5 years from possession.</p>
    <div class="sig"><div>${e(b.customer)}</div><div>For ${e(store.setting('company_name', 'GENXA Developers'))}</div></div>`, store.setting('company_name', 'GENXA Developers'));
}
