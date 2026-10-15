import { Headphones, CheckCircle, Clock, AlertCircle, Plus, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  bookingId: string;
  customer: string;
  mobile: string;
  project: string;
  unit: string;
  category: string;
  issue: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo?: string;
  createdDate: string;
  resolvedDate?: string;
  resolution?: string;
}

export function PostSalesSupport() {
  const [activeTab, setActiveTab] = useState('open');

  const [tickets] = useState<SupportTicket[]>([
    { id: 'TKT001', bookingId: 'BK127', customer: 'Vikram Singh', mobile: '9876543214', project: 'Metro Plaza', unit: 'A-201', category: 'Maintenance', issue: 'Water leakage in bathroom', description: 'Water leaking from ceiling in master bathroom', priority: 'High', status: 'Open', createdDate: '2025-02-04', assignedTo: 'Maintenance Team' },
    { id: 'TKT002', bookingId: 'BK126', customer: 'Meera Iyer', mobile: '9876543217', project: 'Skyline Heights', unit: 'B-305', category: 'Electrical', issue: 'Power fluctuation', description: 'Frequent power fluctuations in the unit', priority: 'High', status: 'In Progress', createdDate: '2025-02-03', assignedTo: 'Electrical Team' },
    { id: 'TKT003', bookingId: 'BK125', customer: 'Rahul Sharma', mobile: '9876543218', project: 'Green Valley', unit: 'C-102', category: 'Plumbing', issue: 'Low water pressure', description: 'Water pressure is very low in kitchen and bathrooms', priority: 'Medium', status: 'In Progress', createdDate: '2025-02-02', assignedTo: 'Plumbing Team' },
    { id: 'TKT004', bookingId: 'BK124', customer: 'Anjali Desai', mobile: '9876543215', project: 'Skyline Heights', unit: 'A-405', category: 'Painting', issue: 'Paint peeling off', description: 'Paint is peeling off from bedroom walls', priority: 'Low', status: 'Resolved', createdDate: '2025-02-01', resolvedDate: '2025-02-03', assignedTo: 'Painting Team', resolution: 'Repainted the affected area' },
    { id: 'TKT005', bookingId: 'BK123', customer: 'Karan Mehta', mobile: '9876543216', project: 'Ocean View', unit: 'B-201', category: 'Documentation', issue: 'Missing society papers', description: "Haven't received society formation documents", priority: 'Medium', status: 'Closed', createdDate: '2025-01-28', resolvedDate: '2025-01-30', assignedTo: 'CRM Team', resolution: 'Documents sent via courier' },
  ]);

  const categories = [
    'Maintenance',
    'Plumbing',
    'Electrical',
    'Painting',
    'Carpentry',
    'Documentation',
    'Society Issues',
    'Amenities',
    'Parking',
    'Security',
    'Other',
  ];

  const stats = [
    { label: 'Open Tickets', value: tickets.filter(t => t.status === 'Open').length, icon: Clock, color: 'orange' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length, icon: Headphones, color: 'blue' },
    { label: 'Resolved Today', value: tickets.filter(t => t.status === 'Resolved').length, icon: CheckCircle, color: 'green' },
    { label: 'Avg Resolution Time', value: '2.5 days', icon: AlertCircle, color: 'purple' },
  ];

  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved');
  const closedTickets = tickets.filter(t => t.status === 'Closed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
    };
    return colors[color];
  };

  const handleAssignTicket = (_ticketId: string) => {
    toast.success('Ticket assigned to team');
  };

  const handleResolveTicket = (_ticketId: string) => {
    toast.success('Ticket marked as resolved');
  };

  const handleAddNote = (_ticketId: string) => {
    toast.success('Note added to ticket');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Post-Sales Support</h2>
          <p className="text-gray-600">Customer support and issue resolution</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Ticket
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

      {/* Issue Categories */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Common Issue Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((category, idx) => (
            <div key={idx} className="p-3 border border-gray-200 rounded-lg text-center hover:border-blue-300 transition-colors cursor-pointer">
              <Headphones className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xs text-gray-900">{category}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            {([
              ['open', `Open (${openTickets.length})`],
              ['resolved', `Resolved (${resolvedTickets.length})`],
              ['closed', `Closed (${closedTickets.length})`],
              ['all', `All (${tickets.length})`],
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
            {(activeTab === 'open' ? openTickets :
              activeTab === 'resolved' ? resolvedTickets :
              activeTab === 'closed' ? closedTickets :
              tickets).map((ticket) => (
              <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Headphones className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-900">{ticket.customer}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Ticket ID:</span>
                        <div className="text-gray-900">{ticket.id}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <div className="text-gray-900">{ticket.category}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Project:</span>
                        <div className="text-gray-900">{ticket.project}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Unit:</span>
                        <div className="text-gray-900">{ticket.unit}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <div className="text-gray-900">{new Date(ticket.createdDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm mt-2">
                      <div className="col-span-2">
                        <span className="text-gray-600">Issue:</span>
                        <div className="text-gray-900">{ticket.issue}</div>
                      </div>
                      {ticket.assignedTo && (
                        <div>
                          <span className="text-gray-600">Assigned To:</span>
                          <div className="text-gray-900">{ticket.assignedTo}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Mobile:</span>
                        <div className="text-gray-900">{ticket.mobile}</div>
                      </div>
                      {ticket.resolvedDate && (
                        <div>
                          <span className="text-gray-600">Resolved:</span>
                          <div className="text-gray-900">{new Date(ticket.resolvedDate).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                      <span className="text-gray-600">Description: </span>
                      <span className="text-gray-900">{ticket.description}</span>
                    </div>
                    {ticket.resolution && (
                      <div className="mt-2 text-sm bg-green-50 p-2 rounded">
                        <span className="text-green-600">Resolution: </span>
                        <span className="text-gray-900">{ticket.resolution}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {ticket.status === 'Open' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleAssignTicket(ticket.id)}>
                          Assign
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => toast.info('Opening ticket details...')}>
                          Process
                        </Button>
                      </>
                    )}
                    {ticket.status === 'In Progress' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleAddNote(ticket.id)}>
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Add Note
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleResolveTicket(ticket.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      </>
                    )}
                    {(ticket.status === 'Resolved' || ticket.status === 'Closed') && (
                      <Button size="sm" variant="outline" onClick={() => toast.info('Viewing ticket details...')}>
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20">
            <div className="text-center">
              <Headphones className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm">Call Customer</div>
            </div>
          </Button>
          <Button variant="outline" className="h-20">
            <div className="text-center">
              <MessageSquare className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm">Send Update</div>
            </div>
          </Button>
          <Button variant="outline" className="h-20">
            <div className="text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm">Schedule Visit</div>
            </div>
          </Button>
          <Button variant="outline" className="h-20">
            <div className="text-center">
              <AlertCircle className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm">Escalate Issue</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
