import { useEffect, useState } from 'react';
import { Loader2, UserCircle2 } from 'lucide-react';
import { getDataStore, ADMIN_PERSONA, Persona } from './lib/dataStore';
import { Sidebar, menuItems } from './components/Sidebar';
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
import { ChannelPartnerDashboard } from './components/ChannelPartnerDashboard';
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
import { Toaster } from './components/ui/sonner';

const ROLE_ORDER = ['Team Leader', 'Telecaller', 'Sales Executive', 'CRM Executive', 'Finance', 'MIS Head', 'Sourcing Executive'];

const ROLE_HOME: Record<string, string> = {
  'Admin': 'management',
  'MIS Head': 'management',
  'Team Leader': 'telecaller',
  'Telecaller': 'telecaller',
  'Sales Executive': 'sales',
  'CRM Executive': 'crm',
  'Finance': 'finance',
  'Sourcing Executive': 'channel-partner',
};

/** Home screen for a role, falling back to the first sidebar module it may open. */
const firstModuleFor = (role: string) =>
  ROLE_HOME[role] ?? menuItems.find(m => m.roles.includes(role))?.id ?? 'management';

export default function App() {
  const [dataReady, setDataReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [, setVersion] = useState(0);
  const [currentModule, setCurrentModule] = useState('management');

  const store = getDataStore();

  // Load CRM data and re-render whenever it (or the selected persona) changes
  useEffect(() => {
    let cancelled = false;
    store.load()
      .then(() => {
        if (cancelled) return;
        setCurrentModule(firstModuleFor(store.getPersona().role));
        setDataReady(true);
      })
      .catch((err) => { if (!cancelled) setLoadError(err?.message || 'Failed to load data'); });
    const unsubscribe = store.subscribe(() => setVersion(v => v + 1));
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const persona = store.getPersona();
  const userRole = persona.role;

  const switchPersona = (value: string) => {
    let next: Persona = ADMIN_PERSONA;
    if (value !== 'Admin') {
      const user = store.getUsers().find(u => u.id === value);
      if (user) next = { name: user.name, role: user.role };
    }
    store.setPersona(next);
    // Keep the current screen if the new role can see it, otherwise jump to its home screen
    const item = menuItems.find(m => m.id === currentModule);
    if (!(next.role === 'Admin' || item?.roles.includes(next.role))) {
      setCurrentModule(firstModuleFor(next.role));
    }
  };

  const renderModule = () => {
    switch (currentModule) {
      case 'management': return <ManagementDashboard />;
      case 'master-setup': return <MasterSetup />;
      case 'lead-capture': return <LeadCapture />;
      case 'lead-pool': return <LeadPool />;
      case 'telecaller': return <TelecallerDashboard />;
      case 'sales': return <SalesDashboard />;
      case 'crm': return <CRMDashboard />;
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
      default: return <ManagementDashboard />;
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
  const selectedUserId = persona.role === 'Admin'
    ? 'Admin'
    : users.find(u => u.name === persona.name && u.role === persona.role)?.id ?? 'Admin';

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      <Sidebar
        currentModule={currentModule}
        setCurrentModule={setCurrentModule}
        userRole={userRole}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-gray-900">Real Estate CRM System</h1>
              <p className="text-gray-500 text-sm">Complete Lead-to-Possession Management</p>
            </div>
            <div className="flex items-center gap-3">
              <UserCircle2 className="w-8 h-8 text-blue-600" />
              <div className="text-right">
                <label htmlFor="persona" className="block text-xs text-gray-500">Viewing as</label>
                <select
                  id="persona"
                  value={selectedUserId}
                  onChange={(e) => switchPersona(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm max-w-[260px]"
                >
                  <option value="Admin">Admin (full access)</option>
                  {ROLE_ORDER.map(role => {
                    const people = users.filter(u => u.role === role);
                    if (people.length === 0) return null;
                    return (
                      <optgroup key={role} label={role}>
                        {people.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name}{u.status === 'Inactive' ? ' (inactive)' : ''}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
              <span className="hidden md:inline-flex px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">{userRole}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
