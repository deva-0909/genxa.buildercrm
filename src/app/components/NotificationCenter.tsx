import { useState } from 'react';
import { Bell, Send, MessageCircle, Mail, Smartphone, CheckCircle, Clock, XCircle, Plus, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, NotificationRecord, toastError } from '../lib/dataStore';
import { liveBookings, bookingFinance } from '../lib/crm';
import { fmtDateTime, fmtDate, waLink, inr, addDays, today } from '../lib/format';
import { PageHeader, StatCard, Panel, Tabs, Badge, thCls, tdCls, btnPrimary, btnSecondary, btnSmall, btnSmallPrimary, inputCls, EmptyState, Modal, Field, Spinner } from './common';

const CHANNEL_ICON: Record<string, any> = { WhatsApp: MessageCircle, SMS: Smartphone, Email: Mail, 'In-app': Bell };

export const TEMPLATES: { name: string; channel: string; text: string }[] = [
  { name: 'Visit Confirmation', channel: 'WhatsApp', text: 'Hello {name}, your site visit to {project} is confirmed for {date} at {time}. Our executive {exec} will meet you. Location: {location}.' },
  { name: 'Visit Reminder', channel: 'WhatsApp', text: 'Hello {name}, a reminder of your visit to {project} tomorrow at {time}. Reply 1 to confirm or 2 to reschedule.' },
  { name: 'Payment Reminder', channel: 'WhatsApp', text: 'Dear {name}, {amount} for unit {unit}, {project} is due by {due}. Please quote booking {booking}.' },
  { name: 'Booking Confirmation', channel: 'WhatsApp', text: 'Dear {name}, congratulations on booking {unit} at {project}. Your booking ID is {booking}. Our CRM team will share the next steps.' },
  { name: 'Construction Update', channel: 'WhatsApp', text: 'Dear {name}, construction update for {project}: {update}.' },
  { name: 'Festive Greeting', channel: 'WhatsApp', text: 'Dear {name}, warm wishes from all of us at {company}!' },
];

export function fill(text: string, vars: Record<string, string | undefined>) {
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

/** Open the right app for a message and mark it sent. */
export async function sendNow(n: NotificationRecord) {
  const store = getDataStore();
  const contact = n.recipientContact || '';
  if (n.channel === 'WhatsApp') window.open(waLink(contact, n.message), '_blank');
  else if (n.channel === 'SMS') window.open(`sms:+91${contact.replace(/\D/g, '').slice(-10)}?body=${encodeURIComponent(n.message)}`, '_self');
  else if (n.channel === 'Email') window.open(`mailto:${contact.includes('@') ? contact : ''}?subject=${encodeURIComponent(n.template || 'Update')}&body=${encodeURIComponent(n.message)}`, '_self');
  try {
    await store.patch('notifications', n.id, { status: 'Sent', sentAt: new Date().toISOString(), sentBy: store.getPersona().name });
  } catch (e) { toastError(e); }
}

export function NotificationCenter() {
  const store = getDataStore();
  const persona = store.getPersona();
  const [tab, setTab] = useState('queue');
  const [compose, setCompose] = useState(false);
  const [channel, setChannel] = useState('');
  const all = store.list<NotificationRecord>('notifications');
  const queue = all.filter(n => ['Queued', 'Pending'].includes(n.status));
  const rows = (tab === 'queue' ? queue : all).filter(n => !channel || n.channel === channel);
  const sentToday = all.filter(n => n.sentAt && n.sentAt.slice(0, 10) === today()).length;

  const queueVisitReminders = async () => {
    const tomorrow = addDays(today(), 1);
    const visits = store.getVisits().filter(v => v.date === tomorrow && ['Scheduled', 'Confirmed', 'Tentative'].includes(v.status));
    const already = new Set(all.filter(n => n.template === 'Visit Reminder' && n.scheduledFor === tomorrow).map(n => n.relatedId));
    const todo = visits.filter(v => !already.has(v.id));
    if (todo.length === 0) { toast.info('All of tomorrow\'s visits already have a reminder'); return; }
    try {
      await store.insertMany('notifications', todo.map(v => ({
        channel: 'WhatsApp', recipientName: v.customer, recipientContact: v.mobile, template: 'Visit Reminder',
        message: fill(TEMPLATES[1].text, { name: v.customer, project: v.project, time: v.time }), status: 'Queued',
        relatedType: 'visit', relatedId: v.id, sentBy: persona.name, scheduledFor: tomorrow,
      })));
      toast.success(`${todo.length} visit reminders queued for tomorrow`);
    } catch (e) { toastError(e); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Every WhatsApp, SMS and email sent from the CRM, plus queued reminders. Messages open in WhatsApp / your mail app until a WhatsApp Business API key is connected."
        actions={<>
          <button className={btnSecondary} onClick={queueVisitReminders}><CalendarClock className="w-4 h-4" />Queue tomorrow's visit reminders</button>
          <button className={btnPrimary} onClick={() => setCompose(true)}><Plus className="w-4 h-4" />New message</button>
        </>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Waiting to send" value={queue.length} icon={Clock} tone="orange" />
        <StatCard label="Sent today" value={sentToday} icon={Send} tone="blue" />
        <StatCard label="Delivered / read" value={all.filter(n => ['Delivered', 'Read', 'Sent'].includes(n.status)).length} icon={CheckCircle} tone="green" />
        <StatCard label="Failed" value={all.filter(n => n.status === 'Failed').length} icon={XCircle} tone="red" />
      </div>
      <Panel>
        <Tabs active={tab} onChange={setTab} tabs={[{ id: 'queue', label: 'To send', count: queue.length }, { id: 'log', label: 'All messages', count: all.length }, { id: 'templates', label: 'Templates', count: TEMPLATES.length }]} />
        {tab !== 'templates' && (
          <div className="p-3 flex gap-2">
            <select className={`${inputCls} max-w-[180px]`} value={channel} onChange={e => setChannel(e.target.value)} aria-label="Channel"><option value="">All channels</option>{['WhatsApp', 'SMS', 'Email', 'In-app'].map(c => <option key={c}>{c}</option>)}</select>
            {tab === 'queue' && queue.filter(n => n.channel !== 'In-app').length > 0 && (
              <button className={btnSecondary} onClick={async () => { const first = rows.find(n => n.channel !== 'In-app'); if (first) await sendNow(first); }}><Send className="w-4 h-4" />Send next</button>
            )}
          </div>
        )}
        {tab === 'templates' ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEMPLATES.map(t => (
              <div key={t.name} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between"><span className="text-sm text-gray-900">{t.name}</span><Badge tone="green">{t.channel}</Badge></div>
                <p className="text-sm text-gray-600 mt-1">{t.text}</p>
              </div>
            ))}
            <p className="text-xs text-gray-500 md:col-span-2">To send these automatically through the WhatsApp Business API, register them as message templates with Meta (Interakt, Gupshup or WATI can host the number) and add the API key under Master Setup → Integrations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['Channel', 'To', 'Template', 'Message', 'Status', 'When', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {rows.slice(0, 300).map(n => {
                  const Icon = CHANNEL_ICON[n.channel] || Bell;
                  return (
                    <tr key={n.id} className="align-top">
                      <td className={tdCls}><span className="inline-flex items-center gap-1.5"><Icon className="w-4 h-4 text-gray-500" />{n.channel}</span></td>
                      <td className={tdCls}>{n.recipientName || '—'}<div className="text-xs text-gray-500">{n.recipientContact}</div></td>
                      <td className={`${tdCls} text-gray-600`}>{n.template || '—'}</td>
                      <td className={`${tdCls} max-w-[380px]`}><span className="line-clamp-2 text-gray-700" title={n.message}>{n.message}</span></td>
                      <td className={tdCls}><Badge tone={['Queued', 'Pending'].includes(n.status) ? 'orange' : undefined}>{n.status}</Badge></td>
                      <td className={`${tdCls} text-xs text-gray-600 whitespace-nowrap`}>{n.sentAt ? fmtDateTime(n.sentAt) : n.scheduledFor ? `For ${fmtDate(n.scheduledFor)}` : fmtDateTime(n.createdAt)}<div>{n.sentBy}</div></td>
                      <td className={tdCls}>{['Queued', 'Pending', 'Failed'].includes(n.status) && n.channel !== 'In-app' && <button className={btnSmallPrimary} onClick={() => sendNow(n)}><Send className="w-3.5 h-3.5" />Send</button>}
                        {n.channel === 'In-app' && n.status !== 'Read' && <button className={btnSmall} onClick={() => store.patch('notifications', n.id, { status: 'Read' }).catch(toastError)}>Mark read</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <EmptyState>{tab === 'queue' ? 'Nothing waiting to be sent.' : 'No messages.'}</EmptyState>}
          </div>
        )}
      </Panel>
      {compose && <ComposeDialog onClose={() => setCompose(false)} />}
    </div>
  );
}

function ComposeDialog({ onClose }: { onClose: () => void }) {
  const store = getDataStore();
  const persona = store.getPersona();
  const projects = store.getProjects();
  const [audience, setAudience] = useState<'one' | 'overdue' | 'project'>('one');
  const [bookingId, setBookingId] = useState('');
  const [project, setProject] = useState(projects[0]?.name || '');
  const [channel, setChannel] = useState('WhatsApp');
  const [template, setTemplate] = useState(TEMPLATES[3].name);
  const [text, setText] = useState(TEMPLATES[3].text);
  const [busy, setBusy] = useState(false);
  const bookings = liveBookings();
  const recipients = audience === 'one' ? bookings.filter(b => b.id === bookingId)
    : audience === 'overdue' ? bookings.filter(b => bookingFinance(b).overdue > 0)
      : bookings.filter(b => b.project === project);
  const company = store.setting('company_name', 'GENXA Developers');
  const varsFor = (b: typeof bookings[number]) => {
    const f = bookingFinance(b);
    const nd = f.nextDue;
    return { name: b.customer, unit: b.unit, project: b.project, booking: b.id, company, amount: nd ? inr(nd.amount + nd.gst - nd.paid) : inr(0), due: nd ? fmtDate(nd.dueDate) : '' };
  };
  const send = async () => {
    if (recipients.length === 0) { toast.error('No recipients selected'); return; }
    if (!text.trim()) { toast.error('Write the message'); return; }
    setBusy(true);
    try {
      const rows = recipients.map(b => ({
        channel, recipientName: b.customer, recipientContact: b.mobile, template, message: fill(text, varsFor(b)),
        status: recipients.length === 1 ? 'Sent' : 'Queued', relatedType: 'booking', relatedId: b.id, sentBy: persona.name,
        sentAt: recipients.length === 1 ? new Date().toISOString() : undefined, scheduledFor: today(),
      }));
      const saved = await store.insertMany<NotificationRecord>('notifications', rows);
      if (saved.length === 1) {
        const n = saved[0];
        if (channel === 'WhatsApp') window.open(waLink(n.recipientContact || '', n.message), '_blank');
        else if (channel === 'SMS') window.open(`sms:+91${(n.recipientContact || '').slice(-10)}?body=${encodeURIComponent(n.message)}`, '_self');
        else window.open(`mailto:?subject=${encodeURIComponent(template)}&body=${encodeURIComponent(n.message)}`, '_self');
        toast.success('Message opened and logged');
      } else toast.success(`${saved.length} messages queued. Send them from "To send".`);
      onClose();
    } catch (e) { toastError(e); } finally { setBusy(false); }
  };
  const preview = recipients[0] ? fill(text, varsFor(recipients[0])) : text;
  return (
    <Modal open onClose={onClose} title="New message" size="lg"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={send} disabled={busy}>{busy ? <Spinner /> : <Send className="w-4 h-4" />}{recipients.length > 1 ? `Queue ${recipients.length} messages` : 'Send'}</button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Send to">
            <select className={inputCls} value={audience} onChange={e => setAudience(e.target.value as any)}>
              <option value="one">One customer</option><option value="overdue">All customers with overdue dues</option><option value="project">All buyers in a project</option>
            </select>
          </Field>
          {audience === 'one' && <Field label="Customer"><select className={inputCls} value={bookingId} onChange={e => setBookingId(e.target.value)}><option value="">Select</option>{bookings.map(b => <option key={b.id} value={b.id}>{b.customer} · {b.unit}</option>)}</select></Field>}
          {audience === 'project' && <Field label="Project"><select className={inputCls} value={project} onChange={e => setProject(e.target.value)}>{projects.map(p => <option key={p.id}>{p.name}</option>)}</select></Field>}
          <Field label="Channel"><select className={inputCls} value={channel} onChange={e => setChannel(e.target.value)}><option>WhatsApp</option><option>SMS</option><option>Email</option></select></Field>
        </div>
        <Field label="Template">
          <select className={inputCls} value={template} onChange={e => { setTemplate(e.target.value); setText(TEMPLATES.find(t => t.name === e.target.value)?.text || text); }}>
            {TEMPLATES.map(t => <option key={t.name}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Message" hint="Placeholders: {name} {unit} {project} {booking} {amount} {due} {company}"><textarea rows={4} className={inputCls} value={text} onChange={e => setText(e.target.value)} /></Field>
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm"><div className="text-xs text-gray-500 mb-1">Preview{recipients.length > 1 ? ` (1 of ${recipients.length})` : ''}</div>{preview}</div>
      </div>
    </Modal>
  );
}
