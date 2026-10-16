import { useState } from 'react';
import { FileCheck, FileClock, FileX, FolderOpen, Upload, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, DocumentRecord, Booking, toastError } from '../lib/dataStore';
import { liveBookings } from '../lib/crm';
import { PageHeader, StatCard, Panel, Tabs, Badge, thCls, tdCls, btnSmall, btnSmallPrimary, inputCls, EmptyState, Modal, Field, btnSecondary, btnDanger, ContactButtons } from './common';
import { DocList, KycUploadDialog, REQUIRED_KYC, KYC_TYPES } from './BookingParts';

export function DocumentationModule() {
  const store = getDataStore();
  const persona = store.getPersona();
  const [tab, setTab] = useState('queue');
  const [upload, setUpload] = useState<{ booking?: Booking; type?: string } | null>(null);
  const [reject, setReject] = useState<DocumentRecord | null>(null);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const docs = store.list<DocumentRecord>('documents');
  const bookings = liveBookings();
  const queue = docs.filter(d => d.status === 'Uploaded');
  const kycStatus = (b: Booking) => REQUIRED_KYC.map(t => {
    const d = docs.filter(x => x.bookingId === b.id && x.docType === t).sort((a, c) => (c.uploadedAt || '').localeCompare(a.uploadedAt || ''))[0];
    return { type: t, doc: d, state: !d ? 'Missing' : d.status };
  });
  const complete = bookings.filter(b => kycStatus(b).every(k => k.state === 'Verified'));
  const missing = bookings.filter(b => kycStatus(b).some(k => k.state === 'Missing' || k.state === 'Rejected'));

  const verify = async (d: DocumentRecord) => {
    try {
      await store.patch('documents', d.id, { status: 'Verified', verifiedBy: persona.name, verifiedAt: new Date().toISOString() });
      toast.success(`${d.docType} of ${d.customer} verified`);
    } catch (e) { toastError(e); }
  };

  const actions = (d: DocumentRecord) => d.status === 'Uploaded' ? (
    <span className="inline-flex gap-1">
      <button className={btnSmallPrimary} onClick={() => verify(d)}><CheckCircle className="w-3.5 h-3.5" />Verify</button>
      <button className={btnSmall} onClick={() => setReject(d)}><XCircle className="w-3.5 h-3.5" />Reject</button>
    </span>
  ) : d.status === 'Rejected' && d.bookingId ? (
    <button className={btnSmall} onClick={() => setUpload({ booking: bookings.find(b => b.id === d.bookingId), type: d.docType })}><Upload className="w-3.5 h-3.5" />Re-upload</button>
  ) : null;

  const filtered = docs.filter(d => (!typeFilter || d.docType === typeFilter) && (!q || `${d.customer} ${d.bookingId} ${d.id}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-6">
      <PageHeader title="Documentation" subtitle="KYC document store with verification. Files are kept in secure cloud storage against each booking."
        actions={<button className={btnSecondary} onClick={() => setUpload({})}><Upload className="w-4 h-4" />Upload document</button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Awaiting verification" value={queue.length} icon={FileClock} tone="orange" />
        <StatCard label="KYC complete" value={`${complete.length} / ${bookings.length}`} icon={FileCheck} tone="green" hint="Bookings with all 4 KYC verified" />
        <StatCard label="Bookings missing KYC" value={missing.length} icon={FileX} tone="red" />
        <StatCard label="Documents stored" value={docs.length} icon={FolderOpen} hint={`${docs.filter(d => d.fileUrl).length} with files`} />
      </div>
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'queue', label: 'Verification queue', count: queue.length }, { id: 'checklist', label: 'KYC checklist', count: bookings.length }, { id: 'all', label: 'All documents', count: docs.length }]} />
        {tab === 'queue' && (queue.length ? <DocList docs={queue} actions={actions} /> : <EmptyState>Nothing waiting for verification.</EmptyState>)}
        {tab === 'checklist' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['Booking', 'Customer', ...REQUIRED_KYC, ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td className={tdCls}>{b.id}<div className="text-xs text-gray-500 whitespace-nowrap">{b.project} {b.unit}</div></td>
                    <td className={tdCls}>{b.customer}</td>
                    {kycStatus(b).map(k => (
                      <td key={k.type} className={tdCls}>
                        {k.state === 'Missing' || k.state === 'Rejected'
                          ? <button className="text-xs text-red-700 hover:underline" onClick={() => setUpload({ booking: b, type: k.type })}>{k.state} · upload</button>
                          : k.doc?.fileUrl ? <a href={k.doc.fileUrl} target="_blank" rel="noreferrer"><Badge>{k.state}</Badge></a> : <Badge>{k.state}</Badge>}
                      </td>
                    ))}
                    <td className={`${tdCls} whitespace-nowrap`}>
                      <ContactButtons compact mobile={b.mobile} name={b.customer} relatedType="booking" relatedId={b.id} template="KYC Reminder"
                        message={`Dear ${b.customer}, please share ${kycStatus(b).filter(k => k.state === 'Missing' || k.state === 'Rejected').map(k => k.type).join(', ') || 'your KYC documents'} for your booking of ${b.unit}, ${b.project}. You can upload them in the buyer portal or reply here.`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'all' && (
          <>
            <div className="flex flex-wrap gap-2 p-3">
              <input className={`${inputCls} max-w-xs`} placeholder="Search customer or booking" value={q} onChange={e => setQ(e.target.value)} aria-label="Search documents" />
              <select className={`${inputCls} max-w-[200px]`} value={typeFilter} onChange={e => setTypeFilter(e.target.value)} aria-label="Document type"><option value="">All types</option>{KYC_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            </div>
            <DocList docs={filtered} actions={actions} />
          </>
        )}
      </Panel>
      {upload && <UploadPicker booking={upload.booking} type={upload.type} onClose={() => setUpload(null)} />}
      {reject && <RejectDialog doc={reject} onClose={() => setReject(null)} />}
    </div>
  );
}

function UploadPicker({ booking, type, onClose }: { booking?: Booking; type?: string; onClose: () => void }) {
  const [b, setB] = useState<Booking | undefined>(booking);
  if (b) return <KycUploadDialog booking={b} defaultType={type} onClose={onClose} />;
  return (
    <Modal open onClose={onClose} title="Upload document" size="sm">
      <Field label="Booking">
        <select className={inputCls} defaultValue="" onChange={e => setB(liveBookings().find(x => x.id === e.target.value))}>
          <option value="" disabled>Select booking</option>
          {liveBookings().map(x => <option key={x.id} value={x.id}>{x.customer} · {x.project} {x.unit}</option>)}
        </select>
      </Field>
    </Modal>
  );
}

function RejectDialog({ doc, onClose }: { doc: DocumentRecord; onClose: () => void }) {
  const store = getDataStore();
  const [reason, setReason] = useState('');
  const save = async () => {
    if (!reason.trim()) { toast.error('Enter the reason so the customer knows what to fix'); return; }
    try {
      await store.patch('documents', doc.id, { status: 'Rejected', remarks: reason.trim(), verifiedBy: store.getPersona().name, verifiedAt: new Date().toISOString() });
      toast.success('Document rejected');
      onClose();
    } catch (e) { toastError(e); }
  };
  return (
    <Modal open onClose={onClose} title={`Reject ${doc.docType}`} subtitle={doc.customer} size="sm"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnDanger} onClick={save}>Reject</button></>}>
      <Field label="Reason" required><textarea rows={3} className={inputCls} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Image is blurred; name does not match PAN" /></Field>
    </Modal>
  );
}
