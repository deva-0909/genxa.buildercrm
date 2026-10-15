import { DollarSign, TrendingUp, TrendingDown, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function FinanceDashboard() {
  const stats = [
    { label: 'Total Revenue (₹Cr)', value: '45.6', change: '+22.1%', trend: 'up', icon: DollarSign, color: 'green' },
    { label: 'Collections MTD (₹Cr)', value: '12.8', change: '+18.5%', trend: 'up', icon: CreditCard, color: 'blue' },
    { label: 'Pending Collections (₹Cr)', value: '8.4', change: '-12%', trend: 'down', icon: AlertCircle, color: 'orange' },
    { label: 'Marketing ROI', value: '3.8x', change: '+0.5x', trend: 'up', icon: TrendingUp, color: 'purple' },
  ];

  const revenueByProject = [
    { project: 'Skyline Heights', revenue: 15.2, bookings: 42, avgDeal: 36.2 },
    { project: 'Green Valley', revenue: 12.8, bookings: 35, avgDeal: 36.6 },
    { project: 'Ocean View', revenue: 10.5, bookings: 28, avgDeal: 37.5 },
    { project: 'Metro Plaza', revenue: 7.1, bookings: 22, avgDeal: 32.3 },
  ];

  const monthlyRevenue = [
    { month: 'Jul', revenue: 6.2, collections: 5.8, target: 7.5 },
    { month: 'Aug', revenue: 7.8, collections: 7.2, target: 7.5 },
    { month: 'Sep', revenue: 6.9, collections: 6.5, target: 7.5 },
    { month: 'Oct', revenue: 8.5, collections: 8.1, target: 7.5 },
    { month: 'Nov', revenue: 8.1, collections: 7.8, target: 7.5 },
    { month: 'Dec', revenue: 8.1, collections: 7.5, target: 7.5 },
  ];

  const marketingSpend = [
    { source: 'Digital Ads', spend: 2.5, leads: 1245, cpl: 450, bookings: 48, cac: 11500 },
    { source: 'Portals', spend: 1.8, leads: 856, cpl: 395, bookings: 35, cac: 12200 },
    { source: 'Channel Partners', spend: 0.5, leads: 428, cpl: 0, bookings: 22, cac: 8500 },
    { source: 'Outdoor/Events', spend: 0.8, leads: 318, cpl: 850, bookings: 12, cac: 14800 },
  ];

  const collectionSchedule = [
    { customer: 'Vikram Singh', project: 'Metro Plaza', totalAmount: 3590000, received: 2500000, pending: 1090000, dueDate: 'Dec 10, 2025', status: 'Overdue' },
    { customer: 'Meera Iyer', project: 'Skyline Heights', totalAmount: 4200000, received: 3500000, pending: 700000, dueDate: 'Dec 15, 2025', status: 'Due Soon' },
    { customer: 'Rahul Sharma', project: 'Green Valley', totalAmount: 6800000, received: 6800000, pending: 0, dueDate: '-', status: 'Paid' },
    { customer: 'Anjali Desai', project: 'Skyline Heights', totalAmount: 4500000, received: 3800000, pending: 700000, dueDate: 'Dec 20, 2025', status: 'On Track' },
  ];

  const roiData = [
    { name: 'Digital', value: 4.2, color: '#3b82f6' },
    { name: 'Portals', value: 3.8, color: '#8b5cf6' },
    { name: 'CP', value: 5.5, color: '#10b981' },
    { name: 'Events', value: 2.8, color: '#f59e0b' },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
    };
    return colors[color];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Overdue': return 'bg-red-100 text-red-700';
      case 'Due Soon': return 'bg-orange-100 text-orange-700';
      case 'On Track': return 'bg-blue-100 text-blue-700';
      case 'Paid': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Finance & ROI Dashboard</h2>
        <p className="text-gray-600">Track revenue, collections, marketing spend, and ROI</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color);
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;

          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
              <div className={`flex items-center gap-1 mt-2 ${colors.text}`}>
                <TrendIcon className="w-4 h-4" />
                <span className="text-sm">{stat.change} vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Monthly Revenue & Collections</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue (₹Cr)" strokeWidth={2} />
              <Line type="monotone" dataKey="collections" stroke="#3b82f6" name="Collections (₹Cr)" strokeWidth={2} />
              <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeDasharray="5 5" name="Target (₹Cr)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Revenue by Project</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByProject}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (₹Cr)" />
              <Bar dataKey="bookings" fill="#10b981" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Marketing Spend & ROI */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Marketing Spend & ROI Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Source</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Spend (₹L)</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Leads</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">CPL (₹)</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Bookings</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">CAC (₹)</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Conv %</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">ROI</th>
              </tr>
            </thead>
            <tbody>
              {marketingSpend.map((item, index) => {
                const conversion = ((item.bookings / item.leads) * 100).toFixed(2);
                const roi = item.cpl > 0 ? ((item.bookings * 35) / item.spend).toFixed(1) : 'N/A';

                return (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-gray-900">{item.source}</td>
                    <td className="text-right py-4 px-4 text-gray-900">₹{item.spend}L</td>
                    <td className="text-right py-4 px-4 text-gray-600">{item.leads}</td>
                    <td className="text-right py-4 px-4 text-gray-600">
                      {item.cpl > 0 ? `₹${item.cpl}` : 'N/A'}
                    </td>
                    <td className="text-right py-4 px-4 text-gray-900">{item.bookings}</td>
                    <td className="text-right py-4 px-4 text-gray-900">₹{item.cac.toLocaleString()}</td>
                    <td className="text-right py-4 px-4 text-gray-600">{conversion}%</td>
                    <td className="text-right py-4 px-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        roi !== 'N/A' && parseFloat(roi) > 3.5
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {roi !== 'N/A' ? `${roi}x` : roi}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Total Marketing Spend</div>
            <div className="text-gray-900 mt-1">₹5.6L</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Leads</div>
            <div className="text-gray-900 mt-1">2,847</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Bookings</div>
            <div className="text-gray-900 mt-1">117</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Overall CAC</div>
            <div className="text-gray-900 mt-1">₹12,450</div>
          </div>
        </div>
      </div>

      {/* ROI by Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">ROI by Marketing Source</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={roiData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}x`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {roiData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">Blended ROI</div>
            <div className="text-gray-900 mt-1">3.8x</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Key Financial Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Average Deal Value</span>
              <span className="text-gray-900">₹35.9 L</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Customer Lifetime Value</span>
              <span className="text-gray-900">₹38.2 L</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">CAC to LTV Ratio</span>
              <span className="text-green-600">1:3.1</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Collection Efficiency</span>
              <span className="text-green-600">91.5%</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Booking to Revenue Time</span>
              <span className="text-gray-900">45 days avg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue Forecast (Q1 2026)</span>
              <span className="text-gray-900">₹28.5 Cr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Schedule */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Payment Schedule & Collections</h3>
            <p className="text-sm text-gray-600">Track pending payments and collection status</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Send Reminders
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Project</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Total Amount (₹)</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Received (₹)</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Pending (₹)</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Due Date</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-center py-3 px-4 text-sm text-gray-600">Progress</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collectionSchedule.map((item, index) => {
                const progress = Math.round((item.received / item.totalAmount) * 100);

                return (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-gray-900">{item.customer}</td>
                    <td className="py-4 px-4 text-gray-600">{item.project}</td>
                    <td className="text-right py-4 px-4 text-gray-900">
                      ₹{(item.totalAmount / 100000).toFixed(2)}L
                    </td>
                    <td className="text-right py-4 px-4 text-green-600">
                      ₹{(item.received / 100000).toFixed(2)}L
                    </td>
                    <td className="text-right py-4 px-4">
                      {item.pending > 0 ? (
                        <span className="text-orange-600">₹{(item.pending / 100000).toFixed(2)}L</span>
                      ) : (
                        <span className="text-green-600">₹0</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{item.dueDate}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                        {item.status === 'Overdue' && <AlertCircle className="w-3 h-3" />}
                        {item.status === 'Paid' && <CheckCircle className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-full">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{progress}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        {item.pending > 0 && (
                          <button className="px-3 py-1 text-xs bg-orange-50 text-orange-600 rounded hover:bg-orange-100">
                            Send Reminder
                          </button>
                        )}
                        <button className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
