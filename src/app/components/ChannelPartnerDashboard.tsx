import { Briefcase, Users, TrendingUp, DollarSign, Phone, Mail, MapPin, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { getDataStore, localDate } from '../lib/dataStore';
import { OnboardCPDialog } from './OnboardCPDialog';
import { CPProfileDialog } from './CPProfileDialog';
import { ProcessCommissionDialog } from './ProcessCommissionDialog';
import { toast } from 'sonner';

export function ChannelPartnerDashboard() {
  const [showOnboardDialog, setShowOnboardDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showCommissionDialog, setShowCommissionDialog] = useState(false);
  const [selectedCP, setSelectedCP] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setRefreshKey] = useState(0);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    location: '',
    reraNumber: '',
    commissionRate: '',
    commissionType: 'Percentage of Deal Value',
    paymentTerms: 'On Booking',
    bankDetails: '',
    remarks: ''
  });

  const dataStore = getDataStore();
  const allLeads = dataStore.getLeads();
  const allBookings = dataStore.getBookings();

  // Channel partners come from the database; performance is derived from leads and bookings
  const channelPartners = dataStore.getChannelPartners().map(cp => {
    const cpLeads = allLeads.filter(l => (l.source || '').includes(cp.id) || (l.source || '').includes(cp.companyName));
    const cpLeadIds = new Set(cpLeads.map(l => l.id));
    const cpBookings = allBookings.filter(b => cpLeadIds.has(b.leadId));
    const bookingValue = cpBookings.reduce((sum, b) => sum + (b.price - b.discount), 0);
    return {
      id: cp.id,
      name: cp.companyName,
      contact: cp.contactPerson,
      mobile: cp.mobile,
      email: cp.email,
      location: cp.location,
      status: cp.status,
      rating: cp.rating,
      leadsProvided: cpLeads.length,
      visits: cpLeads.filter(l => l.status === 'Visit Scheduled').length,
      bookings: cpBookings.length,
      commission: Math.round(bookingValue * (cp.commissionRate || 0) / 100),
    };
  }).filter(cp =>
    searchTerm === '' ||
    cp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cp.contact || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    cp.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProfile = (cp: any) => {
    setSelectedCP(cp);
    setShowProfileDialog(true);
  };

  const handlePayCommission = (cp: any) => {
    setSelectedCP(cp);
    setShowCommissionDialog(true);
  };

  const handleProcessCommissions = () => {
    toast.info('Opening bulk commission processing...');
  };

  const handlePerformanceReport = () => {
    toast.success('Generating performance report...');
  };

  const handleOnboardCP = () => {
    setShowOnboardDialog(true);
  };

  const handleClearForm = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      mobile: '',
      email: '',
      location: '',
      reraNumber: '',
      commissionRate: '',
      commissionType: 'Percentage of Deal Value',
      paymentTerms: 'On Booking',
      bankDetails: '',
      remarks: ''
    });
    toast.info('Form cleared');
  };

  const handleSubmitInlineForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.contactPerson || !formData.mobile || !formData.email) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    const cp = dataStore.addChannelPartner({
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      mobile: formData.mobile,
      email: formData.email,
      location: formData.location,
      reraNumber: formData.reraNumber,
      commissionRate: parseFloat(formData.commissionRate) || 2,
      commissionType: formData.commissionType,
      paymentTerms: formData.paymentTerms,
      bankDetails: formData.bankDetails,
      remarks: formData.remarks,
      status: 'Active',
      rating: 0,
      onboardedDate: localDate()
    });

    toast.success(`Channel Partner ${cp.id} onboarded successfully!`);
    handleClearForm();
    setRefreshKey(prev => prev + 1);
  };

  const handleDialogSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const totalCommission = channelPartners.reduce((sum, cp) => sum + cp.commission, 0);

  const stats = [
    { label: 'Total CPs', value: channelPartners.length, icon: Briefcase, color: 'blue' },
    { label: 'Leads MTD', value: channelPartners.reduce((sum, cp) => sum + cp.leadsProvided, 0), icon: Users, color: 'green' },
    { label: 'CP Bookings', value: channelPartners.reduce((sum, cp) => sum + cp.bookings, 0), icon: TrendingUp, color: 'purple' },
    { label: 'Commission Due (₹L)', value: (totalCommission / 100000).toFixed(1), icon: DollarSign, color: 'orange' },
  ];

  const cpPerformance = channelPartners.map(cp => ({
    cp: cp.name,
    leads: cp.leadsProvided,
    visits: cp.visits,
    bookings: cp.bookings,
  }));

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
    };
    return colors[color];
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Channel Partner Dashboard</h2>
        <p className="text-gray-600">Manage CP relationships, track performance, and commission</p>
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

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleOnboardCP}>
            <Briefcase className="w-4 h-4" />
            Onboard New CP
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={handleProcessCommissions}>
            <DollarSign className="w-4 h-4" />
            Process Commissions
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={handlePerformanceReport}>
            <TrendingUp className="w-4 h-4" />
            Performance Report
          </button>
        </div>
      </div>

      {/* CP Performance Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Channel Partner Performance - This Month</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={cpPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cp" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
            <Bar dataKey="visits" fill="#10b981" name="Visits" />
            <Bar dataKey="bookings" fill="#f59e0b" name="Bookings" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Channel Partners List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900">Channel Partners Directory</h3>
            <p className="text-sm text-gray-600">Complete list with performance metrics</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search CPs..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm text-gray-600">CP ID</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Company Name</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Contact Person</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Contact Details</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Location</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Rating</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Leads</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Visits</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Bookings</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Commission (₹)</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {channelPartners.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-gray-500">No channel partners found.</td>
                </tr>
              )}
              {channelPartners.map((cp) => {
                const conversion = cp.leadsProvided > 0 ? ((cp.bookings / cp.leadsProvided) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={cp.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="text-blue-600 hover:underline cursor-pointer">{cp.id}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{cp.name}</td>
                    <td className="py-4 px-4 text-gray-900">{cp.contact}</td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          {cp.mobile}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          {cp.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {cp.location}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`flex items-center gap-1 ${getRatingColor(cp.rating)}`}>
                        <Star className="w-4 h-4 fill-current" />
                        <span>{cp.rating}</span>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4 text-gray-900">{cp.leadsProvided}</td>
                    <td className="text-right py-4 px-4 text-gray-600">{cp.visits}</td>
                    <td className="text-right py-4 px-4 text-gray-900">{cp.bookings}</td>
                    <td className="text-right py-4 px-4">
                      <div className="text-green-600">₹{(cp.commission / 1000).toFixed(0)}k</div>
                      <div className="text-xs text-gray-500">{conversion}% conv.</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        cp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {cp.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        <button className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100" onClick={() => handleViewProfile(cp)}>
                          View Profile
                        </button>
                        <button className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100" onClick={() => handlePayCommission(cp)}>
                          Pay Commission
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard New CP Form */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Onboard New Channel Partner</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Company Name *</label>
            <input
              type="text"
              placeholder="ABC Properties Pvt. Ltd."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Contact Person *</label>
            <input
              type="text"
              placeholder="Full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Mobile Number *</label>
            <input
              type="tel"
              placeholder="10-digit mobile"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Email Address *</label>
            <input
              type="email"
              placeholder="contact@company.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Location</label>
            <input
              type="text"
              placeholder="Andheri, Mumbai"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">RERA Registration</label>
            <input
              type="text"
              placeholder="RERA number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.reraNumber}
              onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Commission Rate (%)</label>
            <input
              type="number"
              placeholder="e.g., 2.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Commission Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={formData.commissionType} onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}>
              <option>Percentage of Deal Value</option>
              <option>Fixed Amount per Booking</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Payment Terms</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}>
              <option>On Booking</option>
              <option>On Agreement</option>
              <option>On Possession</option>
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm text-gray-700 mb-2">Bank Details</label>
            <textarea
              rows={2}
              placeholder="Account number, IFSC, bank name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.bankDetails}
              onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm text-gray-700 mb-2">Remarks / Notes</label>
            <textarea
              rows={2}
              placeholder="Any additional information..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm" onClick={handleSubmitInlineForm}>
              Onboard Channel Partner
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm" onClick={handleClearForm}>
              Clear Form
            </button>
          </div>
        </div>
      </div>

      {/* Commission Processing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Pending Commission Payments</h3>
          <div className="space-y-3">
            {channelPartners.filter(cp => cp.commission > 0).length === 0 && (
              <p className="text-sm text-gray-500">No commission due yet.</p>
            )}
            {channelPartners.filter(cp => cp.commission > 0).map((cp) => (
              <div key={cp.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="text-gray-900">{cp.name}</div>
                  <div className="text-xs text-gray-500">{cp.bookings} bookings this month</div>
                </div>
                <div className="text-right">
                  <div className="text-green-600">₹{(cp.commission / 1000).toFixed(0)}k</div>
                  <button className="text-xs text-blue-600 hover:underline mt-1" onClick={() => handlePayCommission(cp)}>Process Payment</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
            <span className="text-gray-600">Total Pending</span>
            <span className="text-gray-900">₹{(totalCommission / 100000).toFixed(2)}L</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Top Performing CPs - This Month</h3>
          <div className="space-y-3">
            {[...channelPartners]
              .sort((a, b) => b.bookings - a.bookings)
              .slice(0, 5)
              .map((cp, index) => (
                <div key={cp.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900">{cp.name}</div>
                    <div className="text-xs text-gray-500">{cp.bookings} bookings • {cp.leadsProvided} leads</div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 ${getRatingColor(cp.rating)}`}>
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-sm">{cp.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showOnboardDialog && (
        <OnboardCPDialog
          onClose={() => setShowOnboardDialog(false)}
          onSuccess={handleDialogSuccess}
        />
      )}
      {showProfileDialog && selectedCP && (
        <CPProfileDialog
          onClose={() => setShowProfileDialog(false)}
          cp={selectedCP}
        />
      )}
      {showCommissionDialog && selectedCP && (
        <ProcessCommissionDialog
          onClose={() => setShowCommissionDialog(false)}
          onSuccess={handleDialogSuccess}
          cp={selectedCP}
        />
      )}
    </div>
  );
}
