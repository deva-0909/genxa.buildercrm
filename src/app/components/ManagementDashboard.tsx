import { TrendingUp, Users, Calendar, Building2, DollarSign, Phone, CheckCircle, Target } from 'lucide-react';
import { getDataStore, localDate } from '../lib/dataStore';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ManagementDashboard() {
  const store = getDataStore();
  const leads = store.getLeads();
  const visits = store.getVisits();
  const bookings = store.getBookings();
  const sources = store.getSources();

  const pct = (n: number, d: number) => (d ? (n / d) * 100 : 0);
  const contactedCount = leads.filter(l => (l.callAttempts || 0) > 0 || l.status !== 'New').length;
  const qualifiedCount = leads.filter(l => ['Qualified', 'Visit Scheduled'].includes(l.status)).length + bookings.length;
  const visitLeadIds = new Set(visits.filter(v => v.status !== 'Cancelled').map(v => v.leadId));
  const completedVisits = visits.filter(v => v.status === 'Completed').length;
  const revenue = bookings.reduce((s, b) => s + (b.price - b.discount), 0);
  const marketingSpend = leads.reduce((s, l) => s + (sources.find(src => src.name === l.source)?.costPerLead || 0), 0);
  const unassigned = leads.filter(l => !l.assignedTo).length;
  const todayStr = localDate();
  const overdue = leads.filter(l => l.nextFollowUp && l.nextFollowUp.slice(0, 10) < todayStr && l.status !== 'Dead').length;

  const kpiCards = [
    { label: 'Total Leads', value: leads.length.toLocaleString('en-IN'), change: `${unassigned} unassigned`, trend: 'up', icon: Users, color: 'blue' },
    { label: 'Site Visits', value: String(visits.length), change: `${completedVisits} completed`, trend: 'up', icon: Calendar, color: 'green' },
    { label: 'Bookings', value: String(bookings.length), change: `${pct(bookings.length, completedVisits).toFixed(0)}% of completed visits`, trend: 'up', icon: Building2, color: 'purple' },
    { label: 'Revenue (₹Cr)', value: (revenue / 10000000).toFixed(2), change: `Avg ₹${bookings.length ? (revenue / bookings.length / 100000).toFixed(1) : 0}L / booking`, trend: 'up', icon: DollarSign, color: 'orange' },
    { label: 'Contact Rate', value: `${pct(contactedCount, leads.length).toFixed(0)}%`, change: 'Leads called at least once', trend: 'up', icon: Phone, color: 'cyan' },
    { label: 'Conversion Rate', value: `${pct(bookings.length, leads.length).toFixed(1)}%`, change: 'Lead → booking', trend: 'up', icon: Target, color: 'pink' },
    { label: 'Overdue Follow-ups', value: String(overdue), change: 'Past promised call-back', trend: 'up', icon: CheckCircle, color: 'indigo' },
    { label: 'CAC (₹)', value: bookings.length ? Math.round(marketingSpend / bookings.length).toLocaleString('en-IN') : '—', change: `Spend ₹${(marketingSpend / 1000).toFixed(1)}k on paid leads`, trend: 'up', icon: TrendingUp, color: 'red' },
  ];

  const funnelData = [
    { stage: 'Leads', count: leads.length },
    { stage: 'Contacted', count: contactedCount },
    { stage: 'Qualified', count: qualifiedCount },
    { stage: 'Site Visit', count: visitLeadIds.size },
    { stage: 'Visit Done', count: completedVisits },
    { stage: 'Booking', count: bookings.length },
  ];

  const monthlyTrend = [
    { month: 'Jul', leads: 380, visits: 65, bookings: 18, revenue: 6.2 },
    { month: 'Aug', leads: 420, visits: 72, bookings: 21, revenue: 7.8 },
    { month: 'Sep', leads: 450, visits: 78, bookings: 19, revenue: 6.9 },
    { month: 'Oct', leads: 485, visits: 85, bookings: 24, revenue: 8.5 },
    { month: 'Nov', leads: 512, visits: 91, bookings: 22, revenue: 8.1 },
    { month: 'Dec', leads: 600, visits: 95, bookings: 23, revenue: 8.1 },
  ];

  const sourceGroup = (src: string) =>
    /^CP\d|channel/i.test(src) ? 'Channel Partners'
      : /walk/i.test(src) ? 'Walk-In'
      : /housing|magic|99acres/i.test(src) ? 'Portals'
      : /ads|google|facebook/i.test(src) ? 'Digital Marketing'
      : 'Other';
  const sourceColors: Record<string, string> = {
    'Digital Marketing': '#3b82f6', 'Channel Partners': '#8b5cf6', 'Walk-In': '#10b981', 'Portals': '#f59e0b', 'Other': '#94a3b8',
  };
  const sourceData = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => { const g = sourceGroup(l.source || ''); acc[g] = (acc[g] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value, color: sourceColors[name] }));

  const projectPerformance = store.getProjects().map(p => {
    const pb = bookings.filter(b => b.project === p.name);
    return {
      project: p.name,
      leads: leads.filter(l => l.project === p.name).length,
      visits: visits.filter(v => v.project === p.name).length,
      bookings: pb.length,
      revenue: +(pb.reduce((s, b) => s + (b.price - b.discount), 0) / 10000000).toFixed(2),
    };
  });

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
                  <p className={`text-sm mt-1 ${colors.text}`}>{kpi.change}</p>
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
          <h3 className="text-gray-900 mb-4">Sales Funnel - Live</h3>
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
              <div className="text-gray-900">{pct(visitLeadIds.size, leads.length).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Visit→Booking</div>
              <div className="text-gray-900">{pct(bookings.length, completedVisits).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Overall Conv.</div>
              <div className="text-gray-900">{pct(bookings.length, leads.length).toFixed(1)}%</div>
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
        <h3 className="text-gray-900 mb-4">6-Month Performance Trends <span className="text-xs text-gray-400">(sample data)</span></h3>
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
                    {pct(project.bookings, project.leads).toFixed(1)}%
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
          <h3 className="text-gray-900 mb-4">Lead Indicators (Predictive) <span className="text-xs text-gray-400">(sample data)</span></h3>
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
          <h3 className="text-gray-900 mb-4">Lag Indicators (Outcome) <span className="text-xs text-gray-400">(sample data)</span></h3>
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
