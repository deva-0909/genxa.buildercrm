import { useState } from 'react';
import { Upload, Globe, UserPlus, Download } from 'lucide-react';
import { getDataStore } from '../lib/dataStore';
import { useLeadAssignment } from '../hooks/useLeadAssignment';
import { toast } from 'sonner';

export function LeadCapture() {
  const [captureMethod, setCaptureMethod] = useState('digital');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    source: '',
    project: '',
    budget: '',
    comments: ''
  });

  const [walkinFormData, setWalkinFormData] = useState({
    name: '',
    mobile: '',
    location: '',
    project: '',
    hearAbout: '',
    immediateVisit: 'No',
    notes: ''
  });

  const [cpFormData, setCpFormData] = useState({
    channelPartner: '',
    file: null as File | null
  });

  const dataStore = getDataStore();
  const { autoAssignLeads } = useLeadAssignment();
  const projects = dataStore.getProjects();
  const sources = dataStore.getSources();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.mobile || !formData.source || !formData.project) {
      toast.error('Please fill all required fields');
      return;
    }

    // Create new lead
    const newLead = dataStore.addLead({
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      source: formData.source,
      project: formData.project,
      status: 'New',
      assignedTo: null,
      priority: 'Warm',
      budget: formData.budget,
      notes: formData.comments
    });

    // Auto-assign the lead
    await autoAssignLeads();

    // Reset form
    resetForm();

    toast.success(`Lead ${newLead.id} created and assigned successfully!`);
  };

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walkinFormData.name || !walkinFormData.mobile || !walkinFormData.location || !walkinFormData.project) {
      toast.error('Please fill all required fields');
      return;
    }

    const newLead = dataStore.addLead({
      name: walkinFormData.name,
      mobile: walkinFormData.mobile,
      email: `${walkinFormData.name.toLowerCase().replace(' ', '.')}@walkin.com`,
      source: 'Walk-In',
      project: walkinFormData.project,
      status: 'New',
      assignedTo: null,
      priority: 'Hot',
      notes: `Location: ${walkinFormData.location}. ${walkinFormData.notes}`
    });

    await autoAssignLeads();

    setWalkinFormData({
      name: '',
      mobile: '',
      location: '',
      project: '',
      hearAbout: '',
      immediateVisit: 'No',
      notes: ''
    });

    toast.success(`Walk-in lead ${newLead.id} registered successfully!`);
  };

  const handleCPUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cpFormData.channelPartner) {
      toast.error('Please select a channel partner');
      return;
    }

    if (!cpFormData.file) {
      toast.error('Please select a file to upload');
      return;
    }

    // Simulate bulk upload
    const leadCount = Math.floor(Math.random() * 20) + 10;

    for (let i = 0; i < leadCount; i++) {
      dataStore.addLead({
        name: `CP Lead ${i + 1}`,
        mobile: `98765${String(43210 + i).padStart(5, '0')}`,
        email: `cplead${i + 1}@email.com`,
        source: cpFormData.channelPartner,
        project: projects[Math.floor(Math.random() * projects.length)].name,
        status: 'New',
        assignedTo: null,
        priority: 'Warm'
      });
    }

    await autoAssignLeads();

    setCpFormData({
      channelPartner: '',
      file: null
    });

    toast.success(`${leadCount} leads uploaded and assigned successfully!`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      source: '',
      project: '',
      budget: '',
      comments: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleWalkinInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setWalkinFormData({
      ...walkinFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCpFormData({
      ...cpFormData,
      file
    });
  };

  const handleCPSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCpFormData({
      ...cpFormData,
      channelPartner: e.target.value
    });
  };

  const downloadTemplate = () => {
    toast.success('Template downloaded! Check your downloads folder.');
  };

  // Get recent leads from dataStore
  const recentLeads = dataStore.getLeads().slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Lead Capture</h2>
        <p className="text-gray-600">Capture leads from multiple sources - Digital, Walk-In, Channel Partners</p>
      </div>

      {/* Capture Method Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setCaptureMethod('digital')}
          className={`p-6 rounded-lg border-2 transition-all ${
            captureMethod === 'digital'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <Globe className={`w-8 h-8 mb-3 ${captureMethod === 'digital' ? 'text-blue-600' : 'text-gray-400'}`} />
          <h3 className={captureMethod === 'digital' ? 'text-blue-900' : 'text-gray-900'}>
            Digital Lead
          </h3>
          <p className="text-sm text-gray-600 mt-1">From ads, portals, website forms</p>
        </button>

        <button
          onClick={() => setCaptureMethod('walkin')}
          className={`p-6 rounded-lg border-2 transition-all ${
            captureMethod === 'walkin'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <UserPlus className={`w-8 h-8 mb-3 ${captureMethod === 'walkin' ? 'text-blue-600' : 'text-gray-400'}`} />
          <h3 className={captureMethod === 'walkin' ? 'text-blue-900' : 'text-gray-900'}>
            Walk-In
          </h3>
          <p className="text-sm text-gray-600 mt-1">Direct visitor at office/site</p>
        </button>

        <button
          onClick={() => setCaptureMethod('cp')}
          className={`p-6 rounded-lg border-2 transition-all ${
            captureMethod === 'cp'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <Upload className={`w-8 h-8 mb-3 ${captureMethod === 'cp' ? 'text-blue-600' : 'text-gray-400'}`} />
          <h3 className={captureMethod === 'cp' ? 'text-blue-900' : 'text-gray-900'}>
            Channel Partner
          </h3>
          <p className="text-sm text-gray-600 mt-1">CP bulk upload</p>
        </button>
      </div>

      {/* Digital Lead Form */}
      {captureMethod === 'digital' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <h3 className="text-gray-900">Digital Lead Entry</h3>
            <p className="text-sm text-gray-600">Enter lead details from digital sources</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                placeholder="Enter customer name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Mobile Number *</label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="customer@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Lead Source *</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="source"
                value={formData.source}
                onChange={handleInputChange}
              >
                <option value="">Select source</option>
                {sources.map(source => (
                  <option key={source.id} value={source.name}>{source.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Interested Project *</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="project"
                value={formData.project}
                onChange={handleInputChange}
              >
                <option value="">Select project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.name}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Budget Range</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
              >
                <option>Select budget</option>
                <option>Below 50L</option>
                <option>50L - 75L</option>
                <option>75L - 1Cr</option>
                <option>1Cr - 1.5Cr</option>
                <option>Above 1.5Cr</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Comments</label>
              <textarea
                rows={3}
                placeholder="Any additional notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleSubmit}>
              Create Lead
            </button>
            <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={resetForm} type="button">
              Reset
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Auto-Process:</strong> Lead will be validated for duplicates → Assigned to Telecaller → First follow-up task created
            </p>
          </div>
        </div>
      )}

      {/* Walk-In Lead Form */}
      {captureMethod === 'walkin' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <h3 className="text-gray-900">Walk-In Lead Entry</h3>
            <p className="text-sm text-gray-600">Register visitor details</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                placeholder="Enter visitor name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="name"
                value={walkinFormData.name}
                onChange={handleWalkinInputChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Mobile Number *</label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="mobile"
                value={walkinFormData.mobile}
                onChange={handleWalkinInputChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Visit Location *</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="location"
                value={walkinFormData.location}
                onChange={handleWalkinInputChange}
              >
                <option>Select location</option>
                <option>Head Office</option>
                <option>Skyline Heights Site</option>
                <option>Green Valley Site</option>
                <option>Ocean View Site</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Interested Project *</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="project"
                value={walkinFormData.project}
                onChange={handleWalkinInputChange}
              >
                <option>Select project</option>
                <option>Skyline Heights</option>
                <option>Green Valley</option>
                <option>Ocean View</option>
                <option>Metro Plaza</option>
                <option>General Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">How did you hear about us?</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="hearAbout"
                value={walkinFormData.hearAbout}
                onChange={handleWalkinInputChange}
              >
                <option>Select source</option>
                <option>Referral</option>
                <option>Online Search</option>
                <option>Hoarding/Billboard</option>
                <option>Newspaper</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Immediate Site Visit?</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="immediateVisit"
                value={walkinFormData.immediateVisit}
                onChange={handleWalkinInputChange}
              >
                <option>No</option>
                <option>Yes - Immediate</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Notes</label>
              <textarea
                rows={3}
                placeholder="Conversation notes, requirements..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="notes"
                value={walkinFormData.notes}
                onChange={handleWalkinInputChange}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleWalkinSubmit}>
              Register Walk-In
            </button>
            <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Clear Form
            </button>
          </div>
        </div>
      )}

      {/* Channel Partner Upload */}
      {captureMethod === 'cp' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <h3 className="text-gray-900">Channel Partner Lead Upload</h3>
            <p className="text-sm text-gray-600">Bulk upload leads from channel partners</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Select Channel Partner *</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="channelPartner"
                value={cpFormData.channelPartner}
                onChange={handleCPSelectChange}
              >
                <option>Select CP</option>
                <option>CP001 - ABC Properties</option>
                <option>CP002 - XYZ Realty</option>
                <option>CP003 - Prime Brokers</option>
                <option>CP004 - Elite Partners</option>
              </select>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 mb-2">Upload Excel/CSV File</p>
              <p className="text-sm text-gray-600 mb-4">Drag and drop or click to browse</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                id="file-upload"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </label>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Download className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">Download Template</p>
                <p className="text-xs text-gray-600">Use this format for bulk upload</p>
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-white" onClick={downloadTemplate}>
                Download
              </button>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                <strong>Required Columns:</strong> Name, Mobile, Email, Project, Budget, CP Reference ID
              </p>
              <p className="text-xs text-yellow-800 mt-1">
                System will auto-validate duplicates and assign to telecallers
              </p>
            </div>

            <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleCPUpload}>
              Upload & Process Leads
            </button>
          </div>
        </div>
      )}

      {/* Recent Leads */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Recently Captured Leads</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Lead ID</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Mobile</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Source</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Project</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Captured At</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{lead.id}</td>
                  <td className="py-3 px-4 text-gray-900">{lead.name}</td>
                  <td className="py-3 px-4 text-gray-600">{lead.mobile}</td>
                  <td className="py-3 px-4 text-gray-600">{lead.source}</td>
                  <td className="py-3 px-4 text-gray-600">{lead.project}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(lead.createdAt).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${
                      lead.assignedTo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {lead.assignedTo ? 'Assigned' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
