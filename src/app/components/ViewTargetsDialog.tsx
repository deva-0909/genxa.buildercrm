import { X, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ViewTargetsDialogProps {
  onClose: () => void;
}

export function ViewTargetsDialog({ onClose }: ViewTargetsDialogProps) {
  const targets = [
    {
      metric: 'Daily Calls',
      target: 50,
      achieved: 45,
      unit: 'calls',
      trend: 'up',
      change: '+8%'
    },
    {
      metric: 'Connected Calls',
      target: 40,
      achieved: 33,
      unit: 'calls',
      trend: 'down',
      change: '-5%'
    },
    {
      metric: 'Site Visits Fixed',
      target: 8,
      achieved: 5,
      unit: 'visits',
      trend: 'up',
      change: '+12%'
    },
    {
      metric: 'Hot Leads',
      target: 10,
      achieved: 7,
      unit: 'leads',
      trend: 'stable',
      change: '0%'
    }
  ];

  const monthlyTargets = [
    { month: 'January', calls: 1100, visits: 180, conversions: 45, achieved: true },
    { month: 'February', calls: 1200, visits: 200, conversions: 50, achieved: false },
    { month: 'March', calls: 1150, visits: 190, conversions: 48, achieved: true }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">My Targets & Performance</h3>
            <p className="text-sm text-gray-600">Track your daily and monthly targets</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Daily Targets */}
          <div>
            <h4 className="text-gray-900 mb-4">Today's Targets</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {targets.map((item) => {
                const progress = Math.round((item.achieved / item.target) * 100);
                const isOnTrack = progress >= 80;

                return (
                  <div key={item.metric} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm text-gray-600">{item.metric}</div>
                        <div className="text-gray-900 mt-1">
                          {item.achieved} / {item.target} {item.unit}
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${
                        item.trend === 'up' ? 'text-green-600' :
                        item.trend === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {item.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                        {item.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                        {item.trend === 'stable' && <Minus className="w-3 h-3" />}
                        {item.change}
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${
                          isOnTrack ? 'bg-green-600' : 'bg-orange-600'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className={isOnTrack ? 'text-green-600' : 'text-orange-600'}>
                        {progress}% complete
                      </span>
                      <span className="text-gray-500">
                        {item.target - item.achieved} remaining
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Performance */}
          <div>
            <h4 className="text-gray-900 mb-4">Monthly Targets - Q1 2026</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Month</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-600">Calls Target</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-600">Visits Target</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-600">Conversions</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTargets.map((month) => (
                    <tr key={month.month} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{month.month}</td>
                      <td className="text-right py-3 px-4 text-gray-600">{month.calls}</td>
                      <td className="text-right py-3 px-4 text-gray-600">{month.visits}</td>
                      <td className="text-right py-3 px-4 text-gray-600">{month.conversions}</td>
                      <td className="text-center py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs ${
                          month.achieved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {month.achieved ? 'Achieved' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Card */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-gray-900">Overall Performance</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <div className="text-xs text-gray-600">This Week</div>
                <div className="text-gray-900 mt-1">224 calls</div>
                <div className="text-xs text-green-600">+8% vs last week</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">This Month</div>
                <div className="text-gray-900 mt-1">945 calls</div>
                <div className="text-xs text-green-600">On track</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Quarter Target</div>
                <div className="text-gray-900 mt-1">3450 calls</div>
                <div className="text-xs text-gray-600">27% complete</div>
              </div>
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
