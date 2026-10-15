import { TrendingUp, Users, Calendar, Building2, DollarSign, Phone, CheckCircle, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ManagementDashboard() {
  const kpiCards = [
    { label: 'Total Leads', value: '2,847', change: '+12.5%', trend: 'up', icon: Users, color: 'blue' },
    { label: 'Site Visits', value: '486', change: '+8.2%', trend: 'up', icon: Calendar, color: 'green' },
    { label: 'Bookings', value: '127', change: '+15.3%', trend: 'up', icon: Building2, color: 'purple' },
    { label: 'Revenue (₹Cr)', value: '45.6', change: '+22.1%', trend: 'up', icon: DollarSign, color: 'orange' },
    { label: 'Contact Rate', value: '73%', change: '+3.2%', trend: 'up', icon: Phone, color: 'cyan' },
    { label: 'Conversion Rate', value: '4.5%', change: '+0.8%', trend: 'up', icon: Target, color: 'pink' },
    { label: 'Avg Response Time', value: '8 min', change: '-15%', trend: 'up', icon: CheckCircle, color: 'indigo' },
    { label: 'CAC (₹)', value: '12,450', change: '-5.2%', trend: 'up', icon: TrendingUp, color: 'red' },
  ];

  const funnelData = [
    { stage: 'Leads', count: 2847, conversion: 100 },
    { stage: 'Contacted', count: 2078, conversion: 73 },
    { stage: 'Qualified', count: 1254, conversion: 44 },
    { stage: 'Site Visit', count: 486, conversion: 17 },
    { stage: 'Proposal', count: 247, conversion: 8.7 },
    { stage: 'Booking', count: 127, conversion: 4.5 },
  ];

  const monthlyTrend = [
    { month: 'Jul', leads: 380, visits: 65, bookings: 18, revenue: 6.2 },
    { month: 'Aug', leads: 420, visits: 72, bookings: 21, revenue: 7.8 },
    { month: 'Sep', leads: 450, visits: 78, bookings: 19, revenue: 6.9 },
    { month: 'Oct', leads: 485, visits: 85, bookings: 24, revenue: 8.5 },
    { month: 'Nov', leads: 512, visits: 91, bookings: 22, revenue: 8.1 },
    { month: 'Dec', leads: 600, visits: 95, bookings: 23, revenue: 8.1 },
  ];

  const sourceData = [
    { name: 'Digital Marketing', value: 1245, color: '#3b82f6' },
    { name: 'Channel Partners', value: 856, color: '#8b5cf6' },
    { name: 'Walk-In', value: 428, color: '#10b981' },
    { name: 'Referrals', value: 318, color: '#f59e0b' },
  ];

  const projectPerformance = [
    { project: 'Skyline Heights', leads: 845, visits: 156, bookings: 42, revenue: 15.2 },
    { project: 'Green Valley', leads: 623, visits: 118, bookings: 35, revenue: 12.8 },
    { project: 'Ocean View', leads: 756, visits: 142, bookings: 28, revenue: 10.5 },
    { project: 'Metro Plaza', leads: 623, visits: 70, bookings: 22, revenue: 7.1 },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-600' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-700', icon: 'text-pink-600' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600' },
      red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Management Dashboard</h2>
        <p className="text-gray-600">Consolidated Lead → Visit → Booking → Revenue Funnel</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const colors = getColorClasses(kpi.color);
          return (
            <div key={kpi.label} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{kpi.label}</p>
                  <p className="text-gray-900 mt-2">{kpi.value}</p>
                  <p className={`text-sm mt-1 ${colors.text}`}>{kpi.change} vs last month</p>
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Funnel Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Sales Funnel - Current Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500">Lead→Visit</div>
              <div className="text-gray-900">17%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Visit→Booking</div>
              <div className="text-gray-900">26.1%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Overall Conv.</div>
              <div className="text-gray-900">4.5%</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Lead Sources Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">6-Month Performance Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="leads" stroke="#3b82f6" name="Leads" strokeWidth={2} />
            <Line type="monotone" dataKey="visits" stroke="#10b981" name="Visits" strokeWidth={2} />
            <Line type="monotone" dataKey="bookings" stroke="#8b5cf6" name="Bookings" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Project Performance Table */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Project-wise Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Project</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Leads</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Site Visits</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Bookings</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Conversion %</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Revenue (₹Cr)</th>
              </tr>
            </thead>
            <tbody>
              {projectPerformance.map((project, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900">{project.project}</td>
                  <td className="text-right py-3 px-4 text-gray-600">{project.leads}</td>
                  <td className="text-right py-3 px-4 text-gray-600">{project.visits}</td>
                  <td className="text-right py-3 px-4 text-gray-600">{project.bookings}</td>
                  <td className="text-right py-3 px-4 text-gray-900">
                    {((project.bookings / project.leads) * 100).toFixed(1)}%
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900">{project.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead & Lag Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Lead Indicators (Predictive)</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">New Lead Velocity</span>
              <span className="text-green-600">+18% WoW</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Avg Response Time</span>
              <span className="text-green-600">8 min (Target: 10)</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Contact Rate</span>
              <span className="text-green-600">73% (Target: 70%)</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Visit Fix Rate</span>
              <span className="text-yellow-600">23% (Target: 25%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Proposal Rate</span>
              <span className="text-green-600">51% (Target: 48%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Lag Indicators (Outcome)</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Monthly Bookings</span>
              <span className="text-gray-900">127 units</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Total Revenue</span>
              <span className="text-gray-900">₹45.6 Cr</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Avg Deal Value</span>
              <span className="text-gray-900">₹35.9 L</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Customer Acquisition Cost</span>
              <span className="text-gray-900">₹12,450</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Marketing ROI</span>
              <span className="text-green-600">3.8x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
