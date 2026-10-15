import { useState } from 'react';
import { Search, Filter, User, Phone, Mail, MapPin, Calendar, Tag, Zap, Settings, RefreshCw } from 'lucide-react';
import { getDataStore, localDate } from '../lib/dataStore';
import { useLeadAssignment } from '../hooks/useLeadAssignment';
import { LeadDetailsDialog } from './LeadDetailsDialog';
import { AssignLeadDialog } from './AssignLeadDialog';
import { AdvancedFiltersDialog } from './AdvancedFiltersDialog';
import { BulkAssignDialog } from './BulkAssignDialog';

export function LeadPool() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignmentConfig, setShowAssignmentConfig] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [showAssignLead, setShowAssignLead] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [, setAdvancedFilters] = useState<any>({});
  const [, setRefreshKey] = useState(0);

  const dataStore = getDataStore();
  const persona = dataStore.getPersona();
  // Telecallers only see their own leads; managers see the whole pool
  const allLeads = dataStore.getLeads();
  const leads = persona.role === 'Telecaller'
    ? allLeads.filter(l => l.assignedTo === persona.name)
    : allLeads;
  const inactiveOwners = new Set(dataStore.getUsers().filter(u => u.status === 'Inactive').map(u => u.name));
  const todayStr = localDate();
  const isOverdue = (l: any) => !!l.nextFollowUp && l.nextFollowUp.slice(0, 10) < todayStr && l.status !== 'Dead';
  const mobileCounts = allLeads.reduce<Record<string, number>>((acc, l) => { acc[l.mobile] = (acc[l.mobile] || 0) + 1; return acc; }, {});
  const {
    isAssigning,
    autoAssignLeads,
    rebalanceLeads
  } = useLeadAssignment();

  const statusCounts = {
    all: leads.length,
    unassigned: leads.filter(l => !l.assignedTo).length,
    new: leads.filter(l => l.status === 'New').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    qualified: leads.filter(l => l.status === 'Qualified').length,
    followup: leads.filter(l => l.status === 'Follow-up').length,
  };

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === 'all'
      || (filterStatus === 'unassigned' ? !lead.assignedTo : lead.status.toLowerCase().replace('-', '') === filterStatus);
    const matchesSearch = searchQuery === '' ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.mobile.includes(searchQuery) ||
      lead.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Hot': return 'bg-red-100 text-red-700';
      case 'Warm': return 'bg-orange-100 text-orange-700';
      case 'Cold': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Contacted': return 'bg-green-100 text-green-700';
      case 'Qualified': return 'bg-purple-100 text-purple-700';
      case 'Follow-up': return 'bg-yellow-100 text-yellow-700';
      case 'Unassigned': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAutoAssign = async () => {
    await autoAssignLeads();
  };

  const handleRebalanceLeads = async () => {
    await rebalanceLeads();
  };

  const handleLeadDetails = (lead: any) => {
    setSelectedLead(lead);
    setShowLeadDetails(true);
  };

  const handleAssignLead = (lead: any) => {
    setSelectedLead(lead);
    setShowAssignLead(true);
  };

  const handleAdvancedFilters = () => {
    setShowAdvancedFilters(true);
  };

  const handleBulkAssign = () => {
    setShowBulkAssign(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Lead Pool Management</h2>
        <p className="text-gray-600">View and manage all leads with auto-assignment capabilities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <button
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterStatus === 'all' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">All Leads</div>
          <div className="text-gray-900 mt-1">{statusCounts.all}</div>
        </button>

        <button
          onClick={() => setFilterStatus('unassigned')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterStatus === 'unassigned' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">Unassigned</div>
          <div className="text-gray-900 mt-1">{statusCounts.unassigned}</div>
        </button>

        <button
          onClick={() => setFilterStatus('new')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterStatus === 'new' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">New</div>
          <div className="text-gray-900 mt-1">{statusCounts.new}</div>
        </button>

        <button
          onClick={() => setFilterStatus('contacted')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterStatus === 'contacted' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">Contacted</div>
          <div className="text-gray-900 mt-1">{statusCounts.contacted}</div>
        </button>

        <button
          onClick={() => setFilterStatus('qualified')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterStatus === 'qualified' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">Qualified</div>
          <div className="text-gray-900 mt-1">{statusCounts.qualified}</div>
        </button>

        <button
          onClick={() => setFilterStatus('followup')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterStatus === 'followup' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">Follow-up</div>
          <div className="text-gray-900 mt-1">{statusCounts.followup}</div>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, mobile, or Lead ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={handleAdvancedFilters}>
            <Filter className="w-4 h-4" />
            More Filters
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleAutoAssign}>
            {isAssigning ? (
              <div className="flex items-center">
                <Zap className="w-4 h-4 animate-spin" />
                Assigning...
              </div>
            ) : (
              'Auto-Assign'
            )}
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700" onClick={() => setShowAssignmentConfig(!showAssignmentConfig)}>
            <Settings className="w-4 h-4" />
            Config
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700" onClick={handleRebalanceLeads}>
            <RefreshCw className="w-4 h-4" />
            Rebalance
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700" onClick={handleBulkAssign}>
            <User className="w-4 h-4" />
            Bulk Assign
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Lead ID</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Contact</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Source</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Project</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Priority</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Assigned To</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Created</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-blue-600 hover:underline cursor-pointer">{lead.id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-900">{lead.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="w-3 h-3" />
                        {lead.mobile}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{lead.source}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {lead.project}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getPriorityColor(lead.priority)}`}>
                      <Tag className="w-3 h-3" />
                      {lead.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {lead.assignedTo || <span className="text-red-600">Not Assigned</span>}
                    {lead.assignedTo && inactiveOwners.has(lead.assignedTo) && (
                      <div className="text-xs text-red-600">Owner inactive – reassign</div>
                    )}
                    {isOverdue(lead) && <div className="text-xs text-orange-600">Follow-up overdue</div>}
                    {mobileCounts[lead.mobile] > 1 && <div className="text-xs text-purple-600">Duplicate mobile</div>}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(lead.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100" onClick={() => handleLeadDetails(lead)}>
                        View
                      </button>
                      {!lead.assignedTo && (
                        <button className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100" onClick={() => handleAssignLead(lead)}>
                          Assign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto-Assignment Rules Info */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Auto-Assignment Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-900 mb-1">Project-based Assignment</div>
            <p className="text-xs text-blue-700">Leads assigned based on telecaller's project specialization</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-900 mb-1">Load Balancing</div>
            <p className="text-xs text-green-700">Distributes leads evenly across available telecallers</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-900 mb-1">Source Routing</div>
            <p className="text-xs text-purple-700">Digital vs CP leads routed to specialized teams</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-sm text-orange-900 mb-1">Time-based Assignment</div>
            <p className="text-xs text-orange-700">Leads assigned during working hours only</p>
          </div>
        </div>
      </div>

      {/* Assignment Configuration */}
      {showAssignmentConfig && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Assignment Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-900 mb-1">Project-based Assignment</div>
              <p className="text-xs text-blue-700">Leads assigned based on telecaller's project specialization</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-900 mb-1">Load Balancing</div>
              <p className="text-xs text-green-700">Distributes leads evenly across available telecallers</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-900 mb-1">Source Routing</div>
              <p className="text-xs text-purple-700">Digital vs CP leads routed to specialized teams</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-900 mb-1">Time-based Assignment</div>
              <p className="text-xs text-orange-700">Leads assigned during working hours only</p>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Dialog */}
      {showLeadDetails && (
        <LeadDetailsDialog
          lead={selectedLead}
          onClose={() => setShowLeadDetails(false)}
        />
      )}

      {/* Assign Lead Dialog */}
      {showAssignLead && selectedLead && (
        <AssignLeadDialog
          lead={selectedLead}
          onClose={() => setShowAssignLead(false)}
          onSuccess={() => {
            setRefreshKey(prev => prev + 1);
            setShowAssignLead(false);
          }}
        />
      )}

      {/* Advanced Filters Dialog */}
      {showAdvancedFilters && (
        <AdvancedFiltersDialog
          onClose={() => setShowAdvancedFilters(false)}
          onApplyFilters={(filters: any) => {
            setAdvancedFilters(filters);
          }}
        />
      )}

      {/* Bulk Assign Dialog */}
      {showBulkAssign && (
        <BulkAssignDialog
          selectedLeads={filteredLeads.filter(l => !l.assignedTo).slice(0, 5)}
          onClose={() => setShowBulkAssign(false)}
          onSuccess={() => {
            setRefreshKey(prev => prev + 1);
            setShowBulkAssign(false);
          }}
        />
      )}
    </div>
  );
}
