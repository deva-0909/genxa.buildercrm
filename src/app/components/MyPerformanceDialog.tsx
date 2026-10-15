import { X, TrendingUp, Phone, Calendar, CheckCircle, Award } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MyPerformanceDialogProps {
  onClose: () => void;
}

export function MyPerformanceDialog({ onClose }: MyPerformanceDialogProps) {
  const weeklyData = [
    { day: 'Mon', calls: 42, connects: 31, visits: 4, conversion: 9.5 },
    { day: 'Tue', calls: 48, connects: 35, visits: 6, conversion: 12.5 },
    { day: 'Wed', calls: 45, connects: 33, visits: 5, conversion: 11.1 },
    { day: 'Thu', calls: 38, connects: 28, visits: 3, conversion: 7.9 },
    { day: 'Fri', calls: 51, connects: 38, visits: 7, conversion: 13.7 }
  ];

  const monthlyComparison = [
    { month: 'Nov', calls: 980, visits: 165, bookings: 12 },
    { month: 'Dec', calls: 1050, visits: 182, bookings: 15 },
    { month: 'Jan', calls: 945, visits: 175, bookings: 14 }
  ];

  const stats = [
    { label: 'Total Calls This Month', value: '945', change: '+8%', trend: 'up', icon: Phone, color: 'blue' },
    { label: 'Connect Rate', value: '73%', change: '+5%', trend: 'up', icon: CheckCircle, color: 'green' },
    { label: 'Site Visits Fixed', value: '175', change: '-4%', trend: 'down', icon: Calendar, color: 'purple' },
    { label: 'Visit Conversion', value: '24%', change: '+2%', trend: 'up', icon: TrendingUp, color: 'orange' }
  ];

  const achievements = [
    { title: 'Top Performer', description: 'Highest calls in Q4 2025', date: 'Dec 2025' },
    { title: 'Conversion Master', description: '25%+ visit conversion rate', date: 'Nov 2025' },
    { title: 'Consistency Award', description: '30 days target achievement', date: 'Oct 2025' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">My Performance Dashboard</h3>
            <p className="text-sm text-gray-600">Detailed analytics and achievements</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const bgColor = ({
                blue: 'bg-blue-50',
                green: 'bg-green-50',
                purple: 'bg-purple-50',
                orange: 'bg-orange-50'
              } as Record<string, string>)[stat.color];
              const iconColor = ({
                blue: 'text-blue-600',
                green: 'text-green-600',
                purple: 'text-purple-600',
                orange: 'text-orange-600'
              } as Record<string, string>)[stat.color];

              return (
                <div key={stat.label} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${bgColor}`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <span className={`text-xs ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-gray-900 mt-2">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Weekly Performance */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h4 className="text-gray-900 mb-4">This Week's Performance</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="calls" fill="#3b82f6" name="Calls Made" />
                <Bar dataKey="connects" fill="#10b981" name="Connected" />
                <Bar dataKey="visits" fill="#f59e0b" name="Visits Fixed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h4 className="text-gray-900 mb-4">3-Month Trend Analysis</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calls" stroke="#3b82f6" name="Total Calls" strokeWidth={2} />
                <Line type="monotone" dataKey="visits" stroke="#10b981" name="Site Visits" strokeWidth={2} />
                <Line type="monotone" dataKey="bookings" stroke="#f59e0b" name="Bookings" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Achievements */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-yellow-600" />
              <h4 className="text-gray-900">Recent Achievements</h4>
            </div>
            <div className="space-y-3">
              {achievements.map((achievement, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900">{achievement.title}</div>
                    <div className="text-sm text-gray-600">{achievement.description}</div>
                  </div>
                  <div className="text-xs text-gray-500">{achievement.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Avg Daily Calls</div>
              <div className="text-gray-900 mt-1">47 calls/day</div>
              <div className="text-xs text-gray-600 mt-1">Top 15% in team</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Best Connect Rate</div>
              <div className="text-gray-900 mt-1">78%</div>
              <div className="text-xs text-gray-600 mt-1">Achieved on Dec 15</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Team Ranking</div>
              <div className="text-gray-900 mt-1">#3 of 12</div>
              <div className="text-xs text-gray-600 mt-1">This month</div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
