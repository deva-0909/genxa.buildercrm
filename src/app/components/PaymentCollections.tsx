import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, AlertCircle, CheckCircle, TrendingUp, Download, Receipt, Printer, Bell, HardHat, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Booking, Payment, ScheduleItem, ProjectStage, localDate, toastError } from '../lib/dataStore';
import { interestOn, liveBookings, bookingFinance } from '../lib/crm';
import { inr, inrShort, fmtDate, lastMonths, monthKey, downloadCSV, downloadText, today, addDays, escapeHtml } from '../lib/format';
import { printReceipt, printDemandLetter } from '../lib/documents';
import { PageHeader, StatCard, Panel, Tabs, Badge, thCls, tdCls, btnSecondary, btnSmall, inputCls, EmptyState, ContactButtons, Confirm, Field } from './common';
import { RecordPaymentDialog, BookingDetail } from './BookingParts';

export function PaymentCollections() {
  const store = getDataStore();
  const persona = store.getPersona();
  const [tab, setTab] = useState('receivables');
  const [pay, setPay] = useState<{ b: Booking; amount?: number } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [filter, setFilter] = useState({ project: '', status: '', q: '' });
  const [range, setRange] = useState({ from: addDays(today(), -90), to: today(), mode: '' });

  const bookings = liveBookings();
  const byId = new Map(store.getBookings().map(b => [b.id, b]));
  const live = new Set(bookings.map(b => b.id));
  const schedule = store.list<ScheduleItem>('paymentSchedule').filter(s => live.has(s.bookingId));
  const payments = store.list<Payment>('payments');
  const receipts = payments.filter(p => p.type === 'Receipt');
  const t = today();
  const month = t.slice(0, 7);

  const open = schedule.filter(s => ['Due', 'Overdue', 'Partially Paid'].includes(s.status));
  const bal = (s: ScheduleItem) => Math.max(0, s.amount + s.gst - s.paid);
  const overdue = open.filter(s => s.status === 'Overdue');
  const interest = overdue.reduce((a, s) => a + interestOn(s).amount, 0);
  const due30 = open.filter(s => s.status !== 'Overdue' && (!s.dueDate || s.dueDate <= addDays(t, 30))).reduce((a, s) => a + bal(s), 0);
  const collectedMTD = receipts.filter(p => monthKey(p.receivedDate) === month).reduce((a, p) => a + p.amount, 0);
  const demandedToDate = schedule.filter(s => s.dueDate && s.dueDate <= t).reduce((a, s) => a + s.amount + s.gst, 0);
  const paidOnDemanded = schedule.filter(s => s.dueDate && s.dueDate <= t).reduce((a, s) => a + s.paid, 0);

  const months = lastMonths(6);
  const trend = months.map(m => ({
    month: m.label,
    Demanded: Math.round(schedule.filter(s => monthKey(s.dueDate) === m.key).reduce((a, s) => a + s.amount + s.gst, 0) / 1e5),
    Collected: Math.round(receipts.filter(p => monthKey(p.receivedDate) === m.key).reduce((a, p) => a + p.amount, 0) / 1e5),
  }));
  const modes = Array.from(new Set(receipts.map(p => p.mode)));
  const byMode = modes.map(m => ({ mode: m, Amount: Math.round(receipts.filter(p => p.mode === m).reduce((a, p) => a + p.amount, 0) / 1e5) }));

  const recv = open.map(s => ({ s, b: byId.get(s.bookingId)! })).filter(x => x.b)
    .filter(x => (!filter.project || x.b.project === filter.project) && (!filter.status || x.s.status === filter.status)
      && (!filter.q || `${x.b.customer} ${x.b.unit} ${x.b.id}`.toLowerCase().includes(filter.q.toLowerCase())))
    .sort((a, b) => (a.s.dueDate || '9999').localeCompare(b.s.dueDate || '9999'));

  const ledger = payments.filter(p => p.receivedDate >= range.from && p.receivedDate <= range.to && (!range.mode || p.mode === range.mode))
    .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate) || b.createdAt.localeCompare(a.createdAt));

  const reminderText = (b: Booking, s: ScheduleItem) =>
    `Dear ${b.customer}, ${inr(bal(s))} for the ${s.stageName} instalment of unit ${b.unit}, ${b.project} ${s.status === 'Overdue' ? `was due on ${fmtDate(s.dueDate)} and is overdue. Interest at ${store.settingNumber('late_interest_pct', 10.5)}% a year applies` : `is due by ${fmtDate(s.dueDate)}`}. Please quote booking ${b.id}. - ${store.setting('company_name', 'GENXA Developers')}`;

  const [queueOpen, setQueueOpen] = useState(false);
  const queueReminders = async () => {
    const rows = overdue.map(s => ({ s, b: byId.get(s.bookingId)! })).filter(x => x.b);
    try {
      await store.insertMany('notifications', rows.map(({ s, b }) => ({
        channel: 'WhatsApp', recipientName: b.customer, recipientContact: b.mobile, template: 'Payment Reminder', message: reminderText(b, s),
        status: 'Queued', relatedType: 'booking', relatedId: b.id, sentBy: persona.name, scheduledFor: today(),
      })));
      toast.success(`${rows.length} overdue reminders queued in Notifications`);
    } catch (e) { toastError(e); }
    setQueueOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payments & Collections" subtitle="Construction-linked schedules, receipts, demand letters and late-payment interest for every booking."
        actions={<>
          <button className={btnSecondary} onClick={() => setQueueOpen(true)} disabled={overdue.length === 0}><Bell className="w-4 h-4" />Remind overdue ({overdue.length})</button>
          <button className={btnSecondary} onClick={() => exportTally(ledger.length ? ledger : payments, byId)}><FileSpreadsheet className="w-4 h-4" />Export to Tally</button>
        </>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Collected this month" value={inrShort(collectedMTD)} icon={CheckCircle} tone="green" hint={`${receipts.filter(p => monthKey(p.receivedDate) === month).length} receipts`} />
        <StatCard label="Due in next 30 days" value={inrShort(due30)} icon={Clock} tone="orange" />
        <StatCard label="Overdue" value={inrShort(overdue.reduce((a, s) => a + bal(s), 0))} icon={AlertCircle} tone="red" hint={`${overdue.length} instalments · interest ${inrShort(interest)}`} />
        <StatCard label="Collection efficiency" value={`${demandedToDate ? Math.round(paidOnDemanded / demandedToDate * 100) : 100}%`} icon={TrendingUp} hint="Paid of everything due to date" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Demanded vs collected (₹ lakh)" className="lg:col-span-2">
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                <Bar dataKey="Demanded" fill="#cbd5e1" /><Bar dataKey="Collected" fill="#16a34a" /></BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Receipts by mode (₹ lakh)">
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMode} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fontSize: 12 }} /><YAxis dataKey="mode" type="category" width={80} tick={{ fontSize: 12 }} /><Tooltip />
                <Bar dataKey="Amount" fill="#2563eb" /></BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[
          { id: 'receivables', label: 'Receivables', count: open.length },
          { id: 'ledger', label: 'Receipts ledger', count: ledger.length },
          { id: 'stages', label: 'Construction stages' },
          { id: 'customers', label: 'By customer', count: bookings.length },
        ]} />

        {tab === 'receivables' && (
          <>
            <div className="flex flex-wrap gap-2 p-3">
              <input className={`${inputCls} max-w-xs`} placeholder="Search customer, unit, booking" value={filter.q} onChange={e => setFilter({ ...filter, q: e.target.value })} aria-label="Search receivables" />
              <select className={`${inputCls} max-w-[180px]`} value={filter.project} onChange={e => setFilter({ ...filter, project: e.target.value })} aria-label="Project"><option value="">All projects</option>{store.getProjects().map(p => <option key={p.id}>{p.name}</option>)}</select>
              <select className={`${inputCls} max-w-[160px]`} value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} aria-label="Status"><option value="">All open</option><option>Overdue</option><option>Due</option><option>Partially Paid</option></select>
              <span className="flex-1" />
              <button className={btnSecondary} onClick={() => downloadCSV(`receivables-${today()}.csv`, recv.map(({ s, b }) => ({ booking: b.id, customer: b.customer, mobile: b.mobile, project: b.project, unit: b.unit, milestone: s.stageName, amount: s.amount, gst: s.gst, paid: s.paid, balance: bal(s), due_date: s.dueDate, status: s.status, interest: interestOn(s).amount })))}><Download className="w-4 h-4" />Export</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr>{['Customer', 'Unit', 'Milestone', 'Balance', 'Due', 'Status', 'Interest', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {recv.map(({ s, b }) => {
                    const int = interestOn(s);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className={tdCls}><button className="text-left hover:underline" onClick={() => setDetail(b.id)}>{b.customer}</button><div className="text-xs text-gray-500">{b.id}</div></td>
                        <td className={`${tdCls} whitespace-nowrap`}>{b.unit}<div className="text-xs text-gray-500">{b.project}</div></td>
                        <td className={tdCls}>{s.stageName}<div className="text-xs text-gray-500">{s.percent}% · demanded {fmtDate(s.demandDate)}</div></td>
                        <td className={`${tdCls} whitespace-nowrap`}>{inr(bal(s))}{s.paid > 0 && <div className="text-xs text-gray-500">of {inr(s.amount + s.gst)}</div>}</td>
                        <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(s.dueDate)}</td>
                        <td className={tdCls}><Badge>{s.status}</Badge></td>
                        <td className={`${tdCls} whitespace-nowrap text-red-700`}>{int.amount ? <>{inr(int.amount)}<div className="text-xs">{int.days} days</div></> : '—'}</td>
                        <td className={`${tdCls} whitespace-nowrap`}>
                          <span className="inline-flex gap-1">
                            <button className={btnSmall} onClick={() => setPay({ b, amount: bal(s) })}><Receipt className="w-3.5 h-3.5" />Receive</button>
                            <button className={btnSmall} onClick={() => printDemandLetter(b, s)}><Printer className="w-3.5 h-3.5" />Letter</button>
                            <ContactButtons compact mobile={b.mobile} name={b.customer} message={reminderText(b, s)} relatedType="booking" relatedId={b.id} template="Payment Reminder" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {recv.length === 0 && <EmptyState>Nothing outstanding.</EmptyState>}
            </div>
          </>
        )}

        {tab === 'ledger' && (
          <>
            <div className="flex flex-wrap items-end gap-2 p-3">
              <Field label="From"><input type="date" className={inputCls} value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} /></Field>
              <Field label="To"><input type="date" className={inputCls} value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} /></Field>
              <Field label="Mode"><select className={inputCls} value={range.mode} onChange={e => setRange({ ...range, mode: e.target.value })}><option value="">All</option>{modes.map(m => <option key={m}>{m}</option>)}</select></Field>
              <span className="flex-1" />
              <span className="text-sm text-gray-600 pb-2">Receipts {inr(ledger.filter(p => p.type === 'Receipt').reduce((a, p) => a + p.amount, 0))} · Refunds {inr(ledger.filter(p => p.type === 'Refund').reduce((a, p) => a + p.amount, 0))}</span>
              <button className={btnSecondary} onClick={() => downloadCSV(`receipts-${range.from}-to-${range.to}.csv`, ledger.map(p => { const b = byId.get(p.bookingId); return { date: p.receivedDate, receipt_no: p.receiptNo, type: p.type, booking: p.bookingId, customer: b?.customer, project: b?.project, unit: b?.unit, mode: p.mode, reference: p.reference, amount: p.amount, entered_by: p.createdBy }; }))}><Download className="w-4 h-4" />CSV</button>
              <button className={btnSecondary} onClick={() => exportTally(ledger, byId)}><FileSpreadsheet className="w-4 h-4" />Tally XML</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr>{['Date', 'Receipt', 'Customer', 'Unit', 'Type', 'Mode', 'Reference', 'Amount', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {ledger.map(p => {
                    const b = byId.get(p.bookingId);
                    return (
                      <tr key={p.id}>
                        <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(p.receivedDate)}</td>
                        <td className={`${tdCls} whitespace-nowrap`}>{p.receiptNo}</td>
                        <td className={tdCls}>{b?.customer}<div className="text-xs text-gray-500">{p.bookingId}</div></td>
                        <td className={`${tdCls} whitespace-nowrap`}>{b?.unit}<div className="text-xs text-gray-500">{b?.project}</div></td>
                        <td className={tdCls}><Badge>{p.type}</Badge></td>
                        <td className={tdCls}>{p.mode}</td>
                        <td className={`${tdCls} text-gray-600`}>{p.reference || '—'}</td>
                        <td className={`${tdCls} whitespace-nowrap ${p.type === 'Refund' ? 'text-red-700' : ''}`}>{p.type === 'Refund' ? '− ' : ''}{inr(p.amount)}</td>
                        <td className={tdCls}><button className={btnSmall} onClick={() => printReceipt(p)}><Printer className="w-3.5 h-3.5" />Print</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {ledger.length === 0 && <EmptyState>No payments in this period.</EmptyState>}
            </div>
          </>
        )}

        {tab === 'stages' && <StagesPanel />}

        {tab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['Customer', 'Unit', 'Total payable', 'Paid', 'Outstanding', 'Overdue', 'Interest', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(b => { const f = bookingFinance(b); return (
                  <tr key={b.id}>
                    <td className={tdCls}>{b.customer}<div className="text-xs text-gray-500">{b.id}</div></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{b.unit}<div className="text-xs text-gray-500">{b.project}</div></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{inr(f.grandTotal)}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{inr(f.paid)} <span className="text-xs text-gray-500">({f.percentPaid}%)</span></td>
                    <td className={`${tdCls} whitespace-nowrap`}>{inr(f.outstanding)}</td>
                    <td className={`${tdCls} whitespace-nowrap ${f.overdue ? 'text-red-700' : 'text-gray-400'}`}>{f.overdue ? inr(f.overdue) : '—'}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{f.interest ? inr(f.interest) : '—'}</td>
                    <td className={tdCls}><button className={btnSmall} onClick={() => setDetail(b.id)}>Open</button></td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {pay && <RecordPaymentDialog booking={pay.b} presetAmount={pay.amount} onClose={() => setPay(null)} />}
      {detail && <BookingDetail bookingId={detail} onClose={() => setDetail(null)} />}
      <Confirm open={queueOpen} onClose={() => setQueueOpen(false)} onConfirm={queueReminders} title="Queue overdue reminders"
        message={<>Queue a WhatsApp payment reminder for each of the {overdue.length} overdue instalments. They appear in Notifications, where each can be sent with one click (or automatically once a WhatsApp Business API key is added).</>} confirmLabel="Queue reminders" />
    </div>
  );
}

/** Mark construction milestones complete; the database raises demands for every booking in the project. */
function StagesPanel() {
  const store = getDataStore();
  const persona = store.getPersona();
  const canEdit = ['Admin', 'Finance', 'CRM Executive', 'MIS Head'].includes(persona.role);
  const projects = store.getProjects();
  const [project, setProject] = useState(projects[0]?.name || '');
  const [confirm, setConfirm] = useState<ProjectStage | null>(null);
  const [date, setDate] = useState(localDate());
  const [busy, setBusy] = useState(false);
  const stages = store.list<ProjectStage>('projectStages').filter(s => s.project === project).sort((a, b) => a.seq - b.seq);
  const affected = (seq: number) => store.list<ScheduleItem>('paymentSchedule').filter(x => x.seq === seq && !x.demandDate && store.getBookings().some(b => b.id === x.bookingId && b.project === project && b.stage !== 'Cancelled'));
  const complete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const n = affected(confirm.seq).length;
      await store.patch('projectStages', confirm.id, { completed: true, completedDate: date });
      await store.reload(['paymentSchedule', 'notifications', 'bookings']);
      toast.success(`${confirm.stageName} marked complete. ${n} demand${n === 1 ? '' : 's'} raised, due in 15 days.`);
      setConfirm(null);
    } catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <Field label="Project"><select className={inputCls} value={project} onChange={e => setProject(e.target.value)}>{projects.map(p => <option key={p.id}>{p.name}</option>)}</select></Field>
        <p className="text-sm text-gray-600 pb-2">Completing a stage raises the instalment for every live booking in the project, sets the due date 15 days out and queues a demand letter.</p>
      </div>
      <ol className="relative border-l-2 border-gray-200 ml-3 space-y-4">
        {stages.map((s, i) => {
          const next = !s.completed && stages.slice(0, i).every(x => x.completed);
          return (
            <li key={s.id} className="ml-5">
              <span className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 ${s.completed ? 'bg-green-600 border-green-600' : next ? 'bg-white border-blue-600' : 'bg-white border-gray-300'}`} />
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-gray-900">{s.seq}. {s.stageName}</span>
                <span className="text-xs text-gray-500">{s.percent}% of value</span>
                {s.completed ? <Badge tone="green">Completed {fmtDate(s.completedDate)}</Badge> : next ? <Badge tone="blue">Next</Badge> : <Badge tone="gray">Pending</Badge>}
                {next && canEdit && <button className={btnSmall} onClick={() => setConfirm(s)}><HardHat className="w-3.5 h-3.5" />Mark complete</button>}
              </div>
            </li>
          );
        })}
      </ol>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={complete} busy={busy} title={`Complete "${confirm?.stageName}"`} confirmLabel="Complete stage and raise demands"
        message={<div className="space-y-3">
          <p>This raises the {confirm?.stageName} instalment ({confirm?.percent}%) for {confirm ? affected(confirm.seq).length : 0} live booking(s) in {project} and queues demand letters.</p>
          <Field label="Completion date"><input type="date" max={localDate()} className={inputCls} value={date} onChange={e => setDate(e.target.value)} /></Field>
        </div>} />
    </div>
  );
}

/** Tally import file: one Receipt (or Payment, for refunds) voucher per entry. */
function exportTally(list: Payment[], byId: Map<string, Booking>) {
  if (list.length === 0) { toast.error('Nothing to export'); return; }
  const store = getDataStore();
  const company = store.setting('company_name', 'GENXA Developers');
  const x = escapeHtml;
  const vouchers = list.map(p => {
    const b = byId.get(p.bookingId);
    const party = `${b?.customer || 'Customer'} - ${b?.project || ''} ${b?.unit || ''}`.trim();
    const bank = p.mode === 'Cash' ? 'Cash' : p.mode === 'Home Loan' ? 'Home Loan Disbursements' : 'Collection Account';
    const isRefund = p.type === 'Refund';
    return `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="${isRefund ? 'Payment' : 'Receipt'}" ACTION="Create">
<DATE>${p.receivedDate.replace(/-/g, '')}</DATE><VOUCHERTYPENAME>${isRefund ? 'Payment' : 'Receipt'}</VOUCHERTYPENAME><VOUCHERNUMBER>${x(p.receiptNo)}</VOUCHERNUMBER>
<PARTYLEDGERNAME>${x(party)}</PARTYLEDGERNAME><NARRATION>${x(`${p.mode}${p.reference ? ' ' + p.reference : ''}; booking ${p.bookingId}${p.remarks ? '; ' + p.remarks : ''}`)}</NARRATION>
<ALLLEDGERENTRIES.LIST><LEDGERNAME>${x(party)}</LEDGERNAME><ISDEEMEDPOSITIVE>${isRefund ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE><AMOUNT>${isRefund ? -p.amount : p.amount}</AMOUNT></ALLLEDGERENTRIES.LIST>
<ALLLEDGERENTRIES.LIST><LEDGERNAME>${x(bank)}</LEDGERNAME><ISDEEMEDPOSITIVE>${isRefund ? 'No' : 'Yes'}</ISDEEMEDPOSITIVE><AMOUNT>${isRefund ? p.amount : -p.amount}</AMOUNT></ALLLEDGERENTRIES.LIST>
</VOUCHER></TALLYMESSAGE>`;
  }).join('\n');
  const xml = `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${x(company)}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA>
${vouchers}
</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
  downloadText(`tally-receipts-${today()}.xml`, xml, 'application/xml');
  toast.success(`${list.length} vouchers exported. In Tally: Gateway → Import Data → Vouchers.`);
}

