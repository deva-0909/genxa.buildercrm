import { useMemo, useState } from 'react';
import { Upload, Globe, UserPlus, Download, AlertTriangle, CheckCircle2, Webhook, Copy, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, Lead, User, toastError, CrmError, toCrmError, localDate } from '../lib/dataStore';
import { SUPABASE_URL } from '../lib/supabase';
import { normaliseMobile, isValidMobile, isValidEmail, parseCSV, downloadCSV, fmtDateTime } from '../lib/format';
import { PageHeader, Field, inputCls, btnPrimary, btnSecondary, Badge, Panel, thCls, tdCls, Spinner } from './common';

const BUDGETS = ['Below 50L', '50L - 75L', '75L - 1Cr', '1Cr - 1.5Cr', 'Above 1.5Cr'];

type Method = 'digital' | 'walkin' | 'cp' | 'api';

/** Find an open lead with the same mobile (the database blocks these too; a dead lead can be re-registered). */
function findDuplicate(mobile: string): Lead | undefined {
  const m = normaliseMobile(mobile);
  if (m.length !== 10) return undefined;
  return getDataStore().getLeads().find(l => l.status !== 'Dead' && normaliseMobile(l.mobile) === m);
}

function DuplicateNotice({ lead }: { lead: Lead }) {
  const store = getDataStore();
  const cp = lead.cpId ? store.getChannelPartners().find(c => c.id === lead.cpId) : undefined;
  return (
    <div className="flex gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800" role="alert">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div>
        This mobile number already belongs to lead <b>{lead.id}</b> ({lead.name}, {lead.project}), status <b>{lead.status}</b>,
        owner <b>{lead.assignedTo || 'unassigned'}</b>{cp ? <>, registered by <b>{cp.companyName}</b></> : null}.
        A second lead can't be created. Update the existing lead instead.
      </div>
    </div>
  );
}

export function LeadCapture() {
  const [method, setMethod] = useState<Method>('digital');
  const store = getDataStore();
  const recent = store.getLeads().slice(0, 8);

  const methods: { id: Method; title: string; text: string; icon: any }[] = [
    { id: 'digital', title: 'Digital Lead', text: 'From ads, portals, website forms', icon: Globe },
    { id: 'walkin', title: 'Walk-In', text: 'Direct visitor at office/site', icon: UserPlus },
    { id: 'cp', title: 'Channel Partner', text: 'CSV / Excel bulk upload', icon: Upload },
    { id: 'api', title: 'Auto Intake', text: 'Meta, Google, portals, website', icon: Webhook },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Lead Capture" subtitle="Every lead is checked for a valid mobile, email and duplicates before it is saved, then assigned to the least-loaded telecaller." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {methods.map(m => {
          const Icon = m.icon;
          const on = method === m.id;
          return (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${on ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <Icon className={`w-6 h-6 mb-2 ${on ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className={on ? 'text-blue-900' : 'text-gray-900'}>{m.title}</div>
              <p className="text-xs text-gray-600 mt-0.5">{m.text}</p>
            </button>
          );
        })}
      </div>

      {method === 'digital' && <LeadForm kind="digital" />}
      {method === 'walkin' && <LeadForm kind="walkin" />}
      {method === 'cp' && <CPUpload />}
      {method === 'api' && <IntakeSetup />}

      <Panel title="Recently captured leads">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>
              {['Lead ID', 'Name', 'Mobile', 'Source', 'Project', 'Captured', 'Owner'].map(h => <th key={h} className={thCls}>{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {recent.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className={tdCls}>{l.id}</td>
                  <td className={tdCls}>{l.name}</td>
                  <td className={`${tdCls} text-gray-600`}>{l.mobile}</td>
                  <td className={`${tdCls} text-gray-600`}>{l.source}</td>
                  <td className={`${tdCls} text-gray-600`}>{l.project}</td>
                  <td className={`${tdCls} text-gray-600 whitespace-nowrap`}>{fmtDateTime(l.createdAt)}</td>
                  <td className={tdCls}>{l.assignedTo ? <Badge tone="green">{l.assignedTo}</Badge> : <Badge tone="orange">Unassigned</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------

function LeadForm({ kind }: { kind: 'digital' | 'walkin' }) {
  const store = getDataStore();
  const projects = store.getProjects();
  const sources = store.getSources().filter(s => s.status === 'Active' && s.type !== 'CP');
  const salesExecs = store.getUsers().filter(u => u.role === 'Sales Executive' && u.status === 'Active');
  const blank = { name: '', mobile: '', email: '', source: kind === 'walkin' ? 'Walk-In' : '', project: '', budget: '', notes: '', location: 'Head Office', hearAbout: '', immediateVisit: 'No', salesExec: '' };
  const [f, setF] = useState(blank);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<CrmError | null>(null);

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setF({ ...f, [k]: e.target.value });
    setServerError(null);
  };
  const touch = (k: string) => () => setTouched({ ...touched, [k]: true });

  const errors: Record<string, string> = {};
  if (!f.name.trim()) errors.name = 'Name is required';
  else if (f.name.trim().length < 2) errors.name = 'Enter the full name';
  if (!f.mobile) errors.mobile = 'Mobile is required';
  else if (!isValidMobile(f.mobile)) errors.mobile = 'Enter a 10-digit Indian mobile starting with 6, 7, 8 or 9';
  if (!isValidEmail(f.email)) errors.email = 'Enter a valid email address';
  if (!f.source) errors.source = 'Choose a source';
  if (!f.project) errors.project = 'Choose a project';
  if (kind === 'walkin' && f.immediateVisit === 'Yes' && !f.salesExec) errors.salesExec = 'Choose who will show the site';
  const duplicate = isValidMobile(f.mobile) ? findDuplicate(f.mobile) : undefined;
  const show = (k: string) => (touched[k] || touched._submit) ? errors[k] : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ ...touched, _submit: true });
    if (Object.keys(errors).length || duplicate) {
      toast.error(duplicate ? 'Duplicate lead: this mobile is already in the CRM' : 'Please fix the highlighted fields');
      return;
    }
    setBusy(true);
    try {
      const assignee = await store.rpc<string | null>('auto_assign_telecaller', { p_project: f.project }).catch(() => null);
      const notes = kind === 'walkin'
        ? [`Walk-in at ${f.location}`, f.hearAbout && `Heard via ${f.hearAbout}`, f.notes].filter(Boolean).join('. ')
        : f.notes;
      const lead = await store.addLead({
        name: f.name.trim(), mobile: normaliseMobile(f.mobile), email: f.email.trim(), source: f.source, project: f.project,
        status: 'New', assignedTo: assignee || null, priority: kind === 'walkin' ? 'Hot' : 'Warm', budget: f.budget || undefined, notes,
      });
      if (kind === 'walkin' && f.immediateVisit === 'Yes') {
        const now = new Date();
        await store.addVisit({
          leadId: lead.id, customer: lead.name, mobile: lead.mobile, project: lead.project, date: localDate(now),
          time: now.toTimeString().slice(0, 5), status: 'Confirmed', telecaller: assignee || '', salesExec: f.salesExec,
          confirmationSent: false, notes: 'Walk-in, visiting now',
        });
        store.updateLead(lead.id, { status: 'Visit Scheduled' });
      }
      toast.success(`Lead ${lead.id} created${assignee ? ` and assigned to ${assignee}` : ''}`);
      setF(blank);
      setTouched({});
    } catch (err) {
      const ce = toCrmError(err);
      setServerError(ce);
      toastError(ce);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="bg-white p-6 rounded-lg border border-gray-200 space-y-5">
      <div>
        <h3 className="text-gray-900">{kind === 'walkin' ? 'Walk-in lead' : 'Digital lead'}</h3>
        <p className="text-sm text-gray-600">{kind === 'walkin' ? 'Register a visitor at the office or site' : 'Enter a lead from an ad, portal or website enquiry'}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Full name" required error={show('name')}>
          <input className={inputCls} value={f.name} onChange={set('name')} onBlur={touch('name')} placeholder="Customer name" autoComplete="off" />
        </Field>
        <Field label="Mobile number" required error={show('mobile')} hint="10 digits; +91 or a leading 0 is removed">
          <input className={inputCls} type="tel" inputMode="numeric" value={f.mobile} onChange={set('mobile')} onBlur={touch('mobile')} placeholder="98XXXXXXXX" />
        </Field>
        <Field label="Email" error={show('email')}>
          <input className={inputCls} type="email" value={f.email} onChange={set('email')} onBlur={touch('email')} placeholder="customer@email.com" />
        </Field>
        {kind === 'digital' ? (
          <Field label="Lead source" required error={show('source')}>
            <select className={inputCls} value={f.source} onChange={set('source')} onBlur={touch('source')}>
              <option value="">Select source</option>
              {sources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Visit location">
            <select className={inputCls} value={f.location} onChange={set('location')}>
              <option>Head Office</option>
              {projects.map(p => <option key={p.id}>{p.name} site</option>)}
            </select>
          </Field>
        )}
        <Field label="Interested project" required error={show('project')}>
          <select className={inputCls} value={f.project} onChange={set('project')} onBlur={touch('project')}>
            <option value="">Select project</option>
            {projects.map(p => <option key={p.id} value={p.name}>{p.name} ({p.location})</option>)}
          </select>
        </Field>
        <Field label="Budget range">
          <select className={inputCls} value={f.budget} onChange={set('budget')}>
            <option value="">Not discussed</option>
            {BUDGETS.map(b => <option key={b}>{b}</option>)}
          </select>
        </Field>
        {kind === 'walkin' && (
          <>
            <Field label="How did they hear about us?">
              <select className={inputCls} value={f.hearAbout} onChange={set('hearAbout')}>
                <option value="">Select</option>
                {['Referral', 'Online search', 'Hoarding / billboard', 'Newspaper', 'Other'].map(x => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Site visit now?">
              <select className={inputCls} value={f.immediateVisit} onChange={set('immediateVisit')}>
                <option>No</option><option>Yes</option>
              </select>
            </Field>
            {f.immediateVisit === 'Yes' && (
              <Field label="Sales executive" required error={show('salesExec')}>
                <select className={inputCls} value={f.salesExec} onChange={set('salesExec')}>
                  <option value="">Select</option>
                  {salesExecs.map((u: User) => <option key={u.id}>{u.name}</option>)}
                </select>
              </Field>
            )}
          </>
        )}
        <div className="md:col-span-2">
          <Field label="Notes">
            <textarea rows={3} className={inputCls} value={f.notes} onChange={set('notes')} placeholder="Requirements, preferred floor, timeline…" />
          </Field>
        </div>
      </div>

      {duplicate && <DuplicateNotice lead={duplicate} />}
      {serverError && !duplicate && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800" role="alert">{serverError.message}</div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className={btnPrimary} disabled={busy || !!duplicate}>{busy && <Spinner />}{kind === 'walkin' ? 'Register walk-in' : 'Create lead'}</button>
        <button type="button" className={btnSecondary} onClick={() => { setF(blank); setTouched({}); setServerError(null); }}>Clear</button>
      </div>
      <p className="text-xs text-gray-500">The database also checks every lead: duplicate mobiles, invalid numbers and invalid emails are rejected even if submitted from another screen or the intake API.</p>
    </form>
  );
}

// ---------------------------------------------------------------------------

interface UploadRow {
  row: number;
  name: string;
  mobile: string;
  email: string;
  project: string;
  budget: string;
  reference: string;
  problems: string[];
  result?: { ok: boolean; message: string };
}

const TEMPLATE_COLUMNS = ['Name', 'Mobile', 'Email', 'Project', 'Budget', 'CP Reference ID'];

function CPUpload() {
  const store = getDataStore();
  const partners = store.getChannelPartners().filter(c => c.status === 'Active');
  const projects = store.getProjects();
  const [cpId, setCpId] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const downloadTemplate = () => {
    downloadCSV('cp-lead-upload-template.csv', [
      { Name: 'Rahul Verma', Mobile: '9812345678', Email: 'rahul@example.com', Project: projects[0]?.name || 'Skyline Heights', Budget: '75L - 1Cr', 'CP Reference ID': 'REF-001' },
    ], TEMPLATE_COLUMNS);
  };

  const validate = (list: Omit<UploadRow, 'problems'>[]): UploadRow[] => {
    const seen = new Map<string, number>();
    return list.map(r => {
      const problems: string[] = [];
      if (!r.name.trim()) problems.push('Name missing');
      if (!isValidMobile(r.mobile)) problems.push('Invalid mobile');
      if (!isValidEmail(r.email)) problems.push('Invalid email');
      if (!projects.some(p => p.name.toLowerCase() === r.project.trim().toLowerCase())) problems.push(`Unknown project "${r.project || '(blank)'}"`);
      const m = normaliseMobile(r.mobile);
      if (isValidMobile(r.mobile)) {
        if (seen.has(m)) problems.push(`Repeats row ${seen.get(m)}`);
        else seen.set(m, r.row);
        const dup = findDuplicate(m);
        if (dup) {
          const owner = dup.cpId ? store.getChannelPartners().find(c => c.id === dup.cpId)?.companyName : null;
          problems.push(dup.cpId === cpId ? `Already registered by you (${dup.id})` : owner ? `Already registered by ${owner} (${dup.id})` : `Existing lead ${dup.id}`);
        }
      }
      return { ...r, problems };
    });
  };

  const onFile = async (file: File | undefined) => {
    setDone(false);
    if (!file) return;
    setFileName(file.name);
    try {
      let records: Record<string, string>[];
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
        records = parseCSV(csv);
      } else {
        records = parseCSV(await file.text());
      }
      if (records.length === 0) { toast.error('The file has no rows'); setRows([]); return; }
      if (records.length > 1000) { toast.error('Upload at most 1,000 rows at a time'); return; }
      const keys = Object.keys(records[0]);
      if (!keys.includes('name') || !keys.includes('mobile')) {
        toast.error('The file needs at least Name and Mobile columns. Download the template for the format.');
        setRows([]);
        return;
      }
      const matchProject = (p: string) => projects.find(x => x.name.toLowerCase() === p.trim().toLowerCase())?.name || p;
      setRows(validate(records.map((r, i) => ({
        row: i + 2, name: r.name || '', mobile: r.mobile || r.phone || '', email: r.email || '', project: matchProject(r.project || ''),
        budget: r.budget || '', reference: r.cp_reference_id || r.reference || '',
      }))));
    } catch (err) {
      toast.error(`Could not read the file: ${(err as Error).message}`);
    }
  };

  // Re-check duplicates when the partner changes (affects the "registered by you" wording)
  const checked = useMemo(() => rows.some(r => r.result) ? rows : validate(rows), [cpId, rows]);
  const valid = checked.filter(r => r.problems.length === 0 && !r.result);
  const importRows = async () => {
    if (!cpId) { toast.error('Select the channel partner first'); return; }
    setBusy(true);
    const cp = partners.find(c => c.id === cpId)!;
    let ok = 0;
    const next = [...checked];
    for (const r of valid) {
      try {
        const assignee = await store.rpc<string | null>('auto_assign_telecaller', { p_project: r.project }).catch(() => null);
        const lead = await store.addLead({
          name: r.name.trim(), mobile: normaliseMobile(r.mobile), email: r.email, source: 'Channel Partners', project: r.project,
          status: 'New', assignedTo: assignee || null, priority: 'Warm', budget: r.budget || undefined, cpId,
          notes: `Uploaded by ${cp.companyName}${r.reference ? `, ref ${r.reference}` : ''}`,
        });
        next[next.findIndex(x => x.row === r.row)] = { ...r, result: { ok: true, message: `Created ${lead.id}${assignee ? ` → ${assignee}` : ''}` } };
        ok++;
      } catch (err) {
        next[next.findIndex(x => x.row === r.row)] = { ...r, result: { ok: false, message: toCrmError(err).message } };
      }
      setRows([...next]);
    }
    setBusy(false);
    setDone(true);
    toast.success(`${ok} of ${valid.length} leads imported for ${cp.companyName}`);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-5">
      <div>
        <h3 className="text-gray-900">Channel partner lead upload</h3>
        <p className="text-sm text-gray-600">Upload a CSV or Excel file. Each row is checked before import; a buyer already in the CRM can't be claimed again by any partner.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Channel partner" required>
          <select className={inputCls} value={cpId} onChange={e => setCpId(e.target.value)}>
            <option value="">Select partner</option>
            {partners.map(c => <option key={c.id} value={c.id}>{c.id} · {c.companyName}</option>)}
          </select>
        </Field>
        <Field label="File (CSV, XLSX)" required hint={fileName || 'Columns: Name, Mobile, Email, Project, Budget, CP Reference ID'}>
          <input type="file" accept=".csv,.xlsx,.xls,.txt" className={inputCls} onChange={e => onFile(e.target.files?.[0])} aria-label="Upload lead file" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnSecondary} onClick={downloadTemplate}><Download className="w-4 h-4" />Download template</button>
        {rows.length > 0 && (
          <span className="text-sm text-gray-600">
            {rows.length} rows · <span className="text-green-700">{checked.filter(r => !r.problems.length).length} ready</span> · <span className="text-red-700">{checked.filter(r => r.problems.length).length} with problems</span>
          </span>
        )}
      </div>

      {rows.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-[420px]">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0"><tr>
              {['Row', 'Name', 'Mobile', 'Email', 'Project', 'Budget', 'Check'].map(h => <th key={h} className={thCls}>{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {checked.map(r => (
                <tr key={r.row} className={r.problems.length ? 'bg-red-50/40' : ''}>
                  <td className={tdCls}>{r.row}</td>
                  <td className={tdCls}>{r.name}</td>
                  <td className={tdCls}>{r.mobile}</td>
                  <td className={`${tdCls} text-gray-600`}>{r.email}</td>
                  <td className={tdCls}>{r.project}</td>
                  <td className={`${tdCls} text-gray-600`}>{r.budget}</td>
                  <td className={`${tdCls} text-xs`}>
                    {r.result ? (
                      <span className={r.result.ok ? 'text-green-700' : 'text-red-700'}>{r.result.message}</span>
                    ) : r.problems.length ? (
                      <span className="text-red-700">{r.problems.join('; ')}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 className="w-3.5 h-3.5" />Ready</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button type="button" className={`${btnPrimary} w-full`} disabled={busy || !cpId || valid.length === 0 || done} onClick={importRows}>
        {busy && <Spinner />}
        {done ? 'Import finished' : `Import ${valid.length} valid lead${valid.length === 1 ? '' : 's'}`}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

function IntakeSetup() {
  const store = getDataStore();
  const endpoint = `${SUPABASE_URL}/functions/v1/lead-intake`;
  const token = store.setting('intake_token');
  const sla = store.settingNumber('lead_sla_minutes', 15);
  const [test, setTest] = useState({ name: '', mobile: '', source: 'Website', project: store.getProjects()[0]?.name || '' });
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<string>('');

  const copy = (t: string) => { navigator.clipboard?.writeText(t); toast.success('Copied'); };

  const sendTest = async () => {
    if (!test.name || !isValidMobile(test.mobile)) { toast.error('Enter a name and a valid mobile'); return; }
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-intake-token': token }, body: JSON.stringify(test) });
      const body = await res.json();
      setResponse(JSON.stringify(body, null, 2));
      if (body.status === 'created') { toast.success(`Lead ${body.id} created via the intake API`); store.reload(['leads', 'notifications']); }
      else if (body.status === 'duplicate') toast.warning(`Duplicate: existing lead ${body.existing_lead} marked as a re-enquiry`);
      else toast.error(body.error || 'Rejected');
    } catch (err) {
      setResponse(String(err));
      toast.error('Could not reach the intake API');
    } finally {
      setBusy(false);
    }
  };

  const curl = `curl -X POST '${endpoint}' \\\n  -H 'Content-Type: application/json' \\\n  -H 'x-intake-token: ${token}' \\\n  -d '{"name":"Asha Rao","mobile":"9820012345","email":"asha@example.com","project":"Skyline Heights","source":"99acres","budget":"75L - 1Cr"}'`;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-5">
      <div>
        <h3 className="text-gray-900">Automatic lead intake</h3>
        <p className="text-sm text-gray-600">
          Leads posted to this endpoint are validated, de-duplicated (a repeat enquiry is marked on the existing lead), assigned to the least-loaded
          telecaller and flagged if nobody calls within {sla} minutes.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Endpoint URL">
          <div className="flex gap-2"><input readOnly className={inputCls} value={endpoint} /><button type="button" className={btnSecondary} onClick={() => copy(endpoint)} aria-label="Copy endpoint"><Copy className="w-4 h-4" /></button></div>
        </Field>
        <Field label="Token (header x-intake-token or ?token=)">
          <div className="flex gap-2"><input readOnly className={inputCls} value={token} /><button type="button" className={btnSecondary} onClick={() => copy(token)} aria-label="Copy token"><Copy className="w-4 h-4" /></button></div>
        </Field>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
          <p className="text-gray-900">Connect each source</p>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li><b>Website form:</b> POST name, mobile, email, project, budget, message as JSON.</li>
            <li><b>Google Ads lead forms:</b> paste the URL (with <code>?token=</code>) as the webhook; the Google key is the token.</li>
            <li><b>Meta lead ads:</b> use the URL as the webhook callback and the token as the verify token. Zapier/Make can forward <code>field_data</code> directly.</li>
            <li><b>99acres, MagicBricks, Housing.com:</b> ask the portal account manager to push leads to the URL, or forward their lead emails through Zapier.</li>
          </ul>
        </div>
        <pre className="p-4 rounded-lg bg-gray-900 text-gray-100 text-xs overflow-x-auto whitespace-pre">{curl}</pre>
      </div>
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-900 mb-3">Send a test lead through the API</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className={inputCls} placeholder="Name" value={test.name} onChange={e => setTest({ ...test, name: e.target.value })} aria-label="Test name" />
          <input className={inputCls} placeholder="Mobile" value={test.mobile} onChange={e => setTest({ ...test, mobile: e.target.value })} aria-label="Test mobile" />
          <select className={inputCls} value={test.source} onChange={e => setTest({ ...test, source: e.target.value })} aria-label="Test source">
            {store.getSources().map(s => <option key={s.id}>{s.name}</option>)}
          </select>
          <select className={inputCls} value={test.project} onChange={e => setTest({ ...test, project: e.target.value })} aria-label="Test project">
            {store.getProjects().map(p => <option key={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button type="button" className={`${btnPrimary} mt-3`} onClick={sendTest} disabled={busy}>{busy ? <Spinner /> : <Send className="w-4 h-4" />}Send test lead</button>
        {response && <pre className="mt-3 p-3 rounded bg-gray-50 border border-gray-200 text-xs overflow-x-auto">{response}</pre>}
      </div>
    </div>
  );
}
