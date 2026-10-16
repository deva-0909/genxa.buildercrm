import {
  LayoutDashboard, Settings, Users, Phone, Building2, TrendingUp, FileText, IndianRupee, Calendar, Briefcase, UserCheck, FileCheck,
  CreditCard, Wallet, Package, FolderOpen, Key, BarChart3, Bell, XCircle, Headphones, ShieldCheck, History, Smartphone, Home, Handshake,
  PanelLeftClose, PanelLeftOpen, X,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  roles: string[];
  /** Shown only to the listed roles (not to Admin), e.g. portals that need a specific partner or buyer. */
  only?: boolean;
  section: string;
}

export const menuItems: MenuItem[] = [
  { id: 'management', label: 'Management Dashboard', icon: LayoutDashboard, roles: ['Admin', 'MIS Head'], section: 'Overview' },
  { id: 'approvals', label: 'Approvals', icon: ShieldCheck, roles: ['Admin', 'MIS Head', 'Team Leader', 'Finance'], section: 'Overview' },
  { id: 'lead-capture', label: 'Lead Capture', icon: Users, roles: ['Admin', 'Digital Team', 'Front Desk', 'Team Leader', 'MIS Head', 'Sourcing Executive'], section: 'Pre-sales' },
  { id: 'lead-pool', label: 'Lead Pool', icon: UserCheck, roles: ['Admin', 'MIS Head', 'Telecaller', 'Team Leader'], section: 'Pre-sales' },
  { id: 'telecaller', label: 'Telecaller Dashboard', icon: Phone, roles: ['Telecaller', 'Team Leader', 'Admin'], section: 'Pre-sales' },
  { id: 'site-visits', label: 'Site Visits', icon: Calendar, roles: ['Sales Executive', 'Telecaller', 'Team Leader', 'Admin'], section: 'Pre-sales' },
  { id: 'sales', label: 'Sales Dashboard', icon: TrendingUp, roles: ['Sales Executive', 'Team Leader', 'Admin'], section: 'Sales' },
  { id: 'field', label: 'Field App', icon: Smartphone, roles: ['Sales Executive', 'Team Leader', 'Admin'], section: 'Sales' },
  { id: 'inventory', label: 'Inventory', icon: Package, roles: ['Sales Executive', 'Team Leader', 'MIS Head', 'Admin'], section: 'Sales' },
  { id: 'bookings', label: 'Bookings', icon: Building2, roles: ['Sales Executive', 'CRM Executive', 'Finance', 'Team Leader', 'Admin'], section: 'Sales' },
  { id: 'channel-partner', label: 'Channel Partners', icon: Briefcase, roles: ['Sourcing Executive', 'Admin', 'MIS Head'], section: 'Sales' },
  { id: 'crm', label: 'CRM Dashboard', icon: FileText, roles: ['CRM Executive', 'Admin'], section: 'Post-sales' },
  { id: 'agreements', label: 'Agreements', icon: FileCheck, roles: ['CRM Executive', 'Admin'], section: 'Post-sales' },
  { id: 'documentation', label: 'Documentation', icon: FolderOpen, roles: ['CRM Executive', 'Admin'], section: 'Post-sales' },
  { id: 'loans', label: 'Loan Processing', icon: CreditCard, roles: ['CRM Executive', 'Finance', 'Admin'], section: 'Post-sales' },
  { id: 'payments', label: 'Payments & Collections', icon: Wallet, roles: ['Finance', 'CRM Executive', 'Admin'], section: 'Post-sales' },
  { id: 'possession', label: 'Possession', icon: Key, roles: ['CRM Executive', 'Admin'], section: 'Post-sales' },
  { id: 'cancellations', label: 'Cancellations & Refunds', icon: XCircle, roles: ['CRM Executive', 'Finance', 'Admin'], section: 'Post-sales' },
  { id: 'support', label: 'Post-Sales Support', icon: Headphones, roles: ['CRM Executive', 'Admin'], section: 'Post-sales' },
  { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['Admin', 'CRM Executive', 'Finance', 'Team Leader'], section: 'Post-sales' },
  { id: 'finance', label: 'Finance & ROI', icon: IndianRupee, roles: ['Finance', 'Admin', 'MIS Head'], section: 'Insights' },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['Admin', 'MIS Head', 'Team Leader', 'Finance'], section: 'Insights' },
  { id: 'audit', label: 'Audit Trail', icon: History, roles: ['Admin', 'MIS Head'], section: 'Admin' },
  { id: 'master-setup', label: 'Master Setup', icon: Settings, roles: ['Admin', 'MIS Head'], section: 'Admin' },
  { id: 'cp-portal', label: 'Partner Portal', icon: Handshake, roles: ['Channel Partner'], only: true, section: 'Portal' },
  { id: 'buyer-portal', label: 'My Home', icon: Home, roles: ['Buyer'], only: true, section: 'Portal' },
];

export const canSee = (item: MenuItem, role: string) => item.roles.includes(role) || (role === 'Admin' && !item.only);

interface SidebarProps {
  currentModule: string;
  setCurrentModule: (module: string) => void;
  userRole: string;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
  badges?: Record<string, number>;
}

export function Sidebar({ currentModule, setCurrentModule, userRole, collapsed, setCollapsed, mobileOpen, setMobileOpen, badges = {} }: SidebarProps) {
  const items = menuItems.filter(i => canSee(i, userRole));
  const sections = Array.from(new Set(items.map(i => i.section)));
  const narrow = collapsed && !mobileOpen;
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`bg-white border-r border-gray-200 flex flex-col z-40 transition-all
        fixed inset-y-0 left-0 lg:static ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${narrow ? 'lg:w-16' : 'w-64'}`}>
        <div className={`flex items-center gap-2 border-b border-gray-200 ${narrow ? 'justify-center p-3' : 'p-4'}`}>
          <Building2 className="w-7 h-7 text-blue-600 shrink-0" />
          {!narrow && <div className="flex-1"><div className="text-gray-900 leading-tight">Builder CRM</div><div className="text-xs text-gray-500">by GENXA</div></div>}
          <button className="lg:hidden p-1" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Modules">
          {sections.map(sec => (
            <div key={sec} className="mb-2">
              {!narrow && <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-400">{sec}</div>}
              {items.filter(i => i.section === sec).map(item => {
                const Icon = item.icon;
                const active = currentModule === item.id;
                const badge = badges[item.id];
                return (
                  <button key={item.id} title={narrow ? item.label : undefined}
                    onClick={() => { setCurrentModule(item.id); setMobileOpen(false); }}
                    className={`relative w-full flex items-center gap-3 rounded-lg transition-colors text-sm ${narrow ? 'justify-center p-2.5' : 'px-3 py-2'} ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {!narrow && <span className="flex-1 text-left truncate">{item.label}</span>}
                    {badge ? <span className={`text-[10px] min-w-[18px] px-1 rounded-full bg-red-600 text-white text-center ${narrow ? 'absolute top-1 right-1' : ''}`}>{badge > 99 ? '99+' : badge}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-200 hidden lg:block">
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs text-gray-500 hover:bg-gray-50" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}>
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <><PanelLeftClose className="w-4 h-4" />Collapse menu</>}
          </button>
        </div>
      </aside>
    </>
  );
}
