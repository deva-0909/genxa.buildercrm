import { useEffect, useRef, useState } from 'react';
import { Loader2, UserCircle2, Menu, Bell, PhoneMissed } from 'lucide-react';
import { toast } from 'sonner';
import { getDataStore, ADMIN_PERSONA, Persona, NotificationRecord, Approval } from './lib/dataStore';
import { slaBreaches, canApprove } from './lib/crm';
import { fmtDateTime } from './lib/format';
import { Sidebar, menuItems, canSee } from './components/Sidebar';
import { MasterSetup } from './components/MasterSetup';
import { LeadCapture } from './components/LeadCapture';
import { LeadPool } from './components/LeadPool';
import { TelecallerDashboard } from './components/TelecallerDashboard';
import { SalesDashboard } from './components/SalesDashboard';
import { CRMDashboard } from './components/CRMDashboard';
import { FinanceDashboard } from './components/FinanceDashboard';
import { ManagementDashboard } from './components/ManagementDashboard';
import { SiteVisitManagement } from './components/SiteVisitManagement';
import { BookingManagement } from './components/BookingManagement';
import { ChannelPartnerDashboard, CPPortal } from './components/ChannelPartnerDashboard';
import { AgreementManagement } from './components/AgreementManagement';
import { LoanProcessing } from './components/LoanProcessing';
import { PaymentCollections } from './components/PaymentCollections';
import { InventoryManagement } from './components/InventoryManagement';
import { DocumentationModule } from './components/DocumentationModule';
import { PossessionHandover } from './components/PossessionHandover';
import { ReportsAnalytics } from './components/ReportsAnalytics';
import { NotificationCenter } from './components/NotificationCenter';
import { CancellationRefunds } from './components/CancellationRefunds';
import { PostSalesSupport } from './components/PostSalesSupport';
import { ApprovalsPage, AuditTrailPage } from './components/Approvals';
import { BuyerPortal, FieldApp } from './components/Portals';
import { Toaster } from './components/ui/sonner';

const ROLE_ORDER = ['Team Leader', 'Telecaller', 'Sales Executive', 'CRM Executive', 'Finance', 'MIS Head', 'Sourcing Executive', 'Digital Team', 'Front Desk'];

const ROLE_HOME: Record<string, string> = {
  'Admin': 'management',
  'MIS Head': 'management',
  'Team Leader': 'telecaller',
  'Telecaller': 'telecaller',
  'Sales Executive': 'sales',
  'CRM Executive': 'crm',
  'Finance': 'finance',
  'Sourcing Executive': 'channel-partner',
  'Channel Partner': 'cp-portal',
  'Buyer': 'buyer-portal',
};

const firstModuleFor = (role: string) =>
  ROLE_HOME[role] ?? menuItems.find(m => canSee(m, role))?.id ?? 'management';

const personaValue = (p: Persona, users: { id: string; name: string; role: string }[]) =>
  p.role === 'Admin' ? 'Admin'
    : p.role === 'Channel Partner' ? `CP:${p.refId}`
      : p.role === 'Buyer' ? `BK:${p.refId}`
        : users.find(u => u.name === p.name && u.role === p.role)?.id ?? 'Admin';

export default function App() {
  const [dataReady, setDataReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [, setVersion] = useState(0);
  const [currentModule, setCurrentModule] = useState('management');
  const [collapsed, setCollapsed] = useState(() => {
    try { const saved = localStorage.getItem('buildercrm_sidebar'); if (saved) return saved === 'collapsed'; } catch { /* ignore */ }
    return window.innerWidth < 1440; // laptops get the slim menu so tables fit
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const alerted = useRef(new Set<string>());

  const store = getDataStore();

  useEffect(() => {
    let cancelled = false;
    store.load()
      .then(() => {
        if (cancelled) return;
        setCurrentModule(firstModuleFor(store.getPersona().role));
        setDataReady(true);
        if (store.lastRefresh?.shifted) toast.info(`Demo dates moved forward ${store.lastRefresh.shifted} day(s) to today`);
      })
      .catch((err) => { if (!cancelled) setLoadError(err?.message || 'Failed to load data'); });
    const unsubscribe = store.subscribe(() => setVersion(v => v + 1));
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  useEffect(() => { try { localStorage.setItem('buildercrm_sidebar', collapsed ? 'collapsed' : 'open'); } catch { /* ignore */ } }, [collapsed]);

  // Lead SLA watcher: alert the owner (and managers) when a new lead waits longer than the SLA
  useEffect(() => {
    if (!dataReady) return;
    const check = () => {
      const p = store.getPersona();
      if (!['Telecaller', 'Team Leader', 'Admin', 'MIS Head'].includes(p.role)) return;
      const breaches = slaBreaches().filter(l => p.role !== 'Telecaller' || l.assignedTo === p.name);
      const fresh = breaches.filter(l => !alerted.current.has(l.id));
      fresh.forEach(l => alerted.current.add(l.id));
      if (fresh.length === 1) toast.warning(`${fresh[0].name} (${fresh[0].source}) has waited over ${store.settingNumber('lead_sla_minutes', 15)} minutes for a call`, { duration: 8000 });
      else if (fresh.length > 1 && alerted.current.size > fresh.length) toast.warning(`${fresh.length} more leads have passed the ${store.settingNumber('lead_sla_minutes', 15)}-minute call limit`);
    };
    // the first check only records existing breaches; the Lead Pool banner shows them
    slaBreaches().forEach(l => alerted.current.add(l.id));
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, [dataReady]);

  const persona = store.getPersona();
  const userRole = persona.role;

  const switchPersona = (value: string) => {
    let next: Persona = ADMIN_PERSONA;
    if (value.startsWith('CP:')) {
      const cp = store.getChannelPartners().find(c => c.id === value.slice(3));
      if (cp) next = { name: cp.contactPerson || cp.companyName, role: 'Channel Partner', refId: cp.id };
    } else if (value.startsWith('BK:')) {
      const b = store.getBookings().find(x => x.id === value.slice(3));
      if (b) next = { name: b.customer, role: 'Buyer', refId: b.id };
    } else if (value !== 'Admin') {
      const user = store.getUsers().find(u => u.id === value);
      if (user) next = { name: user.name, role: user.role };
    }
    store.setPersona(next);
    alerted.current = new Set(slaBreaches().map(l => l.id));
    const item = menuItems.find(m => m.id === currentModule);
    if (!item || !canSee(item, next.role)) setCurrentModule(firstModuleFor(next.role));
  };

  const go = (id: string) => {
    const item = menuItems.find(m => m.id === id);
    if (item && canSee(item, store.getPersona().role)) setCurrentModule(id);
  };

  const renderModule = () => {
    switch (currentModule) {
      case 'management': return <ManagementDashboard onNavigate={go} />;
      case 'master-setup': return <MasterSetup />;
      case 'lead-capture': return <LeadCapture />;
      case 'lead-pool': return <LeadPool />;
      case 'telecaller': return <TelecallerDashboard />;
      case 'sales': return <SalesDashboard />;
      case 'field': return <FieldApp />;
      case 'crm': return <CRMDashboard onNavigate={go} />;
      case 'finance': return <FinanceDashboard />;
      case 'site-visits': return <SiteVisitManagement />;
      case 'bookings': return <BookingManagement />;
      case 'channel-partner': return <ChannelPartnerDashboard />;
      case 'agreements': return <AgreementManagement />;
      case 'loans': return <LoanProcessing />;
      case 'payments': return <PaymentCollections />;
      case 'inventory': return <InventoryManagement />;
      case 'documentation': return <DocumentationModule />;
      case 'possession': return <PossessionHandover />;
      case 'reports': return <ReportsAnalytics />;
      case 'notifications': return <NotificationCenter />;
      case 'cancellations': return <CancellationRefunds />;
      case 'support': return <PostSalesSupport />;
      case 'approvals': return <ApprovalsPage />;
      case 'audit': return <AuditTrailPage />;
      case 'cp-portal': return <CPPortal />;
      case 'buyer-portal': return <BuyerPortal />;
      default: return <ManagementDashboard onNavigate={go} />;
    }
  };

  if (!dataReady) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        {loadError ? (
          <>
            <p className="text-red-600">Could not load CRM data: {loadError}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-600">Loading CRM data…</p>
          </>
        )}
      </div>
    );
  }

  const users = store.getUsers();
  const selected = personaValue(persona, users);
  const approvalsMine = store.list<Approval>('approvals').filter(a => a.status === 'Pending' && canApprove(persona, a)).length;
  const sla = slaBreaches().filter(l => persona.role !== 'Telecaller' || l.assignedTo === persona.name);
  const inbox = store.list<NotificationRecord>('notifications').filter(n => n.channel === 'In-app' && n.recipientName === persona.name);
  const unread = inbox.filter(n => n.status !== 'Read').length;
  const badges: Record<string, number> = {
    approvals: approvalsMine,
    'lead-pool': ['Telecaller', 'Team Leader', 'Admin', 'MIS Head'].includes(persona.role) ? sla.length : 0,
    notifications: store.list<NotificationRecord>('notifications').filter(n => n.status === 'Queued' || n.status === 'Pending').length,
  };
  const buyers = store.getBookings().filter(b => b.stage !== 'Cancelled').slice(-15).reverse();

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      <Sidebar currentModule={currentModule} setCurrentModule={setCurrentModule} userRole={userRole}
        collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} badges={badges} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="w-5 h-5" /></button>
              <div className="min-w-0">
                <h1 className="text-gray-900 truncate lg:hidden">{menuItems.find(m => m.id === currentModule)?.label || 'Builder CRM'}</h1>
                <p className="text-gray-900 hidden lg:block">{persona.role === 'Admin' ? 'Admin' : persona.name}</p>
                <p className="text-gray-500 text-xs hidden sm:block">{persona.role === 'Admin' ? 'Full access · demo mode' : persona.role === 'Buyer' ? `Buyer portal · booking ${persona.refId}` : persona.role === 'Channel Partner' ? `Partner portal · ${persona.refId}` : `${persona.role} view · only what this role would see`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <button onClick={() => setBellOpen(!bellOpen)} className="relative p-2 rounded-lg hover:bg-gray-100" aria-label="Alerts">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {(unread + sla.length + approvalsMine) > 0 && <span className="absolute -top-0.5 -right-0.5 text-[10px] min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white flex items-center justify-center">{unread + sla.length + approvalsMine}</span>}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="px-3 py-2 border-b border-gray-100 text-sm text-gray-900">Alerts for {persona.name}</div>
                    {sla.length > 0 && (
                      <button className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 flex gap-2" onClick={() => { go('lead-pool'); setBellOpen(false); }}>
                        <PhoneMissed className="w-4 h-4 text-red-600 mt-0.5" /><span><b>{sla.length}</b> new lead(s) not called within {store.settingNumber('lead_sla_minutes', 15)} min</span>
                      </button>
                    )}
                    {approvalsMine > 0 && (
                      <button className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50" onClick={() => { go('approvals'); setBellOpen(false); }}><b>{approvalsMine}</b> approval(s) waiting for you</button>
                    )}
                    {inbox.slice(0, 15).map(n => (
                      <div key={n.id} className={`px-3 py-2 text-sm border-t border-gray-50 ${n.status !== 'Read' ? 'bg-blue-50/50' : ''}`}>
                        <div className="text-gray-900">{n.template}</div><div className="text-gray-600 text-xs">{n.message}</div><div className="text-[11px] text-gray-400">{fmtDateTime(n.sentAt || n.createdAt)}</div>
                      </div>
                    ))}
                    {inbox.length === 0 && sla.length === 0 && approvalsMine === 0 && <p className="px-3 py-6 text-sm text-gray-500 text-center">Nothing needs attention.</p>}
                    {unread > 0 && <button className="w-full px-3 py-2 text-xs text-blue-700 border-t border-gray-100" onClick={() => { inbox.filter(n => n.status !== 'Read').forEach(n => store.patch('notifications', n.id, { status: 'Read' }).catch(() => {})); }}>Mark all read</button>}
                  </div>
                )}
              </div>
              <UserCircle2 className="w-8 h-8 text-blue-600 hidden sm:block" />
              <div className="text-right">
                <label htmlFor="persona" className="block text-xs text-gray-500">Viewing as</label>
                <select id="persona" value={selected} onChange={(e) => switchPersona(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-sm max-w-[170px] sm:max-w-[260px]">
                  <option value="Admin">Admin (full access)</option>
                  {ROLE_ORDER.map(role => {
                    const people = users.filter(u => u.role === role);
                    if (people.length === 0) return null;
                    return (
                      <optgroup key={role} label={role}>
                        {people.map(u => <option key={u.id} value={u.id}>{u.name}{u.status === 'Inactive' ? ' (inactive)' : ''}</option>)}
                      </optgroup>
                    );
                  })}
                  <optgroup label="Channel partner (portal)">
                    {store.getChannelPartners().map(c => <option key={c.id} value={`CP:${c.id}`}>{c.companyName}{c.status === 'Inactive' ? ' (inactive)' : ''}</option>)}
                  </optgroup>
                  <optgroup label="Buyer (portal)">
                    {buyers.map(b => <option key={b.id} value={`BK:${b.id}`}>{b.customer} · {b.unit}</option>)}
                  </optgroup>
                </select>
              </div>
              <span className="hidden xl:inline-flex px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 whitespace-nowrap">{userRole}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-6" onClick={() => bellOpen && setBellOpen(false)}>
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
