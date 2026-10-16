// Channel partners: the sourcing team's dashboard, onboarding, commission
// payouts, and the partner's own portal (persona "Channel Partner").
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Briefcase, Users, TrendingUp, IndianRupee, Plus, Download, Star, Eye, Wallet, UserPlus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, ChannelPartner, Booking, CommissionPayout, Lead, localDate, toastError, toCrmError } from '../lib/dataStore';
import { bookingFinance } from '../lib/crm';
import { inr, inrShort, fmtDate, downloadCSV, today, isValidMobile, isValidEmail, normaliseMobile } from '../lib/format';
import { PageHeader, StatCard, Panel, Badge, thCls, tdCls, btnPrimary, btnSecondary, btnSmall, inputCls, Modal, Field, Spinner, EmptyState, Tabs, ContactButtons } from './common';

// ---------------- commission maths ----------------

export function commissionEligible(cp: ChannelPartner, b: Booking): boolean {
  if (b.stage === 'Cancelled') return false;
  const terms = (cp.paymentTerms || '').toLowerCase();
  if (terms.includes('agreement')) return ['Agreement Done', 'Documentation', 'Fully Paid', 'Possession Done', 'Completed'].includes(b.stage);
  const pct = terms.match(/(\d+)\s*%/);
  if (pct) return bookingFinance(b).percentPaid >= Number(pct[1]);
  return true;
}

export interface CPStats {
  cp: ChannelPartner;
  leads: Lead[];
  visits: number;
  bookings: Booking[];
  bookingValue: number;
  earned: number;      // on eligible bookings
  accrued: number;     // on all live bookings
  paid: number;
  due: number;
  payouts: CommissionPayout[];
}

export function cpStats(cp: ChannelPartner): CPStats {
  const store = getDataStore();
  const leads = store.getLeads().filter(l => l.cpId === cp.id);
  const leadIds = new Set(leads.map(l => l.id));
  const bookings = store.getBookings().filter(b => b.cpId === cp.id || (b.leadId && leadIds.has(b.leadId)));
  const live = bookings.filter(b => b.stage !== 'Cancelled');
  const value = (b: Booking) => (b.price - b.discount) * (cp.commissionRate || 0) / 100;
  const payouts = store.list<CommissionPayout>('commissionPayouts').filter(p => p.cpId === cp.id);
  const paid = payouts.reduce((s, p) => s + p.amount, 0);
  const earned = Math.round(live.filter(b => commissionEligible(cp, b)).reduce((s, b) => s + value(b), 0));
  return {
    cp, leads, bookings,
    visits: store.getVisits().filter(v => leadIds.has(v.leadId) && v.status === 'Completed').length,
    bookingValue: live.reduce((s, b) => s + b.price - b.discount, 0),
    earned, accrued: Math.round(live.reduce((s, b) => s + value(b), 0)), paid, due: Math.max(0, earned - paid), payouts,
  };
}

/** Commission still unpaid per booking. */
function bookingDues(s: CPStats) {
  return s.bookings.filter(b => b.stage !== 'Cancelled').map(b => {
    const amount = Math.round((b.price - b.discount) * (s.cp.commissionRate || 0) / 100);
    const paid = s.payouts.filter(p => p.bookingId === b.id).reduce((a, p) => a + p.amount, 0);
    return { booking: b, amount, paid, due: Math.max(0, amount - paid), eligible: commissionEligible(s.cp, b) };
  });
}

// ---------------- internal dashboard ----------------

export function ChannelPartnerDashboard() {
  const store = getDataStore();
  const [search, setSearch] = useState('');
  const [onboard, setOnboard] = useState(false);
  const [profile, setProfile] = useState<ChannelPartner | null>(null);
  const [payout, setPayout] = useState<ChannelPartner | null>(null);
  const stats = store.getChannelPartners().map(cpStats);
  const shown = stats.filter(s => !search || `${s.cp.id} ${s.cp.companyName} ${s.cp.contactPerson} ${s.cp.location}`.toLowerCase().includes(search.toLowerCase()));
  const chart = stats.filter(s => s.cp.status === 'Active').map(s => ({ name: s.cp.companyName, Leads: s.leads.length, Visits: s.visits, Bookings: s.bookings.filter(b => b.stage !== 'Cancelled').length }));

  const report = () => downloadCSV(`channel-partners-${today()}.csv`, stats.map(s => ({
    id: s.cp.id, company: s.cp.companyName, contact: s.cp.contactPerson, mobile: s.cp.mobile, status: s.cp.status, rating: s.cp.rating,
    leads: s.leads.length, visits: s.visits, bookings: s.bookings.filter(b => b.stage !== 'Cancelled').length, booking_value: s.bookingValue,
    rate_pct: s.cp.commissionRate, commission_earned: s.earned, commission_paid: s.paid, commission_due: s.due,
  })));

  return (
    <div className="space-y-6">
      <PageHeader title="Channel Partners" subtitle="Partner performance, registered leads and commission. A buyer already in the CRM can't be claimed by a second partner."
        actions={<>
          <button className={btnSecondary} onClick={report}><Download className="w-4 h-4" />Performance report</button>
          <button className={btnPrimary} onClick={() => setOnboard(true)}><Plus className="w-4 h-4" />Onboard partner</button>
        </>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active partners" value={stats.filter(s => s.cp.status === 'Active').length} icon={Briefcase} hint={`${stats.length} in total`} />
        <StatCard label="Partner leads" value={stats.reduce((a, s) => a + s.leads.length, 0)} icon={Users} tone="green" />
        <StatCard label="Partner bookings" value={stats.reduce((a, s) => a + s.bookings.filter(b => b.stage !== 'Cancelled').length, 0)} icon={TrendingUp} tone="purple" hint={inrShort(stats.reduce((a, s) => a + s.bookingValue, 0))} />
        <StatCard label="Commission due" value={inrShort(stats.reduce((a, s) => a + s.due, 0))} icon={IndianRupee} tone="orange" hint={`${inrShort(stats.reduce((a, s) => a + s.paid, 0))} paid so far`} />
      </div>

      <Panel title="Leads to bookings by partner">
        <div className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip /><Legend />
              <Bar dataKey="Leads" fill="#93c5fd" /><Bar dataKey="Visits" fill="#3b82f6" /><Bar dataKey="Bookings" fill="#1e3a8a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Partner directory" actions={<input className={`${inputCls} sm:max-w-[16rem]`} placeholder="Search partners" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search partners" />}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>{['Partner', 'Contact', 'Leads', 'Visits', 'Bookings', 'Commission due', 'Rating', 'Status', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map(s => (
                <tr key={s.cp.id} className="hover:bg-gray-50">
                  <td className={tdCls}>{s.cp.companyName}<div className="text-xs text-gray-500">{s.cp.id} · {s.cp.location}</div></td>
                  <td className={tdCls}>{s.cp.contactPerson}<div className="text-xs text-gray-500">{s.cp.mobile}</div></td>
                  <td className={tdCls}>{s.leads.length}</td>
                  <td className={tdCls}>{s.visits}</td>
                  <td className={tdCls}>{s.bookings.filter(b => b.stage !== 'Cancelled').length}<div className="text-xs text-gray-500">{inrShort(s.bookingValue)}</div></td>
                  <td className={`${tdCls} whitespace-nowrap`}>{inr(s.due)}<div className="text-xs text-gray-500">{s.cp.commissionRate}% · paid {inrShort(s.paid)}</div></td>
                  <td className={tdCls}><span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />{s.cp.rating || '—'}</span></td>
                  <td className={tdCls}><Badge>{s.cp.status}</Badge></td>
                  <td className={`${tdCls} whitespace-nowrap`}>
                    <span className="inline-flex gap-1">
                      <button className={btnSmall} onClick={() => setProfile(s.cp)}><Eye className="w-3.5 h-3.5" />Profile</button>
                      <button className={btnSmall} disabled={s.due <= 0} onClick={() => setPayout(s.cp)}><Wallet className="w-3.5 h-3.5" />Pay</button>
                      <ContactButtons compact mobile={s.cp.mobile} name={s.cp.contactPerson} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && <EmptyState>No partners match.</EmptyState>}
        </div>
      </Panel>

      {onboard && <OnboardCPDialog onClose={() => setOnboard(false)} />}
      {profile && <CPProfileDialog cp={profile} onClose={() => setProfile(null)} />}
      {payout && <ProcessCommissionDialog cp={payout} onClose={() => setPayout(null)} />}
    </div>
  );
}

// ---------------- dialogs ----------------

export function OnboardCPDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const store = getDataStore();
  const [f, setF] = useState({ companyName: '', contactPerson: '', mobile: '', email: '', location: '', reraNumber: '', commissionRate: 2, paymentTerms: 'On Agreement', bankDetails: '', remarks: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: k === 'commissionRate' ? Number(e.target.value) : e.target.value });
  const submit = async () => {
    if (!f.companyName.trim() || !f.contactPerson.trim()) { toast.error('Company and contact person are required'); return; }
    if (!isValidMobile(f.mobile)) { toast.error('Enter a valid 10-digit mobile'); return; }
    if (!f.email || !isValidEmail(f.email)) { toast.error('Enter a valid email'); return; }
    if (!(f.commissionRate > 0 && f.commissionRate <= 10)) { toast.error('Commission rate should be between 0 and 10%'); return; }
    if (store.getChannelPartners().some(c => normaliseMobile(c.mobile) === normaliseMobile(f.mobile))) { toast.error('A partner with this mobile already exists'); return; }
    setBusy(true);
    try {
      const cp = await store.addChannelPartner({
        ...f, mobile: normaliseMobile(f.mobile), commissionType: 'Percentage of Deal Value', status: 'Active', rating: 0, onboardedDate: localDate(),
      });
      toast.success(`${cp.companyName} onboarded as ${cp.id}`);
      onSuccess?.();
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="Onboard channel partner" size="lg"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={submit} disabled={busy}>{busy && <Spinner />}Onboard</button></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Company name" required><input className={inputCls} value={f.companyName} onChange={set('companyName')} /></Field>
        <Field label="Contact person" required><input className={inputCls} value={f.contactPerson} onChange={set('contactPerson')} /></Field>
        <Field label="Mobile" required><input className={inputCls} value={f.mobile} onChange={set('mobile')} inputMode="numeric" /></Field>
        <Field label="Email" required><input className={inputCls} value={f.email} onChange={set('email')} /></Field>
        <Field label="Location"><input className={inputCls} value={f.location} onChange={set('location')} /></Field>
        <Field label="RERA agent no."><input className={inputCls} value={f.reraNumber} onChange={set('reraNumber')} /></Field>
        <Field label="Commission (% of agreement value)" required><input type="number" step="0.25" className={inputCls} value={f.commissionRate} onChange={set('commissionRate')} /></Field>
        <Field label="Payable">
          <select className={inputCls} value={f.paymentTerms} onChange={set('paymentTerms')}><option>On Booking</option><option>On Agreement</option><option>On 20% Payment</option></select>
        </Field>
        <div className="md:col-span-2"><Field label="Bank details"><input className={inputCls} value={f.bankDetails} onChange={set('bankDetails')} placeholder="Bank, account no., IFSC" /></Field></div>
        <div className="md:col-span-2"><Field label="Remarks"><textarea rows={2} className={inputCls} value={f.remarks} onChange={set('remarks')} /></Field></div>
      </div>
    </Modal>
  );
}

export function CPProfileDialog({ cp, onClose }: { cp: ChannelPartner; onClose: () => void }) {
  const store = getDataStore();
  const s = cpStats(cp);
  const [tab, setTab] = useState('bookings');
  const setRating = (r: number) => store.updateChannelPartner(cp.id, { rating: r });
  const toggle = () => store.updateChannelPartner(cp.id, { status: cp.status === 'Active' ? 'Inactive' : 'Active' });
  const current = store.getChannelPartners().find(c => c.id === cp.id) || cp;
  return (
    <Modal open onClose={onClose} title={current.companyName} subtitle={`${current.id} · ${current.contactPerson} · ${current.mobile} · ${current.email}`} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <StatCard label="Leads" value={s.leads.length} />
          <StatCard label="Site visits" value={s.visits} />
          <StatCard label="Bookings" value={s.bookings.filter(b => b.stage !== 'Cancelled').length} />
          <StatCard label="Commission earned" value={inrShort(s.earned)} hint={`${inrShort(s.accrued)} incl. not yet payable`} />
          <StatCard label="Paid / due" value={`${inrShort(s.paid)} / ${inrShort(s.due)}`} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-gray-600">Rating</span>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setRating(n)} aria-label={`Rate ${n}`}><Star className={`w-5 h-5 ${n <= Math.round(current.rating || 0) ? 'text-yellow-500 fill-yellow-400' : 'text-gray-300'}`} /></button>
          ))}
          <span className="text-gray-500">Commission {current.commissionRate}% · {current.paymentTerms || 'On Booking'} · RERA {current.reraNumber || '—'}</span>
          <span className="flex-1" />
          <button className={btnSmall} onClick={toggle}>{current.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
        </div>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'bookings', label: 'Bookings', count: s.bookings.length }, { id: 'leads', label: 'Leads', count: s.leads.length }, { id: 'payouts', label: 'Payouts', count: s.payouts.length }]} />
        {tab === 'bookings' && <CPBookingsTable stats={s} />}
        {tab === 'leads' && <CPLeadsTable leads={s.leads} />}
        {tab === 'payouts' && <PayoutTable payouts={s.payouts} />}
      </div>
    </Modal>
  );
}

function CPBookingsTable({ stats }: { stats: CPStats }) {
  const rows = bookingDues(stats);
  if (rows.length === 0) return <EmptyState>No bookings yet.</EmptyState>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50"><tr>{['Booking', 'Customer', 'Unit', 'Value', 'Stage', 'Commission', 'Paid', 'Due', 'Payable?'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(r => (
            <tr key={r.booking.id}>
              <td className={tdCls}>{r.booking.id}<div className="text-xs text-gray-500">{fmtDate(r.booking.bookingDate)}</div></td>
              <td className={tdCls}>{r.booking.customer}</td>
              <td className={`${tdCls} whitespace-nowrap`}>{r.booking.project} {r.booking.unit}</td>
              <td className={`${tdCls} whitespace-nowrap`}>{inrShort(r.booking.price - r.booking.discount)}</td>
              <td className={tdCls}><Badge>{r.booking.stage}</Badge></td>
              <td className={`${tdCls} whitespace-nowrap`}>{inr(r.amount)}</td>
              <td className={`${tdCls} whitespace-nowrap`}>{inr(r.paid)}</td>
              <td className={`${tdCls} whitespace-nowrap`}>{inr(r.due)}</td>
              <td className={tdCls}>{r.eligible ? <Badge tone="green">Yes</Badge> : <Badge tone="gray">Not yet</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CPLeadsTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) return <EmptyState>No leads registered.</EmptyState>;
  return (
    <div className="overflow-x-auto max-h-[360px]">
      <table className="w-full">
        <thead className="bg-gray-50 sticky top-0"><tr>{['Lead', 'Name', 'Project', 'Registered', 'Status', 'Telecaller'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map(l => (
            <tr key={l.id}>
              <td className={tdCls}>{l.id}</td><td className={tdCls}>{l.name}<div className="text-xs text-gray-500">{l.mobile.replace(/^(\d{2})\d{5}/, '$1XXXXX')}</div></td>
              <td className={tdCls}>{l.project}</td><td className={`${tdCls} whitespace-nowrap text-gray-600`}>{fmtDate(l.createdAt)}</td>
              <td className={tdCls}><Badge tone={l.status === 'Booked' ? 'purple' : l.status === 'Dead' ? 'gray' : 'blue'}>{l.status}</Badge></td>
              <td className={`${tdCls} text-gray-600`}>{l.assignedTo || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayoutTable({ payouts }: { payouts: CommissionPayout[] }) {
  if (payouts.length === 0) return <EmptyState>No payouts yet.</EmptyState>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50"><tr>{['Payout', 'Date', 'Booking', 'Mode', 'Reference', 'Amount'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {payouts.map(p => (
            <tr key={p.id}><td className={tdCls}>{p.id}</td><td className={tdCls}>{fmtDate(p.paidDate)}</td><td className={tdCls}>{p.bookingId || '—'}</td>
              <td className={tdCls}>{p.mode}</td><td className={tdCls}>{p.reference}</td><td className={tdCls}>{inr(p.amount)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProcessCommissionDialog({ cp, onClose, onSuccess }: { cp: ChannelPartner; onClose: () => void; onSuccess?: () => void }) {
  const store = getDataStore();
  const s = cpStats(cp);
  const dues = bookingDues(s).filter(d => d.eligible && d.due > 0);
  const [bookingId, setBookingId] = useState(dues[0]?.booking.id || '');
  const sel = dues.find(d => d.booking.id === bookingId);
  const [amount, setAmount] = useState(sel?.due || 0);
  const [mode, setMode] = useState('NEFT');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!sel) { toast.error('Choose a booking'); return; }
    if (!(amount > 0) || amount > sel.due) { toast.error(`Amount must be between 1 and ${inr(sel.due)}`); return; }
    if (!reference.trim()) { toast.error('Enter the payment reference (UTR / cheque no.)'); return; }
    setBusy(true);
    try {
      await store.insert('commissionPayouts', { cpId: cp.id, bookingId: sel.booking.id, amount, mode, reference: reference.trim(), paidDate: localDate() });
      toast.success(`Commission of ${inr(amount)} paid to ${cp.companyName}`);
      onSuccess?.();
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`Pay commission · ${cp.companyName}`} subtitle={`Payable now ${inr(s.due)} at ${cp.commissionRate}% (${cp.paymentTerms || 'On Booking'})`}
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={submit} disabled={busy || !sel}>{busy && <Spinner />}Record payout</button></>}>
      {dues.length === 0 ? <EmptyState>Nothing is payable yet. Commission becomes payable as bookings reach the agreed stage.</EmptyState> : (
        <div className="space-y-4">
          <Field label="Booking" required>
            <select className={inputCls} value={bookingId} onChange={e => { setBookingId(e.target.value); setAmount(dues.find(d => d.booking.id === e.target.value)?.due || 0); }}>
              {dues.map(d => <option key={d.booking.id} value={d.booking.id}>{d.booking.id} · {d.booking.customer} · {d.booking.unit} · due {inr(d.due)}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Amount (₹)" required><input type="number" className={inputCls} value={amount || ''} onChange={e => setAmount(Number(e.target.value))} /></Field>
            <Field label="Mode"><select className={inputCls} value={mode} onChange={e => setMode(e.target.value)}>{['NEFT', 'RTGS', 'Cheque', 'UPI'].map(m => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Reference" required><input className={inputCls} value={reference} onChange={e => setReference(e.target.value)} /></Field>
          </div>
          <p className="text-xs text-gray-500">TDS under section 194H and GST on commission are handled in accounts; export the payout list for Tally from Payments.</p>
        </div>
      )}
    </Modal>
  );
}

// ---------------- partner portal ----------------

export function CPPortal() {
  const store = getDataStore();
  const persona = store.getPersona();
  const cp = store.getChannelPartners().find(c => c.id === persona.refId);
  const [tab, setTab] = useState('leads');
  const [f, setF] = useState({ name: '', mobile: '', email: '', project: store.getProjects()[0]?.name || '', budget: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  if (!cp) return <EmptyState>Choose a channel partner in "Viewing as".</EmptyState>;
  const s = cpStats(cp);

  const register = async () => {
    setConflict(null);
    if (!f.name.trim() || !isValidMobile(f.mobile)) { toast.error('Enter the buyer name and a valid 10-digit mobile'); return; }
    if (!isValidEmail(f.email)) { toast.error('Enter a valid email'); return; }
    const existing = store.getLeads().find(l => l.status !== 'Dead' && normaliseMobile(l.mobile) === normaliseMobile(f.mobile));
    if (existing) {
      setConflict(existing.cpId === cp.id ? `You registered this buyer already (lead ${existing.id}, status ${existing.status}).` : 'This buyer is already registered with us, so it cannot be claimed. Contact your sourcing manager if you believe this is wrong.');
      return;
    }
    setBusy(true);
    try {
      const assignee = await store.rpc<string | null>('auto_assign_telecaller', { p_project: f.project }).catch(() => null);
      const lead = await store.addLead({
        name: f.name.trim(), mobile: normaliseMobile(f.mobile), email: f.email, source: 'Channel Partners', project: f.project, status: 'New',
        assignedTo: assignee || null, priority: 'Warm', budget: f.budget || undefined, cpId: cp.id, notes: `Registered by ${cp.companyName} via partner portal${f.notes ? `. ${f.notes}` : ''}`,
      });
      toast.success(`Buyer registered as ${lead.id}. It is now protected for ${cp.companyName}.`);
      setF({ ...f, name: '', mobile: '', email: '', budget: '', notes: '' });
    } catch (err) {
      const e = toCrmError(err);
      if (e.code === 'DUPLICATE_LEAD') setConflict('This buyer is already registered with us, so it cannot be claimed.');
      else toastError(e);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Partner portal · ${cp.companyName}`} subtitle={`Partner ID ${cp.id} · commission ${cp.commissionRate}% of agreement value, ${cp.paymentTerms || 'on booking'}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Buyers registered" value={s.leads.length} icon={Users} />
        <StatCard label="Site visits done" value={s.visits} icon={TrendingUp} tone="green" />
        <StatCard label="Bookings" value={s.bookings.filter(b => b.stage !== 'Cancelled').length} icon={Briefcase} tone="purple" hint={inrShort(s.bookingValue)} />
        <StatCard label="Commission due" value={inr(s.due)} icon={IndianRupee} tone="orange" hint={`Paid ${inr(s.paid)} · pipeline ${inrShort(s.accrued - s.earned)}`} />
      </div>
      <Panel title={<span className="inline-flex items-center gap-2"><UserPlus className="w-4 h-4 text-blue-600" />Register a buyer</span>}>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Buyer name" required><input className={inputCls} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Mobile" required><input className={inputCls} value={f.mobile} onChange={e => setF({ ...f, mobile: e.target.value })} inputMode="numeric" /></Field>
            <Field label="Email"><input className={inputCls} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Project"><select className={inputCls} value={f.project} onChange={e => setF({ ...f, project: e.target.value })}>{store.getProjects().map(p => <option key={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Budget"><select className={inputCls} value={f.budget} onChange={e => setF({ ...f, budget: e.target.value })}><option value="">—</option>{['Below 50L', '50L - 75L', '75L - 1Cr', '1Cr - 1.5Cr', 'Above 1.5Cr'].map(b => <option key={b}>{b}</option>)}</select></Field>
            <Field label="Notes"><input className={inputCls} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></Field>
          </div>
          {conflict && <div className="flex gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"><AlertTriangle className="w-4 h-4 mt-0.5" />{conflict}</div>}
          <button className={btnPrimary} onClick={register} disabled={busy}>{busy && <Spinner />}Register buyer</button>
        </div>
      </Panel>
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'leads', label: 'My buyers', count: s.leads.length }, { id: 'bookings', label: 'Bookings & commission', count: s.bookings.length }, { id: 'payouts', label: 'Payouts', count: s.payouts.length }]} />
        {tab === 'leads' && <CPLeadsTable leads={s.leads} />}
        {tab === 'bookings' && <CPBookingsTable stats={s} />}
        {tab === 'payouts' && <PayoutTable payouts={s.payouts} />}
      </Panel>
    </div>
  );
}
