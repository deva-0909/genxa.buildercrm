import { TrendingUp, Clock, AlertCircle, CheckCircle, Plus, Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Payment {
  id: string;
  bookingId: string;
  customer: string;
  project: string;
  unit: string;
  amount: number;
  type: 'Token' | 'Booking' | 'Construction Linked' | 'Final Payment';
  status: 'Pending' | 'Received' | 'Overdue';
  dueDate: string;
  receivedDate?: string;
  paymentMode?: 'Cheque' | 'NEFT' | 'RTGS' | 'DD';
  reference?: string;
}

export function PaymentCollections() {
  const [activeTab, setActiveTab] = useState('pending');

  const [payments] = useState<Payment[]>([
    { id: 'PAY001', bookingId: 'BK127', customer: 'Vikram Singh', project: 'Metro Plaza', unit: 'A-201', amount: 500000, type: 'Token', status: 'Received', dueDate: '2025-02-01', receivedDate: '2025-02-01', paymentMode: 'NEFT', reference: 'NEFT7845621' },
    { id: 'PAY002', bookingId: 'BK127', customer: 'Vikram Singh', project: 'Metro Plaza', unit: 'A-201', amount: 1000000, type: 'Booking', status: 'Pending', dueDate: '2025-02-10' },
    { id: 'PAY003', bookingId: 'BK126', customer: 'Meera Iyer', project: 'Skyline Heights', unit: 'B-305', amount: 1600000, type: 'Construction Linked', status: 'Pending', dueDate: '2025-02-05' },
    { id: 'PAY004', bookingId: 'BK125', customer: 'Rahul Sharma', project: 'Green Valley', unit: 'C-102', amount: 750000, type: 'Token', status: 'Received', dueDate: '2025-01-25', receivedDate: '2025-01-25', paymentMode: 'Cheque', reference: 'CHQ458962' },
    { id: 'PAY005', bookingId: 'BK124', customer: 'Anjali Desai', project: 'Skyline Heights', unit: 'A-405', amount: 2100000, type: 'Construction Linked', status: 'Overdue', dueDate: '2025-01-30' },
  ]);

  const stats = [
    { label: 'Due This Month (₹Cr)', value: (payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0) / 10000000).toFixed(2), icon: Clock, color: 'orange' },
    { label: 'Collected MTD (₹Cr)', value: (payments.filter(p => p.status === 'Received').reduce((sum, p) => sum + p.amount, 0) / 10000000).toFixed(2), icon: CheckCircle, color: 'green' },
    { label: 'Overdue Amount (₹L)', value: (payments.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.amount, 0) / 100000).toFixed(1), icon: AlertCircle, color: 'red' },
    { label: 'Collection Rate', value: '87.5%', icon: TrendingUp, color: 'blue' },
  ];

  const monthlyCollectionData = [
    { month: 'Aug', target: 8.5, actual: 7.2 },
    { month: 'Sep', target: 9.2, actual: 9.5 },
    { month: 'Oct', target: 10.1, actual: 9.8 },
    { month: 'Nov', target: 11.5, actual: 12.1 },
    { month: 'Dec', target: 12.0, actual: 11.2 },
    { month: 'Jan', target: 13.5, actual: 14.2 },
  ];

  const paymentTypeData = [
    { type: 'Token', amount: 35.2 },
    { type: 'Booking', amount: 48.6 },
    { type: 'Construction', amount: 125.8 },
    { type: 'Final', amount: 42.1 },
  ];

  const pendingPayments = payments.filter(p => p.status === 'Pending');
  const receivedPayments = payments.filter(p => p.status === 'Received');
  const overduePayments = payments.filter(p => p.status === 'Overdue');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Received': return 'bg-green-100 text-green-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Token': return 'bg-blue-100 text-blue-700';
      case 'Booking': return 'bg-purple-100 text-purple-700';
      case 'Construction Linked': return 'bg-orange-100 text-orange-700';
      case 'Final Payment': return 'bg-green-100 text-green-700';
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

  const handleRecordPayment = (_paymentId: string) => {
    toast.success('Payment recorded successfully');
  };

  const handleSendReminder = (_paymentId: string) => {
    toast.success('Payment reminder sent via SMS and WhatsApp');
  };

  const handleDownloadReceipt = (_paymentId: string) => {
    toast.success('Downloading payment receipt...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Payment & Collections</h2>
          <p className="text-gray-600">Track payment schedules and collection status</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Monthly Collection Trend (₹Cr)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyCollectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="target" stroke="#3b82f6" name="Target" />
              <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Collection by Payment Type (₹Cr)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={paymentTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            {([
              ['pending', `Pending (${pendingPayments.length})`],
              ['overdue', `Overdue (${overduePayments.length})`],
              ['received', `Received (${receivedPayments.length})`],
              ['all', `All (${payments.length})`],
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
            {(activeTab === 'pending' ? pendingPayments :
              activeTab === 'overdue' ? overduePayments :
              activeTab === 'received' ? receivedPayments :
              payments).map((payment) => (
              <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-900">{payment.customer}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(payment.type)}`}>
                        {payment.type}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Payment ID:</span>
                        <div className="text-gray-900">{payment.id}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Project:</span>
                        <div className="text-gray-900">{payment.project}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Unit:</span>
                        <div className="text-gray-900">{payment.unit}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <div className="text-gray-900">₹{(payment.amount / 100000).toFixed(1)}L</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Due Date:</span>
                        <div className="text-gray-900">{new Date(payment.dueDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    {payment.status === 'Received' && (
                      <div className="grid grid-cols-5 gap-4 text-sm mt-2">
                        <div>
                          <span className="text-gray-600">Received On:</span>
                          <div className="text-gray-900">{payment.receivedDate ? new Date(payment.receivedDate).toLocaleDateString() : '-'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Payment Mode:</span>
                          <div className="text-gray-900">{payment.paymentMode || '-'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Reference:</span>
                          <div className="text-gray-900">{payment.reference || '-'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {payment.status === 'Pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleSendReminder(payment.id)}>
                          Send Reminder
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleRecordPayment(payment.id)}>
                          Record Payment
                        </Button>
                      </>
                    )}
                    {payment.status === 'Overdue' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleSendReminder(payment.id)}>
                          Send Reminder
                        </Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleRecordPayment(payment.id)}>
                          Mark Received
                        </Button>
                      </>
                    )}
                    {payment.status === 'Received' && (
                      <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(payment.id)}>
                        <Download className="w-4 h-4 mr-1" />
                        Receipt
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
