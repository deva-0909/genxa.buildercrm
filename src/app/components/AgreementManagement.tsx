import { FileText, Clock, CheckCircle, AlertCircle, Plus, Download, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface Agreement {
  id: string;
  bookingId: string;
  customer: string;
  project: string;
  unit: string;
  status: 'Draft' | 'Sent for Signature' | 'Signed' | 'Registered' | 'Completed';
  agreementDate: string;
  registrationDate?: string;
  stampDuty: number;
  registrationFee: number;
  documentUrl?: string;
}

export function AgreementManagement() {
  const [activeTab, setActiveTab] = useState('pending');

  const [agreements] = useState<Agreement[]>([
    { id: 'AG001', bookingId: 'BK127', customer: 'Vikram Singh', project: 'Metro Plaza', unit: 'A-201', status: 'Draft', agreementDate: '2025-02-01', stampDuty: 179500, registrationFee: 30000 },
    { id: 'AG002', bookingId: 'BK126', customer: 'Meera Iyer', project: 'Skyline Heights', unit: 'B-305', status: 'Sent for Signature', agreementDate: '2025-01-28', stampDuty: 210000, registrationFee: 30000 },
    { id: 'AG003', bookingId: 'BK125', customer: 'Rahul Sharma', project: 'Green Valley', unit: 'C-102', status: 'Signed', agreementDate: '2025-01-25', stampDuty: 340000, registrationFee: 30000 },
    { id: 'AG004', bookingId: 'BK124', customer: 'Anjali Desai', project: 'Skyline Heights', unit: 'A-405', status: 'Registered', agreementDate: '2025-01-20', registrationDate: '2025-01-30', stampDuty: 225000, registrationFee: 30000 },
    { id: 'AG005', bookingId: 'BK123', customer: 'Karan Mehta', project: 'Ocean View', unit: 'B-201', status: 'Completed', agreementDate: '2025-01-15', registrationDate: '2025-01-28', stampDuty: 410000, registrationFee: 30000 },
  ]);

  const stats = [
    { label: 'Pending Agreements', value: agreements.filter(a => a.status === 'Draft' || a.status === 'Sent for Signature').length, icon: Clock, color: 'orange' },
    { label: 'Awaiting Signature', value: agreements.filter(a => a.status === 'Sent for Signature').length, icon: FileText, color: 'blue' },
    { label: 'Completed This Month', value: agreements.filter(a => a.status === 'Completed').length, icon: CheckCircle, color: 'green' },
    { label: 'Total Stamp Duty (₹L)', value: (agreements.reduce((sum, a) => sum + a.stampDuty, 0) / 100000).toFixed(1), icon: AlertCircle, color: 'purple' },
  ];

  const pendingAgreements = agreements.filter(a => a.status === 'Draft' || a.status === 'Sent for Signature');
  const completedAgreements = agreements.filter(a => a.status === 'Registered' || a.status === 'Completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-700';
      case 'Sent for Signature': return 'bg-blue-100 text-blue-700';
      case 'Signed': return 'bg-yellow-100 text-yellow-700';
      case 'Registered': return 'bg-green-100 text-green-700';
      case 'Completed': return 'bg-purple-100 text-purple-700';
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

  const handleGenerateAgreement = (_agreementId: string) => {
    toast.success('Agreement generated successfully');
  };

  const handleSendForSignature = (_agreementId: string) => {
    toast.success('Agreement sent for e-signature');
  };

  const handleDownloadAgreement = (_agreementId: string) => {
    toast.success('Downloading agreement...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Agreement Management</h2>
          <p className="text-gray-600">Manage sale agreements and documentation</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Agreement
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

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({pendingAgreements.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'completed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed ({completedAgreements.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({agreements.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Pending Agreements */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingAgreements.map((agreement) => (
                <div key={agreement.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-900">{agreement.customer}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(agreement.status)}`}>
                          {agreement.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Agreement ID:</span>
                          <div className="text-gray-900">{agreement.id}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Project:</span>
                          <div className="text-gray-900">{agreement.project}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Unit:</span>
                          <div className="text-gray-900">{agreement.unit}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <div className="text-gray-900">{new Date(agreement.agreementDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                        <div>
                          <span className="text-gray-600">Stamp Duty:</span>
                          <div className="text-gray-900">₹{(agreement.stampDuty / 1000).toFixed(0)}K</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Registration:</span>
                          <div className="text-gray-900">₹{(agreement.registrationFee / 1000).toFixed(0)}K</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {agreement.status === 'Draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateAgreement(agreement.id)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Generate
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleSendForSignature(agreement.id)}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send
                          </Button>
                        </>
                      )}
                      {agreement.status === 'Sent for Signature' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadAgreement(agreement.id)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Agreements */}
          {activeTab === 'completed' && (
            <div className="space-y-4">
              {completedAgreements.map((agreement) => (
                <div key={agreement.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-900">{agreement.customer}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(agreement.status)}`}>
                          {agreement.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Agreement ID:</span>
                          <div className="text-gray-900">{agreement.id}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Project:</span>
                          <div className="text-gray-900">{agreement.project}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Unit:</span>
                          <div className="text-gray-900">{agreement.unit}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Registered:</span>
                          <div className="text-gray-900">{agreement.registrationDate ? new Date(agreement.registrationDate).toLocaleDateString() : '-'}</div>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadAgreement(agreement.id)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All Agreements */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              {agreements.map((agreement) => (
                <div key={agreement.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-900">{agreement.customer}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(agreement.status)}`}>
                          {agreement.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">ID:</span>
                          <div className="text-gray-900">{agreement.id}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Project:</span>
                          <div className="text-gray-900">{agreement.project}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Unit:</span>
                          <div className="text-gray-900">{agreement.unit}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Stamp Duty:</span>
                          <div className="text-gray-900">₹{(agreement.stampDuty / 1000).toFixed(0)}K</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <div className="text-gray-900">{agreement.status}</div>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadAgreement(agreement.id)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
