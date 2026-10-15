import { LayoutDashboard, Settings, Users, Phone, Building2, TrendingUp, FileText, DollarSign, Calendar, Briefcase, UserCheck, FileCheck, CreditCard, Wallet, Package, FolderOpen, Key, BarChart3, Bell, XCircle, Headphones } from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  setCurrentModule: (module: string) => void;
  userRole: string;
}

export const menuItems = [
    { id: 'management', label: 'Management Dashboard', icon: LayoutDashboard, roles: ['Admin', 'MIS Head'] },
    { id: 'master-setup', label: 'Master Setup', icon: Settings, roles: ['Admin', 'MIS Head'] },
    { id: 'lead-capture', label: 'Lead Capture', icon: Users, roles: ['Admin', 'Digital Team', 'Front Desk'] },
    { id: 'lead-pool', label: 'Lead Pool', icon: UserCheck, roles: ['Admin', 'MIS Head', 'Telecaller', 'Team Leader'] },
    { id: 'telecaller', label: 'Telecaller Dashboard', icon: Phone, roles: ['Telecaller', 'Team Leader', 'Admin'] },
    { id: 'sales', label: 'Sales Dashboard', icon: TrendingUp, roles: ['Sales Executive', 'Team Leader', 'Admin'] },
    { id: 'site-visits', label: 'Site Visits', icon: Calendar, roles: ['Sales Executive', 'Telecaller', 'Team Leader', 'Admin'] },
    { id: 'bookings', label: 'Bookings', icon: Building2, roles: ['Sales Executive', 'CRM Executive', 'Admin'] },
    { id: 'agreements', label: 'Agreements', icon: FileCheck, roles: ['CRM Executive', 'Admin'] },
    { id: 'loans', label: 'Loan Processing', icon: CreditCard, roles: ['CRM Executive', 'Admin'] },
    { id: 'payments', label: 'Payment & Collections', icon: Wallet, roles: ['Finance', 'CRM Executive', 'Admin'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['Sales Executive', 'Admin'] },
    { id: 'documentation', label: 'Documentation', icon: FolderOpen, roles: ['CRM Executive', 'Admin'] },
    { id: 'possession', label: 'Possession', icon: Key, roles: ['CRM Executive', 'Admin'] },
    { id: 'crm', label: 'CRM Dashboard', icon: FileText, roles: ['CRM Executive', 'Admin'] },
    { id: 'finance', label: 'Finance & ROI', icon: DollarSign, roles: ['Finance', 'Admin', 'MIS Head'] },
    { id: 'channel-partner', label: 'Channel Partners', icon: Briefcase, roles: ['Sourcing Executive', 'Admin'] },
    { id: 'cancellations', label: 'Cancellation & Refunds', icon: XCircle, roles: ['CRM Executive', 'Finance', 'Admin'] },
    { id: 'support', label: 'Post-Sales Support', icon: Headphones, roles: ['CRM Executive', 'Admin'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['Admin', 'MIS Head'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['Admin', 'CRM Executive'] },
  ];

export function Sidebar({ currentModule, setCurrentModule, userRole }: SidebarProps) {
  const filteredItems = menuItems.filter(item =>
    item.roles.includes(userRole) || userRole === 'Admin'
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div>
            <div className="text-gray-900">Builder CRM</div>
            <div className="text-xs text-gray-500">by GENXA</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentModule(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Version 2.0.1 | © {new Date().getFullYear()} GENXA
        </div>
      </div>
    </div>
  );
}
