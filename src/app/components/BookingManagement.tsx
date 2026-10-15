import { Building2, DollarSign, FileText, CheckCircle, TrendingUp, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDataStore, Booking } from '../lib/dataStore';
import { CreateBookingDialog } from './CreateBookingDialog';
import { BlockUnitDialog } from './BlockUnitDialog';
import { CheckAvailabilityDialog } from './CheckAvailabilityDialog';
import { toast } from 'sonner';

export function BookingManagement() {
  const [activeTab, setActiveTab] = useState('active');
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isCheckAvailOpen, setIsCheckAvailOpen] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    revenue: '0',
    avgDeal: '0',
    conversion: '0%'
  });

  // Unit inventory stats
  const [inventory, setInventory] = useState<any[]>([]);

  const dataStore = getDataStore();

  const loadData = () => {
    const allBookings = dataStore.getBookings();
    setBookings([...allBookings]);

    const totalRevenue = allBookings.reduce((sum, b) => sum + (b.price - b.discount), 0);
    const avgDeal = allBookings.length > 0 ? totalRevenue / allBookings.length : 0;

    const visitsCount = dataStore.getVisits().length;
    const conversion = visitsCount > 0 ? (allBookings.length / visitsCount) * 100 : 0;

    setStats({
      total: allBookings.length,
      revenue: (totalRevenue / 10000000).toFixed(2), // Cr
      avgDeal: (avgDeal / 100000).toFixed(1), // Lakhs
      conversion: `${conversion.toFixed(1)}%`
    });

    // Inventory based on projects, bookings and active unit blocks
    const projects = dataStore.getProjects();
    const blockedUnits = dataStore.getBlockedUnits();
    const invStats = projects.map(p => {
      const soldCount = allBookings.filter(b => b.project === p.name).length;
      const blockedCount = blockedUnits.filter(b => b.project === p.name && b.status === 'Active').length;
      const available = p.units - soldCount - blockedCount;
      return {
        project: p.name,
        total: p.units,
        sold: soldCount,
        blocked: blockedCount,
        available: Math.max(0, available)
      };
    });
    setInventory(invStats);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPayment = (booking: Booking) => {
    const amountStr = window.prompt(`Enter payment amount for ${booking.unit}:`);
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Invalid amount');
        return;
      }

      const newTotal = booking.totalPaid + amount;
      const newStage = newTotal >= (booking.price - booking.discount) ? 'Fully Paid' : booking.stage;

      dataStore.updateBooking(booking.id, {
        totalPaid: newTotal,
        stage: newStage as Booking['stage']
      });
      toast.success(`Payment of ₹${amount.toLocaleString()} recorded`);
      loadData();
    }
  };

  const handleBlockUnit = () => {
    setIsBlockDialogOpen(true);
  };

  const handleCheckAvailability = () => {
    setIsCheckAvailOpen(true);
  };

  const activeBookings = bookings.filter(b => ['Token Paid', 'Agreement Pending', 'Agreement Done', 'Documentation'].includes(b.stage));
  const completedBookings = bookings.filter(b => ['Fully Paid', 'Possession Done', 'Completed'].includes(b.stage));

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Agreement Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Documentation': return 'bg-orange-100 text-orange-700';
      case 'Agreement Done': return 'bg-green-100 text-green-700';
      case 'Fully Paid': return 'bg-blue-100 text-blue-700';
      case 'Possession Done': return 'bg-purple-100 text-purple-700';
      case 'Token Paid': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Booking Management</h2>
        <p className="text-gray-600">Track bookings, unit allocation, and revenue</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-gray-900 mt-2 text-xl">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue (₹Cr)</p>
              <p className="text-gray-900 mt-2 text-xl">{stats.revenue}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Deal (₹L)</p>
              <p className="text-gray-900 mt-2 text-xl">{stats.avgDeal}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-gray-900 mt-2 text-xl">{stats.conversion}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Unit Inventory Status */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Unit Inventory Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {inventory.map((inv, index) => {
            const soldPercent = inv.total > 0 ? Math.round((inv.sold / inv.total) * 100) : 0;

            return (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="text-gray-900 mb-3">{inv.project}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Units</span>
                    <span className="text-gray-900">{inv.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Sold</span>
                    <span className="text-green-900">{inv.sold}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Blocked</span>
                    <span className="text-yellow-900">{inv.blocked}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Available</span>
                    <span className="text-blue-900">{inv.available}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${soldPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{soldPercent}% sold</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
          <button
            onClick={handleBlockUnit}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FileText className="w-4 h-4" />
            Block Unit
          </button>
          <button
            onClick={handleCheckAvailability}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <CheckCircle className="w-4 h-4" />
            Check Availability
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Bookings ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed ({completedBookings.length})
          </button>
        </div>
      </div>

      {/* Active Bookings */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-gray-900">Active Bookings Pipeline</h3>
              <p className="text-sm text-gray-600">Track ongoing bookings and payment status</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Booking ID</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Project / Unit</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Type</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Total Price (₹)</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Paid (₹)</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Pending (₹)</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Stage</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Sales Exec</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-600">Payment %</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeBookings.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-500">
                      No active bookings found.
                    </td>
                  </tr>
                )}
                {activeBookings.map((booking) => {
                  const netPrice = booking.price - booking.discount;
                  const paymentPercent = Math.min(100, Math.round((booking.totalPaid / netPrice) * 100));
                  const pending = netPrice - booking.totalPaid;

                  return (
                    <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="text-blue-600 hover:underline cursor-pointer">{booking.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-900">{booking.customer}</div>
                        <div className="text-xs text-gray-500">{booking.mobile}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-900">{booking.project}</div>
                        <div className="text-xs text-gray-500">Unit: {booking.unit}</div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">{booking.unitType}</td>
                      <td className="text-right py-4 px-4 text-gray-900">
                        ₹{(netPrice / 100000).toFixed(2)}L
                      </td>
                      <td className="text-right py-4 px-4 text-green-600">
                        ₹{(booking.totalPaid / 100000).toFixed(2)}L
                      </td>
                      <td className="text-right py-4 px-4 text-orange-600">
                        ₹{(pending / 100000).toFixed(2)}L
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs ${getStageColor(booking.stage)}`}>
                          {booking.stage}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">{booking.salesExec}</td>
                      <td className="py-4 px-4">
                        <div className="w-full">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${paymentPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-10 text-right">{paymentPercent}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAddPayment(booking)}
                            className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
                          >
                            Add Payment
                          </button>
                          <button
                            onClick={() => toast.info(`Viewing details for ${booking.id}`)}
                            className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          >
                            View Details
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
      )}

      {/* Completed Bookings */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900">Completed Bookings</h3>
            <p className="text-sm text-gray-600">Fully paid or possession completed bookings</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Booking ID</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Project / Unit</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Type</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Total Paid (₹)</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Booking Date</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Sales Exec</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedBookings.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No completed bookings found.
                    </td>
                  </tr>
                )}
                {completedBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="text-blue-600 hover:underline cursor-pointer">{booking.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900">{booking.customer}</div>
                      <div className="text-xs text-gray-500">{booking.mobile}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900">{booking.project}</div>
                      <div className="text-xs text-gray-500">Unit: {booking.unit}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{booking.unitType}</td>
                    <td className="text-right py-4 px-4 text-green-600">
                      ₹{(booking.totalPaid / 100000).toFixed(2)}L
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{booking.bookingDate}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{booking.salesExec}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStageColor(booking.stage)}`}>
                        <CheckCircle className="w-3 h-3" />
                        {booking.stage}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toast.info(`Viewing details for ${booking.id}`)}
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

      {isCreateDialogOpen && (
        <CreateBookingDialog
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={loadData}
        />
      )}

      {isBlockDialogOpen && (
        <BlockUnitDialog
          onClose={() => setIsBlockDialogOpen(false)}
          onSuccess={loadData}
        />
      )}

      {isCheckAvailOpen && (
        <CheckAvailabilityDialog
          onClose={() => setIsCheckAvailOpen(false)}
        />
      )}
    </div>
  );
}
