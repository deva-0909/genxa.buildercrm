import { FileText, Upload, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface Document {
  id: string;
  bookingId: string;
  customer: string;
  project: string;
  unit: string;
  documentType: string;
  fileName: string;
  uploadedBy: string;
  uploadedDate: string;
  status: 'Pending' | 'Uploaded' | 'Verified' | 'Rejected';
  verifiedBy?: string;
  verifiedDate?: string;
  remarks?: string;
}

export function DocumentationModule() {
  const [activeTab, setActiveTab] = useState('pending');

  const [documents] = useState<Document[]>([
    { id: 'DOC001', bookingId: 'BK127', customer: 'Vikram Singh', project: 'Metro Plaza', unit: 'A-201', documentType: 'Aadhaar Card', fileName: 'aadhaar_vikram.pdf', uploadedBy: 'CRM Team', uploadedDate: '2025-02-01', status: 'Verified', verifiedBy: 'Amit Patel', verifiedDate: '2025-02-02' },
    { id: 'DOC002', bookingId: 'BK127', customer: 'Vikram Singh', project: 'Metro Plaza', unit: 'A-201', documentType: 'PAN Card', fileName: 'pan_vikram.pdf', uploadedBy: 'CRM Team', uploadedDate: '2025-02-01', status: 'Verified', verifiedBy: 'Amit Patel', verifiedDate: '2025-02-02' },
    { id: 'DOC003', bookingId: 'BK127', customer: 'Vikram Singh', project: 'Metro Plaza', unit: 'A-201', documentType: 'Bank Statement', fileName: 'bank_statement_vikram.pdf', uploadedBy: 'Customer', uploadedDate: '2025-02-03', status: 'Uploaded' },
    { id: 'DOC004', bookingId: 'BK126', customer: 'Meera Iyer', project: 'Skyline Heights', unit: 'B-305', documentType: 'Aadhaar Card', fileName: 'aadhaar_meera.pdf', uploadedBy: 'CRM Team', uploadedDate: '2025-01-30', status: 'Pending' },
    { id: 'DOC005', bookingId: 'BK126', customer: 'Meera Iyer', project: 'Skyline Heights', unit: 'B-305', documentType: 'Income Proof', fileName: 'salary_slip_meera.pdf', uploadedBy: 'Customer', uploadedDate: '2025-02-01', status: 'Rejected', verifiedBy: 'Amit Patel', verifiedDate: '2025-02-02', remarks: 'Document unclear, please re-upload' },
  ]);

  const documentTypes = [
    'Aadhaar Card',
    'PAN Card',
    'Passport',
    'Driving License',
    'Bank Statement',
    'Income Proof',
    'Address Proof',
    'Cancelled Cheque',
    'Passport Photo',
    'Marriage Certificate',
    'Birth Certificate',
  ];

  const stats = [
    { label: 'Pending Verification', value: documents.filter(d => d.status === 'Pending' || d.status === 'Uploaded').length, icon: Clock, color: 'orange' },
    { label: 'Verified', value: documents.filter(d => d.status === 'Verified').length, icon: CheckCircle, color: 'green' },
    { label: 'Rejected', value: documents.filter(d => d.status === 'Rejected').length, icon: AlertCircle, color: 'red' },
    { label: 'Total Documents', value: documents.length, icon: FileText, color: 'blue' },
  ];

  const pendingDocuments = documents.filter(d => d.status === 'Pending' || d.status === 'Uploaded');
  const verifiedDocuments = documents.filter(d => d.status === 'Verified');
  const rejectedDocuments = documents.filter(d => d.status === 'Rejected');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Uploaded': return 'bg-blue-100 text-blue-700';
      case 'Verified': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
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

  const handleVerifyDocument = (_docId: string) => {
    toast.success('Document verified successfully');
  };

  const handleRejectDocument = (_docId: string) => {
    toast.error('Document rejected');
  };

  const handleDownloadDocument = (_docId: string) => {
    toast.success('Downloading document...');
  };

  const handleUploadDocument = () => {
    toast.success('Document upload initiated');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Documentation</h2>
          <p className="text-gray-600">Manage customer documents and verification</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleUploadDocument}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
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

      {/* Document Checklist */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-900 mb-4">Required Documents Checklist</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {documentTypes.map((docType) => (
            <div key={docType} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
              <CheckCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{docType}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            {([
              ['pending', `Pending (${pendingDocuments.length})`],
              ['verified', `Verified (${verifiedDocuments.length})`],
              ['rejected', `Rejected (${rejectedDocuments.length})`],
              ['all', `All (${documents.length})`],
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
            {(activeTab === 'pending' ? pendingDocuments :
              activeTab === 'verified' ? verifiedDocuments :
              activeTab === 'rejected' ? rejectedDocuments :
              documents).map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-900">{doc.documentType}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Customer:</span>
                        <div className="text-gray-900">{doc.customer}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Booking ID:</span>
                        <div className="text-gray-900">{doc.bookingId}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">File Name:</span>
                        <div className="text-gray-900">{doc.fileName}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Uploaded:</span>
                        <div className="text-gray-900">{new Date(doc.uploadedDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    {doc.status === 'Verified' && (
                      <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                        <div>
                          <span className="text-gray-600">Verified By:</span>
                          <div className="text-gray-900">{doc.verifiedBy}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Verified On:</span>
                          <div className="text-gray-900">{doc.verifiedDate ? new Date(doc.verifiedDate).toLocaleDateString() : '-'}</div>
                        </div>
                      </div>
                    )}
                    {doc.status === 'Rejected' && doc.remarks && (
                      <div className="mt-2 text-sm">
                        <span className="text-red-600">Rejection Reason: </span>
                        <span className="text-gray-900">{doc.remarks}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(doc.id)}>
                      <Download className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {(doc.status === 'Pending' || doc.status === 'Uploaded') && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleVerifyDocument(doc.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleRejectDocument(doc.id)}>
                          Reject
                        </Button>
                      </>
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
