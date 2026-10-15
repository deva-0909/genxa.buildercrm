import { FileText, DollarSign, Key, TrendingUp, AlertCircle } from 'lucide-react';

export function CRMDashboard() {
  const stats = [
    { label: 'Pending Agreements', value: 8, icon: FileText, color: 'blue' },
    { label: 'Loan Applications', value: 12, icon: DollarSign, color: 'purple' },
    { label: 'Pending Disbursements', value: 5, icon: TrendingUp, color: 'orange' },
    { label: 'Possessions Due', value: 3, icon: Key, color: 'green' },
  ];

  const bookingsPipeline = [
    { id: 'BK127', customer: 'Vikram Singh', project: 'Metro Plaza', unit: 'A-201', price: 3590000, tokenAmount: 500000, stage: 'Agreement Pending', assignedTo: 'Amit Patel', bookingDate: 'Dec 1, 2025' },
    { id: 'BK126', customer: 'Meera Iyer', project: 'Skyline Heights', unit: 'B-305', price: 4200000, tokenAmount: 500000, stage: 'Documentation', assignedTo: 'Amit Patel', bookingDate: 'Nov 28, 2025' },
    { id: 'BK125', customer: 'Rahul Sharma', project: 'Green Valley', unit: 'C-102', price: 6800000, tokenAmount: 750000, stage: 'Agreement Done', assignedTo: 'Sneha Joshi', bookingDate: 'Nov 25, 2025' },
  ];

  const loanCases = [
    { id: 'LN045', customer: 'Anjali Desai', project: 'Skyline Heights', unit: 'A-405', loanAmount: 3200000, bank: 'HDFC Bank', status: 'Sanctioned', disbursement: 'Pending', sanctionDate: 'Nov 20, 2025' },
    { id: 'LN044', customer: 'Karan Mehta', project: 'Ocean View', unit: 'B-201', loanAmount: 5600000, bank: 'SBI', status: 'In Process', disbursement: 'N/A', sanctionDate: '-' },
    { id: 'LN043', customer: 'Priya Shah', project: 'Green Valley', unit: 'C-304', loanAmount: 4800000, bank: 'ICICI Bank', status: 'Disbursed', disbursement: 'Complete', sanctionDate: 'Nov 15, 2025' },
  ];

  const possessionSchedule = [
    { id: 'PS012', customer: 'Ramesh Kumar', project: 'Skyline Heights', unit: 'A-102', possessionDate: 'Dec 10, 2025', status: 'Due Soon', outstandingDues: 0, snagList: 'Cleared' },
    { id: 'PS011', customer: 'Sneha Patel', project: 'Green Valley', unit: 'B-205', possessionDate: 'Dec 15, 2025', status: 'Scheduled', outstandingDues: 150000, snagList: 'Pending' },
    { id: 'PS010', customer: 'Amit Verma', project: 'Ocean View', unit: 'C-401', possessionDate: 'Dec 20, 2025', status: 'Scheduled', outstandingDues: 0, snagList: 'Cleared' },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
    };
    return colors[color];
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Agreement Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Documentation': return 'bg-orange-100 text-orange-700';
      case 'Agreement Done': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLoanStatusColor = (status: string) => {
    switch (status) {
      case 'Sanctioned': return 'bg-green-100 text-green-700';
      case 'In Process': return 'bg-yellow-100 text-yellow-700';
      case 'Disbursed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">CRM Executive Dashboard</h2>
        <p className="text-gray-600">Manage agreements, loans, disbursements, and possessions</p>
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

      {/* Bookings Pipeline - Agreements */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Bookings Pipeline - Agreements</h3>
            <p className="text-sm text-gray-600">Track agreement execution and documentation</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Upload Agreement
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Booking ID</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Project / Unit</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Price (₹)</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Token (₹)</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Stage</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Assigned To</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Booking Date</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookingsPipeline.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="text-blue-600 hover:underline cursor-pointer">{booking.id}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{booking.customer}</td>
                  <td className="py-4 px-4">
                    <div className="text-gray-900">{booking.project}</div>
                    <div className="text-xs text-gray-500">Unit: {booking.unit}</div>
                  </td>
                  <td className="text-right py-4 px-4 text-gray-900">
                    ₹{(booking.price / 100000).toFixed(2)}L
                  </td>
                  <td className="text-right py-4 px-4 text-gray-600">
                    ₹{(booking.tokenAmount / 100000).toFixed(2)}L
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${getStageColor(booking.stage)}`}>
                      {booking.stage}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{booking.assignedTo}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{booking.bookingDate}</td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                        Upload KYC
                      </button>
                      <button className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100">
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Processing */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Loan Processing Tracker</h3>
            <p className="text-sm text-gray-600">Monitor loan applications and disbursements</p>
          </div>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
            New Loan Application
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Loan ID</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Project / Unit</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Loan Amount (₹)</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Bank</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Disbursement</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Sanction Date</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loanCases.map((loan) => (
                <tr key={loan.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="text-purple-600 hover:underline cursor-pointer">{loan.id}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{loan.customer}</td>
                  <td className="py-4 px-4">
                    <div className="text-gray-900">{loan.project}</div>
                    <div className="text-xs text-gray-500">Unit: {loan.unit}</div>
                  </td>
                  <td className="text-right py-4 px-4 text-gray-900">
                    ₹{(loan.loanAmount / 100000).toFixed(2)}L
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{loan.bank}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${getLoanStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${
                      loan.disbursement === 'Complete' ? 'bg-green-100 text-green-700' :
                      loan.disbursement === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {loan.disbursement}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{loan.sanctionDate}</td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
                        Update Status
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Possession Schedule */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Possession & Handover Schedule</h3>
            <p className="text-sm text-gray-600">Track upcoming possessions and handovers</p>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
            Schedule Possession
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Possession ID</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Project / Unit</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Possession Date</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Outstanding (₹)</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Snag List</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {possessionSchedule.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="text-green-600 hover:underline cursor-pointer">{item.id}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{item.customer}</td>
                  <td className="py-4 px-4">
                    <div className="text-gray-900">{item.project}</div>
                    <div className="text-xs text-gray-500">Unit: {item.unit}</div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">{item.possessionDate}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      item.status === 'Due Soon' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.status === 'Due Soon' && <AlertCircle className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    {item.outstandingDues > 0 ? (
                      <span className="text-red-600">₹{(item.outstandingDues / 100000).toFixed(2)}L</span>
                    ) : (
                      <span className="text-green-600">₹0</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${
                      item.snagList === 'Cleared' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.snagList}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                        Handover
                      </button>
                      <button className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Update Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Update Agreement Status</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Booking ID</label>
              <input
                type="text"
                placeholder="BK127"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">KYC Documents</label>
              <input
                type="file"
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Agreement Status</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Documentation Pending</option>
                <option>Agreement Generated</option>
                <option>Agreement Signed</option>
                <option>Registered</option>
              </select>
            </div>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Update Agreement
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Update Loan Status</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Loan ID</label>
              <input
                type="text"
                placeholder="LN045"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Bank</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>HDFC Bank</option>
                <option>SBI</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Loan Status</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Applied</option>
                <option>In Process</option>
                <option>Sanctioned</option>
                <option>Disbursed</option>
                <option>Rejected</option>
              </select>
            </div>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
              Update Loan Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
