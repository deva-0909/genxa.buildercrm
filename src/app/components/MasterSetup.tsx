import { useState } from 'react';
import { Building2, Users, Target, DollarSign, MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
import { getDataStore } from '../lib/dataStore';

export function MasterSetup() {
  const [activeTab, setActiveTab] = useState('projects');

  // Projects, users and sources are loaded from the database
  const dataStore = getDataStore();
  const projects = dataStore.getProjects();
  const users = dataStore.getUsers();
  const sources = dataStore.getSources();

  const pricingConfig = [
    { project: 'Skyline Heights', unitType: '1 BHK', basePrice: 4500000, sqft: 650, status: 'Active' },
    { project: 'Skyline Heights', unitType: '2 BHK', basePrice: 7200000, sqft: 980, status: 'Active' },
    { project: 'Green Valley', unitType: '2 BHK', basePrice: 6800000, sqft: 920, status: 'Active' },
    { project: 'Green Valley', unitType: '3 BHK', basePrice: 9500000, sqft: 1350, status: 'Active' },
    { project: 'Ocean View', unitType: '2 BHK', basePrice: 8200000, sqft: 1050, status: 'Active' },
  ];

  const targets = users
    .filter(u => u.target > 0 && ['Telecaller', 'Sales Executive', 'Team Leader', 'CRM Executive', 'Sourcing Executive'].includes(u.role))
    .map(u => ({
      user: u.name,
      role: u.role,
      monthly: u.target,
      weekly: Math.max(1, Math.round(u.target / 4)),
      daily: Math.max(1, Math.round(u.target / 22)),
    }));

  const tabs = [
    { id: 'projects', label: 'Projects & Units', icon: Building2 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'sources', label: 'Lead Sources', icon: MapPin },
    { id: 'pricing', label: 'Pricing Config', icon: DollarSign },
    { id: 'targets', label: 'Targets', icon: Target },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Master Setup</h2>
        <p className="text-gray-600">Configure projects, users, pricing, sources, and targets</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-gray-900">Projects & Towers</h3>
              <p className="text-sm text-gray-600">Manage project inventory and configuration</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Project Name</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Location</th>
                  <th className="text-center py-3 px-6 text-sm text-gray-600">Towers</th>
                  <th className="text-center py-3 px-6 text-sm text-gray-600">Total Units</th>
                  <th className="text-center py-3 px-6 text-sm text-gray-600">Status</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900">{project.name}</td>
                    <td className="py-4 px-6 text-gray-600">{project.location}</td>
                    <td className="text-center py-4 px-6 text-gray-600">{project.towers}</td>
                    <td className="text-center py-4 px-6 text-gray-600">{project.units}</td>
                    <td className="text-center py-4 px-6">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        project.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="text-right py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
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

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600">Manage team members and their roles</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Name</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Role</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Email</th>
                  <th className="text-center py-3 px-6 text-sm text-gray-600">Monthly Target</th>
                  <th className="text-center py-3 px-6 text-sm text-gray-600">Status</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900">{user.name}</td>
                    <td className="py-4 px-6 text-gray-600">{user.role}</td>
                    <td className="py-4 px-6 text-gray-600">{user.email}</td>
                    <td className="text-center py-4 px-6 text-gray-600">{user.target}</td>
                    <td className="text-center py-4 px-6">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="text-right py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
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

      {/* Sources Tab */}
      {activeTab === 'sources' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-gray-900">Lead Sources</h3>
              <p className="text-sm text-gray-600">Configure lead sources and cost per lead</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Source
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Source Name</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Type</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Cost Per Lead (₹)</th>
                  <th className="text-center py-3 px-6 text-sm text-gray-600">Status</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900">{source.name}</td>
                    <td className="py-4 px-6 text-gray-600">{source.type}</td>
                    <td className="text-right py-4 px-6 text-gray-600">
                      {source.costPerLead > 0 ? `₹${source.costPerLead}` : 'N/A'}
                    </td>
                    <td className="text-center py-4 px-6">
                      <span className="inline-flex px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                        {source.status}
                      </span>
                    </td>
                    <td className="text-right py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
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

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-gray-900">Pricing Configuration</h3>
              <p className="text-sm text-gray-600">Set base prices for different unit types</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Pricing
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Project</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Unit Type</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Base Price (₹)</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Sq.Ft</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Price/Sq.Ft</th>
                  <th className="text-center py-3 px-6 text-sm text-gray-600">Status</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pricingConfig.map((pricing, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900">{pricing.project}</td>
                    <td className="py-4 px-6 text-gray-600">{pricing.unitType}</td>
                    <td className="text-right py-4 px-6 text-gray-900">
                      ₹{(pricing.basePrice / 100000).toFixed(2)}L
                    </td>
                    <td className="text-right py-4 px-6 text-gray-600">{pricing.sqft}</td>
                    <td className="text-right py-4 px-6 text-gray-600">
                      ₹{Math.round(pricing.basePrice / pricing.sqft)}
                    </td>
                    <td className="text-center py-4 px-6">
                      <span className="inline-flex px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                        {pricing.status}
                      </span>
                    </td>
                    <td className="text-right py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
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

      {/* Targets Tab */}
      {activeTab === 'targets' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-gray-900">User Targets</h3>
              <p className="text-sm text-gray-600">Set and manage performance targets</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Set Target
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-6 text-sm text-gray-600">User</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Role</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Monthly Target</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Weekly Target</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Daily Target</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((target, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900">{target.user}</td>
                    <td className="py-4 px-6 text-gray-600">{target.role}</td>
                    <td className="text-right py-4 px-6 text-gray-600">{target.monthly}</td>
                    <td className="text-right py-4 px-6 text-gray-600">{target.weekly}</td>
                    <td className="text-right py-4 px-6 text-gray-600">{target.daily}</td>
                    <td className="text-right py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 className="w-4 h-4" />
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
    </div>
  );
}
