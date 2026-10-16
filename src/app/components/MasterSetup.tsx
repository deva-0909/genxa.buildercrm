import { useState, ReactNode } from 'react';
import { Plus, Edit2, Trash2, HardHat, Settings2, Plug, Grid3X3, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, CollectionKey, Project, User, LeadSource, PriceListItem, ProjectStage, Unit, toastError, localDate } from '../lib/dataStore';
import { SUPABASE_URL } from '../lib/supabase';
import { inr, monthKey, today, isValidEmail, isValidMobile, normaliseMobile } from '../lib/format';
import { PageHeader, Panel, Tabs, Badge, thCls, tdCls, btnPrimary, btnSecondary, btnSmall, inputCls, Modal, Field, Confirm, Spinner, EmptyState, ProgressBar } from './common';

export const ROLES = ['Telecaller', 'Team Leader', 'Sales Executive', 'CRM Executive', 'Finance', 'MIS Head', 'Sourcing Executive', 'Digital Team', 'Front Desk'];
const DEFAULT_STAGES = [['Booking', 10], ['Agreement', 10], ['Plinth', 15], ['5th Slab', 15], ['10th Slab', 15], ['Brickwork', 10], ['Finishing', 10], ['Possession', 15]] as const;

// ---------------- generic editable table ----------------

interface Col<T> {
  key: keyof T & string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'date' | 'email' | 'tel' | 'multi';
  options?: string[] | (() => string[]);
  required?: boolean;
  hideInTable?: boolean;
  render?: (row: T) => ReactNode;
  /** Field can't be changed once records refer to it. */
  locked?: (row: T) => string | null;
  validate?: (v: any, row: Partial<T>) => string | null;
}

function CrudTable<T extends { id: string }>({ title, subtitle, collection, rows, cols, defaults, canDelete, onAdded, extraActions, addLabel }: {
  title: string; subtitle?: string; collection: CollectionKey; rows: T[]; cols: Col<T>[]; defaults: Partial<T>;
  /** Return a reason to block deletion, or null to allow. */
  canDelete?: (row: T) => string | null;
  onAdded?: (row: T) => Promise<void> | void;
  extraActions?: (row: T) => ReactNode;
  addLabel?: string;
}) {
  const store = getDataStore();
  const [edit, setEdit] = useState<Partial<T> | null>(null);
  const [del, setDel] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const isNew = edit && !edit.id;
  const opts = (c: Col<T>) => typeof c.options === 'function' ? c.options() : c.options || [];

  const save = async () => {
    if (!edit) return;
    for (const c of cols) {
      const v = (edit as any)[c.key];
      if (c.required && (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0))) { toast.error(`${c.label} is required`); return; }
      if (c.type === 'email' && v && !isValidEmail(v)) { toast.error('Enter a valid email'); return; }
      if (c.type === 'tel' && v && !isValidMobile(v)) { toast.error('Enter a valid 10-digit mobile'); return; }
      if (c.type === 'number' && v !== undefined && v !== '' && Number(v) < 0) { toast.error(`${c.label} can't be negative`); return; }
      const err = c.validate?.(v, edit);
      if (err) { toast.error(err); return; }
    }
    const payload: any = { ...edit };
    cols.forEach(c => {
      if (c.type === 'number' && payload[c.key] !== undefined && payload[c.key] !== '') payload[c.key] = Number(payload[c.key]);
      if (c.type === 'tel' && payload[c.key]) payload[c.key] = normaliseMobile(payload[c.key]);
    });
    setBusy(true);
    try {
      if (isNew) {
        const row = await store.insert<T>(collection, payload);
        await onAdded?.(row);
        toast.success(`${title.replace(/s$/, '')} added`);
      } else {
        const { id, ...rest } = payload;
        await store.patch(collection, id, rest);
        toast.success('Saved');
      }
      setEdit(null);
    } catch (e) { toastError(e); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try { await store.remove(collection, del.id); toast.success('Deleted'); setDel(null); } catch (e) { toastError(e); } finally { setBusy(false); }
  };

  const tryDelete = (row: T) => {
    const reason = canDelete?.(row);
    if (reason) { toast.error(reason); return; }
    setDel(row);
  };

  const visible = cols.filter(c => !c.hideInTable);
  return (
    <Panel title={<div><h3 className="text-gray-900">{title}</h3>{subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}</div>}
      actions={<button className={btnPrimary} onClick={() => setEdit({ ...defaults })}><Plus className="w-4 h-4" />{addLabel || 'Add'}</button>}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>{visible.map(c => <th key={c.key} className={thCls}>{c.label}</th>)}<th className={thCls} /></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                {visible.map(c => <td key={c.key} className={tdCls}>{c.render ? c.render(r) : Array.isArray((r as any)[c.key]) ? ((r as any)[c.key] as string[]).join(', ') : String((r as any)[c.key] ?? '—')}</td>)}
                <td className={`${tdCls} whitespace-nowrap text-right`}>
                  <span className="inline-flex gap-1">
                    {extraActions?.(r)}
                    <button className={btnSmall} onClick={() => setEdit({ ...r })} aria-label={`Edit ${r.id}`}><Edit2 className="w-3.5 h-3.5" />Edit</button>
                    <button className={`${btnSmall} text-red-700`} onClick={() => tryDelete(r)} aria-label={`Delete ${r.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState>Nothing set up yet.</EmptyState>}
      </div>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={`${isNew ? 'Add' : 'Edit'} ${title.toLowerCase().replace(/s$/, '')}`} subtitle={edit.id}
          footer={<><button className={btnSecondary} onClick={() => setEdit(null)}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy && <Spinner />}Save</button></>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cols.map(c => {
              const lockReason = !isNew && c.locked ? c.locked(edit as T) : null;
              const v = (edit as any)[c.key];
              const set = (val: any) => setEdit({ ...edit, [c.key]: val });
              return (
                <div key={c.key} className={c.type === 'multi' ? 'md:col-span-2' : ''}>
                  <Field label={c.label} required={c.required} hint={lockReason || undefined}>
                    {c.type === 'select' ? (
                      <select className={inputCls} value={v ?? ''} disabled={!!lockReason} onChange={e => set(e.target.value)}>
                        <option value="">Select</option>{opts(c).map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : c.type === 'multi' ? (
                      <div className="flex flex-wrap gap-3 pt-1">
                        {opts(c).map(o => (
                          <label key={o} className="inline-flex items-center gap-1.5 text-sm">
                            <input type="checkbox" checked={(v || []).includes(o)} onChange={e => set(e.target.checked ? [...(v || []), o] : (v || []).filter((x: string) => x !== o))} />{o}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input className={inputCls} type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : c.type === 'email' ? 'email' : 'text'}
                        value={v ?? ''} disabled={!!lockReason} onChange={e => set(e.target.value)} />
                    )}
                  </Field>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
      <Confirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} busy={busy} danger confirmLabel="Delete" title="Delete record"
        message={<>Delete <b>{(del as any)?.name || (del as any)?.stageName || (del as any)?.unitType || del?.id}</b>? This can't be undone; the deletion is kept in the audit trail.</>} />
    </Panel>
  );
}

// ---------------- page ----------------

export function MasterSetup() {
  const store = getDataStore();
  const [tab, setTab] = useState('projects');
  const [genFor, setGenFor] = useState<Project | null>(null);
  const leads = store.getLeads();
  const bookings = store.getBookings();
  const projectNames = () => store.getProjects().map(p => p.name);
  const usedProject = (name: string) => leads.some(l => l.project === name) || bookings.some(b => b.project === name);
  const usedUser = (name: string) => leads.some(l => l.assignedTo === name) || bookings.some(b => b.salesExec === name || b.crmExec === name) || store.getVisits().some(v => v.salesExec === name || v.telecaller === name);

  return (
    <div className="space-y-6">
      <PageHeader title="Master Setup" subtitle="Projects, team, sources, price list, construction stages, targets and business rules. Every change is recorded in the audit trail." />
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[
          { id: 'projects', label: 'Projects' }, { id: 'users', label: 'Team' }, { id: 'sources', label: 'Lead sources' },
          { id: 'pricing', label: 'Price list' }, { id: 'stages', label: 'Construction stages' }, { id: 'targets', label: 'Targets' },
          { id: 'settings', label: 'Rules & integrations' },
        ]} />
      </Panel>

      {tab === 'projects' && (
        <CrudTable<Project> title="Projects" subtitle="Adding a project also creates the standard 8-stage payment plan. Use 'Units' to generate its inventory." collection="projects" rows={store.getProjects()}
          defaults={{ status: 'Planning', towers: 1, units: 0 }}
          cols={[
            { key: 'name', label: 'Name', required: true, locked: r => usedProject(r.name) ? 'Leads and bookings refer to this name, so it can\'t be renamed' : null,
              validate: (v, r) => store.getProjects().some(p => p.name.toLowerCase() === String(v).trim().toLowerCase() && p.id !== r.id) ? 'A project with this name exists' : null },
            { key: 'location', label: 'Location', required: true },
            { key: 'towers', label: 'Towers', type: 'number', required: true },
            { key: 'units', label: 'Units', type: 'number', render: r => `${store.getUnits().filter(u => u.project === r.name).length} set up` },
            { key: 'reraNumber', label: 'RERA no.' },
            { key: 'possessionDate', label: 'Possession by', type: 'date' },
            { key: 'status', label: 'Status', type: 'select', options: ['Planning', 'Active', 'Completed'], required: true, render: r => <Badge>{r.status}</Badge> },
            { key: 'latitude', label: 'Site latitude', type: 'number', hideInTable: true },
            { key: 'longitude', label: 'Site longitude', type: 'number', hideInTable: true },
          ]}
          canDelete={r => usedProject(r.name) ? 'This project has leads or bookings. Mark it Completed instead of deleting.' : store.getUnits().some(u => u.project === r.name) ? 'Delete its units first, or mark the project Completed.' : null}
          onAdded={async p => {
            await store.insertMany('projectStages', DEFAULT_STAGES.map(([stageName, percent], i) => ({ project: p.name, seq: i + 1, stageName, percent, completed: false }))).catch(() => {});
          }}
          extraActions={r => <button className={btnSmall} onClick={() => setGenFor(r)} disabled={store.getUnits().some(u => u.project === r.name)}><Grid3X3 className="w-3.5 h-3.5" />Units</button>}
          addLabel="Add project" />
      )}

      {tab === 'users' && (
        <CrudTable<User> title="Team members" subtitle="Deactivate people who leave; their leads stay with them until reassigned in Lead Pool." collection="users" rows={store.getUsers()}
          defaults={{ status: 'Active', target: 0, projectAccess: [] }}
          cols={[
            { key: 'name', label: 'Name', required: true, locked: r => usedUser(r.name) ? 'Records refer to this name, so it can\'t be renamed' : null },
            { key: 'role', label: 'Role', type: 'select', options: ROLES, required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'mobile', label: 'Mobile', type: 'tel' },
            { key: 'reportsTo', label: 'Reports to', type: 'select', options: () => store.getUsers().filter(u => ['Team Leader', 'MIS Head'].includes(u.role)).map(u => u.name) },
            { key: 'target', label: 'Monthly target', type: 'number' },
            { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true, render: r => <Badge>{r.status}</Badge> },
            { key: 'projectAccess', label: 'Projects', type: 'multi', options: projectNames, render: r => (r.projectAccess || []).length ? (r.projectAccess || []).join(', ') : 'All' },
          ]}
          canDelete={r => usedUser(r.name) ? `${r.name} has leads, visits or bookings. Set status to Inactive instead.` : null}
          addLabel="Add member" />
      )}

      {tab === 'sources' && (
        <CrudTable<LeadSource> title="Lead sources" collection="sources" rows={store.getSources()} defaults={{ status: 'Active', type: 'Digital', costPerLead: 0 }}
          cols={[
            { key: 'name', label: 'Name', required: true, locked: r => leads.some(l => l.source === r.name) ? 'Leads use this source name' : null },
            { key: 'type', label: 'Type', type: 'select', options: ['Digital', 'Portal', 'CP', 'Offline'], required: true },
            { key: 'costPerLead', label: 'Cost per lead (₹)', type: 'number', render: r => r.costPerLead ? inr(r.costPerLead) : '—' },
            { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true, render: r => <Badge>{r.status}</Badge> },
          ]}
          canDelete={r => leads.some(l => l.source === r.name) ? 'Leads came from this source. Mark it Inactive instead.' : null}
          addLabel="Add source" />
      )}

      {tab === 'pricing' && (
        <CrudTable<PriceListItem> title="Price list" subtitle="Unit price = base price + floor rise × carpet area × (floor − 1). Booked units keep their agreed price." collection="priceList" rows={store.list<PriceListItem>('priceList')}
          defaults={{ status: 'Active', floorRisePerSqft: 20 }}
          cols={[
            { key: 'project', label: 'Project', type: 'select', options: projectNames, required: true },
            { key: 'unitType', label: 'Unit type', required: true },
            { key: 'carpetArea', label: 'Carpet (sq ft)', type: 'number', required: true },
            { key: 'ratePerSqft', label: 'Rate / sq ft', type: 'number', required: true, render: r => inr(r.ratePerSqft) },
            { key: 'basePrice', label: 'Base price', type: 'number', required: true, render: r => inr(r.basePrice) },
            { key: 'floorRisePerSqft', label: 'Floor rise / sq ft', type: 'number', render: r => inr(r.floorRisePerSqft) },
            { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], render: r => <Badge>{r.status}</Badge> },
          ]}
          addLabel="Add price" />
      )}

      {tab === 'stages' && <StagesEditor />}
      {tab === 'targets' && <TargetsTable />}
      {tab === 'settings' && <SettingsPanel />}
      {genFor && <GenerateUnitsDialog project={genFor} onClose={() => setGenFor(null)} />}
    </div>
  );
}

function StagesEditor() {
  const store = getDataStore();
  const projects = store.getProjects();
  const [project, setProject] = useState(projects[0]?.name || '');
  const rows = store.list<ProjectStage>('projectStages').filter(s => s.project === project).sort((a, b) => a.seq - b.seq);
  const total = rows.reduce((s, r) => s + Number(r.percent), 0);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Project"><select className={inputCls} value={project} onChange={e => setProject(e.target.value)}>{projects.map(p => <option key={p.id}>{p.name}</option>)}</select></Field>
        <p className={`text-sm pb-2 ${total === 100 ? 'text-green-700' : 'text-red-700'}`}>Stages add up to {total}%{total !== 100 && ' — should be 100%'}</p>
      </div>
      <CrudTable<ProjectStage> title="Construction stages" subtitle="New bookings get an instalment for each stage. Mark stages complete in Payments → Construction stages." collection="projectStages" rows={rows}
        defaults={{ project, seq: (rows[rows.length - 1]?.seq || 0) + 1, completed: false }}
        cols={[
          { key: 'seq', label: 'Order', type: 'number', required: true, render: r => <span>{r.seq} {r.completed && <Badge tone="green">Completed</Badge>}</span> },
          { key: 'stageName', label: 'Stage', required: true },
          { key: 'percent', label: '% of value', type: 'number', required: true, validate: v => Number(v) > 0 && Number(v) <= 100 ? null : 'Percent must be between 1 and 100' },
          { key: 'project', label: 'Project', type: 'select', options: () => projects.map(p => p.name), hideInTable: true, required: true },
        ]}
        canDelete={r => r.completed ? 'Completed stages can\'t be deleted' : null}
        addLabel="Add stage" />
    </div>
  );
}

function TargetsTable() {
  const store = getDataStore();
  const month = today().slice(0, 7);
  const users = store.getUsers().filter(u => u.status === 'Active' && ['Telecaller', 'Sales Executive', 'Sourcing Executive', 'Team Leader'].includes(u.role));
  const achieved = (u: User) => {
    if (u.role === 'Telecaller') return { n: store.getVisits().filter(v => v.telecaller === u.name && monthKey(v.createdAt) === month).length, unit: 'visits booked' };
    if (u.role === 'Sales Executive') return { n: store.getBookings().filter(b => b.salesExec === u.name && b.stage !== 'Cancelled' && monthKey(b.bookingDate) === month).length, unit: 'bookings' };
    if (u.role === 'Sourcing Executive') return { n: store.getLeads().filter(l => l.cpId && monthKey(l.createdAt) === month).length, unit: 'partner leads' };
    return { n: store.getBookings().filter(b => b.stage !== 'Cancelled' && monthKey(b.bookingDate) === month).length, unit: 'team bookings' };
  };
  const [edits, setEdits] = useState<Record<string, number>>({});
  const save = async (u: User) => {
    const v = edits[u.id];
    if (v === undefined || v < 0) return;
    try { await store.patch('users', u.id, { target: v }); toast.success(`Target for ${u.name} set to ${v}`); setEdits(e => { const n = { ...e }; delete n[u.id]; return n; }); } catch (e) { toastError(e); }
  };
  return (
    <Panel title="Monthly targets" actions={<span className="text-xs text-gray-500">Telecallers: site visits booked · Sales: bookings · Sourcing: partner leads</span>}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>{['Member', 'Role', 'Monthly target', 'Weekly', 'Achieved this month', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => {
              const a = achieved(u);
              const t = edits[u.id] ?? u.target;
              const pct = u.target ? Math.round(a.n / u.target * 100) : 0;
              return (
                <tr key={u.id}>
                  <td className={tdCls}>{u.name}</td><td className={`${tdCls} text-gray-600`}>{u.role}</td>
                  <td className={tdCls}><input type="number" min={0} className={`${inputCls} w-24 max-w-[6rem]`} value={t} onChange={e => setEdits({ ...edits, [u.id]: Number(e.target.value) })} aria-label={`Target for ${u.name}`} /></td>
                  <td className={`${tdCls} text-gray-600`}>{Math.ceil(t / 4)}</td>
                  <td className={`${tdCls} min-w-[200px]`}><div className="text-xs text-gray-600 mb-1">{a.n} {a.unit} ({pct}%)</div><ProgressBar value={pct} tone={pct >= 100 ? 'green' : pct >= 60 ? 'blue' : 'orange'} /></td>
                  <td className={tdCls}>{edits[u.id] !== undefined && edits[u.id] !== u.target && <button className={btnSmall} onClick={() => save(u)}>Save</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function SettingsPanel() {
  const store = getDataStore();
  const keys = [
    { key: 'company_name', label: 'Company name (on letters and receipts)' },
    { key: 'lead_sla_minutes', label: 'Call new leads within (minutes)', number: true },
    { key: 'discount_limit_pct', label: 'Discount allowed without approval (%)', number: true },
    { key: 'late_interest_pct', label: 'Interest on late payments (% a year)', number: true },
  ];
  const [vals, setVals] = useState<Record<string, string>>(Object.fromEntries(keys.map(k => [k.key, store.setting(k.key)])));
  const [busy, setBusy] = useState(false);
  const save = async () => {
    for (const k of keys) if (k.number && (isNaN(Number(vals[k.key])) || Number(vals[k.key]) < 0)) { toast.error(`${k.label} must be a number`); return; }
    setBusy(true);
    try { for (const k of keys) if (vals[k.key] !== store.setting(k.key)) await store.setSetting(k.key, vals[k.key]); toast.success('Rules saved'); } catch (e) { toastError(e); } finally { setBusy(false); }
  };
  const regenerate = async () => {
    const token = `genxa-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 8)}`;
    try { await store.setSetting('intake_token', token); toast.success('New intake token created. Update it in every connected lead source.'); } catch (e) { toastError(e); }
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title={<span className="inline-flex items-center gap-2"><Settings2 className="w-4 h-4" />Business rules</span>}>
        <div className="p-4 space-y-4">
          {keys.map(k => <Field key={k.key} label={k.label}><input className={inputCls} value={vals[k.key] ?? ''} onChange={e => setVals({ ...vals, [k.key]: e.target.value })} /></Field>)}
          <button className={btnPrimary} onClick={save} disabled={busy}>{busy && <Spinner />}Save rules</button>
          <p className="text-xs text-gray-500">The database enforces these: bookings above the discount limit go for approval, and the SLA drives the "not called" alerts.</p>
        </div>
      </Panel>
      <Panel title={<span className="inline-flex items-center gap-2"><Plug className="w-4 h-4" />Integrations</span>}>
        <div className="p-4 space-y-4 text-sm">
          <Integration name="Lead intake API" status="Live" tone="green">
            <code className="text-xs break-all">{SUPABASE_URL}/functions/v1/lead-intake</code>
            <div className="flex items-center gap-2 mt-1"><span className="text-xs text-gray-500">Token</span><code className="text-xs">{store.setting('intake_token')}</code><button className={btnSmall} onClick={regenerate}><RefreshCw className="w-3 h-3" />New token</button></div>
            <p className="text-xs text-gray-500 mt-1">Website, Google Ads, Meta lead ads and portals post here. Setup guide in Lead Capture → Auto Intake.</p>
          </Integration>
          <Integration name="WhatsApp" status="Click-to-chat" tone="blue">
            <p className="text-xs text-gray-600">Messages open in WhatsApp and are logged. For automatic sending, get a WhatsApp Business API number (Interakt, Gupshup, WATI or Meta Cloud API), then store its key as a Supabase secret — never in the browser — and the queued reminders can be sent by a scheduled function.</p>
          </Integration>
          <Integration name="Cloud calling (Exotel / Knowlarity)" status="Click-to-call" tone="blue">
            <p className="text-xs text-gray-600">Call buttons dial from the phone and log the call. With an Exotel or Knowlarity account, point its call-status webhook to a function that writes to call logs with the recording URL; the call history screen already shows recordings.</p>
          </Integration>
          <Integration name="Tally" status="Export" tone="blue">
            <p className="text-xs text-gray-600">Payments → Export to Tally creates a voucher XML for Gateway → Import Data → Vouchers.</p>
          </Integration>
          <Integration name="Daily refresh" status="On load" tone="green">
            <p className="text-xs text-gray-600">Expired blocks are released, overdue instalments flagged, and demo dates moved to today each time the CRM opens (demo anchor {store.setting('demo_anchor')}).</p>
          </Integration>
        </div>
      </Panel>
    </div>
  );
}

function Integration({ name, status, tone, children }: { name: string; status: string; tone: string; children: ReactNode }) {
  return <div className="border border-gray-200 rounded-lg p-3"><div className="flex items-center justify-between mb-1"><span className="text-gray-900">{name}</span><Badge tone={tone}>{status}</Badge></div>{children}</div>;
}

function GenerateUnitsDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const store = getDataStore();
  const prices = store.list<PriceListItem>('priceList').filter(p => p.project === project.name && p.status !== 'Inactive');
  const [f, setF] = useState({ towers: project.towers || 1, floors: 10, perFloor: 4, facing: 'East,West,North,South' });
  const [busy, setBusy] = useState(false);
  const total = f.towers * f.floors * f.perFloor;
  const go = async () => {
    if (prices.length === 0) { toast.error('Add the price list for this project first'); return; }
    if (total > 2000 || total < 1) { toast.error('Between 1 and 2,000 units at a time'); return; }
    const facings = f.facing.split(',').map(s => s.trim()).filter(Boolean);
    const rows: Partial<Unit>[] = [];
    for (let t = 0; t < f.towers; t++) {
      const tower = String.fromCharCode(65 + t);
      for (let fl = 1; fl <= f.floors; fl++) for (let n = 1; n <= f.perFloor; n++) {
        const p = prices[(n - 1) % prices.length];
        rows.push({ project: project.name, tower, floor: fl, unitNumber: `${tower}-${fl}${String(n).padStart(2, '0')}`, unitType: p.unitType, carpetArea: p.carpetArea, basePrice: p.basePrice, facing: facings[(n - 1) % facings.length], status: 'Available' });
      }
    }
    setBusy(true);
    try {
      for (let i = 0; i < rows.length; i += 500) await store.insertMany('units', rows.slice(i, i + 500));
      await store.patch('projects', project.id, { units: rows.length, towers: f.towers });
      toast.success(`${rows.length} units created for ${project.name}`);
      onClose();
    } catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`Generate units · ${project.name}`} subtitle="Unit types cycle through the project's price list across each floor."
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={go} disabled={busy}>{busy ? <Spinner /> : <HardHat className="w-4 h-4" />}Create {total} units</button></>}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Towers (A, B, …)"><input type="number" min={1} max={26} className={inputCls} value={f.towers} onChange={e => setF({ ...f, towers: Number(e.target.value) })} /></Field>
        <Field label="Floors per tower"><input type="number" min={1} max={80} className={inputCls} value={f.floors} onChange={e => setF({ ...f, floors: Number(e.target.value) })} /></Field>
        <Field label="Units per floor"><input type="number" min={1} max={20} className={inputCls} value={f.perFloor} onChange={e => setF({ ...f, perFloor: Number(e.target.value) })} /></Field>
        <Field label="Facings (comma separated)"><input className={inputCls} value={f.facing} onChange={e => setF({ ...f, facing: e.target.value })} /></Field>
      </div>
      <p className="text-xs text-gray-500 mt-3">{prices.length ? `Types: ${prices.map(p => p.unitType).join(', ')}` : 'No price list yet for this project.'} · Created {localDate()}</p>
    </Modal>
  );
}

