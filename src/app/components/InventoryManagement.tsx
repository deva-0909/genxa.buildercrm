import { useState } from 'react';
import { Package, CheckCircle, Lock, Building2, Ban, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Unit, PriceListItem, isManagerRole, toastError } from '../lib/dataStore';
import { unitPrice } from '../lib/crm';
import { inr, inrShort, downloadCSV, today } from '../lib/format';
import { printProposal } from '../lib/documents';
import { PageHeader, StatCard, Panel, Tabs, Badge, thCls, tdCls, btnSecondary, btnSmall, inputCls, Field, EmptyState } from './common';
import { UnitGrid, UnitLegend, BlockUnitDialog, CreateBookingDialog } from './UnitDialogs';
import { BlocksTable } from './BookingManagement';

export function InventoryManagement() {
  const store = getDataStore();
  const persona = store.getPersona();
  const projects = store.getProjects();
  const [project, setProject] = useState(projects[0]?.name || '');
  const [type, setType] = useState('');
  const [sel, setSel] = useState<Unit | null>(null);
  const [tab, setTab] = useState('grid');
  const [dialog, setDialog] = useState<null | 'block' | 'book'>(null);
  const all = store.getUnits();
  const units = all.filter(u => u.project === project);
  const types = Array.from(new Set(units.map(u => u.unitType))).sort();
  const current = sel ? all.find(u => u.id === sel.id) || null : null;
  const prices = store.list<PriceListItem>('priceList').filter(p => p.project === project);
  const availableValue = units.filter(u => u.status === 'Available').reduce((s, u) => s + unitPrice(u).total, 0);
  const canManage = isManagerRole(persona.role);

  const toggleHold = async (u: Unit) => {
    try {
      await store.patch('units', u.id, { status: u.status === 'Not for Sale' ? 'Available' : 'Not for Sale' });
      toast.success(u.status === 'Not for Sale' ? `${u.unitNumber} released for sale` : `${u.unitNumber} withheld from sale`);
    } catch (e) { toastError(e); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" subtitle="Live tower and floor view. Unit status follows bookings and blocks automatically; blocks expire on their own."
        actions={<button className={btnSecondary} onClick={() => downloadCSV(`inventory-${project}-${today()}.csv`, units.map(u => ({ unit: u.unitNumber, tower: u.tower, floor: u.floor, type: u.unitType, carpet_sqft: u.carpetArea, facing: u.facing, price: unitPrice(u).total, status: u.status })))}><Download className="w-4 h-4" />Export</button>} />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Project"><select className={inputCls} value={project} onChange={e => { setProject(e.target.value); setSel(null); setType(''); }}>{projects.map(p => <option key={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Type"><select className={inputCls} value={type} onChange={e => setType(e.target.value)}><option value="">All</option>{types.map(t => <option key={t}>{t}</option>)}</select></Field>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total units" value={units.length} icon={Building2} />
        <StatCard label="Available" value={units.filter(u => u.status === 'Available').length} icon={CheckCircle} tone="green" hint={`${inrShort(availableValue)} unsold value`} />
        <StatCard label="Blocked" value={units.filter(u => u.status === 'Blocked').length} icon={Lock} tone="orange" />
        <StatCard label="Booked" value={units.filter(u => u.status === 'Booked').length} icon={Package} tone="purple" hint={`${units.length ? Math.round(units.filter(u => u.status === 'Booked').length / units.length * 100) : 0}% sold`} />
      </div>
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'grid', label: 'Floor grid' }, { id: 'types', label: 'By unit type' }, { id: 'blocks', label: 'Active blocks', count: store.getBlockedUnits().filter(b => b.status === 'Active').length }]} />
        {tab === 'grid' && (
          <div className="p-4 space-y-4">
            <UnitLegend units={units} />
            {current && (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
                <span className="text-gray-900">{current.unitNumber}</span>
                <span className="text-gray-600">{current.unitType} · {current.carpetArea} sq ft · floor {current.floor} · {current.facing}</span>
                <span className="text-gray-900">{inr(unitPrice(current).total)}</span>
                <Badge>{current.status}</Badge>
                <span className="flex-1" />
                {current.status === 'Available' && <>
                  <button className={btnSmall} onClick={() => setDialog('block')}><Lock className="w-3.5 h-3.5" />Block</button>
                  <button className={btnSmall} onClick={() => setDialog('book')}><CheckCircle className="w-3.5 h-3.5" />Book</button>
                  <button className={btnSmall} onClick={() => printProposal({ name: 'Prospective buyer', mobile: '', project: current.project }, [current])}><FileText className="w-3.5 h-3.5" />Quote</button>
                </>}
                {canManage && ['Available', 'Not for Sale'].includes(current.status) && (
                  <button className={btnSmall} onClick={() => toggleHold(current)}><Ban className="w-3.5 h-3.5" />{current.status === 'Not for Sale' ? 'Release for sale' : 'Withhold'}</button>
                )}
              </div>
            )}
            <UnitGrid project={project} typeFilter={type} onSelect={setSel} selectedId={current?.id} />
          </div>
        )}
        {tab === 'types' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['Type', 'Carpet', 'Rate / sq ft', 'Base price', 'Floor rise', 'Units', 'Available', 'Blocked', 'Booked'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {types.map(t => {
                  const p = prices.find(x => x.unitType === t);
                  const tu = units.filter(u => u.unitType === t);
                  return (
                    <tr key={t}>
                      <td className={tdCls}>{t}</td><td className={tdCls}>{p?.carpetArea ?? tu[0]?.carpetArea} sq ft</td>
                      <td className={tdCls}>{p ? inr(p.ratePerSqft) : '—'}</td><td className={tdCls}>{p ? inr(p.basePrice) : '—'}</td>
                      <td className={tdCls}>{p ? `${inr(p.floorRisePerSqft)}/sq ft/floor` : '—'}</td>
                      <td className={tdCls}>{tu.length}</td><td className={`${tdCls} text-green-700`}>{tu.filter(u => u.status === 'Available').length}</td>
                      <td className={tdCls}>{tu.filter(u => u.status === 'Blocked').length}</td><td className={tdCls}>{tu.filter(u => u.status === 'Booked').length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {types.length === 0 && <EmptyState>No units for this project.</EmptyState>}
            <p className="text-xs text-gray-500 p-3">Edit rates in Master Setup → Price list. Prices of booked units can't be changed.</p>
          </div>
        )}
        {tab === 'blocks' && <BlocksTable />}
      </Panel>
      {dialog === 'block' && current && <BlockUnitDialog preset={current} onClose={() => setDialog(null)} />}
      {dialog === 'book' && current && <CreateBookingDialog preset={current} onClose={() => setDialog(null)} />}
    </div>
  );
}

