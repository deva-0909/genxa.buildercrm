import { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface AdvancedFiltersDialogProps {
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

export function AdvancedFiltersDialog({ onClose, onApplyFilters }: AdvancedFiltersDialogProps) {
  const [filters, setFilters] = useState({
    source: '',
    project: '',
    priority: '',
    status: '',
    assignedTo: '',
    dateFrom: '',
    dateTo: '',
    budgetMin: '',
    budgetMax: '',
    callAttempts: '',
    hasFollowUp: ''
  });

  const handleApply = () => {
    onApplyFilters(filters);
    toast.success('Filters applied successfully');
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      source: '',
      project: '',
      priority: '',
      status: '',
      assignedTo: '',
      dateFrom: '',
      dateTo: '',
      budgetMin: '',
      budgetMax: '',
      callAttempts: '',
      hasFollowUp: ''
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
    toast.info('Filters reset');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="text-gray-900">Advanced Filters</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lead Attributes */}
          <div>
            <h4 className="text-sm text-gray-700 mb-3">Lead Attributes</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Source</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={filters.source}
                  onChange={(e) => setFilters({...filters, source: e.target.value})}
                >
                  <option value="">All Sources</option>
                  <option value="Facebook Ads">Facebook Ads</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="MagicBricks">MagicBricks</option>
                  <option value="99acres">99acres</option>
                  <option value="Channel Partner">Channel Partner</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Referral">Referral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Project</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={filters.project}
                  onChange={(e) => setFilters({...filters, project: e.target.value})}
                >
                  <option value="">All Projects</option>
                  <option value="Skyline Towers">Skyline Towers</option>
                  <option value="Green Valley">Green Valley</option>
                  <option value="Marina Heights">Marina Heights</option>
                  <option value="Palm Residency">Palm Residency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                >
                  <option value="">All Priorities</option>
                  <option value="Hot">Hot - Very Interested</option>
                  <option value="Warm">Warm - Maybe</option>
                  <option value="Cold">Cold - Not Interested</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Status</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Visit Scheduled">Visit Scheduled</option>
                  <option value="Dead">Dead</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Assigned To</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={filters.assignedTo}
                  onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
                >
                  <option value="">All Telecallers</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="Rajesh Kumar">Rajesh Kumar</option>
                  <option value="Sneha Reddy">Sneha Reddy</option>
                  <option value="Amit Sharma">Amit Sharma</option>
                  <option value="Priya Singh">Priya Singh</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Call Attempts</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={filters.callAttempts}
                  onChange={(e) => setFilters({...filters, callAttempts: e.target.value})}
                >
                  <option value="">Any</option>
                  <option value="0">Never Called</option>
                  <option value="1-3">1-3 attempts</option>
                  <option value="4-6">4-6 attempts</option>
                  <option value="7+">7+ attempts</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h4 className="text-sm text-gray-700 mb-3">Date Range</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">From Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">To Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <h4 className="text-sm text-gray-700 mb-3">Budget Range (₹ Lakhs)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Minimum Budget</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={filters.budgetMin}
                  onChange={(e) => setFilters({...filters, budgetMin: e.target.value})}
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Maximum Budget</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={filters.budgetMax}
                  onChange={(e) => setFilters({...filters, budgetMax: e.target.value})}
                  placeholder="e.g., 100"
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <h4 className="text-sm text-gray-700 mb-3">Additional Options</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={filters.hasFollowUp === 'yes'}
                  onChange={(e) => setFilters({...filters, hasFollowUp: e.target.checked ? 'yes' : ''})}
                />
                <span className="text-sm text-gray-700">Has Follow-up Scheduled</span>
              </label>
            </div>
          </div>

          {/* Active Filters Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-900 mb-2">Active Filters</div>
            <div className="text-xs text-blue-700">
              {Object.values(filters).filter(v => v !== '').length || 'No'} filter(s) active
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
