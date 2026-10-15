import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { getDataStore } from './lib/dataStore';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
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

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [, setVersion] = useState(0);

  const [currentModule, setCurrentModule] = useState('management');
  const [userRole, setUserRole] = useState('Admin');

  // Track the signed-in session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load CRM data once signed in, and re-render whenever it changes
  useEffect(() => {
    const store = getDataStore();
    if (!session) {
      store.clear();
      setDataReady(false);
      return;
    }
    let cancelled = false;
    setLoadError(null);
    store.load()
      .then(() => { if (!cancelled) setDataReady(true); })
      .catch((err) => { if (!cancelled) setLoadError(err?.message || 'Failed to load data'); });
    const unsubscribe = store.subscribe(() => setVersion(v => v + 1));
    return () => { cancelled = true; unsubscribe(); };
  }, [session?.user?.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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

  if (!authReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LoginScreen />
      </>
    );
  }

  if (!dataReady) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        {loadError ? (
          <>
            <p className="text-red-600">Could not load CRM data: {loadError}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
            <button onClick={handleSignOut} className="text-sm text-gray-600 hover:underline">Sign out</button>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">Real Estate CRM System</h1>
              <p className="text-gray-500 text-sm">Complete Lead-to-Possession Management</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="Admin">Admin</option>
                <option value="MIS Head">MIS Head</option>
                <option value="Telecaller">Telecaller</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Sales Executive">Sales Executive</option>
                <option value="CRM Executive">CRM Executive</option>
                <option value="Finance">Finance</option>
                <option value="Sourcing Executive">Sourcing Executive</option>
              </select>
              <div className="text-right">
                <div className="text-sm text-gray-600">Role: {userRole}</div>
                <div className="text-xs text-gray-400">{session.user.email}</div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
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
