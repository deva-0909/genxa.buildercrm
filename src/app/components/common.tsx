// Small building blocks shared by the CRM screens.
import { ReactNode, useEffect, useState } from 'react';
import { Phone, MessageCircle, X, Loader2 } from 'lucide-react';
import { getDataStore, toastError } from '../lib/dataStore';
import { telLink, waLink } from '../lib/format';

export const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50';
export const btnPrimary = 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed';
export const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed';
export const btnSmall = 'inline-flex items-center gap-1 px-2.5 py-1 border border-gray-300 bg-white text-gray-700 rounded-md text-xs hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap';
export const btnSmallPrimary = 'inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap';
export const btnDanger = 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-gray-900 text-xl">{title}</h2>
        {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONES: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  green: { bg: 'bg-green-50', text: 'text-green-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600' },
};

export function StatCard({ label, value, icon: Icon, tone = 'blue', hint }: { label: string; value: ReactNode; icon?: any; tone?: string; hint?: ReactNode }) {
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-600">{label}</p>
          <p className="text-xl text-gray-900 mt-1 truncate">{value}</p>
          {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
        </div>
        {Icon && <div className={`p-2 rounded-lg ${t.bg} shrink-0`}><Icon className={`w-5 h-5 ${t.text}`} /></div>}
      </div>
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  // positive
  Paid: 'green', Approved: 'green', Signed: 'green', Registered: 'green', Verified: 'green', Delivered: 'green', Sent: 'green',
  Resolved: 'green', Closed: 'gray', 'Handed Over': 'green', Disbursed: 'green', 'Fully Disbursed': 'green', Completed: 'green',
  Available: 'green', Active: 'green', Refunded: 'green', Receipt: 'green', 'Possession Done': 'green', 'Fully Paid': 'green',
  Connected: 'green', Converted: 'green', Booked: 'purple', Hot: 'red', Warm: 'orange', Cold: 'blue',
  // in progress
  Generated: 'blue', 'Sent for Signature': 'purple', 'In Progress': 'blue', Sanctioned: 'blue', 'Partially Disbursed': 'blue',
  'Under Review': 'blue', Applied: 'blue', 'Documents Submitted': 'blue', Scheduled: 'blue', 'Inspection Done': 'blue',
  'Ready for Handover': 'purple', Uploaded: 'blue', 'Partially Paid': 'blue', Due: 'orange', Pending: 'orange',
  Requested: 'orange', Draft: 'gray', 'Not Due': 'gray', Open: 'orange', Blocked: 'orange', 'Token Paid': 'blue',
  'Agreement Pending': 'orange', 'Agreement Done': 'blue', Documentation: 'blue', Medium: 'orange', Low: 'gray',
  // negative
  Overdue: 'red', Rejected: 'red', Failed: 'red', Cancelled: 'red', Refund: 'red', Expired: 'gray', Critical: 'red', High: 'red',
  'Not for Sale': 'gray', Inactive: 'gray', Missing: 'red', Dead: 'gray',
};

const BADGE_CLS: Record<string, string> = {
  green: 'bg-green-100 text-green-700', blue: 'bg-blue-100 text-blue-700', orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700', purple: 'bg-purple-100 text-purple-700', gray: 'bg-gray-100 text-gray-700',
};

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const t = tone || STATUS_TONE[String(children)] || 'gray';
  return <span className={`inline-block px-2 py-0.5 rounded text-xs whitespace-nowrap ${BADGE_CLS[t] || BADGE_CLS.gray}`}>{children}</span>;
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`bg-white rounded-lg shadow-xl w-full ${w} max-h-[95vh] flex flex-col`}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-gray-200 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint, error, required }: { label: string; children: ReactNode; hint?: string; error?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
      {error ? <span className="block text-xs text-red-600 mt-1">{error}</span> : hint ? <span className="block text-xs text-gray-500 mt-1">{hint}</span> : null}
    </label>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="text-center text-sm text-gray-500 py-10">{children}</div>;
}

/** Card with a title row and a horizontally scrollable table area. */
export function Panel({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-200">
          {typeof title === 'string' ? <h3 className="text-gray-900">{title}</h3> : title}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export const thCls = 'px-3 py-2.5 text-left text-xs text-gray-600 whitespace-nowrap';
export const tdCls = 'px-3 py-2.5 text-sm text-gray-900';

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string; count?: number }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="border-b border-gray-200 overflow-x-auto">
      <div className="flex gap-1 px-2 min-w-max">
        {tabs.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`px-3 py-2.5 text-sm border-b-2 -mb-px whitespace-nowrap ${active === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            {t.label}{t.count !== undefined && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Call and WhatsApp buttons. Each tap is logged: calls in call_logs (when a
 * lead is given) and WhatsApp messages in notifications.
 */
export function ContactButtons({ mobile, name, message, leadId, relatedType, relatedId, template, compact }: {
  mobile?: string; name?: string; message?: string; leadId?: string; relatedType?: string; relatedId?: string; template?: string; compact?: boolean;
}) {
  if (!mobile) return null;
  const store = getDataStore();
  const actor = store.getPersona().name;
  const onCall = () => {
    if (leadId) {
      store.insert('callLogs', { leadId, caller: actor, outcome: 'Dialled', provider: 'Click-to-call', notes: 'Call started from CRM' }).catch(() => {});
    }
  };
  const onWa = () => {
    store.insert('notifications', {
      channel: 'WhatsApp', recipientName: name, recipientContact: mobile, template: template || 'Manual message',
      message: message || `Hello ${name || ''}`, status: 'Sent', relatedType: relatedType || (leadId ? 'lead' : undefined),
      relatedId: relatedId || leadId, sentBy: actor, sentAt: new Date().toISOString(),
    }).catch(() => {});
  };
  const cls = compact ? 'p-1.5 rounded-md border border-gray-200 hover:bg-gray-50' : 'inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-200 text-xs hover:bg-gray-50';
  return (
    <span className="inline-flex items-center gap-1">
      <a href={telLink(mobile)} onClick={onCall} className={cls} title={`Call ${mobile}`} aria-label={`Call ${name || mobile}`}>
        <Phone className="w-3.5 h-3.5 text-blue-600" />{!compact && 'Call'}
      </a>
      <a href={waLink(mobile, message)} onClick={onWa} target="_blank" rel="noreferrer" className={cls} title="WhatsApp" aria-label={`WhatsApp ${name || mobile}`}>
        <MessageCircle className="w-3.5 h-3.5 text-green-600" />{!compact && 'WhatsApp'}
      </a>
    </span>
  );
}

/** Wrap an async action: disables while running, shows success/error toasts. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = async <T,>(fn: () => Promise<T>, success?: string | ((r: T) => string)): Promise<T | undefined> => {
    if (busy) return undefined;
    setBusy(true);
    try {
      const r = await fn();
      if (success) {
        const { toast } = await import('sonner');
        toast.success(typeof success === 'function' ? success(r) : success);
      }
      return r;
    } catch (err) {
      toastError(err);
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

export function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" />;
}

export function Confirm({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onClose, busy }: {
  open: boolean; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void; busy?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <button className={btnSecondary} onClick={onClose}>Cancel</button>
        <button className={danger ? btnDanger : btnPrimary} onClick={onConfirm} disabled={busy}>{busy && <Spinner />}{confirmLabel}</button>
      </>}>
      <div className="text-sm text-gray-700">{message}</div>
    </Modal>
  );
}

export function ProgressBar({ value, tone = 'blue' }: { value: number; tone?: string }) {
  const color = { blue: 'bg-blue-600', green: 'bg-green-600', orange: 'bg-orange-500', red: 'bg-red-600' }[tone] || 'bg-blue-600';
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className={`${color} h-2 rounded-full`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
