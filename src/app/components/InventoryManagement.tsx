import { Building2, Home, CheckCircle, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';

interface Unit {
  id: string;
  project: string;
  tower: string;
  floor: number;
  unitNumber: string;
  unitType: string;
  area: number;
  price: number;
  status: 'Available' | 'Blocked' | 'Sold' | 'Reserved';
  facing: string;
  blockedBy?: string;
  soldTo?: string;
  blockDate?: string;
}

export function InventoryManagement() {
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [units] = useState<Unit[]>([
    { id: 'U001', project: 'Skyline Heights', tower: 'A', floor: 2, unitNumber: 'A-201', unitType: '2 BHK', area: 1150, price: 3590000, status: 'Sold', facing: 'East', soldTo: 'Vikram Singh' },
    { id: 'U002', project: 'Skyline Heights', tower: 'A', floor: 2, unitNumber: 'A-202', unitType: '2 BHK', area: 1150, price: 3590000, status: 'Available', facing: 'West' },
    { id: 'U003', project: 'Skyline Heights', tower: 'B', floor: 3, unitNumber: 'B-305', unitType: '2 BHK', area: 1200, price: 4200000, status: 'Blocked', facing: 'North', blockedBy: 'Meera Iyer', blockDate: '2025-02-01' },
    { id: 'U004', project: 'Green Valley', tower: 'C', floor: 1, unitNumber: 'C-102', unitType: '3 BHK', area: 1650, price: 6800000, status: 'Sold', facing: 'South', soldTo: 'Rahul Sharma' },
    { id: 'U005', project: 'Green Valley', tower: 'C', floor: 1, unitNumber: 'C-103', unitType: '3 BHK', area: 1650, price: 6800000, status: 'Available', facing: 'East' },
    { id: 'U006', project: 'Ocean View', tower: 'D', floor: 5, unitNumber: 'D-501', unitType: '3 BHK', area: 1850, price: 8500000, status: 'Reserved', facing: 'West' },
    { id: 'U007', project: 'Ocean View', tower: 'D', floor: 5, unitNumber: 'D-502', unitType: '2 BHK', area: 1250, price: 5200000, status: 'Available', facing: 'North' },
    { id: 'U008', project: 'Metro Plaza', tower: 'E', floor: 4, unitNumber: 'E-401', unitType: '2 BHK', area: 1100, price: 3200000, status: 'Available', facing: 'South' },
  ]);

  const projects = ['Skyline Heights', 'Green Valley', 'Ocean View', 'Metro Plaza'];

  const stats = [
    { label: 'Total Units', value: units.length, icon: Building2, color: 'blue' },
    { label: 'Available', value: units.filter(u => u.status === 'Available').length, icon: Home, color: 'green' },
    { label: 'Sold', value: units.filter(u => u.status === 'Sold').length, icon: CheckCircle, color: 'purple' },
    { label: 'Blocked', value: units.filter(u => u.status === 'Blocked').length, icon: Clock, color: 'orange' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700';
      case 'Blocked': return 'bg-yellow-100 text-yellow-700';
      case 'Sold': return 'bg-purple-100 text-purple-700';
      case 'Reserved': return 'bg-blue-100 text-blue-700';
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

  const filteredUnits = units.filter(unit => {
    const matchesProject = selectedProject === 'all' || unit.project === selectedProject;
    const matchesStatus = selectedStatus === 'all' || unit.status === selectedStatus;
    const matchesSearch = searchQuery === '' ||
      unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.unitType.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesProject && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Inventory Management</h2>
          <p className="text-gray-600">Track unit availability and manage inventory</p>
        </div>
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

      {/* Project-wise Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Project-wise Inventory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((project) => {
            const projectUnits = units.filter(u => u.project === project);
            const available = projectUnits.filter(u => u.status === 'Available').length;
            const sold = projectUnits.filter(u => u.status === 'Sold').length;
            const blocked = projectUnits.filter(u => u.status === 'Blocked').length;
            const total = projectUnits.length;
            const soldPercent = total > 0 ? Math.round((sold / total) * 100) : 0;

            return (
              <div key={project} className="p-4 border border-gray-200 rounded-lg">
                <div className="text-gray-900 mb-3">{project}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total</span>
                    <span className="text-gray-900">{total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Available</span>
                    <span className="text-green-900">{available}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">Sold</span>
                    <span className="text-purple-900">{sold}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Blocked</span>
                    <span className="text-yellow-900">{blocked}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${soldPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 text-center">{soldPercent}% Sold</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by unit number or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Blocked">Blocked</option>
            <option value="Sold">Sold</option>
            <option value="Reserved">Reserved</option>
          </select>
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Tower/Floor</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Area (sq ft)</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Facing</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{unit.unitNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{unit.project}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">{unit.tower} / Floor {unit.floor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{unit.unitType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{unit.area}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">₹{(unit.price / 100000).toFixed(1)}L</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">{unit.facing}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(unit.status)}`}>
                      {unit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {unit.status === 'Sold' && unit.soldTo && `Sold to ${unit.soldTo}`}
                    {unit.status === 'Blocked' && unit.blockedBy && `Blocked by ${unit.blockedBy}`}
                    {unit.status === 'Available' && '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Showing {filteredUnits.length} of {units.length} units
      </div>
    </div>
  );
}
