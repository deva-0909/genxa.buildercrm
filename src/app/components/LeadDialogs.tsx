// Lead and visit dialogs: call logging, GPS check-in with photo, proposals,
// sales follow-up updates, lead history and personal targets.
import { useEffect, useState } from 'react';
import { MapPin, Camera, Phone, Send, FileText, Navigation, CheckCircle, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Lead, SiteVisit, CallLog, Unit, Persona, localDate, toastError } from '../lib/dataStore';
import { leadScore, unitPrice } from '../lib/crm';
import { inr, inrShort, fmtDate, fmtDateTime, monthKey, today, waLink, isValidEmail } from '../lib/format';
import { printProposal } from '../lib/documents';
import { Modal, Field, inputCls, btnPrimary, btnSecondary, Badge, Tabs, thCls, tdCls, Spinner, EmptyState, ProgressBar, ContactButtons, StatCard } from './common';
import { AuditTimeline } from './BookingParts';

export const CALL_OUTCOMES = ['Connected', 'No Answer', 'Busy', 'Switched Off', 'Wrong Number', 'Call Back Later', 'Not Interested'];

// ---------------------------------------------------------------------------

export function CallLogDialog({ leadId, customerName, onClose, onSuccess }: { leadId: string; customerName: string; onClose: () => void; onSuccess?: () => void }) {
  const store = getDataStore();
  const persona = store.getPersona();
  const lead = store.getLeads().find(l => l.id === leadId);
  const [f, setF] = useState<{ outcome: string; interest: string; status: string; duration: number; nextFollowUp: string; notes: string }>({ outcome: 'Connected', interest: lead?.priority || 'Warm', status: lead?.status === 'New' ? 'Contacted' : lead?.status || 'Contacted', duration: 2, nextFollowUp: '', notes: '' });
  const [busy, setBusy] = useState(false);
  if (!lead) return null;
  const save = async () => {
    if (f.nextFollowUp && f.nextFollowUp < localDate()) { toast.error('Next follow-up cannot be in the past'); return; }
    if (f.outcome === 'Connected' && !f.notes.trim()) { toast.error('Add a short note about the conversation'); return; }
    setBusy(true);
    try {
      await store.insert<CallLog>('callLogs', {
        leadId, caller: persona.name, direction: 'Outbound', outcome: f.outcome, durationSec: f.outcome === 'Connected' ? Math.round(f.duration * 60) : 0,
        notes: f.notes.trim() || undefined, provider: 'Manual', calledAt: new Date().toISOString(),
      });
      const updates: Partial<Lead> = { lastContactedAt: new Date().toISOString(), callAttempts: (lead.callAttempts || 0) + 1 };
      if (f.notes.trim()) updates.notes = `${f.notes.trim()}${lead.notes ? ` | ${lead.notes}` : ''}`.slice(0, 1000);
      if (f.outcome === 'Connected') { updates.status = f.status as Lead['status']; updates.priority = f.interest as Lead['priority']; }
      if (f.outcome === 'Not Interested' || f.outcome === 'Wrong Number') updates.status = 'Dead';
      if (f.nextFollowUp) updates.nextFollowUp = f.nextFollowUp;
      await store.patch('leads', leadId, updates);
      toast.success(`Call logged for ${customerName}`);
      onSuccess?.();
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`Log call · ${customerName}`} subtitle={`${lead.id} · ${lead.mobile} · attempt ${(lead.callAttempts || 0) + 1}`}
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy && <Spinner />}Save call</button></>}>
      <div className="space-y-4">
        <div className="flex gap-2"><ContactButtons mobile={lead.mobile} name={lead.name} leadId={lead.id} message={`Hello ${lead.name}, this is ${persona.name} from ${store.setting('company_name', 'GENXA Developers')} about ${lead.project}.`} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Outcome" required><select className={inputCls} value={f.outcome} onChange={e => setF({ ...f, outcome: e.target.value })}>{CALL_OUTCOMES.map(o => <option key={o}>{o}</option>)}</select></Field>
          {f.outcome === 'Connected' && <Field label="Duration (minutes)"><input type="number" min={0} step={0.5} className={inputCls} value={f.duration} onChange={e => setF({ ...f, duration: Number(e.target.value) })} /></Field>}
          {f.outcome === 'Connected' && <Field label="Lead status"><select className={inputCls} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>{['Contacted', 'Follow-up', 'Qualified'].map(o => <option key={o}>{o}</option>)}</select></Field>}
          {f.outcome === 'Connected' && <Field label="Interest"><select className={inputCls} value={f.interest} onChange={e => setF({ ...f, interest: e.target.value })}>{['Hot', 'Warm', 'Cold'].map(o => <option key={o}>{o}</option>)}</select></Field>}
          {!['Not Interested', 'Wrong Number'].includes(f.outcome) && <Field label="Next follow-up"><input type="date" min={localDate()} className={inputCls} value={f.nextFollowUp} onChange={e => setF({ ...f, nextFollowUp: e.target.value })} /></Field>}
        </div>
        {['Not Interested', 'Wrong Number'].includes(f.outcome) && <p className="text-sm text-orange-700">The lead will be marked Dead.</p>}
        <Field label="Notes" required={f.outcome === 'Connected'}><textarea rows={3} className={inputCls} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} placeholder="Requirement, budget, objections, family decision-maker…" /></Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

/** Distance in metres between two coordinates. */
export function distanceM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000, r = (d: number) => d * Math.PI / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

export function CheckInDialog({ visit, onClose, onSuccess }: { visit: SiteVisit; onClose: () => void; onSuccess?: () => void }) {
  const store = getDataStore();
  const project = store.getProjects().find(p => p.name === visit?.project);
  const [pos, setPos] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [geoError, setGeoError] = useState('');
  const [locating, setLocating] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [customerPresent, setCustomerPresent] = useState(true);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const locate = () => {
    if (!navigator.geolocation) { setGeoError('This device does not support location'); return; }
    setLocating(true); setGeoError('');
    navigator.geolocation.getCurrentPosition(
      p => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }); setLocating(false); },
      e => { setGeoError(e.code === 1 ? 'Location permission was denied. Allow location for this site and try again.' : 'Could not get the location. Move to an open area and retry.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };
  useEffect(() => { locate(); }, []);
  useEffect(() => { if (!photo) { setPreview(''); return; } const u = URL.createObjectURL(photo); setPreview(u); return () => URL.revokeObjectURL(u); }, [photo]);
  if (!visit) return null;
  const dist = pos && project?.latitude && project?.longitude ? distanceM(pos.lat, pos.lng, project.latitude, project.longitude) : null;
  const far = dist !== null && dist > 500;

  const save = async () => {
    if (!pos) { toast.error('Location is required to check in'); return; }
    if (far && !notes.trim()) { toast.error(`You are ${(dist! / 1000).toFixed(1)} km from the site. Add a note explaining why.`); return; }
    setBusy(true);
    try {
      const photoUrl = photo ? await store.uploadFile(`checkins/${visit.id}`, photo) : undefined;
      await store.patch('visits', visit.id, {
        checkinLat: pos.lat, checkinLng: pos.lng, checkinAt: new Date().toISOString(), checkinDistanceM: dist ?? undefined, photoUrl,
        status: visit.status === 'Scheduled' || visit.status === 'Tentative' ? 'Confirmed' : visit.status,
        notes: [visit.notes, `Checked in ${new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}${dist !== null ? `, ${dist} m from site` : ''}${customerPresent ? '' : ', customer not yet arrived'}${notes ? `. ${notes}` : ''}`].filter(Boolean).join('\n'),
      });
      toast.success(far ? `Checked in ${(dist! / 1000).toFixed(1)} km from ${visit.project} (flagged)` : `Checked in at ${visit.project}`);
      onSuccess?.();
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title="Site check-in" subtitle={`${visit.customer} · ${visit.project} · ${fmtDate(visit.date)} ${visit.time}`}
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy || !pos}>{busy ? <Spinner /> : <CheckCircle className="w-4 h-4" />}Check in</button></>}>
      <div className="space-y-4">
        <div className={`p-3 rounded-lg border text-sm ${!pos ? 'bg-gray-50 border-gray-200' : far ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />
            {locating ? 'Getting your location…' : pos ? <>Location found (±{pos.acc} m){dist !== null && <> · <b>{dist < 1000 ? `${dist} m` : `${(dist / 1000).toFixed(1)} km`}</b> from {visit.project}</>}</> : geoError || 'Location not available'}
          </div>
          {pos && <a className="text-xs text-blue-700 hover:underline" href={`https://maps.google.com/?q=${pos.lat},${pos.lng}`} target="_blank" rel="noreferrer">View on map</a>}
          {!pos && !locating && <button className="text-xs text-blue-700 hover:underline ml-6" onClick={locate}>Try again</button>}
          {far && <p className="text-xs text-orange-800 mt-1">More than 500 m from the site. The check-in will be flagged for your manager.</p>}
        </div>
        <Field label="Site photo" hint="Optional: a photo with the customer or at the sample flat">
          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer text-sm text-gray-600 hover:bg-gray-50">
            <Camera className="w-4 h-4" />{photo ? photo.name : 'Take or choose a photo'}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setPhoto(e.target.files?.[0] || null)} />
          </label>
          {preview && <img src={preview} alt="Check-in" className="mt-2 max-h-40 rounded-lg" />}
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={customerPresent} onChange={e => setCustomerPresent(e.target.checked)} />Customer has arrived</label>
        <Field label="Notes" required={far}><textarea rows={2} className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

export function SendProposalDialog({ lead, onClose, onSuccess }: { lead: { id: string; customer?: string; name?: string; mobile: string; project: string }; onClose: () => void; onSuccess?: () => void }) {
  const store = getDataStore();
  const persona = store.getPersona();
  const name = lead.customer || lead.name || '';
  const fullLead = store.getLeads().find(l => l.id === lead.id);
  const available = store.getUnits().filter(u => u.project === lead.project && u.status === 'Available').sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }));
  const [type, setType] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [discount, setDiscount] = useState(0);
  const [valid, setValid] = useState(7);
  const [via, setVia] = useState('WhatsApp');
  const [email, setEmail] = useState(fullLead?.email || '');
  const [busy, setBusy] = useState(false);
  const types = Array.from(new Set(available.map(u => u.unitType)));
  const list = available.filter(u => !type || u.unitType === type).slice(0, 60);
  const units = available.filter(u => picked.includes(u.id));
  const limit = store.settingNumber('discount_limit_pct', 2);
  const maxDiscPct = units.length ? Math.max(...units.map(u => discount * 100 / unitPrice(u).total)) : 0;

  const send = async () => {
    if (units.length === 0) { toast.error('Pick at least one unit'); return; }
    if (units.length > 3) { toast.error('Offer at most 3 units in one proposal'); return; }
    if (via === 'Email' && !isValidEmail(email)) { toast.error('Enter a valid email'); return; }
    setBusy(true);
    try {
      printProposal({ name, mobile: lead.mobile, project: lead.project }, units, discount, valid);
      const summary = units.map(u => `${u.unitNumber} (${u.unitType}, ${u.carpetArea} sq ft) ${inrShort(unitPrice(u).total - discount)}`).join('; ');
      const msg = `Dear ${name}, as discussed, here is our offer at ${lead.project}: ${summary}${discount ? `, including a special discount of ${inr(discount)}` : ''}. Valid till ${fmtDate(new Date(Date.now() + valid * 86400000).toISOString())}. The detailed proposal PDF follows. - ${persona.name}`;
      await store.insert('notifications', { channel: via, recipientName: name, recipientContact: via === 'Email' ? email : lead.mobile, template: 'Proposal', message: msg, status: 'Sent', relatedType: 'lead', relatedId: lead.id, sentBy: persona.name, sentAt: new Date().toISOString() });
      if (fullLead) await store.patch('leads', lead.id, { notes: `Proposal sent: ${summary}${fullLead.notes ? ` | ${fullLead.notes}` : ''}`.slice(0, 1000), priority: 'Hot' });
      if (via === 'WhatsApp') window.open(waLink(lead.mobile, msg), '_blank');
      else window.open(`mailto:${email}?subject=${encodeURIComponent(`Proposal - ${lead.project}`)}&body=${encodeURIComponent(msg)}`, '_self');
      toast.success(`Proposal for ${units.length} unit(s) sent to ${name}. Save the opened PDF and attach it.`);
      onSuccess?.();
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Send proposal · ${name}`} subtitle={`${lead.project} · ${available.length} units available`} size="lg"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={send} disabled={busy}>{busy ? <Spinner /> : <Send className="w-4 h-4" />}Create PDF &amp; send</button></>}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <Field label="Type"><select className={inputCls} value={type} onChange={e => setType(e.target.value)}><option value="">All</option>{types.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Special discount (₹ per unit)" hint={maxDiscPct > limit ? `Above ${limit}%: needs approval at booking` : undefined}><input type="number" min={0} className={inputCls} value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} /></Field>
          <Field label="Valid for"><select className={inputCls} value={valid} onChange={e => setValid(Number(e.target.value))}>{[3, 7, 15].map(d => <option key={d} value={d}>{d} days</option>)}</select></Field>
          <Field label="Send via"><select className={inputCls} value={via} onChange={e => setVia(e.target.value)}><option>WhatsApp</option><option>Email</option></select></Field>
          {via === 'Email' && <Field label="Email"><input className={inputCls} value={email} onChange={e => setEmail(e.target.value)} /></Field>}
        </div>
        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0"><tr>{['', 'Unit', 'Type', 'Carpet', 'Floor', 'Facing', 'Price'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((u: Unit) => (
                <tr key={u.id} className={picked.includes(u.id) ? 'bg-blue-50' : ''}>
                  <td className={tdCls}><input type="checkbox" checked={picked.includes(u.id)} onChange={e => setPicked(e.target.checked ? [...picked, u.id] : picked.filter(x => x !== u.id))} aria-label={`Pick ${u.unitNumber}`} /></td>
                  <td className={tdCls}>{u.unitNumber}</td><td className={tdCls}>{u.unitType}</td><td className={tdCls}>{u.carpetArea}</td><td className={tdCls}>{u.floor}</td><td className={tdCls}>{u.facing}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>{inr(unitPrice(u).total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <EmptyState>No available units.</EmptyState>}
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

export function UpdateSalesLeadDialog({ lead, onClose, onSuccess }: { lead: { id: string; customer?: string; priority?: string; visitId?: string }; onClose: () => void; onSuccess?: () => void }) {
  const store = getDataStore();
  const full = store.getLeads().find(l => l.id === lead.id);
  const [f, setF] = useState<{ status: string; priority: string; nextFollowUp: string; budget: string; note: string; objection: string }>({ status: full?.status === 'Visit Scheduled' ? 'Follow-up' : full?.status || 'Follow-up', priority: full?.priority || lead.priority || 'Warm', nextFollowUp: full?.nextFollowUp?.slice(0, 10) || '', budget: full?.budget || '', note: '', objection: '' });
  const [busy, setBusy] = useState(false);
  if (!full) return <Modal open onClose={onClose} title="Lead not found"><EmptyState>This lead is no longer in the CRM.</EmptyState></Modal>;
  const save = async () => {
    if (f.nextFollowUp && f.nextFollowUp < localDate()) { toast.error('Next follow-up cannot be in the past'); return; }
    if (f.status === 'Dead' && !f.note.trim() && !f.objection) { toast.error('Give a reason for closing the lead'); return; }
    setBusy(true);
    try {
      const note = [f.objection && `Objection: ${f.objection}`, f.note.trim()].filter(Boolean).join('. ');
      await store.patch('leads', full.id, {
        status: f.status as Lead['status'], priority: f.priority as Lead['priority'], nextFollowUp: f.nextFollowUp || undefined, budget: f.budget || undefined,
        notes: note ? `${note}${full.notes ? ` | ${full.notes}` : ''}`.slice(0, 1000) : full.notes, lastContactedAt: new Date().toISOString(),
      });
      toast.success(`Lead ${full.id} updated`);
      onSuccess?.();
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`Update ${full.name}`} subtitle={`${full.id} · ${full.project}`}
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy && <Spinner />}Save</button></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Stage"><select className={inputCls} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>{['Follow-up', 'Qualified', 'Visit Scheduled', 'Dead'].map(o => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Priority"><select className={inputCls} value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}>{['Hot', 'Warm', 'Cold'].map(o => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Next follow-up"><input type="date" min={localDate()} className={inputCls} value={f.nextFollowUp} onChange={e => setF({ ...f, nextFollowUp: e.target.value })} /></Field>
        <Field label="Budget"><select className={inputCls} value={f.budget} onChange={e => setF({ ...f, budget: e.target.value })}><option value="">—</option>{['Below 50L', '50L - 75L', '75L - 1Cr', '1Cr - 1.5Cr', 'Above 1.5Cr'].map(b => <option key={b}>{b}</option>)}</select></Field>
        <Field label="Main objection"><select className={inputCls} value={f.objection} onChange={e => setF({ ...f, objection: e.target.value })}><option value="">None</option>{['Price', 'Location', 'Possession timeline', 'Loan eligibility', 'Family not convinced', 'Comparing other projects'].map(o => <option key={o}>{o}</option>)}</select></Field>
        <div className="md:col-span-2"><Field label="Notes" required={f.status === 'Dead'}><textarea rows={3} className={inputCls} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></Field></div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

export function LeadDetailsDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const store = getDataStore();
  const current = store.getLeads().find(l => l.id === lead.id) || lead;
  const [tab, setTab] = useState('calls');
  const calls = store.list<CallLog>('callLogs').filter(c => c.leadId === lead.id);
  const visits = store.getVisits().filter(v => v.leadId === lead.id);
  const messages = store.list<any>('notifications').filter(n => n.relatedId === lead.id);
  const score = leadScore(current);
  const cp = current.cpId ? store.getChannelPartners().find(c => c.id === current.cpId) : undefined;
  return (
    <Modal open onClose={onClose} title={current.name} subtitle={`${current.id} · ${current.mobile}${current.email ? ` · ${current.email}` : ''}`} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="blue">{current.status}</Badge><Badge>{current.priority}</Badge>
          <Badge tone={score.band === 'Hot' ? 'red' : score.band === 'Warm' ? 'orange' : 'blue'}>Score {score.score}</Badge>
          <span className="flex-1" />
          <ContactButtons mobile={current.mobile} name={current.name} leadId={current.id} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Info k="Project" v={current.project} /><Info k="Source" v={`${current.source}${cp ? ` (${cp.companyName})` : ''}`} />
          <Info k="Budget" v={current.budget || '—'} /><Info k="Owner" v={current.assignedTo || 'Unassigned'} />
          <Info k="Created" v={fmtDateTime(current.createdAt)} /><Info k="Last contact" v={fmtDateTime(current.lastContactedAt)} />
          <Info k="Calls" v={String(current.callAttempts || 0)} /><Info k="Next follow-up" v={fmtDate(current.nextFollowUp)} />
        </div>
        <p className="text-xs text-gray-500">Why this score: {score.reasons.join(' · ')}</p>
        {current.notes && <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">{current.notes}</p>}
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'calls', label: 'Calls', count: calls.length }, { id: 'visits', label: 'Visits', count: visits.length }, { id: 'messages', label: 'Messages', count: messages.length }, { id: 'history', label: 'Change log' }]} />
        {tab === 'calls' && (calls.length ? (
          <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{['When', 'By', 'Outcome', 'Duration', 'Notes', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">{calls.map(c => (
              <tr key={c.id}><td className={`${tdCls} whitespace-nowrap`}>{fmtDateTime(c.calledAt)}</td><td className={tdCls}>{c.caller}</td><td className={tdCls}><Badge tone={c.outcome === 'Connected' ? 'green' : 'gray'}>{c.outcome}</Badge></td>
                <td className={tdCls}>{c.durationSec ? `${Math.floor(c.durationSec / 60)}:${String(c.durationSec % 60).padStart(2, '0')}` : '—'}</td><td className={`${tdCls} text-gray-600 max-w-[260px]`}>{c.notes || '—'}</td>
                <td className={tdCls}>{c.recordingUrl && <a href={c.recordingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-700"><PlayCircle className="w-3.5 h-3.5" />Recording</a>}</td></tr>))}</tbody></table></div>
        ) : <EmptyState>No calls logged.</EmptyState>)}
        {tab === 'visits' && (visits.length ? (
          <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{['Date', 'Sales', 'Status', 'Outcome', 'Check-in'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">{visits.map(v => (
              <tr key={v.id}><td className={`${tdCls} whitespace-nowrap`}>{fmtDate(v.date)} {v.time}</td><td className={tdCls}>{v.salesExec}</td><td className={tdCls}><Badge>{v.status}</Badge></td><td className={tdCls}>{v.outcome || '—'}</td>
                <td className={tdCls}>{v.checkinAt ? <span className="text-xs">{fmtDateTime(v.checkinAt)}{v.checkinDistanceM !== undefined && ` · ${v.checkinDistanceM} m`}</span> : '—'}</td></tr>))}</tbody></table></div>
        ) : <EmptyState>No site visits.</EmptyState>)}
        {tab === 'messages' && (messages.length ? (
          <div className="space-y-2">{messages.map(n => <div key={n.id} className="p-2 rounded bg-gray-50 text-sm"><div className="text-xs text-gray-500">{n.channel} · {n.template} · {fmtDateTime(n.sentAt || n.createdAt)} · {n.sentBy}</div>{n.message}</div>)}</div>
        ) : <EmptyState>No messages sent.</EmptyState>)}
        {tab === 'history' && <AuditTimeline rowId={current.id} />}
      </div>
    </Modal>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return <div><div className="text-xs text-gray-500">{k}</div><div className="text-gray-900 truncate" title={v}>{v}</div></div>;
}

// ---------------------------------------------------------------------------

function personaNumbers(p: Persona) {
  const store = getDataStore();
  const month = today().slice(0, 7);
  const user = store.getUsers().find(u => u.name === p.name);
  const calls = store.list<CallLog>('callLogs').filter(c => c.caller === p.name);
  const callsMonth = calls.filter(c => monthKey(c.calledAt) === month);
  const callsToday = calls.filter(c => localDate(new Date(c.calledAt)) === today());
  const visitsBooked = store.getVisits().filter(v => v.telecaller === p.name && monthKey(v.createdAt) === month);
  const visitsDone = visitsBooked.filter(v => v.status === 'Completed');
  const myLeads = store.getLeads().filter(l => l.assignedTo === p.name);
  const bookings = store.getBookings().filter(b => b.stage !== 'Cancelled' && myLeads.some(l => l.id === b.leadId) && monthKey(b.bookingDate) === month);
  return { user, calls, callsMonth, callsToday, visitsBooked, visitsDone, myLeads, bookings, connected: callsMonth.filter(c => c.outcome === 'Connected').length };
}

export function ViewTargetsDialog({ onClose }: { onClose: () => void }) {
  const store = getDataStore();
  const p = store.getPersona();
  const n = personaNumbers(p);
  const target = n.user?.target || 0;
  const day = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const expected = Math.round(target * day / daysInMonth);
  const rows = [
    { label: 'Site visits booked (monthly target)', done: n.visitsBooked.length, target },
    { label: 'Calls per day (team standard 60)', done: n.callsToday.length, target: 60 },
    { label: 'Visits completed', done: n.visitsDone.length, target: Math.round(target * 0.7) },
  ];
  return (
    <Modal open onClose={onClose} title={`Targets · ${p.name}`} subtitle={`Month to date · day ${day} of ${daysInMonth}. At this point you should be at ${expected} visits.`}>
      <div className="space-y-4">
        {rows.map(r => {
          const pct = r.target ? Math.round(r.done / r.target * 100) : 0;
          return <div key={r.label}><div className="flex justify-between text-sm mb-1"><span className="text-gray-700">{r.label}</span><span className="text-gray-900">{r.done} / {r.target}</span></div><ProgressBar value={pct} tone={pct >= 100 ? 'green' : pct >= 60 ? 'blue' : 'orange'} /></div>;
        })}
        <p className="text-xs text-gray-500">Targets are set by your manager in Master Setup → Targets.</p>
      </div>
    </Modal>
  );
}

export function MyPerformanceDialog({ onClose }: { onClose: () => void }) {
  const store = getDataStore();
  const p = store.getPersona();
  const n = personaNumbers(p);
  const talk = n.callsMonth.reduce((s, c) => s + (c.durationSec || 0), 0);
  return (
    <Modal open onClose={onClose} title={`My performance · ${p.name}`} subtitle="This month" size="lg">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Calls made" value={n.callsMonth.length} icon={Phone} hint={`${n.callsToday.length} today`} />
        <StatCard label="Connected" value={`${n.callsMonth.length ? Math.round(n.connected / n.callsMonth.length * 100) : 0}%`} icon={Phone} tone="green" hint={`${Math.round(talk / 60)} min talk time`} />
        <StatCard label="Visits booked" value={n.visitsBooked.length} icon={MapPin} tone="purple" hint={`Target ${n.user?.target || 0}`} />
        <StatCard label="Visits completed" value={n.visitsDone.length} icon={Navigation} tone="blue" />
        <StatCard label="Bookings from my leads" value={n.bookings.length} icon={CheckCircle} tone="green" />
        <StatCard label="Open leads" value={n.myLeads.filter(l => !['Dead', 'Booked'].includes(l.status)).length} icon={FileText} tone="orange" hint={`${n.myLeads.filter(l => l.nextFollowUp && l.nextFollowUp.slice(0, 10) < today() && !['Dead', 'Booked'].includes(l.status)).length} follow-ups overdue`} />
      </div>
    </Modal>
  );
}
