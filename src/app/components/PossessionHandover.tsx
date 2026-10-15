import { Key, CheckCircle, Clock, AlertCircle, FileText, Camera, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface Possession {
  id: string;
  bookingId: string;
  customer: string;
  mobile: string;
  project: string;
  unit: string;
  unitType: string;
  status: 'Scheduled' | 'Inspection Done' | 'Completed' | 'Delayed';
  scheduledDate: string;
  completedDate?: string;
  inspectionNotes?: string;
  snagsCount?: number;
  occupancyCertificate: boolean;
  completionCertificate: boolean;
  handedOver: boolean;
}

export function PossessionHandover() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const [possessions] = useState<Possession[]>([
    { id: 'PSN001', bookingId: 'BK127', customer: 'Vikram Singh', mobile: '9876543214', project: 'Metro Plaza', unit: 'A-201', unitType: '2 BHK', status: 'Scheduled', scheduledDate: '2025-02-15', occupancyCertificate: true, completionCertificate: true, handedOver: false },
    { id: 'PSN002', bookingId: 'BK126', customer: 'Meera Iyer', mobile: '9876543217', project: 'Skyline Heights', unit: 'B-305', unitType: '2 BHK', status: 'Inspection Done', scheduledDate: '2025-02-08', inspectionNotes: 'Minor painting issues in bedroom', snagsCount: 3, occupancyCertificate: true, completionCertificate: true, handedOver: false },
    { id: 'PSN003', bookingId: 'BK125', customer: 'Rahul Sharma', mobile: '9876543218', project: 'Green Valley', unit: 'C-102', unitType: '3 BHK', status: 'Completed', scheduledDate: '2025-02-01', completedDate: '2025-02-01', occupancyCertificate: true, completionCertificate: true, handedOver: true },
    { id: 'PSN004', bookingId: 'BK124', customer: 'Anjali Desai', mobile: '9876543215', project: 'Skyline Heights', unit: 'A-405', unitType: '2 BHK', status: 'Completed', scheduledDate: '2025-01-28', completedDate: '2025-01-28', occupancyCertificate: true, completionCertificate: true, handedOver: true },
    { id: 'PSN005', bookingId: 'BK123', customer: 'Karan Mehta', mobile: '9876543216', project: 'Ocean View', unit: 'B-201', unitType: '2 BHK', status: 'Delayed', scheduledDate: '2025-01-25', snagsCount: 8, occupancyCertificate: true, completionCertificate: false, handedOver: false },
  ]);

  const stats = [
    { label: 'Upcoming Handovers', value: possessions.filter(p => p.status === 'Scheduled').length, icon: Clock, color: 'blue' },
    { label: 'Inspection Pending', value: possessions.filter(p => p.status === 'Inspection Done').length, icon: AlertCircle, color: 'orange' },
    { label: 'Completed MTD', value: possessions.filter(p => p.status === 'Completed').length, icon: CheckCircle, color: 'green' },
    { label: 'Delayed', value: possessions.filter(p => p.status === 'Delayed').length, icon: AlertCircle, color: 'red' },
  ];

  const upcomingPossessions = possessions.filter(p => p.status === 'Scheduled' || p.status === 'Inspection Done');
  const completedPossessions = possessions.filter(p => p.status === 'Completed');
  const delayedPossessions = possessions.filter(p => p.status === 'Delayed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-700';
      case 'Inspection Done': return 'bg-yellow-100 text-yellow-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Delayed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
    };
    return colors[color];
  };

  const handleScheduleInspection = (_possessionId: string) => {
    toast.success('Pre-possession inspection scheduled');
  };

  const handleCompleteHandover = (_possessionId: string) => {
    toast.success('Possession handover completed successfully');
  };

  const handleUploadPhotos = (_possessionId: string) => {
    toast.success('Photo upload initiated');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Possession & Handover</h2>
          <p className="text-gray-600">Manage final possession and key handover</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Possession
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

      {/* Handover Checklist */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Handover Checklist</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'Occupancy Certificate',
            'Completion Certificate',
            'Building Plan Approval',
            'Society Formation',
            'Electricity Connection',
            'Water Connection',
            'Gas Connection',
            'Final Payment Cleared'
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            {([
              ['upcoming', `Upcoming (${upcomingPossessions.length})`],
              ['completed', `Completed (${completedPossessions.length})`],
              ['delayed', `Delayed (${delayedPossessions.length})`],
              ['all', `All (${possessions.length})`],
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
            {(activeTab === 'upcoming' ? upcomingPossessions :
              activeTab === 'completed' ? completedPossessions :
              activeTab === 'delayed' ? delayedPossessions :
              possessions).map((possession) => (
              <div key={possession.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-900">{possession.customer}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(possession.status)}`}>
                        {possession.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Booking ID:</span>
                        <div className="text-gray-900">{possession.bookingId}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Project:</span>
                        <div className="text-gray-900">{possession.project}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Unit:</span>
                        <div className="text-gray-900">{possession.unit}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <div className="text-gray-900">{possession.unitType}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Scheduled:</span>
                        <div className="text-gray-900">{new Date(possession.scheduledDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-gray-600">OC:</span>
                        <div className={possession.occupancyCertificate ? 'text-green-600' : 'text-red-600'}>
                          {possession.occupancyCertificate ? '✓ Yes' : '✗ No'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">CC:</span>
                        <div className={possession.completionCertificate ? 'text-green-600' : 'text-red-600'}>
                          {possession.completionCertificate ? '✓ Yes' : '✗ No'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Snags:</span>
                        <div className="text-gray-900">{possession.snagsCount || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Mobile:</span>
                        <div className="text-gray-900">{possession.mobile}</div>
                      </div>
                      {possession.status === 'Completed' && (
                        <div>
                          <span className="text-gray-600">Completed:</span>
                          <div className="text-gray-900">{possession.completedDate ? new Date(possession.completedDate).toLocaleDateString() : '-'}</div>
                        </div>
                      )}
                    </div>
                    {possession.inspectionNotes && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Notes: </span>
                        <span className="text-gray-900">{possession.inspectionNotes}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {possession.status === 'Scheduled' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleScheduleInspection(possession.id)}>
                          <FileText className="w-4 h-4 mr-1" />
                          Inspect
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleUploadPhotos(possession.id)}>
                          <Camera className="w-4 h-4 mr-1" />
                          Photos
                        </Button>
                      </>
                    )}
                    {possession.status === 'Inspection Done' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleCompleteHandover(possession.id)}>
                        <Key className="w-4 h-4 mr-1" />
                        Handover Keys
                      </Button>
                    )}
                    {possession.status === 'Completed' && (
                      <Button size="sm" variant="outline" onClick={() => toast.info('Viewing handover details...')}>
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
    </div>
  );
}
