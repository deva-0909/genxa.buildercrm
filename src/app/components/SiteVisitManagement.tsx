import { Calendar, MapPin, User, Phone, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDataStore, SiteVisit, localDate } from '../lib/dataStore';
import { toastError } from '../lib/dataStore';
import { fmtDate, waLink } from '../lib/format';
import { ScheduleVisitDialog } from './ScheduleVisitDialog';
import { RescheduleVisitDialog } from './RescheduleVisitDialog';
import { LogVisitExecutionDialog } from './LogVisitExecutionDialog';
import { CreateBookingDialog } from './CreateBookingDialog';
import { toast } from 'sonner';

export function SiteVisitManagement() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    confirmed: 0,
    pending: 0,
    fixRate: '0%'
  });

  // Dialog states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [rescheduleVisit, setRescheduleVisit] = useState<SiteVisit | null>(null);
  const [completeVisit, setCompleteVisit] = useState<SiteVisit | null>(null);
  const [bookingVisit, setBookingVisit] = useState<SiteVisit | null>(null);

  const dataStore = getDataStore();

  const loadData = () => {
    const allVisits = dataStore.getVisits();
    setVisits([...allVisits]);

    const today = localDate();
    const todayVisits = allVisits.filter(v => v.date === today);
    const confirmed = allVisits.filter(v => v.status === 'Confirmed');
    const pending = allVisits.filter(v => v.status === 'Scheduled' && !v.confirmationSent);

    const completedCount = allVisits.filter(v => v.status === 'Completed').length;
    const total = allVisits.length;
    const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    setStats({
      today: todayVisits.length,
      confirmed: confirmed.length,
      pending: pending.length,
      fixRate: `${rate}%`
    });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const confirmText = (v: SiteVisit) => {
    const p = dataStore.getProjects().find(x => x.name === v.project);
    return `Hello ${v.customer}, your site visit to ${v.project}${p ? ` (${p.location})` : ''} is confirmed for ${fmtDate(v.date)} at ${v.time}. ${v.salesExec} will meet you.${p?.latitude ? ` Location: https://maps.google.com/?q=${p.latitude},${p.longitude}` : ''} - ${dataStore.setting('company_name', 'GENXA Developers')}`;
  };

  const handleConfirm = async (visit: SiteVisit) => {
    const msg = confirmText(visit);
    window.open(waLink(visit.mobile, msg), '_blank');
    try {
      await dataStore.patch('visits', visit.id, { status: 'Confirmed', confirmationSent: true });
      await dataStore.insert('notifications', { channel: 'WhatsApp', recipientName: visit.customer, recipientContact: visit.mobile, template: 'Visit Confirmation', message: msg, status: 'Sent', relatedType: 'visit', relatedId: visit.id, sentBy: dataStore.getPersona().name, sentAt: new Date().toISOString() });
      toast.success(`Visit ${visit.id} confirmed; WhatsApp opened for ${visit.customer}`);
    } catch (err) { toastError(err); }
    loadData();
  };

  const handleCancel = (visit: SiteVisit) => {
    if (window.confirm('Are you sure you want to cancel this visit?')) {
      dataStore.updateVisit(visit.id, {
        status: 'Cancelled',
        notes: (visit.notes || '') + '\nCancelled by user request.'
      });
      toast.success(`Visit ${visit.id} cancelled`);
      loadData();
    }
  };

  const handleSendConfirmations = async () => {
    const pending = visits.filter(v => (v.status === 'Scheduled' || v.status === 'Confirmed' || v.status === 'Tentative') && !v.confirmationSent && v.date >= localDate());
    if (pending.length === 0) {
      toast.info('No pending confirmations to send');
      return;
    }
    try {
      await dataStore.insertMany('notifications', pending.map(v => ({
        channel: 'WhatsApp', recipientName: v.customer, recipientContact: v.mobile, template: 'Visit Confirmation', message: confirmText(v),
        status: 'Queued', relatedType: 'visit', relatedId: v.id, sentBy: dataStore.getPersona().name, scheduledFor: localDate(),
      })));
      await Promise.all(pending.map(v => dataStore.patch('visits', v.id, { confirmationSent: true, status: 'Confirmed' })));
      toast.success(`${pending.length} confirmations queued. Send them from Notifications.`);
    } catch (err) { toastError(err); }
    loadData();
  };

  const upcomingVisits = visits.filter(v => ['Scheduled', 'Confirmed', 'Tentative'].includes(v.status));
  const completedVisits = visits.filter(v => ['Completed', 'No Show'].includes(v.status));
  const cancelledVisits = visits.filter(v => v.status === 'Cancelled');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-700';
      case 'Tentative': return 'bg-yellow-100 text-yellow-700';
      case 'Completed': return 'bg-blue-100 text-blue-700';
      case 'No Show': return 'bg-red-100 text-red-700';
      case 'Cancelled': return 'bg-gray-100 text-gray-700';
      case 'Scheduled': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'Very Interested': return 'bg-green-100 text-green-700';
      case 'Interested': return 'bg-blue-100 text-blue-700';
      case 'Not Interested': return 'bg-orange-100 text-orange-700';
      case 'Not Attended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Site Visit Management</h2>
        <p className="text-gray-600">Schedule, confirm, and track site visits</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
          <div className="text-sm text-gray-600">Today's Visits</div>
          <div className="text-gray-900 mt-1 text-xl font-semibold">{stats.today}</div>
        </div>
        <div className="p-4 rounded-lg border bg-green-50 border-green-200">
          <div className="text-sm text-gray-600">Confirmed</div>
          <div className="text-gray-900 mt-1 text-xl font-semibold">{stats.confirmed}</div>
        </div>
        <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
          <div className="text-sm text-gray-600">Pending Confirmation</div>
          <div className="text-gray-900 mt-1 text-xl font-semibold">{stats.pending}</div>
        </div>
        <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
          <div className="text-sm text-gray-600">Visit Fix Rate</div>
          <div className="text-gray-900 mt-1 text-xl font-semibold">{stats.fixRate}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Calendar className="w-4 h-4" />
            Schedule New Visit
          </button>
          <button
            onClick={handleSendConfirmations}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Phone className="w-4 h-4" />
            Send Confirmations
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'upcoming'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Upcoming Visits ({upcomingVisits.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed ({completedVisits.length})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'cancelled'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Cancelled ({cancelledVisits.length})
          </button>
        </div>
      </div>

      {/* Upcoming Visits */}
      {activeTab === 'upcoming' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Visit ID</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Contact</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Project</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Sales Exec</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-600">Confirmed</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingVisits.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No upcoming visits found. Schedule one using the button above.
                    </td>
                  </tr>
                )}
                {upcomingVisits.map((visit) => (
                  <tr key={visit.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="text-blue-600 hover:underline cursor-pointer">{visit.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-gray-900">{visit.customer}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="w-3 h-3" />
                        {visit.mobile}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {visit.project}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900">{visit.date}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {visit.time}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{visit.salesExec}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${getStatusColor(visit.status)}`}>
                        {visit.status}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      {visit.confirmationSent ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setCompleteVisit(visit)}
                          className="px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                          title="Log Visit Execution / Mark Complete"
                        >
                          Log/Complete
                        </button>
                        {!visit.confirmationSent && (
                          <button
                            onClick={() => handleConfirm(visit)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => setRescheduleVisit(visit)}
                          className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(visit)}
                          className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Completed Visits */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Visit ID</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Project</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Sales Exec</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Outcome</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Units Shown</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedVisits.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No completed visits found.
                    </td>
                  </tr>
                )}
                {completedVisits.map((visit) => (
                  <tr key={visit.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="text-blue-600 hover:underline cursor-pointer">{visit.id}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{visit.customer}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{visit.project}</td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900">{visit.date}</div>
                      <div className="text-xs text-gray-500">{visit.time}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{visit.salesExec}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${getStatusColor(visit.status)}`}>
                        {visit.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${getOutcomeColor(visit.outcome)}`}>
                        {visit.outcome || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{visit.unitsShown || '-'}</td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setBookingVisit(visit)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          title="Convert to Booking"
                        >
                          Book Now
                        </button>
                        <button
                          onClick={() => {
                            if (visit.notes) toast(visit.notes);
                            else toast.info('No additional notes');
                          }}
                          className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancelled Visits */}
      {activeTab === 'cancelled' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Visit ID</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Project</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Notes</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cancelledVisits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No cancelled visits found.
                    </td>
                  </tr>
                )}
                {cancelledVisits.map((visit) => (
                  <tr key={visit.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="text-gray-600">{visit.id}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{visit.customer}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{visit.project}</td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900">{visit.date}</div>
                      <div className="text-xs text-gray-500">{visit.time}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{visit.notes}</td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setRescheduleVisit(visit)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Reschedule
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {isScheduleOpen && (
        <ScheduleVisitDialog
          onClose={() => setIsScheduleOpen(false)}
          onSuccess={loadData}
        />
      )}

      {rescheduleVisit && (
        <RescheduleVisitDialog
          visit={rescheduleVisit}
          onClose={() => setRescheduleVisit(null)}
          onSuccess={loadData}
        />
      )}

      {completeVisit && (
        <LogVisitExecutionDialog
          visit={completeVisit}
          onClose={() => setCompleteVisit(null)}
          onSuccess={loadData}
        />
      )}

      {bookingVisit && (
        <CreateBookingDialog
          leadId={bookingVisit.leadId}
          customerName={bookingVisit.customer}
          customerMobile={bookingVisit.mobile}
          onClose={() => setBookingVisit(null)}
          onSuccess={() => {
            toast.success('Booking created from site visit!');
            loadData();
          }}
        />
      )}
    </div>
  );
}
