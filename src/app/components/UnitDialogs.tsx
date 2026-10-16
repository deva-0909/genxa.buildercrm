// Live unit inventory: the tower/floor grid, availability check, unit
// blocking and booking creation. Everything reads the units table, whose
// status the database keeps in step with bookings and blocks.
import { useState } from 'react';
import { Lock, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Unit, Lead, localDate, toastError } from '../lib/dataStore';
import { unitPrice, PAYMENT_MODES } from '../lib/crm';
import { inr, inrShort, fmtDate, isValidMobile, normaliseMobile, addDays } from '../lib/format';
import { printProposal } from '../lib/documents';
import { Modal, Field, inputCls, btnPrimary, btnSecondary, Badge, Spinner } from './common';

const CELL: Record<string, string> = {
  Available: 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100',
  Blocked: 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100',
  Booked: 'bg-purple-50 border-purple-300 text-purple-800 hover:bg-purple-100',
  'Not for Sale': 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200',
};

export function UnitLegend({ units }: { units: Unit[] }) {
  const count = (s: string) => units.filter(u => u.status === s).length;
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {Object.keys(CELL).map(s => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded border ${CELL[s].split(' ').slice(0, 2).join(' ')}`} />{s} ({count(s)})
        </span>
      ))}
    </div>
  );
}

/** Tower and floor grid for one project. */
export function UnitGrid({ project, onSelect, selectedId, typeFilter = '', selectable }: {
  project: string; onSelect?: (u: Unit) => void; selectedId?: string; typeFilter?: string;
  /** Limit clicks to these statuses. */
  selectable?: Unit['status'][];
}) {
  const store = getDataStore();
  const units = store.getUnits().filter(u => u.project === project && (!typeFilter || u.unitType === typeFilter));
  const towers = Array.from(new Set(units.map(u => u.tower))).sort();
  const blocks = store.getBlockedUnits().filter(b => b.project === project && b.status === 'Active');
  if (units.length === 0) return <p className="text-sm text-gray-500 py-6 text-center">No units set up for this project.</p>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {towers.map(t => {
          const tu = units.filter(u => u.tower === t);
          const floors = Array.from(new Set(tu.map(u => u.floor))).sort((a, b) => b - a);
          return (
            <div key={t} className="border border-gray-200 rounded-lg p-3 overflow-x-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-900">Tower {t}</span>
                <span className="text-xs text-gray-500">{tu.filter(u => u.status === 'Available').length} of {tu.length} available</span>
              </div>
              <div className="space-y-1 min-w-max">
                {floors.map(f => (
                  <div key={f} className="flex items-center gap-1">
                    <span className="w-8 text-[11px] text-gray-500 text-right pr-1">F{f}</span>
                    {tu.filter(u => u.floor === f).sort((a, b) => a.unitNumber.localeCompare(b.unitNumber)).map(u => {
                      const block = blocks.find(b => b.unit === u.unitNumber);
                      const disabled = selectable && !selectable.includes(u.status);
                      return (
                        <button key={u.id} type="button" disabled={disabled || !onSelect}
                          onClick={() => onSelect?.(u)}
                          title={`${u.unitNumber} · ${u.unitType} · ${u.carpetArea} sq ft · ${u.status}${block ? ` for ${block.customer} until ${fmtDate(block.expiryDate)}` : ''}`}
                          aria-label={`Unit ${u.unitNumber} ${u.status}`}
                          className={`w-[58px] h-9 rounded border text-[11px] leading-tight ${CELL[u.status]} ${selectedId === u.id ? 'ring-2 ring-blue-600' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                          {u.unitNumber}<br /><span className="opacity-70">{u.unitType.replace(' BHK', 'B')}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnitSummary({ u }: { u: Unit }) {
  const store = getDataStore();
  const p = unitPrice(u);
  const block = store.getBlockedUnits().find(b => b.project === u.project && b.unit === u.unitNumber && b.status === 'Active');
  const booking = store.getBookings().find(b => b.project === u.project && b.unit === u.unitNumber && b.stage !== 'Cancelled');
  return (
    <div className="border border-gray-200 rounded-lg p-3 text-sm space-y-1">
      <div className="flex items-center justify-between"><span className="text-gray-900">{u.project} · {u.unitNumber}</span><Badge>{u.status}</Badge></div>
      <div className="text-gray-600">{u.unitType} · {u.carpetArea} sq ft · Floor {u.floor} · {u.facing || '—'} facing</div>
      <div className="text-gray-600">Base {inr(p.base)} + floor rise {inr(p.floorRise)} = <b className="text-gray-900">{inr(p.total)}</b> ({inr(p.rate)}/sq ft)</div>
      {block && <div className="text-orange-700">Blocked for {block.customer} by {block.salesExec} until {fmtDate(block.expiryDate)}</div>}
      {booking && <div className="text-purple-700">Booked by {booking.customer} ({booking.id}) on {fmtDate(booking.bookingDate)}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function CheckAvailabilityDialog({ onClose, onBlock, onBook }: {
  onClose: () => void; onBlock?: (u: Unit) => void; onBook?: (u: Unit) => void;
}) {
  const store = getDataStore();
  const projects = store.getProjects();
  const [project, setProject] = useState(projects[0]?.name || '');
  const [type, setType] = useState('');
  const [sel, setSel] = useState<Unit | null>(null);
  const units = store.getUnits().filter(u => u.project === project);
  const types = Array.from(new Set(units.map(u => u.unitType))).sort();
  return (
    <Modal open onClose={onClose} title="Unit availability" subtitle="Live from bookings and active blocks. Click a unit for price and actions." size="xl">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <Field label="Project">
            <select className={inputCls} value={project} onChange={e => { setProject(e.target.value); setSel(null); }}>
              {projects.map(p => <option key={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select className={inputCls} value={type} onChange={e => setType(e.target.value)}>
              <option value="">All types</option>
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <UnitLegend units={units} />
        </div>
        {sel && (
          <div className="space-y-2">
            <UnitSummary u={sel} />
            {sel.status === 'Available' && (
              <div className="flex flex-wrap gap-2">
                {onBlock && <button className={btnSecondary} onClick={() => onBlock(sel)}><Lock className="w-4 h-4" />Block this unit</button>}
                {onBook && <button className={btnPrimary} onClick={() => onBook(sel)}><CheckCircle className="w-4 h-4" />Book this unit</button>}
                <button className={btnSecondary} onClick={() => printProposal({ name: 'Prospective buyer', mobile: '', project: sel.project }, [sel])}><FileText className="w-4 h-4" />Price quote</button>
              </div>
            )}
          </div>
        )}
        <UnitGrid project={project} typeFilter={type} onSelect={setSel} selectedId={sel?.id} />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

/** Pick a unit: project + list of selectable units, with an optional grid. */
function UnitPicker({ project, setProject, unitId, setUnitId, allow, customer }: {
  project: string; setProject: (p: string) => void; unitId: string; setUnitId: (id: string) => void; allow: 'available' | 'bookable'; customer?: string;
}) {
  const store = getDataStore();
  const [showGrid, setShowGrid] = useState(false);
  const blocks = store.getBlockedUnits().filter(b => b.status === 'Active');
  const persona = store.getPersona();
  const units = store.getUnits().filter(u => u.project === project).filter(u => {
    if (u.status === 'Available') return true;
    if (allow === 'bookable' && u.status === 'Blocked') {
      const b = blocks.find(x => x.project === u.project && x.unit === u.unitNumber);
      return !!b && ((customer && b.customer.toLowerCase() === customer.toLowerCase()) || b.salesExec === persona.name || persona.role === 'Admin');
    }
    return false;
  }).sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }));
  const sel = store.getUnits().find(u => u.id === unitId);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Project" required>
          <select className={inputCls} value={project} onChange={e => { setProject(e.target.value); setUnitId(''); }}>
            <option value="">Select project</option>
            {store.getProjects().map(p => <option key={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Unit" required hint={project ? `${units.length} unit(s) you can ${allow === 'bookable' ? 'book' : 'block'}` : undefined}>
          <select className={inputCls} value={unitId} onChange={e => setUnitId(e.target.value)} disabled={!project}>
            <option value="">Select unit</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.unitNumber} · {u.unitType} · {u.carpetArea} sq ft · {inrShort(unitPrice(u).total)}{u.status === 'Blocked' ? ' (blocked for this customer)' : ''}</option>)}
          </select>
        </Field>
      </div>
      {project && <button type="button" className="text-xs text-blue-700 hover:underline" onClick={() => setShowGrid(!showGrid)}>{showGrid ? 'Hide' : 'Show'} floor plan grid</button>}
      {showGrid && project && (
        <div className="max-h-[320px] overflow-y-auto border border-gray-100 rounded-lg p-2">
          <UnitGrid project={project} selectedId={unitId} onSelect={u => { if (units.some(x => x.id === u.id)) setUnitId(u.id); else toast.error(`${u.unitNumber} is ${u.status.toLowerCase()}`); }} />
        </div>
      )}
      {sel && <UnitSummary u={sel} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function BlockUnitDialog({ onClose, onSuccess, preset }: { onClose: () => void; onSuccess?: () => void; preset?: Unit }) {
  const store = getDataStore();
  const persona = store.getPersona();
  const salesExecs = store.getUsers().filter(u => u.role === 'Sales Executive' && u.status === 'Active');
  const [project, setProject] = useState(preset?.project || '');
  const [unitId, setUnitId] = useState(preset?.id || '');
  const [customer, setCustomer] = useState('');
  const [salesExec, setSalesExec] = useState(persona.role === 'Sales Executive' ? persona.name : '');
  const [days, setDays] = useState(3);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const u = store.getUnits().find(x => x.id === unitId);
    if (!u || !customer.trim() || !salesExec) { toast.error('Choose a unit, customer and sales executive'); return; }
    setBusy(true);
    try {
      await store.addBlockedUnit({
        project: u.project, unit: u.unitNumber, customer: customer.trim(), salesExec,
        blockedDate: localDate(), expiryDate: addDays(localDate(), days), status: 'Active', notes,
      });
      toast.success(`${u.unitNumber} blocked for ${customer} until ${fmtDate(addDays(localDate(), days))}. The block lapses automatically.`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toastError(err, 'Could not block the unit');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Block unit" subtitle="Hold a unit for a customer. It is released automatically when the block expires." size="lg"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={submit} disabled={busy}>{busy ? <Spinner /> : <Lock className="w-4 h-4" />}Block unit</button></>}>
      <div className="space-y-4">
        <UnitPicker project={project} setProject={setProject} unitId={unitId} setUnitId={setUnitId} allow="available" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Customer" required>
            <input className={inputCls} list="block-customers" value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Customer name" />
            <datalist id="block-customers">{store.getLeads().filter(l => l.project === project && l.status !== 'Dead').slice(0, 200).map(l => <option key={l.id} value={l.name} />)}</datalist>
          </Field>
          <Field label="Sales executive" required>
            <select className={inputCls} value={salesExec} onChange={e => setSalesExec(e.target.value)}>
              <option value="">Select</option>
              {salesExecs.map(u => <option key={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Block for">
            <select className={inputCls} value={days} onChange={e => setDays(Number(e.target.value))}>
              {[1, 2, 3, 5, 7].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Notes"><textarea rows={2} className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

export function CreateBookingDialog({ leadId, customerName, customerMobile, preset, onClose, onSuccess }: {
  leadId?: string; customerName?: string; customerMobile?: string; preset?: Unit; onClose: () => void; onSuccess?: () => void;
}) {
  const store = getDataStore();
  const persona = store.getPersona();
  const lead: Lead | undefined = leadId ? store.getLeads().find(l => l.id === leadId) : undefined;
  const salesExecs = store.getUsers().filter(u => u.role === 'Sales Executive' && u.status === 'Active');
  const crmExecs = store.getUsers().filter(u => u.role === 'CRM Executive' && u.status === 'Active');
  const limit = store.settingNumber('discount_limit_pct', 2);
  const [project, setProject] = useState(preset?.project || lead?.project || '');
  const [unitId, setUnitId] = useState(preset?.id || '');
  const [f, setF] = useState({
    customer: customerName || lead?.name || '', mobile: customerMobile || lead?.mobile || '',
    discount: 0, tokenAmount: 0, mode: 'NEFT', reference: '', salesExec: persona.role === 'Sales Executive' ? persona.name : '',
    crmExec: crmExecs[0]?.name || '', cpId: lead?.cpId || '', plan: 'Construction Linked',
  });
  const [busy, setBusy] = useState(false);
  const unit = store.getUnits().find(u => u.id === unitId);
  const price = unit ? unitPrice(unit).total : 0;
  const pct = price ? f.discount * 100 / price : 0;
  const net = price - f.discount;
  const gstRate = price <= 4500000 ? 1 : 5;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value });

  const submit = async () => {
    if (!unit) { toast.error('Choose a unit'); return; }
    if (!f.customer.trim() || !f.salesExec) { toast.error('Customer name and sales executive are required'); return; }
    if (!isValidMobile(f.mobile)) { toast.error('Enter a valid 10-digit mobile number'); return; }
    if (f.tokenAmount <= 0) { toast.error('Enter the token amount received'); return; }
    if (f.discount < 0 || f.discount >= price) { toast.error('Discount is not valid'); return; }
    setBusy(true);
    try {
      const booking = await store.addBooking({
        leadId: leadId || undefined, customer: f.customer.trim(), mobile: normaliseMobile(f.mobile), project: unit.project,
        unit: unit.unitNumber, unitType: unit.unitType, price, discount: f.discount, tokenAmount: f.tokenAmount,
        salesExec: f.salesExec, crmExec: f.crmExec || undefined, cpId: f.cpId || undefined, paymentPlan: f.plan, bookingDate: localDate(),
      });
      // The database records the token as a receipt; set the actual payment mode and reference on it.
      await store.reload(['payments']);
      const token = store.list<any>('payments').find(p => p.bookingId === booking.id && p.reference === `TOKEN-${booking.id}`);
      if (token) await store.patch('payments', token.id, { mode: f.mode, reference: f.reference || `TOKEN-${booking.id}` }).catch(() => {});
      toast.success(`Booking ${booking.id} created for ${unit.unitNumber}. Payment schedule, receipt and draft agreement generated.${booking.discountStatus === 'Pending' ? ' Discount sent for approval.' : ''}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toastError(err, 'Booking not saved');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Create booking" subtitle="Only available units (or units blocked for this customer) can be booked." size="lg"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={submit} disabled={busy}>{busy ? <Spinner /> : <CheckCircle className="w-4 h-4" />}Confirm booking</button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Customer name" required><input className={inputCls} value={f.customer} onChange={set('customer')} /></Field>
          <Field label="Mobile" required><input className={inputCls} value={f.mobile} onChange={set('mobile')} inputMode="numeric" /></Field>
        </div>
        <UnitPicker project={project} setProject={setProject} unitId={unitId} setUnitId={setUnitId} allow="bookable" customer={f.customer} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="List price"><input className={inputCls} value={price ? inr(price) : ''} readOnly /></Field>
          <Field label="Discount (₹)" hint={price ? `${pct.toFixed(2)}% of price${pct > limit ? ' · needs approval' : ''}` : `Up to ${limit}% without approval`}>
            <input type="number" min={0} className={inputCls} value={f.discount || ''} onChange={set('discount')} />
          </Field>
          <Field label="Agreement value"><input className={inputCls} value={price ? `${inr(net)} + GST ${gstRate}%` : ''} readOnly /></Field>
          <Field label="Token received (₹)" required><input type="number" min={0} className={inputCls} value={f.tokenAmount || ''} onChange={set('tokenAmount')} /></Field>
          <Field label="Token payment mode">
            <select className={inputCls} value={f.mode} onChange={set('mode')}>{PAYMENT_MODES.filter(m => m !== 'Home Loan').map(m => <option key={m}>{m}</option>)}</select>
          </Field>
          <Field label="Cheque / UTR no."><input className={inputCls} value={f.reference} onChange={set('reference')} /></Field>
          <Field label="Sales executive" required>
            <select className={inputCls} value={f.salesExec} onChange={set('salesExec')}><option value="">Select</option>{salesExecs.map(u => <option key={u.id}>{u.name}</option>)}</select>
          </Field>
          <Field label="CRM executive">
            <select className={inputCls} value={f.crmExec} onChange={set('crmExec')}><option value="">Select</option>{crmExecs.map(u => <option key={u.id}>{u.name}</option>)}</select>
          </Field>
          <Field label="Channel partner">
            <select className={inputCls} value={f.cpId} onChange={set('cpId')}><option value="">Direct (no partner)</option>{store.getChannelPartners().map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select>
          </Field>
        </div>
        {pct > limit && (
          <div className="flex gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm text-orange-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            The discount is above the {limit}% limit. The booking will be saved and the discount sent to a manager for approval.
          </div>
        )}
      </div>
    </Modal>
  );
}
