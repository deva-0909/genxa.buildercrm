import { Building2, DollarSign, FileCheck, Clock, CheckCircle, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface LoanApplication {
  id: string;
  bookingId: string;
  customer: string;
  mobile: string;
  project: string;
  unit: string;
  propertyValue: number;
  loanAmount: number;
  bank: string;
  status: 'Applied' | 'Documents Submitted' | 'Under Review' | 'Sanctioned' | 'Disbursed' | 'Rejected';
  applicationDate: string;
  sanctionDate?: string;
  disbursementDate?: string;
  loanOfficer: string;
}

export function LoanProcessing() {
  const [activeTab, setActiveTab] = useState('active');

  const [loanApplications] = useState<LoanApplication[]>([
    { id: 'LN001', bookingId: 'BK127', customer: 'Vikram Singh', mobile: '9876543214', project: 'Metro Plaza', unit: 'A-201', propertyValue: 3590000, loanAmount: 2500000, bank: 'HDFC Bank', status: 'Documents Submitted', applicationDate: '2025-02-02', loanOfficer: 'Rajiv Mehta' },
    { id: 'LN002', bookingId: 'BK126', customer: 'Meera Iyer', mobile: '9876543217', project: 'Skyline Heights', unit: 'B-305', propertyValue: 4200000, loanAmount: 3000000, bank: 'ICICI Bank', status: 'Under Review', applicationDate: '2025-01-30', loanOfficer: 'Priya Kapoor' },
    { id: 'LN003', bookingId: 'BK125', customer: 'Rahul Sharma', mobile: '9876543218', project: 'Green Valley', unit: 'C-102', propertyValue: 6800000, loanAmount: 4800000, bank: 'SBI', status: 'Sanctioned', applicationDate: '2025-01-26', sanctionDate: '2025-02-03', loanOfficer: 'Amit Sharma' },
    { id: 'LN004', bookingId: 'BK124', customer: 'Anjali Desai', mobile: '9876543215', project: 'Skyline Heights', unit: 'A-405', propertyValue: 4500000, loanAmount: 3200000, bank: 'Axis Bank', status: 'Disbursed', applicationDate: '2025-01-20', sanctionDate: '2025-01-28', disbursementDate: '2025-02-01', loanOfficer: 'Neha Singh' },
  ]);

  const stats = [
    { label: 'Active Applications', value: loanApplications.filter(l => !['Disbursed', 'Rejected'].includes(l.status)).length, icon: Clock, color: 'blue' },
    { label: 'Sanctioned This Month', value: loanApplications.filter(l => l.status === 'Sanctioned').length, icon: CheckCircle, color: 'green' },
    { label: 'Total Loan Amount (₹Cr)', value: (loanApplications.reduce((sum, l) => sum + l.loanAmount, 0) / 10000000).toFixed(2), icon: DollarSign, color: 'purple' },
    { label: 'Avg Processing Time', value: '12 days', icon: FileCheck, color: 'orange' },
  ];

  const activeApplications = loanApplications.filter(l => !['Disbursed', 'Rejected'].includes(l.status));
  const completedApplications = loanApplications.filter(l => l.status === 'Disbursed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'bg-blue-100 text-blue-700';
      case 'Documents Submitted': return 'bg-yellow-100 text-yellow-700';
      case 'Under Review': return 'bg-orange-100 text-orange-700';
      case 'Sanctioned': return 'bg-green-100 text-green-700';
      case 'Disbursed': return 'bg-purple-100 text-purple-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
    };
    return colors[color];
  };

  const handleUpdateStatus = (_loanId: string, newStatus: string) => {
    toast.success(`Loan status updated to ${newStatus}`);
  };

  const handleViewDocuments = (_loanId: string) => {
    toast.info('Opening documents viewer...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Loan Processing</h2>
          <p className="text-gray-600">Manage home loan applications and approvals</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color);

          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bank Partners */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Partner Banks</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra', 'PNB Housing', 'LIC Housing', 'DHFL'].map((bank, idx) => (
            <div key={idx} className="p-3 border border-gray-200 rounded-lg text-center hover:border-blue-300 transition-colors cursor-pointer">
              <Building2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-sm text-gray-900">{bank}</div>
              <div className="text-xs text-gray-500 mt-1">7.5% - 8.5%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Active ({activeApplications.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'completed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed ({completedApplications.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({loanApplications.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {(activeTab === 'active' ? activeApplications : activeTab === 'completed' ? completedApplications : loanApplications).map((loan) => (
              <div key={loan.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-900">{loan.customer}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(loan.status)}`}>
                        {loan.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Loan ID:</span>
                        <div className="text-gray-900">{loan.id}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Bank:</span>
                        <div className="text-gray-900">{loan.bank}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Property Value:</span>
                        <div className="text-gray-900">₹{(loan.propertyValue / 100000).toFixed(1)}L</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Loan Amount:</span>
                        <div className="text-gray-900">₹{(loan.loanAmount / 100000).toFixed(1)}L</div>
                      </div>
                      <div>
                        <span className="text-gray-600">LTV:</span>
                        <div className="text-gray-900">{((loan.loanAmount / loan.propertyValue) * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-gray-600">Project:</span>
                        <div className="text-gray-900">{loan.project}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Unit:</span>
                        <div className="text-gray-900">{loan.unit}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Applied On:</span>
                        <div className="text-gray-900">{new Date(loan.applicationDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Loan Officer:</span>
                        <div className="text-gray-900">{loan.loanOfficer}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Mobile:</span>
                        <div className="text-gray-900">{loan.mobile}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDocuments(loan.id)}
                    >
                      <FileCheck className="w-4 h-4 mr-1" />
                      Documents
                    </Button>
                    {!['Disbursed', 'Rejected'].includes(loan.status) && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleUpdateStatus(loan.id, 'Sanctioned')}
                      >
                        Update Status
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
