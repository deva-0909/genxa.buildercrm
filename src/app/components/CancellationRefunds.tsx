import { XCircle, DollarSign, CheckCircle, Clock, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface Cancellation {
  id: string;
  bookingId: string;
  customer: string;
  mobile: string;
  project: string;
  unit: string;
  bookingAmount: number;
  refundableAmount: number;
  deductions: number;
  reason: string;
  status: 'Requested' | 'Under Review' | 'Approved' | 'Refunded' | 'Rejected';
  requestDate: string;
  approvalDate?: string;
  refundDate?: string;
  approvedBy?: string;
}

export function CancellationRefunds() {
  const [activeTab, setActiveTab] = useState('pending');

  const [cancellations] = useState<Cancellation[]>([
    { id: 'CAN001', bookingId: 'BK130', customer: 'Suresh Kumar', mobile: '9876543220', project: 'Metro Plaza', unit: 'A-301', bookingAmount: 3590000, refundableAmount: 3230000, deductions: 360000, reason: 'Job relocation to another city', status: 'Requested', requestDate: '2025-02-03' },
    { id: 'CAN002', bookingId: 'BK129', customer: 'Neha Gupta', mobile: '9876543221', project: 'Skyline Heights', unit: 'C-205', bookingAmount: 4200000, refundableAmount: 3780000, deductions: 420000, reason: 'Financial constraints', status: 'Under Review', requestDate: '2025-02-01' },
    { id: 'CAN003', bookingId: 'BK128', customer: 'Arun Patel', mobile: '9876543222', project: 'Green Valley', unit: 'B-102', bookingAmount: 6800000, refundableAmount: 6120000, deductions: 680000, reason: 'Found better alternative', status: 'Approved', requestDate: '2025-01-28', approvalDate: '2025-02-02', approvedBy: 'Amit Patel' },
    { id: 'CAN004', bookingId: 'BK127', customer: 'Deepika Singh', mobile: '9876543223', project: 'Ocean View', unit: 'D-401', bookingAmount: 8200000, refundableAmount: 7380000, deductions: 820000, reason: 'Medical emergency', status: 'Refunded', requestDate: '2025-01-20', approvalDate: '2025-01-25', refundDate: '2025-02-01', approvedBy: 'Amit Patel' },
    { id: 'CAN005', bookingId: 'BK126', customer: 'Rahul Verma', mobile: '9876543224', project: 'Metro Plaza', unit: 'B-205', bookingAmount: 3200000, refundableAmount: 0, deductions: 500000, reason: 'Changed mind', status: 'Rejected', requestDate: '2025-01-15', approvalDate: '2025-01-18', approvedBy: 'Amit Patel' },
  ]);

  const stats = [
    { label: 'Pending Requests', value: cancellations.filter(c => c.status === 'Requested' || c.status === 'Under Review').length, icon: Clock, color: 'orange' },
    { label: 'Approved MTD', value: cancellations.filter(c => c.status === 'Approved' || c.status === 'Refunded').length, icon: CheckCircle, color: 'green' },
    { label: 'Refund Amount (₹Cr)', value: (cancellations.filter(c => c.status === 'Refunded').reduce((sum, c) => sum + c.refundableAmount, 0) / 10000000).toFixed(2), icon: DollarSign, color: 'blue' },
    { label: 'Rejection Rate', value: '8.3%', icon: XCircle, color: 'red' },
  ];

  const pendingCancellations = cancellations.filter(c => c.status === 'Requested' || c.status === 'Under Review');
  const approvedCancellations = cancellations.filter(c => c.status === 'Approved');
  const refundedCancellations = cancellations.filter(c => c.status === 'Refunded');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Requested': return 'bg-blue-100 text-blue-700';
      case 'Under Review': return 'bg-yellow-100 text-yellow-700';
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Refunded': return 'bg-purple-100 text-purple-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
    };
    return colors[color];
  };

  const handleApprove = (_id: string) => {
    toast.success('Cancellation request approved');
  };

  const handleReject = (_id: string) => {
    toast.error('Cancellation request rejected');
  };

  const handleProcessRefund = (_id: string) => {
    toast.success('Processing refund...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Cancellation & Refunds</h2>
          <p className="text-gray-600">Manage booking cancellations and refund processing</p>
        </div>
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

      {/* Refund Policy */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Refund Policy Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-900 mb-2">Within 30 Days</div>
            <div className="text-xs text-gray-600 mb-2">90% refund after deducting booking charges</div>
            <div className="text-green-600">Refund: 90%</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-900 mb-2">31-90 Days</div>
            <div className="text-xs text-gray-600 mb-2">80% refund after deducting charges</div>
            <div className="text-yellow-600">Refund: 80%</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-900 mb-2">After 90 Days</div>
            <div className="text-xs text-gray-600 mb-2">As per agreement terms</div>
            <div className="text-red-600">Case by Case</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            {([
              ['pending', `Pending (${pendingCancellations.length})`],
              ['approved', `Approved (${approvedCancellations.length})`],
              ['refunded', `Refunded (${refundedCancellations.length})`],
              ['all', `All (${cancellations.length})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {(activeTab === 'pending' ? pendingCancellations :
              activeTab === 'approved' ? approvedCancellations :
              activeTab === 'refunded' ? refundedCancellations :
              cancellations).map((cancellation) => (
              <div key={cancellation.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-gray-900">{cancellation.customer}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(cancellation.status)}`}>
                        {cancellation.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Booking ID:</span>
                        <div className="text-gray-900">{cancellation.bookingId}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Project:</span>
                        <div className="text-gray-900">{cancellation.project}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Unit:</span>
                        <div className="text-gray-900">{cancellation.unit}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Booking Amount:</span>
                        <div className="text-gray-900">₹{(cancellation.bookingAmount / 100000).toFixed(1)}L</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Request Date:</span>
                        <div className="text-gray-900">{new Date(cancellation.requestDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-gray-600">Refundable:</span>
                        <div className="text-green-600">₹{(cancellation.refundableAmount / 100000).toFixed(1)}L</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Deductions:</span>
                        <div className="text-red-600">₹{(cancellation.deductions / 100000).toFixed(1)}L</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Mobile:</span>
                        <div className="text-gray-900">{cancellation.mobile}</div>
                      </div>
                      {cancellation.approvedBy && (
                        <div>
                          <span className="text-gray-600">Approved By:</span>
                          <div className="text-gray-900">{cancellation.approvedBy}</div>
                        </div>
                      )}
                      {cancellation.refundDate && (
                        <div>
                          <span className="text-gray-600">Refund Date:</span>
                          <div className="text-gray-900">{new Date(cancellation.refundDate).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Reason: </span>
                      <span className="text-gray-900">{cancellation.reason}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cancellation.status === 'Requested' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(cancellation.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleReject(cancellation.id)}>
                          Reject
                        </Button>
                      </>
                    )}
                    {cancellation.status === 'Approved' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleProcessRefund(cancellation.id)}>
                        <DollarSign className="w-4 h-4 mr-1" />
                        Process Refund
                      </Button>
                    )}
                    {cancellation.status === 'Refunded' && (
                      <Button size="sm" variant="outline" onClick={() => toast.info('Viewing refund details...')}>
                        <FileText className="w-4 h-4 mr-1" />
                        View Details
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
