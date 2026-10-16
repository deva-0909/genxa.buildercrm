// Buyer portal (persona "Buyer"), the field sales mobile view, and the
// construction updates that feed the buyer portal.
import { useState } from 'react';
import { Building2, Wallet, FileText, Headphones, HardHat, Upload, PenLine, Navigation, MapPin, ClipboardCheck, Camera, Image as ImageIcon, Send, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Agreement, DocumentRecord, ProjectStage, ProjectUpdate, SupportTicket, SiteVisit, localDate, toastError } from '../lib/dataStore';
import { bookingFinance, unitFor, liveBookings } from '../lib/crm';
import { inr, fmtDate, fmtDateTime, addDays, waLink } from '../lib/format';
import { printCostSheet, printAllotmentLetter, printAgreement, printStatement } from '../lib/documents';
import { PageHeader, StatCard, Panel, Tabs, Badge, btnPrimary, btnSecondary, btnSmall, inputCls, Field, Spinner, EmptyState, ContactButtons } from './common';
import { ScheduleTable, LedgerTable, DocList, KycUploadDialog, ESignDialog, REQUIRED_KYC } from './BookingParts';
import { NewTicketDialog, TicketDialog } from './PostSalesSupport';
import { CheckInDialog } from './LeadDialogs';
import { LogVisitExecutionDialog } from './LogVisitExecutionDialog';

// ---------------------------------------------------------------------------

export function BuyerPortal() {
  const store = getDataStore();
  const persona = store.getPersona();
  const b = store.getBookings().find(x => x.id === persona.refId);
  const [tab, setTab] = useState('home');
  const [kyc, setKyc] = useState<string | null>(null);
  const [sign, setSign] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState(false);
  if (!b) return <EmptyState>Choose a buyer in "Viewing as".</EmptyState>;
  const f = bookingFinance(b);
  const unit = unitFor(b);
  const project = store.getProjects().find(p => p.name === b.project);
  const stages = store.list<ProjectStage>('projectStages').filter(s => s.project === b.project).sort((x, y) => x.seq - y.seq);
  const done = stages.filter(s => s.completed);
  const updates = store.list<ProjectUpdate>('projectUpdates').filter(u => u.project === b.project);
  const docs = store.list<DocumentRecord>('documents').filter(d => d.bookingId === b.id);
  const ag = store.list<Agreement>('agreements').find(a => a.bookingId === b.id);
  const tickets = store.list<SupportTicket>('supportTickets').filter(t => t.bookingId === b.id);
  const crm = store.getUsers().find(u => u.name === b.crmExec);
  const company = store.setting('company_name', 'GENXA Developers');

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title={`Welcome, ${b.customer.split(' ')[0]}`} subtitle={`${b.project}${project ? `, ${project.location}` : ''} · Unit ${b.unit} · ${b.unitType}${unit ? ` · ${unit.carpetArea} sq ft` : ''} · Booking ${b.id}`}
        actions={crm?.mobile ? <ContactButtons mobile={crm.mobile} name={crm.name} message={`Hello ${crm.name}, this is ${b.customer} (booking ${b.id}, unit ${b.unit}).`} /> : undefined} />
      {b.stage === 'Cancelled' && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">This booking has been cancelled. Refund details are in Payments.</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Construction" value={`${stages.length ? Math.round(done.reduce((s, x) => s + Number(x.percent), 0)) : 0}%`} icon={HardHat} hint={done.length ? `Last: ${done[done.length - 1].stageName}` : 'Not started'} />
        <StatCard label="Paid" value={inr(f.paid)} icon={Wallet} tone="green" hint={`${f.percentPaid}% of ${inr(f.grandTotal)}`} />
        <StatCard label="Due now" value={inr(f.outstanding)} icon={Wallet} tone={f.overdue ? 'red' : 'orange'} hint={f.nextDue ? `${f.nextDue.stageName} by ${fmtDate(f.nextDue.dueDate)}` : 'Nothing due'} />
        <StatCard label="Possession by" value={fmtDate(project?.possessionDate)} icon={Building2} tone="purple" hint={`RERA ${project?.reraNumber || '—'}`} />
      </div>
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'home', label: 'Construction' }, { id: 'pay', label: 'Payments' }, { id: 'docs', label: 'Documents' }, { id: 'help', label: 'Requests', count: tickets.filter(t => t.status !== 'Closed').length }]} />
        {tab === 'home' && (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ol className="space-y-3">
              {stages.map(s => (
                <li key={s.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${s.completed ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{s.completed ? '✓' : s.seq}</span>
                  <span className="text-sm text-gray-900 flex-1">{s.stageName}</span>
                  <span className="text-xs text-gray-500">{s.completed ? fmtDate(s.completedDate) : `${s.percent}%`}</span>
                </li>
              ))}
            </ol>
            <div className="space-y-3">
              <h4 className="text-sm text-gray-900">Site updates</h4>
              {updates.length === 0 && <p className="text-sm text-gray-500">No updates yet.</p>}
              {updates.map(u => (
                <div key={u.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {u.photoUrl && <img src={u.photoUrl} alt={u.title} className="w-full max-h-48 object-cover" />}
                  <div className="p-3"><div className="text-sm text-gray-900">{u.title}</div><div className="text-xs text-gray-500">{fmtDate(u.postedAt)}{u.stage ? ` · ${u.stage}` : ''}</div>{u.body && <p className="text-sm text-gray-700 mt-1">{u.body}</p>}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'pay' && (
          <div className="space-y-4 p-1">
            {f.outstanding > 0 && (
              <div className="m-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
                Pay <b>{inr(f.outstanding)}</b> by NEFT/RTGS/UPI to the {b.project} collection account and quote booking <b>{b.id}</b>. Your receipt appears here once Finance records it.
                {f.overdue > 0 && <> Interest of {inr(f.interest)} has accrued on overdue amounts at {store.settingNumber('late_interest_pct', 10.5)}% a year.</>}
              </div>
            )}
            <ScheduleTable booking={b} items={f.schedule} />
            <h4 className="px-3 text-sm text-gray-900">Receipts</h4>
            <LedgerTable payments={f.payments} />
            <div className="p-3"><button className={btnSecondary} onClick={() => printStatement(b)}><FileText className="w-4 h-4" />Statement of account</button></div>
          </div>
        )}
        {tab === 'docs' && (
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button className={btnSecondary} onClick={() => printCostSheet(b)}><FileText className="w-4 h-4" />Cost sheet</button>
              <button className={btnSecondary} onClick={() => printAllotmentLetter(b)}><FileText className="w-4 h-4" />Allotment letter</button>
              {ag && ag.status !== 'Draft' && <button className={btnSecondary} onClick={() => printAgreement(b, ag)}><FileText className="w-4 h-4" />Agreement</button>}
              {ag && ['Generated', 'Sent for Signature'].includes(ag.status) && <button className={btnPrimary} onClick={() => setSign(true)}><PenLine className="w-4 h-4" />Sign agreement</button>}
              {ag && ['Signed', 'Registered'].includes(ag.status) && <Badge tone="green">Agreement {ag.status.toLowerCase()} {fmtDate(ag.signedAt)}</Badge>}
            </div>
            <div>
              <h4 className="text-sm text-gray-900 mb-2">KYC documents</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {REQUIRED_KYC.map(t => {
                  const d = docs.filter(x => x.docType === t).sort((x, y) => (y.uploadedAt || '').localeCompare(x.uploadedAt || ''))[0];
                  return (
                    <div key={t} className="border border-gray-200 rounded-lg p-3 text-sm">
                      <div className="text-gray-900">{t}</div>
                      <div className="mt-1">{d ? <Badge>{d.status}</Badge> : <Badge tone="red">Missing</Badge>}</div>
                      {d?.status === 'Rejected' && <div className="text-xs text-red-700 mt-1">{d.remarks}</div>}
                      {(!d || d.status === 'Rejected') && <button className={`${btnSmall} mt-2`} onClick={() => setKyc(t)}><Upload className="w-3.5 h-3.5" />Upload</button>}
                    </div>
                  );
                })}
              </div>
            </div>
            <DocList docs={docs} />
          </div>
        )}
        {tab === 'help' && (
          <div className="p-4 space-y-3">
            <button className={btnPrimary} onClick={() => setNewTicket(true)}><Headphones className="w-4 h-4" />Raise a request</button>
            {tickets.length === 0 && <EmptyState>No requests yet.</EmptyState>}
            {tickets.map(t => (
              <button key={t.id} onClick={() => setTicket(t.id)} className="w-full text-left border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-center justify-between"><span className="text-sm text-gray-900">{t.issue}</span><Badge>{t.status}</Badge></div>
                <div className="text-xs text-gray-500">{t.id} · {t.category} · {fmtDateTime(t.createdAt)}{t.assignedTo ? ` · ${t.assignedTo}` : ''}</div>
              </button>
            ))}
          </div>
        )}
      </Panel>
      <p className="text-xs text-gray-400">{company} buyer portal. In production each buyer signs in with their mobile number (OTP) and sees only their own booking.</p>
      {kyc && <KycUploadDialog booking={b} defaultType={kyc} onClose={() => setKyc(null)} />}
      {sign && ag && <ESignDialog agreement={ag} booking={b} onClose={() => setSign(false)} />}
      {newTicket && <NewTicketDialog booking={b} raisedBy="Buyer portal" onClose={() => setNewTicket(false)} />}
      {ticket && <TicketDialog id={ticket} readOnly onClose={() => setTicket(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Post a construction update; optionally queue a WhatsApp to every buyer in the project. */
export function ProjectUpdatesPanel() {
  const store = getDataStore();
  const projects = store.getProjects();
  const [f, setF] = useState({ project: projects[0]?.name || '', title: '', body: '', stage: '', notify: true });
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const recent = store.list<ProjectUpdate>('projectUpdates').slice(0, 5);
  const post = async () => {
    if (!f.title.trim()) { toast.error('Add a title'); return; }
    setBusy(true);
    try {
      const photoUrl = photo ? await store.uploadFile(`updates/${f.project.replace(/\s+/g, '-')}`, photo) : undefined;
      await store.insert('projectUpdates', { project: f.project, title: f.title.trim(), body: f.body.trim() || undefined, stage: f.stage || undefined, photoUrl, postedBy: store.getPersona().name, postedAt: new Date().toISOString() });
      if (f.notify) {
        const buyers = liveBookings().filter(b => b.project === f.project);
        await store.insertMany('notifications', buyers.map(b => ({
          channel: 'WhatsApp', recipientName: b.customer, recipientContact: b.mobile, template: 'Construction Update',
          message: `Dear ${b.customer}, construction update for ${f.project}: ${f.title.trim()}. See photos in your buyer portal. - ${store.setting('company_name', 'GENXA Developers')}`,
          status: 'Queued', relatedType: 'booking', relatedId: b.id, sentBy: store.getPersona().name, scheduledFor: localDate(),
        })));
        toast.success(`Update posted; ${buyers.length} buyer messages queued`);
      } else toast.success('Update posted to the buyer portal');
      setF({ ...f, title: '', body: '', stage: '' });
      setPhoto(null);
    } catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <Panel title={<span className="inline-flex items-center gap-2"><ImageIcon className="w-4 h-4" />Construction updates for buyers</span>}>
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project"><select className={inputCls} value={f.project} onChange={e => setF({ ...f, project: e.target.value })}>{projects.map(p => <option key={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Stage"><select className={inputCls} value={f.stage} onChange={e => setF({ ...f, stage: e.target.value })}><option value="">—</option>{store.list<ProjectStage>('projectStages').filter(s => s.project === f.project).map(s => <option key={s.id}>{s.stageName}</option>)}</select></Field>
          </div>
          <Field label="Title" required><input className={inputCls} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="e.g. 12th slab cast in Tower B" /></Field>
          <Field label="Details"><textarea rows={2} className={inputCls} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} /></Field>
          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer text-sm text-gray-600 hover:bg-gray-50">
            <Camera className="w-4 h-4" />{photo ? photo.name : 'Add a site photo'}
            <input type="file" accept="image/*" className="hidden" onChange={e => setPhoto(e.target.files?.[0] || null)} />
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.notify} onChange={e => setF({ ...f, notify: e.target.checked })} />Queue a WhatsApp to every buyer in this project</label>
          <button className={btnPrimary} onClick={post} disabled={busy}>{busy ? <Spinner /> : <Send className="w-4 h-4" />}Post update</button>
        </div>
        <div className="space-y-2">
          {recent.map(u => <div key={u.id} className="text-sm border-b border-gray-100 pb-2"><div className="text-gray-900">{u.title}</div><div className="text-xs text-gray-500">{u.project} · {fmtDate(u.postedAt)} · {u.postedBy}</div></div>)}
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------

/** Phone-sized view for sales executives in the field. */
export function FieldApp() {
  const store = getDataStore();
  const persona = store.getPersona();
  const [day, setDay] = useState<'today' | 'tomorrow'>('today');
  const [checkIn, setCheckIn] = useState<SiteVisit | null>(null);
  const [logVisit, setLogVisit] = useState<SiteVisit | null>(null);
  const isExec = persona.role === 'Sales Executive';
  const [exec, setExec] = useState(isExec ? persona.name : store.getUsers().find(u => u.role === 'Sales Executive' && u.status === 'Active')?.name || '');
  const date = day === 'today' ? localDate() : addDays(localDate(), 1);
  const visits = store.getVisits().filter(v => v.salesExec === exec && v.date === date && v.status !== 'Cancelled').sort((a, b) => a.time.localeCompare(b.time));
  const doneToday = store.getVisits().filter(v => v.salesExec === exec && v.date === localDate() && v.status === 'Completed').length;
  const checkedIn = store.getVisits().filter(v => v.salesExec === exec && v.date === localDate() && v.checkinAt).length;

  return (
    <div className="space-y-4">
      <PageHeader title="Field app" subtitle="Phone view for sales executives at the site: navigate, call, check in with GPS and a photo, then log the outcome." />
      {!isExec && (
        <Field label="Sales executive"><select className={`${inputCls} max-w-xs`} value={exec} onChange={e => setExec(e.target.value)}>{store.getUsers().filter(u => u.role === 'Sales Executive').map(u => <option key={u.id}>{u.name}</option>)}</select></Field>
      )}
      <div className="mx-auto w-full max-w-sm sm:border-8 border-gray-900 rounded-xl sm:rounded-[2rem] bg-gray-50 overflow-hidden shadow-xl">
        <div className="bg-blue-700 text-white px-4 pt-5 pb-3">
          <div className="text-xs opacity-80">{store.setting('company_name', 'GENXA Developers')}</div>
          <div className="text-lg">Hi {exec.split(' ')[0]}</div>
          <div className="flex gap-4 text-xs mt-2 opacity-90"><span>{checkedIn} checked in</span><span>{doneToday} visits done today</span></div>
          <div className="flex mt-3 bg-blue-800 rounded-lg p-0.5 text-sm">
            {(['today', 'tomorrow'] as const).map(d => <button key={d} onClick={() => setDay(d)} className={`flex-1 py-1 rounded-md capitalize ${day === d ? 'bg-white text-blue-800' : ''}`}>{d}</button>)}
          </div>
        </div>
        <div className="p-3 space-y-3 min-h-[420px] max-h-[620px] overflow-y-auto">
          {visits.length === 0 && <p className="text-sm text-gray-500 text-center py-10">No visits {day}.</p>}
          {visits.map(v => {
            const p = store.getProjects().find(x => x.name === v.project);
            return (
              <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div><div className="text-gray-900">{v.customer}</div><div className="text-xs text-gray-500">{v.time} · {v.project}</div></div>
                  <Badge>{v.status}</Badge>
                </div>
                {v.checkinAt && <div className={`text-xs ${v.checkinDistanceM && v.checkinDistanceM > 500 ? 'text-orange-700' : 'text-green-700'}`}><MapPin className="w-3 h-3 inline" /> Checked in {fmtDateTime(v.checkinAt)}{v.checkinDistanceM !== undefined ? ` · ${v.checkinDistanceM < 1000 ? `${v.checkinDistanceM} m` : `${(v.checkinDistanceM / 1000).toFixed(1)} km`} from site` : ''}</div>}
                {v.photoUrl && <img src={v.photoUrl} alt="Check-in" className="rounded-lg max-h-32 w-full object-cover" />}
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  <a href={p?.latitude ? `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}` : '#'} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 text-gray-700"><Navigation className="w-4 h-4" />Route</a>
                  <a href={`tel:+91${v.mobile}`} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 text-gray-700"><Phone className="w-4 h-4" />Call</a>
                  <button disabled={day !== 'today' || !!v.checkinAt} onClick={() => setCheckIn(v)} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-blue-50 text-blue-700 disabled:opacity-40"><MapPin className="w-4 h-4" />Check in</button>
                  <button disabled={day !== 'today' || v.status === 'Completed'} onClick={() => setLogVisit(v)} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-green-50 text-green-700 disabled:opacity-40"><ClipboardCheck className="w-4 h-4" />Outcome</button>
                </div>
                {day === 'tomorrow' && <a className="block text-center text-xs text-green-700" href={waLink(v.mobile, `Hello ${v.customer}, looking forward to meeting you at ${v.project} tomorrow at ${v.time}. - ${exec}`)} target="_blank" rel="noreferrer">Send WhatsApp reminder</a>}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center">Open this page on a phone to use it in the field. A native app (React Native) can reuse the same database and rules.</p>
      {checkIn && <CheckInDialog visit={checkIn} onClose={() => setCheckIn(null)} />}
      {logVisit && <LogVisitExecutionDialog visit={logVisit} onClose={() => setLogVisit(null)} onSuccess={() => {}} />}
    </div>
  );
}


