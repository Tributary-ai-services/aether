import React, { useState } from 'react';
import { useAppSelector, useAppDispatch, setViewMode } from '../../store/index.js';
import {
  BookOpen,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  Calendar,
  User,
  Tag,
  Globe,
  Lock,
  Users,
  Database,
  Activity,
  TrendingUp,
  Shield,
  ShieldCheck,
  UserCheck,
  CreditCard,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useNotebookAccess } from '../../hooks/useResourceAccess.js';
import { RequirePermission } from '../auth/RequirePermission.jsx';
import { ProtectedButton } from '../auth/ProtectedButton.jsx';

const NotebookDetailView = ({ notebook, onUploadDocuments }) => {
  const dispatch = useAppDispatch();
  const { viewMode: globalViewMode } = useAppSelector(state => state.ui);
  const [localViewMode, setLocalViewMode] = useState('grid'); // local grid/list toggle for documents
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState(new Set());

  if (!notebook) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Select a Notebook</h3>
          <p>Choose a notebook from the sidebar to view its contents</p>
        </div>
      </div>
    );
  }
  
  // Parse complianceSettings if it's a string
  let complianceSettings = notebook.complianceSettings;
  if (typeof complianceSettings === 'string') {
    try {
      complianceSettings = JSON.parse(complianceSettings);
    } catch (e) {
      console.error('Failed to parse compliance settings:', e);
      complianceSettings = null;
    }
  }

  const mockDocuments = [
    {
      id: 'doc_1',
      name: 'Research Paper - AI Ethics.pdf',
      type: 'pdf',
      size: '2.4 MB',
      uploadedAt: '2024-01-15T10:30:00Z',
      processedAt: '2024-01-15T10:32:00Z',
      status: 'processed',
      vectorCount: 1250,
      extractedText: 'This paper discusses the ethical implications...',
      metadata: {
        pages: 24,
        author: 'Dr. Sarah Johnson',
        language: 'en',
        confidence: 0.95
      }
    },
    {
      id: 'doc_2',
      name: 'Meeting Recording 2024-01-10.mp4',
      type: 'video',
      size: '156.8 MB',
      uploadedAt: '2024-01-10T14:00:00Z',
      processedAt: '2024-01-10T14:25:00Z',
      status: 'processed',
      vectorCount: 890,
      extractedText: 'Transcript: Welcome everyone to today\'s meeting...',
      metadata: {
        duration: 3420, // seconds
        resolution: '1920x1080',
        transcribed: true,
        confidence: 0.89
      }
    },
    {
      id: 'doc_3',
      name: 'Dataset_Analysis.csv',
      type: 'csv',
      size: '45.2 KB',
      uploadedAt: '2024-01-08T09:15:00Z',
      processedAt: '2024-01-08T09:16:00Z',
      status: 'processed',
      vectorCount: 156,
      extractedText: 'Structured data with 1,234 rows and 15 columns...',
      metadata: {
        rows: 1234,
        columns: 15,
        headers: ['id', 'name', 'category', 'value'],
        encoding: 'utf-8'
      }
    }
  ];

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return <FileText size={16} className="text-red-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image size={16} className="text-green-600" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Film size={16} className="text-(--color-primary-600)" />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music size={16} className="text-purple-600" />;
      default:
        return <Archive size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || doc.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <BookOpen size={24} className="text-(--color-primary-600)" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{notebook.name}</h1>
                <p className="text-sm text-gray-500">{notebook.description}</p>
              </div>
            </div>
            
            {/* Notebook Metadata */}
            <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Updated {formatDate(notebook.updatedAt || new Date().toISOString())}</span>
              </div>
              <div className="flex items-center gap-2">
                {notebook.visibility === 'public' ? (
                  <Globe size={16} className="text-green-600" />
                ) : notebook.visibility === 'shared' ? (
                  <Users size={16} className="text-(--color-primary-600)" />
                ) : (
                  <Lock size={16} className="text-gray-600" />
                )}
                <span className="capitalize">{notebook.visibility}</span>
              </div>
            </div>
            
            {/* Compliance Framework Indicators */}
            {complianceSettings && (
              <div className="flex gap-1 flex-wrap mt-2">
                {/* HIPAA */}
                {complianceSettings.hipaaCompliant && (
                  <div className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 flex items-center gap-1" title="HIPAA Compliance">
                    <Shield size={10} />
                    HIPAA
                  </div>
                )}
                
                {/* PII Protection */}
                {complianceSettings.piiDetection !== false && (
                  <div className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 flex items-center gap-1" title="PII Protection">
                    <UserCheck size={10} />
                    PII
                  </div>
                )}
                
                {/* GDPR */}
                {complianceSettings.complianceFrameworks?.includes('GDPR') && (
                  <div className="px-2 py-1 rounded-full text-xs bg-(--color-primary-100) text-(--color-primary-700) flex items-center gap-1" title="GDPR Compliance">
                    <ShieldCheck size={10} />
                    GDPR
                  </div>
                )}
                
                {/* SOC 2 */}
                {complianceSettings.complianceFrameworks?.includes('SOC2') && (
                  <div className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 flex items-center gap-1" title="SOC 2 Compliance">
                    <CheckCircle size={10} />
                    SOC 2
                  </div>
                )}
                
                {/* ISO 27001 */}
                {complianceSettings.complianceFrameworks?.includes('ISO27001') && (
                  <div className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 flex items-center gap-1" title="ISO 27001 Compliance">
                    <Database size={10} />
                    ISO 27001
                  </div>
                )}
                
                {/* PCI DSS */}
                {complianceSettings.complianceFrameworks?.includes('PCI-DSS') && (
                  <div className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 flex items-center gap-1" title="PCI DSS Compliance">
                    <CreditCard size={10} />
                    PCI DSS
                  </div>
                )}
                
                {/* CCPA */}
                {complianceSettings.complianceFrameworks?.includes('CCPA') && (
                  <div className="px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-700 flex items-center gap-1" title="CCPA Compliance">
                    <Users size={10} />
                    CCPA
                  </div>
                )}
                
                {/* Data Classification */}
                {complianceSettings.dataClassification === 'confidential' && (
                  <div className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 flex items-center gap-1" title="Confidential Data">
                    <AlertTriangle size={10} />
                    Confidential
                  </div>
                )}
                {complianceSettings.dataClassification === 'restricted' && (
                  <div className="px-2 py-1 rounded-full text-xs bg-red-200 text-red-800 flex items-center gap-1" title="Restricted Data">
                    <Lock size={10} />
                    Restricted
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ProtectedButton
              resource={notebook}
              resourcePermission="edit"
              onClick={() => onUploadDocuments?.(notebook)}
              className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors"
              disabledClassName="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg opacity-50 cursor-not-allowed"
              disabledTitle="You need edit access to upload documents"
            >
              <Upload size={16} />
              Upload Documents
            </ProtectedButton>

            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) w-64"
              />
            </div>

            {/* Filter */}
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="doc">Documents</option>
              <option value="mp4">Videos</option>
              <option value="mp3">Audio</option>
              <option value="jpg">Images</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocalViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                localViewMode === 'grid' 
                  ? 'bg-(--color-primary-100) text-(--color-primary-600)' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setLocalViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                localViewMode === 'list' 
                  ? 'bg-(--color-primary-100) text-(--color-primary-600)' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
            <p>
              {searchTerm || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload documents to get started with this notebook'
              }
            </p>
          </div>
        ) : localViewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  {getFileIcon(doc.type)}
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                </div>
                
                <h3 className="font-medium text-gray-900 text-sm mb-2 truncate" title={doc.name}>
                  {doc.name}
                </h3>
                
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{doc.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vectors:</span>
                    <span>{doc.vectorCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                      <Eye size={12} />
                      View
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                      <Download size={12} />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vectors
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            {getFileIcon(doc.type)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {doc.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {doc.type.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.vectorCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.uploadedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-(--color-primary-600) hover:text-(--color-primary-700)">
                            <Eye size={16} />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Download size={16} />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical size={16} />
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
    </div>
  );
};

export default NotebookDetailView;