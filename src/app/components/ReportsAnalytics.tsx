import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export function ReportsAnalytics() {
  const [selectedReport, setSelectedReport] = useState('sales-funnel');
  const [dateRange, setDateRange] = useState('thisMonth');

  const salesFunnelData = [
    { stage: 'Leads', count: 2847, conversion: 100 },
    { stage: 'Contacted', count: 1856, conversion: 65.2 },
    { stage: 'Qualified', count: 945, conversion: 33.2 },
    { stage: 'Site Visit', count: 487, conversion: 17.1 },
    { stage: 'Proposal', count: 234, conversion: 8.2 },
    { stage: 'Booking', count: 127, conversion: 4.5 },
  ];

  const sourcePerformanceData = [
    { source: 'Facebook Ads', leads: 856, cost: 385200, bookings: 42, roi: 4.2 },
    { source: 'Google Ads', leads: 724, cost: 376480, bookings: 38, roi: 3.9 },
    { source: 'Housing.com', leads: 412, cost: 156560, bookings: 18, roi: 4.4 },
    { source: 'Channel Partners', leads: 345, cost: 0, bookings: 21, roi: 0 },
    { source: 'Walk-In', leads: 287, cost: 0, bookings: 8, roi: 0 },
  ];

  const projectWiseData = [
    { project: 'Skyline Heights', leads: 892, visits: 156, bookings: 48, revenue: 20.16 },
    { project: 'Green Valley', leads: 654, visits: 112, bookings: 35, revenue: 23.8 },
    { project: 'Ocean View', leads: 745, visits: 128, bookings: 28, revenue: 22.96 },
    { project: 'Metro Plaza', leads: 556, visits: 91, bookings: 16, revenue: 5.74 },
  ];

  const teamPerformanceData = [
    { name: 'Priya Sharma', leads: 124, visits: 48, bookings: 12, revenue: 4.32, target: 8, achievement: 150 },
    { name: 'Vikram Singh', leads: 118, visits: 42, bookings: 10, revenue: 3.85, target: 8, achievement: 125 },
    { name: 'Rajesh Kumar', leads: 156, visits: 52, bookings: 0, revenue: 0, target: 50, achievement: 104 },
    { name: 'Sneha Reddy', leads: 142, visits: 46, bookings: 0, revenue: 0, target: 50, achievement: 92 },
  ];

  const monthlyTrendData = [
    { month: 'Aug', leads: 412, visits: 68, bookings: 18, revenue: 6.48 },
    { month: 'Sep', leads: 456, visits: 74, bookings: 20, revenue: 7.2 },
    { month: 'Oct', leads: 487, visits: 82, bookings: 22, revenue: 7.92 },
    { month: 'Nov', leads: 524, visits: 89, bookings: 24, revenue: 8.64 },
    { month: 'Dec', leads: 568, visits: 96, bookings: 21, revenue: 7.56 },
    { month: 'Jan', leads: 624, visits: 105, bookings: 23, revenue: 8.28 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const reportTypes = [
    { id: 'sales-funnel', name: 'Sales Funnel Analysis', description: 'Conversion rates across stages' },
    { id: 'source-performance', name: 'Source Performance', description: 'Lead source effectiveness and ROI' },
    { id: 'project-wise', name: 'Project-wise Report', description: 'Performance by project' },
    { id: 'team-performance', name: 'Team Performance', description: 'Individual and team metrics' },
    { id: 'monthly-trend', name: 'Monthly Trends', description: 'Historical performance trends' },
  ];

  const handleExportReport = () => {
    toast.success('Exporting report to Excel...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive business intelligence and insights</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisQuarter">This Quarter</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Select Report Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-4 text-left rounded-lg border-2 transition-colors ${
                selectedReport === report.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="text-sm text-gray-900 mb-1">{report.name}</div>
              <div className="text-xs text-gray-600">{report.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Sales Funnel Report */}
      {selectedReport === 'sales-funnel' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-gray-900 mb-4">Sales Funnel Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesFunnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-gray-900 mb-4">Conversion Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Stage</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Count</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Conversion %</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Drop-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salesFunnelData.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 text-gray-900">{item.stage}</td>
                      <td className="px-6 py-4 text-gray-900">{item.count}</td>
                      <td className="px-6 py-4 text-gray-900">{item.conversion}%</td>
                      <td className="px-6 py-4 text-gray-600">
                        {idx > 0 ? `${(salesFunnelData[idx - 1].count - item.count)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Source Performance Report */}
      {selectedReport === 'source-performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-gray-900 mb-4">Lead Source Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourcePerformanceData}
                    dataKey="leads"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {sourcePerformanceData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-gray-900 mb-4">Source ROI Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourcePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="roi" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-gray-900 mb-4">Source Performance Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Source</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Leads</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Cost (₹)</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Conversion %</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sourcePerformanceData.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 text-gray-900">{item.source}</td>
                      <td className="px-6 py-4 text-gray-900">{item.leads}</td>
                      <td className="px-6 py-4 text-gray-900">₹{item.cost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-900">{item.bookings}</td>
                      <td className="px-6 py-4 text-gray-900">{((item.bookings / item.leads) * 100).toFixed(1)}%</td>
                      <td className="px-6 py-4 text-gray-900">{item.roi > 0 ? `${item.roi}x` : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Project-wise Report */}
      {selectedReport === 'project-wise' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-gray-900 mb-4">Project Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectWiseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="project" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
                <Bar dataKey="visits" fill="#10b981" name="Visits" />
                <Bar dataKey="bookings" fill="#f59e0b" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-gray-900 mb-4">Project Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Leads</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Visits</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Conversion %</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Revenue (₹Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projectWiseData.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 text-gray-900">{item.project}</td>
                      <td className="px-6 py-4 text-gray-900">{item.leads}</td>
                      <td className="px-6 py-4 text-gray-900">{item.visits}</td>
                      <td className="px-6 py-4 text-gray-900">{item.bookings}</td>
                      <td className="px-6 py-4 text-gray-900">{((item.bookings / item.leads) * 100).toFixed(1)}%</td>
                      <td className="px-6 py-4 text-gray-900">₹{item.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Team Performance Report */}
      {selectedReport === 'team-performance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-gray-900 mb-4">Team Achievement vs Target</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="achievement" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-gray-900 mb-4">Individual Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Leads</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Visits</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Revenue (₹Cr)</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Target</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase">Achievement %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teamPerformanceData.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-gray-900">{item.leads}</td>
                      <td className="px-6 py-4 text-gray-900">{item.visits}</td>
                      <td className="px-6 py-4 text-gray-900">{item.bookings}</td>
                      <td className="px-6 py-4 text-gray-900">₹{item.revenue}</td>
                      <td className="px-6 py-4 text-gray-900">{item.target}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.achievement >= 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.achievement}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Trend Report */}
      {selectedReport === 'monthly-trend' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-gray-900 mb-4">6-Month Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#3b82f6" name="Leads" />
                <Line type="monotone" dataKey="visits" stroke="#10b981" name="Visits" />
                <Line type="monotone" dataKey="bookings" stroke="#f59e0b" name="Bookings" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-gray-900 mb-4">Revenue Trend (₹Cr)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
