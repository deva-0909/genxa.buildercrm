// Approvals inbox (discounts above the limit, cancellations) and the
// audit trail viewer.
import { useEffect, useState } from 'react';
import { ShieldCheck, Clock, ThumbsUp, ThumbsDown, History, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Approval, AuditEntry, toastError } from '../lib/dataStore';
import { canApprove } from '../lib/crm';
import { inr, fmtDateTime, downloadCSV, today } from '../lib/format';
import { PageHeader, StatCard, Panel, Tabs, Badge, thCls, tdCls, btnSmall, btnSmallPrimary, btnPrimary, btnSecondary, btnDanger, inputCls, EmptyState, Modal, Field, Spinner } from './common';
import { BookingDetail } from './BookingParts';

export function DecideDialog({ approval, approve, onClose }: { approval: Approval; approve: boolean; onClose: () => void }) {
  const store = getDataStore();
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!approve && !remarks.trim()) { toast.error('Give a reason for rejecting'); return; }
    setBusy(true);
    try {
      await store.patch('approvals', approval.id, {
        status: approve ? 'Approved' : 'Rejected',
        remarks: `${approval.remarks ? approval.remarks + ' | ' : ''}${approve ? 'Approved' : 'Rejected'}${remarks.trim() ? ': ' + remarks.trim() : ''}`,
      });
      toast.success(`${approval.type} ${approve ? 'approved' : 'rejected'}`);
      onClose();
    } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`${approve ? 'Approve' : 'Reject'} ${approval.type.toLowerCase()}`} subtitle={approval.title} size="sm"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={approve ? btnPrimary : btnDanger} onClick={save} disabled={busy}>{busy && <Spinner />}{approve ? 'Approve' : 'Reject'}</button></>}>
      <div className="space-y-3 text-sm">
        <p className="text-gray-700">{approval.remarks}</p>
        {approval.amount ? <p>Amount: <b>{inr(approval.amount)}</b></p> : null}
        <p className="text-gray-600">
          {approval.type === 'Discount'
            ? approve ? 'The discount stands and the booking proceeds.' : 'The booking is flagged; sales must renegotiate the price with the customer.'
            : approve ? 'The booking is cancelled, the unit goes back on sale and the lead is closed. Finance then pays the refund.' : 'The booking continues as before.'}
        </p>
        <Field label={approve ? 'Remarks (optional)' : 'Reason'} required={!approve}><textarea rows={2} className={inputCls} value={remarks} onChange={e => setRemarks(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

export function ApprovalsPage() {
  const store = getDataStore();
  const persona = store.getPersona();
  const [tab, setTab] = useState('pending');
  const [decide, setDecide] = useState<{ a: Approval; approve: boolean } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const all = store.list<Approval>('approvals');
  const pending = all.filter(a => a.status === 'Pending');
  const rows = tab === 'pending' ? pending : all.filter(a => a.status !== 'Pending');
  const bookingFor = (a: Approval) => a.type === 'Discount' ? a.refId : store.list<any>('cancellations').find(c => c.id === a.refId)?.bookingId;
  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" subtitle={`Discounts above ${store.settingNumber('discount_limit_pct', 2)}% of price and every cancellation need a manager's approval. Decisions are recorded with name and time.`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Waiting" value={pending.length} icon={Clock} tone="orange" />
        <StatCard label="You can decide" value={pending.filter(a => canApprove(persona, a)).length} icon={ShieldCheck} tone="blue" />
        <StatCard label="Discounts pending" value={inr(pending.filter(a => a.type === 'Discount').reduce((s, a) => s + (a.amount || 0), 0))} icon={ThumbsUp} tone="purple" />
        <StatCard label="Decided (all time)" value={all.length - pending.length} icon={History} />
      </div>
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'pending', label: 'Pending', count: pending.length }, { id: 'done', label: 'Decided', count: all.length - pending.length }]} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>{['Request', 'Type', 'Details', 'Amount', 'Requested', 'Status', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(a => {
                const bid = bookingFor(a);
                return (
                  <tr key={a.id}>
                    <td className={tdCls}>{a.id}<div className="text-xs text-gray-500">{a.refId}</div></td>
                    <td className={tdCls}><Badge tone={a.type === 'Discount' ? 'purple' : 'red'}>{a.type}</Badge></td>
                    <td className={`${tdCls} max-w-[340px]`}>{bid ? <button className="hover:underline text-left" onClick={() => setDetail(bid)}>{a.title}</button> : a.title}<div className="text-xs text-gray-500">{a.remarks}</div></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{a.amount ? inr(a.amount) : '—'}</td>
                    <td className={`${tdCls} text-xs text-gray-600 whitespace-nowrap`}>{a.requestedBy}<div>{fmtDateTime(a.requestedAt)}</div></td>
                    <td className={tdCls}><Badge>{a.status}</Badge>{a.decidedBy && <div className="text-xs text-gray-500 whitespace-nowrap">{a.decidedBy} · {fmtDateTime(a.decidedAt)}</div>}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      {a.status === 'Pending' && (canApprove(persona, a) ? (
                        <span className="inline-flex gap-1">
                          <button className={btnSmallPrimary} onClick={() => setDecide({ a, approve: true })}><ThumbsUp className="w-3.5 h-3.5" />Approve</button>
                          <button className={btnSmall} onClick={() => setDecide({ a, approve: false })}><ThumbsDown className="w-3.5 h-3.5" />Reject</button>
                        </span>
                      ) : <span className="text-xs text-gray-500">{a.type === 'Discount' ? 'Team Leader / MIS Head' : 'MIS Head / Finance'}</span>)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState>No approvals here.</EmptyState>}
        </div>
      </Panel>
      {decide && <DecideDialog approval={decide.a} approve={decide.approve} onClose={() => setDecide(null)} />}
      {detail && <BookingDetail bookingId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

const TABLE_NAMES = ['leads', 'site_visits', 'bookings', 'payments', 'payment_schedule', 'agreements', 'loans', 'documents', 'possessions', 'cancellations', 'approvals', 'units', 'blocked_units', 'support_tickets', 'team_members', 'projects', 'price_list', 'project_stages', 'channel_partners', 'commission_payouts', 'call_logs'];

export function AuditTrailPage() {
  const store = getDataStore();
  const [filter, setFilter] = useState({ table: '', rowId: '', actor: '' });
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const load = () => {
    setRows(null);
    store.fetchAudit({ table: filter.table || undefined, rowId: filter.rowId.trim() || undefined, actor: filter.actor.trim() || undefined, limit: 300 })
      .then(setRows).catch(e => { toastError(e); setRows([]); });
  };
  useEffect(load, []);
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Trail" subtitle="Every insert, change and delete on CRM records, with who made it and what changed. Records can't be edited or removed from here." />
      <Panel title="Filters" actions={rows && rows.length > 0 && <button className={btnSecondary} onClick={() => downloadCSV(`audit-${today()}.csv`, rows.map(r => ({ time: r.createdAt, actor: r.actor, action: r.action, table: r.tableName, record: r.rowId, changes: JSON.stringify(r.changes) })))}><Download className="w-4 h-4" />Export</button>}>
        <div className="p-3 flex flex-wrap items-end gap-2">
          <Field label="Record type"><select className={inputCls} value={filter.table} onChange={e => setFilter({ ...filter, table: e.target.value })}><option value="">All (except call logs)</option>{TABLE_NAMES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</select></Field>
          <Field label="Record ID"><input className={inputCls} value={filter.rowId} onChange={e => setFilter({ ...filter, rowId: e.target.value })} placeholder="e.g. BK131" /></Field>
          <Field label="Changed by"><input className={inputCls} value={filter.actor} onChange={e => setFilter({ ...filter, actor: e.target.value })} placeholder="Name" /></Field>
          <button className={btnPrimary} onClick={load}><RefreshCw className="w-4 h-4" />Apply</button>
        </div>
      </Panel>
      <Panel>
        {!rows ? <div className="py-10 flex justify-center"><Spinner /></div> : rows.length === 0 ? <EmptyState>No changes match.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['When', 'Who', 'Action', 'Record', 'Changes'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(r => {
                  const entries = Object.entries(r.changes || {});
                  const summary = r.action === 'UPDATE'
                    ? entries.map(([k, v]: [string, any]) => `${k.replace(/_/g, ' ')}: ${fmt((Array.isArray(v) ? v : [v?.old, v?.new])[0])} → ${fmt((Array.isArray(v) ? v : [v?.old, v?.new])[1])}`)
                    : entries.filter(([, v]) => v !== null && v !== '').slice(0, 6).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${fmt(v)}`);
                  return (
                    <tr key={r.id} className="align-top">
                      <td className={`${tdCls} whitespace-nowrap text-gray-600`}>{fmtDateTime(r.createdAt)}</td>
                      <td className={tdCls}>{r.actor}</td>
                      <td className={tdCls}><Badge tone={r.action === 'INSERT' ? 'green' : r.action === 'DELETE' ? 'red' : 'blue'}>{r.action === 'INSERT' ? 'Created' : r.action === 'DELETE' ? 'Deleted' : 'Changed'}</Badge></td>
                      <td className={`${tdCls} whitespace-nowrap`}>{r.rowId}<div className="text-xs text-gray-500">{r.tableName.replace(/_/g, ' ')}</div></td>
                      <td className={`${tdCls} text-xs text-gray-700`}>
                        {(open === r.id ? summary : summary.slice(0, 3)).map((s, i) => <div key={i} className="max-w-[520px] truncate" title={s}>{s}</div>)}
                        {summary.length > 3 && <button className="text-blue-700 hover:underline" onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? 'less' : `+${summary.length - 3} more`}</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

const fmt = (x: any) => x === null || x === undefined || x === '' ? '—' : typeof x === 'object' ? JSON.stringify(x).slice(0, 80) : String(x);
