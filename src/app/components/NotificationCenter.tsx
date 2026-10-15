import { Bell, Mail, MessageSquare, Send, CheckCircle, Clock, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'SMS' | 'Email' | 'WhatsApp';
  recipient: string;
  template: string;
  message: string;
  status: 'Sent' | 'Pending' | 'Failed' | 'Scheduled';
  sentAt?: string;
  scheduledFor?: string;
  deliveryStatus?: 'Delivered' | 'Read' | 'Failed';
}

export function NotificationCenter() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const [notifications] = useState<Notification[]>([
    { id: 'N001', type: 'SMS', recipient: 'Vikram Singh (9876543214)', template: 'Site Visit Reminder', message: 'Reminder: Your site visit is scheduled for tomorrow at 11 AM...', status: 'Sent', sentAt: '2025-02-04 10:30', deliveryStatus: 'Delivered' },
    { id: 'N002', type: 'WhatsApp', recipient: 'Meera Iyer (9876543217)', template: 'Payment Due', message: 'Dear Meera, Your payment of ₹16L is due on 5th Feb...', status: 'Sent', sentAt: '2025-02-04 09:15', deliveryStatus: 'Read' },
    { id: 'N003', type: 'Email', recipient: 'rahul.sharma@email.com', template: 'Agreement Ready', message: 'Your sale agreement is ready for signature...', status: 'Sent', sentAt: '2025-02-04 08:00', deliveryStatus: 'Delivered' },
    { id: 'N004', type: 'SMS', recipient: 'Anjali Desai (9876543215)', template: 'Possession Schedule', message: 'Your possession is scheduled for 15th Feb 2025...', status: 'Scheduled', scheduledFor: '2025-02-10 10:00' },
    { id: 'N005', type: 'WhatsApp', recipient: 'Karan Mehta (9876543216)', template: 'Follow-up', message: 'Thank you for visiting our site. We have exciting offers...', status: 'Failed', sentAt: '2025-02-03 16:45', deliveryStatus: 'Failed' },
  ]);

  const templates = [
    { name: 'Site Visit Reminder', type: 'SMS', category: 'Visit' },
    { name: 'Payment Due', type: 'WhatsApp', category: 'Payment' },
    { name: 'Agreement Ready', type: 'Email', category: 'Agreement' },
    { name: 'Possession Schedule', type: 'SMS', category: 'Possession' },
    { name: 'Follow-up', type: 'WhatsApp', category: 'Follow-up' },
    { name: 'Welcome Email', type: 'Email', category: 'Onboarding' },
    { name: 'Birthday Wishes', type: 'WhatsApp', category: 'Engagement' },
    { name: 'Payment Confirmation', type: 'SMS', category: 'Payment' },
  ];

  const stats = [
    { label: 'Sent Today', value: notifications.filter(n => n.status === 'Sent').length, icon: Send, color: 'green' },
    { label: 'Scheduled', value: notifications.filter(n => n.status === 'Scheduled').length, icon: Clock, color: 'blue' },
    { label: 'Failed', value: notifications.filter(n => n.status === 'Failed').length, icon: Bell, color: 'red' },
    { label: 'Delivery Rate', value: '94.2%', icon: CheckCircle, color: 'purple' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      case 'Scheduled': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SMS': return MessageSquare;
      case 'Email': return Mail;
      case 'WhatsApp': return MessageSquare;
      default: return Bell;
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
    };
    return colors[color];
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesTab = activeTab === 'all' || n.status === activeTab;
    const matchesType = selectedType === 'all' || n.type === selectedType;
    return matchesTab && matchesType;
  });

  const handleSendNotification = () => {
    toast.success('Opening notification composer...');
  };

  const handleRetry = (_notificationId: string) => {
    toast.success('Retrying notification send...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Notification Center</h2>
          <p className="text-gray-600">Manage SMS, Email, and WhatsApp communications</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSendNotification}>
          <Plus className="w-4 h-4 mr-2" />
          Send Notification
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

      {/* Message Templates */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Message Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {templates.map((template, idx) => {
            const Icon = getTypeIcon(template.type);
            return (
              <div key={idx} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-900">{template.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{template.type}</span>
                  <span className="text-xs text-gray-500">{template.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex gap-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="SMS">SMS</option>
            <option value="Email">Email</option>
            <option value="WhatsApp">WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Tabs and Notifications */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            {([
              ['all', `All (${notifications.length})`],
              ['Sent', `Sent (${notifications.filter(n => n.status === 'Sent').length})`],
              ['Scheduled', `Scheduled (${notifications.filter(n => n.status === 'Scheduled').length})`],
              ['Failed', `Failed (${notifications.filter(n => n.status === 'Failed').length})`],
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
            {filteredNotifications.map((notification) => {
              const TypeIcon = getTypeIcon(notification.type);

              return (
                <div key={notification.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <TypeIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-900">{notification.recipient}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(notification.status)}`}>
                          {notification.status}
                        </span>
                        {notification.deliveryStatus && (
                          <span className="text-xs text-gray-600">• {notification.deliveryStatus}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <div className="text-gray-900">{notification.type}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Template:</span>
                          <div className="text-gray-900">{notification.template}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">
                            {notification.status === 'Scheduled' ? 'Scheduled For:' : 'Sent At:'}
                          </span>
                          <div className="text-gray-900">
                            {notification.status === 'Scheduled' ? notification.scheduledFor : notification.sentAt}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {notification.message}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {notification.status === 'Failed' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleRetry(notification.id)}>
                          Retry
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => toast.info('Viewing full notification...')}>
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bulk Send Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Bulk Communication</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-sm text-gray-900 mb-1">Bulk SMS</div>
            <div className="text-xs text-gray-600 mb-3">Send to multiple customers</div>
            <Button size="sm" variant="outline" className="w-full">
              Send Bulk SMS
            </Button>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-sm text-gray-900 mb-1">Email Campaign</div>
            <div className="text-xs text-gray-600 mb-3">Send promotional emails</div>
            <Button size="sm" variant="outline" className="w-full">
              Create Campaign
            </Button>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm text-gray-900 mb-1">WhatsApp Broadcast</div>
            <div className="text-xs text-gray-600 mb-3">Broadcast to groups</div>
            <Button size="sm" variant="outline" className="w-full">
              Send Broadcast
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
