import { useState } from 'react';
import { Building2, IndianRupee, TrendingUp, Plus, Lock, Grid3X3, Receipt, Eye, Unlock, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Booking, Unit, isManagerRole, toastError } from '../lib/dataStore';
import { bookingFinance } from '../lib/crm';
import { inr, inrShort, fmtDate, downloadCSV, daysBetween, today } from '../lib/format';
import { PageHeader, StatCard, Panel, Tabs, Badge, thCls, tdCls, btnPrimary, btnSecondary, btnSmall, inputCls, EmptyState, ContactButtons } from './common';
import { CreateBookingDialog, BlockUnitDialog, CheckAvailabilityDialog } from './UnitDialogs';
import { BookingDetail, RecordPaymentDialog } from './BookingParts';

const ACTIVE = ['Token Paid', 'Agreement Pending', 'Agreement Done', 'Documentation'];
const DONE = ['Fully Paid', 'Possession Done', 'Completed'];

export function BookingManagement() {
  const store = getDataStore();
  const persona = store.getPersona();
  const [tab, setTab] = useState('active');
  const [q, setQ] = useState('');
  const [project, setProject] = useState('');
  const [dialog, setDialog] = useState<null | 'create' | 'block' | 'avail'>(null);
  const [preset, setPreset] = useState<Unit | undefined>();
  const [detail, setDetail] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<Booking | null>(null);

  const mine = (b: Booking) => isManagerRole(persona.role) || persona.role === 'CRM Executive' || persona.role === 'Finance' || b.salesExec === persona.name;
  const all = store.getBookings().filter(mine);
  const live = all.filter(b => b.stage !== 'Cancelled');
  const revenue = live.reduce((s, b) => s + b.price - b.discount, 0);
  const visits = store.getVisits().filter(v => v.status === 'Completed').length;
  const blocks = store.getBlockedUnits().filter(b => b.status === 'Active');

  const filtered = (list: Booking[]) => list.filter(b =>
    (!project || b.project === project) &&
    (!q || `${b.id} ${b.customer} ${b.unit} ${b.mobile}`.toLowerCase().includes(q.toLowerCase())));
  const rows = filtered(tab === 'active' ? all.filter(b => ACTIVE.includes(b.stage)) : tab === 'done' ? all.filter(b => DONE.includes(b.stage)) : tab === 'cancelled' ? all.filter(b => b.stage === 'Cancelled') : []);

  const inventory = store.getProjects().map(p => {
    const u = store.getUnits().filter(x => x.project === p.name);
    return { project: p.name, total: u.length, booked: u.filter(x => x.status === 'Booked').length, blocked: u.filter(x => x.status === 'Blocked').length, available: u.filter(x => x.status === 'Available').length };
  });

  const exportCSV = () => downloadCSV(`bookings-${today()}.csv`, all.map(b => {
    const f = bookingFinance(b);
    return { id: b.id, date: b.bookingDate, customer: b.customer, mobile: b.mobile, project: b.project, unit: b.unit, type: b.unitType, price: b.price, discount: b.discount, discount_status: b.discountStatus, agreement_value: f.net, gst: f.gstTotal, paid: f.paid, overdue: f.overdue, stage: b.stage, sales: b.salesExec, crm: b.crmExec, cp: b.cpId };
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Booking Management" subtitle="Bookings, unit allocation and collections. Units come from live inventory, so a unit can't be booked twice."
        actions={<>
          <button className={btnSecondary} onClick={() => setDialog('avail')}><Grid3X3 className="w-4 h-4" />Availability</button>
          <button className={btnSecondary} onClick={() => { setPreset(undefined); setDialog('block'); }}><Lock className="w-4 h-4" />Block unit</button>
          <button className={btnPrimary} onClick={() => { setPreset(undefined); setDialog('create'); }}><Plus className="w-4 h-4" />New booking</button>
        </>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Live bookings" value={live.length} icon={Building2} hint={`${all.length - live.length} cancelled`} />
        <StatCard label="Booking value" value={inrShort(revenue)} icon={IndianRupee} tone="green" hint="Agreement value, excl. GST" />
        <StatCard label="Average ticket" value={inrShort(live.length ? revenue / live.length : 0)} icon={TrendingUp} tone="purple" />
        <StatCard label="Visit → booking" value={`${visits ? ((live.length / visits) * 100).toFixed(1) : 0}%`} icon={TrendingUp} tone="orange" hint={`${visits} completed visits`} />
      </div>

      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[
          { id: 'active', label: 'In progress', count: all.filter(b => ACTIVE.includes(b.stage)).length },
          { id: 'done', label: 'Paid / handed over', count: all.filter(b => DONE.includes(b.stage)).length },
          { id: 'cancelled', label: 'Cancelled', count: all.filter(b => b.stage === 'Cancelled').length },
          { id: 'blocks', label: 'Active blocks', count: blocks.length },
          { id: 'inventory', label: 'Inventory summary' },
        ]} />
        {(tab === 'active' || tab === 'done' || tab === 'cancelled') && (
          <>
            <div className="flex flex-wrap gap-2 p-3">
              <input className={`${inputCls} max-w-xs`} placeholder="Search customer, unit, ID, mobile" value={q} onChange={e => setQ(e.target.value)} aria-label="Search bookings" />
              <select className={`${inputCls} max-w-[200px]`} value={project} onChange={e => setProject(e.target.value)} aria-label="Project filter">
                <option value="">All projects</option>{store.getProjects().map(p => <option key={p.id}>{p.name}</option>)}
              </select>
              <span className="flex-1" />
              <button className={btnSecondary} onClick={exportCSV}><Download className="w-4 h-4" />Export</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr>{['Booking', 'Customer', 'Unit', 'Value', 'Paid', 'Overdue', 'Stage', 'Sales', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(b => {
                    const f = bookingFinance(b);
                    return (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className={tdCls}>{b.id}<div className="text-xs text-gray-500 whitespace-nowrap">{fmtDate(b.bookingDate)}</div></td>
                        <td className={tdCls}>{b.customer}<div className="text-xs text-gray-500">{b.mobile}</div></td>
                        <td className={tdCls}><span className="whitespace-nowrap">{b.unit}</span><div className="text-xs text-gray-500 whitespace-nowrap">{b.project} · {b.unitType}</div></td>
                        <td className={`${tdCls} whitespace-nowrap`}>{inrShort(f.net)}{b.discountStatus === 'Pending' && <div><Badge tone="orange">Discount pending</Badge></div>}</td>
                        <td className={`${tdCls} whitespace-nowrap`}>{inrShort(f.paid)}<div className="text-xs text-gray-500">{f.percentPaid}%</div></td>
                        <td className={`${tdCls} whitespace-nowrap ${f.overdue ? 'text-red-700' : 'text-gray-400'}`}>{f.overdue ? inrShort(f.overdue) : '—'}</td>
                        <td className={tdCls}><Badge>{b.stage}</Badge></td>
                        <td className={`${tdCls} text-gray-600 whitespace-nowrap`}>{b.salesExec}</td>
                        <td className={`${tdCls} whitespace-nowrap`}>
                          <span className="inline-flex gap-1">
                            <button className={btnSmall} onClick={() => setDetail(b.id)}><Eye className="w-3.5 h-3.5" />Open</button>
                            {b.stage !== 'Cancelled' && <button className={btnSmall} onClick={() => setPayFor(b)}><Receipt className="w-3.5 h-3.5" />Payment</button>}
                            <ContactButtons compact mobile={b.mobile} name={b.customer} relatedType="booking" relatedId={b.id} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length === 0 && <EmptyState>No bookings match.</EmptyState>}
            </div>
          </>
        )}
        {tab === 'blocks' && <BlocksTable />}
        {tab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['Project', 'Units', 'Booked', 'Blocked', 'Available', 'Sold %'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map(i => (
                  <tr key={i.project}>
                    <td className={tdCls}>{i.project}</td><td className={tdCls}>{i.total}</td><td className={tdCls}>{i.booked}</td>
                    <td className={tdCls}>{i.blocked}</td><td className={`${tdCls} text-green-700`}>{i.available}</td>
                    <td className={tdCls}>{i.total ? Math.round(i.booked / i.total * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {dialog === 'create' && <CreateBookingDialog preset={preset} onClose={() => setDialog(null)} />}
      {dialog === 'block' && <BlockUnitDialog preset={preset} onClose={() => setDialog(null)} />}
      {dialog === 'avail' && (
        <CheckAvailabilityDialog onClose={() => setDialog(null)}
          onBlock={u => { setPreset(u); setDialog('block'); }}
          onBook={u => { setPreset(u); setDialog('create'); }} />
      )}
      {detail && <BookingDetail bookingId={detail} onClose={() => setDetail(null)} />}
      {payFor && <RecordPaymentDialog booking={payFor} onClose={() => setPayFor(null)} />}
    </div>
  );
}

export function BlocksTable() {
  const store = getDataStore();
  const persona = store.getPersona();
  const blocks = store.getBlockedUnits().filter(b => b.status === 'Active')
    .filter(b => isManagerRole(persona.role) || persona.role !== 'Sales Executive' || b.salesExec === persona.name);
  const release = async (id: string) => {
    try { await store.patch('blockedUnits', id, { status: 'Expired' }); toast.success('Unit released'); } catch (e) { toastError(e); }
  };
  const extend = async (id: string, expiry: string) => {
    const d = new Date(`${expiry}T00:00:00`); d.setDate(d.getDate() + 2);
    const next = d.toISOString().slice(0, 10);
    try { await store.patch('blockedUnits', id, { expiryDate: next }); toast.success(`Block extended to ${fmtDate(next)}`); } catch (e) { toastError(e); }
  };
  if (blocks.length === 0) return <EmptyState>No units are blocked right now.</EmptyState>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50"><tr>{['Unit', 'Customer', 'Sales exec', 'Blocked', 'Expires', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {blocks.map(b => {
            const left = daysBetween(today(), b.expiryDate);
            return (
              <tr key={b.id}>
                <td className={tdCls}>{b.unit}<div className="text-xs text-gray-500">{b.project}</div></td>
                <td className={tdCls}>{b.customer}</td>
                <td className={`${tdCls} text-gray-600`}>{b.salesExec}</td>
                <td className={`${tdCls} text-gray-600 whitespace-nowrap`}>{fmtDate(b.blockedDate)}</td>
                <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(b.expiryDate)} {left <= 0 ? <Badge tone="red">today</Badge> : <span className="text-xs text-gray-500">({left}d)</span>}</td>
                <td className={`${tdCls} whitespace-nowrap`}>
                  <span className="inline-flex gap-1">
                    <button className={btnSmall} onClick={() => extend(b.id, b.expiryDate)} title="Extend by 2 days"><AlertCircle className="w-3.5 h-3.5" />+2 days</button>
                    <button className={btnSmall} onClick={() => release(b.id)}><Unlock className="w-3.5 h-3.5" />Release</button>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

