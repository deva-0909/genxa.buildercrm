import { useState } from 'react';
import { Search, Zap, RefreshCw, UserPlus, Download, PhoneMissed, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Lead, isManagerRole, localDate } from '../lib/dataStore';
import { useLeadAssignment } from '../hooks/useLeadAssignment';
import { leadScore, slaBreaches } from '../lib/crm';
import { fmtDateTime, downloadCSV, today } from '../lib/format';
import { PageHeader, Panel, Badge, thCls, tdCls, inputCls, btnPrimary, btnSecondary, btnSmall, EmptyState, ContactButtons } from './common';
import { LeadDetailsDialog } from './LeadDialogs';
import { AssignLeadDialog } from './AssignLeadDialog';
import { BulkAssignDialog } from './BulkAssignDialog';

const PAGE = 50;

export function LeadPool() {
  const store = getDataStore();
  const persona = store.getPersona();
  const manager = isManagerRole(persona.role);
  const [chip, setChip] = useState('open');
  const [q, setQ] = useState('');
  const [f, setF] = useState({ project: '', source: '', owner: '', priority: '' });
  const [sort, setSort] = useState<'score' | 'newest' | 'followup'>('score');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Lead | null>(null);
  const [assign, setAssign] = useState<Lead | null>(null);
  const [bulk, setBulk] = useState(false);
  const { isAssigning, autoAssignLeads, rebalanceLeads } = useLeadAssignment();

  const all = store.getLeads();
  const leads = manager ? all : all.filter(l => l.assignedTo === persona.name);
  const inactive = new Set(store.getUsers().filter(u => u.status === 'Inactive').map(u => u.name));
  const t = localDate();
  const overdue = (l: Lead) => !!l.nextFollowUp && l.nextFollowUp.slice(0, 10) < t && !['Dead', 'Booked'].includes(l.status);
  const sla = new Set(slaBreaches(leads).map(l => l.id));
  const scores = new Map(leads.map(l => [l.id, leadScore(l)]));

  const chips: { id: string; label: string; test: (l: Lead) => boolean; tone?: string }[] = [
    { id: 'open', label: 'Open', test: l => !['Dead', 'Booked'].includes(l.status) },
    { id: 'unassigned', label: 'Unassigned', test: l => !l.assignedTo },
    { id: 'sla', label: 'Not called in time', test: l => sla.has(l.id), tone: 'red' },
    { id: 'overdue', label: 'Follow-up overdue', test: overdue, tone: 'orange' },
    { id: 'hot', label: 'Hot by score', test: l => scores.get(l.id)?.band === 'Hot' && !['Dead', 'Booked'].includes(l.status) },
    { id: 'inactive', label: 'Owner inactive', test: l => !!l.assignedTo && inactive.has(l.assignedTo), tone: 'red' },
    { id: 'New', label: 'New', test: l => l.status === 'New' },
    { id: 'Follow-up', label: 'Follow-up', test: l => l.status === 'Follow-up' },
    { id: 'Qualified', label: 'Qualified', test: l => l.status === 'Qualified' },
    { id: 'Visit Scheduled', label: 'Visit scheduled', test: l => l.status === 'Visit Scheduled' },
    { id: 'Booked', label: 'Booked', test: l => l.status === 'Booked' },
    { id: 'Dead', label: 'Dead', test: l => l.status === 'Dead' },
    { id: 'all', label: 'All', test: () => true },
  ];
  const chipTest = chips.find(c => c.id === chip)!.test;
  const rows = leads.filter(l => chipTest(l)
    && (!f.project || l.project === f.project) && (!f.source || l.source === f.source) && (!f.priority || l.priority === f.priority)
    && (!f.owner || (f.owner === '__none' ? !l.assignedTo : l.assignedTo === f.owner))
    && (!q || `${l.id} ${l.name} ${l.mobile} ${l.email || ''}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => sort === 'score' ? (scores.get(b.id)?.score || 0) - (scores.get(a.id)?.score || 0)
      : sort === 'followup' ? (a.nextFollowUp || '9999').localeCompare(b.nextFollowUp || '9999') : b.createdAt.localeCompare(a.createdAt));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);
  const owners = Array.from(new Set(all.map(l => l.assignedTo).filter(Boolean))) as string[];
  const toggle = (id: string) => { const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); setSelected(n); };
  const allOnPage = view.length > 0 && view.every(l => selected.has(l.id));

  const auto = async () => {
    const r = await autoAssignLeads();
    toast.success(r.assigned ? `${r.assigned} lead(s) assigned` : 'No unassigned leads');
  };
  const rebalance = async () => {
    const n = await rebalanceLeads();
    toast.success(n ? `${n} lead(s) moved to balance workloads` : 'Workloads are already balanced');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Lead Pool" subtitle={manager ? 'All leads, scored and sorted so the best ones get called first.' : `Your ${leads.length} leads, best first.`}
        actions={manager ? <>
          <button className={btnSecondary} onClick={rebalance} disabled={isAssigning}><RefreshCw className="w-4 h-4" />Rebalance</button>
          <button className={btnSecondary} onClick={() => selected.size ? setBulk(true) : toast.info('Tick the leads to assign first')}><UserPlus className="w-4 h-4" />Assign selected ({selected.size})</button>
          <button className={btnPrimary} onClick={auto} disabled={isAssigning}><Zap className="w-4 h-4" />Auto-assign</button>
        </> : undefined} />

      {sla.size > 0 && (
        <button onClick={() => { setChip('sla'); setPage(0); }} className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-left">
          <PhoneMissed className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-900"><b>{sla.size} new lead{sla.size > 1 ? 's' : ''}</b> not called within {store.settingNumber('lead_sla_minutes', 15)} minutes of arriving. Call them now.</span>
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        {chips.map(c => {
          const n = leads.filter(c.test).length;
          if (!n && !['open', 'all'].includes(c.id)) return null;
          return (
            <button key={c.id} onClick={() => { setChip(c.id); setPage(0); setSelected(new Set()); }}
              className={`px-3 py-1.5 rounded-full text-sm border ${chip === c.id ? 'bg-blue-600 border-blue-600 text-white' : c.tone === 'red' ? 'bg-white border-red-200 text-red-700' : c.tone === 'orange' ? 'bg-white border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
              {c.label} <span className="opacity-75">{n}</span>
            </button>
          );
        })}
      </div>

      <Panel>
        <div className="p-3 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputCls} pl-9`} placeholder="Search name, mobile, email or ID" value={q} onChange={e => { setQ(e.target.value); setPage(0); }} aria-label="Search leads" />
          </div>
          <select className={`${inputCls} sm:max-w-[10rem]`} value={f.project} onChange={e => { setF({ ...f, project: e.target.value }); setPage(0); }} aria-label="Project"><option value="">All projects</option>{store.getProjects().map(p => <option key={p.id}>{p.name}</option>)}</select>
          <select className={`${inputCls} sm:max-w-[10rem]`} value={f.source} onChange={e => { setF({ ...f, source: e.target.value }); setPage(0); }} aria-label="Source"><option value="">All sources</option>{store.getSources().map(s => <option key={s.id}>{s.name}</option>)}</select>
          {manager && <select className={`${inputCls} sm:max-w-[10rem]`} value={f.owner} onChange={e => { setF({ ...f, owner: e.target.value }); setPage(0); }} aria-label="Owner"><option value="">All owners</option><option value="__none">Unassigned</option>{owners.sort().map(o => <option key={o}>{o}</option>)}</select>}
          <select className={`${inputCls} sm:max-w-[8rem]`} value={f.priority} onChange={e => { setF({ ...f, priority: e.target.value }); setPage(0); }} aria-label="Priority"><option value="">Any priority</option><option>Hot</option><option>Warm</option><option>Cold</option></select>
          <select className={`${inputCls} sm:max-w-[10rem]`} value={sort} onChange={e => setSort(e.target.value as any)} aria-label="Sort"><option value="score">Best score first</option><option value="newest">Newest first</option><option value="followup">Follow-up date</option></select>
          <button className={btnSecondary} onClick={() => downloadCSV(`leads-${today()}.csv`, rows.map(l => ({ id: l.id, name: l.name, mobile: l.mobile, email: l.email, source: l.source, project: l.project, status: l.status, priority: l.priority, score: scores.get(l.id)?.score, owner: l.assignedTo, budget: l.budget, created: l.createdAt, last_contacted: l.lastContactedAt, next_follow_up: l.nextFollowUp, calls: l.callAttempts })))}><Download className="w-4 h-4" />Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>
              {manager && <th className={thCls}><input type="checkbox" checked={allOnPage} onChange={e => { const n = new Set(selected); view.forEach(l => e.target.checked ? n.add(l.id) : n.delete(l.id)); setSelected(n); }} aria-label="Select page" /></th>}
              {['Lead', 'Contact', 'Project / source', 'Score', 'Status', 'Owner', 'Created', ''].map(h => <th key={h} className={thCls}>{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {view.map(l => {
                const s = scores.get(l.id)!;
                return (
                  <tr key={l.id} className={`hover:bg-gray-50 ${selected.has(l.id) ? 'bg-blue-50/50' : ''}`}>
                    {manager && <td className={tdCls}><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} aria-label={`Select ${l.id}`} /></td>}
                    <td className={tdCls}><button className="text-left hover:underline" onClick={() => setDetails(l)}>{l.name}</button><div className="text-xs text-gray-500">{l.id}</div></td>
                    <td className={tdCls}><div className="whitespace-nowrap">{l.mobile}</div><div className="text-xs text-gray-500 max-w-[180px] truncate">{l.email}</div></td>
                    <td className={tdCls}><div className="whitespace-nowrap">{l.project}</div><div className="text-xs text-gray-500">{l.source}{l.budget ? ` · ${l.budget}` : ''}</div></td>
                    <td className={tdCls}><span title={s.reasons.join('\n')}><Badge tone={s.band === 'Hot' ? 'red' : s.band === 'Warm' ? 'orange' : 'blue'}>{s.score}</Badge></span></td>
                    <td className={tdCls}><Badge tone={l.status === 'Booked' ? 'purple' : l.status === 'Dead' ? 'gray' : 'blue'}>{l.status}</Badge>
                      {sla.has(l.id) && <div className="text-xs text-red-700 whitespace-nowrap">Not called yet</div>}
                      {overdue(l) && <div className="text-xs text-orange-700 whitespace-nowrap">Follow-up overdue</div>}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap`}>{l.assignedTo || <span className="text-red-700">Unassigned</span>}{l.assignedTo && inactive.has(l.assignedTo) && <div className="text-xs text-red-700">Inactive – reassign</div>}</td>
                    <td className={`${tdCls} text-xs text-gray-600 whitespace-nowrap`}>{fmtDateTime(l.createdAt)}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      <span className="inline-flex gap-1">
                        <button className={btnSmall} onClick={() => setDetails(l)}><Eye className="w-3.5 h-3.5" /></button>
                        {manager && <button className={btnSmall} onClick={() => setAssign(l)}>{l.assignedTo ? 'Reassign' : 'Assign'}</button>}
                        <ContactButtons compact mobile={l.mobile} name={l.name} leadId={l.id} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState>No leads match.</EmptyState>}
        </div>
        {rows.length > PAGE && (
          <div className="flex items-center justify-between p-3 border-t border-gray-100 text-sm text-gray-600">
            <span>{page * PAGE + 1}–{Math.min(rows.length, (page + 1) * PAGE)} of {rows.length}</span>
            <span className="inline-flex gap-1">
              <button className={btnSmall} disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
              <button className={btnSmall} disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
            </span>
          </div>
        )}
      </Panel>
      <p className="text-xs text-gray-500">Auto-assign sends unassigned leads to active telecallers by project and current workload. New leads from Lead Capture and the intake API are assigned the moment they arrive.</p>

      {details && <LeadDetailsDialog lead={details} onClose={() => setDetails(null)} />}
      {assign && <AssignLeadDialog lead={assign} onClose={() => setAssign(null)} onSuccess={() => setAssign(null)} />}
      {bulk && <BulkAssignDialog selectedLeads={all.filter(l => selected.has(l.id))} onClose={() => setBulk(false)} onSuccess={() => { setBulk(false); setSelected(new Set()); }} />}
    </div>
  );
}
