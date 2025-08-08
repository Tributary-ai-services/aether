import React, { useState } from 'react';
import { Heart, Share2, Shield, Globe, Lock, Users, Tag, Calendar, FileText, Upload, Eye, AlertTriangle, Settings, ShieldCheck, UserCheck, CreditCard, CheckCircle, Database, Trash2 } from 'lucide-react';
import ShareDialog from '../collaboration/ShareDialog.jsx';

const NotebookCard = ({ notebook, onOpenDetail, onUploadDocuments, onOpenSettings, onDelete }) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dragOverDocuments, setDragOverDocuments] = useState(false);
  
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


  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get visibility icon and color
  const getVisibilityDisplay = (visibility) => {
    switch (visibility) {
      case 'public':
        return { icon: Globe, color: 'text-green-600', bg: 'bg-green-100 text-green-800' };
      case 'shared':
        return { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 text-blue-800' };
      default:
        return { icon: Lock, color: 'text-gray-600', bg: 'bg-gray-100 text-gray-800' };
    }
  };

  const visibilityInfo = getVisibilityDisplay(notebook.visibility);
  const VisibilityIcon = visibilityInfo.icon;

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setDragOverDocuments(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && onUploadDocuments) {
      // Pass files to the upload handler
      onUploadDocuments(notebook, files);
    }
  };

  // Document area specific handlers
  const handleDocumentDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDocuments(true);
  };

  const handleDocumentDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDocuments(false);
  };

  return (
  <div 
    className={`bg-white rounded-xl shadow-sm border p-6 transition-all cursor-pointer relative ${
      dragActive ? 'border-blue-500 border-2 shadow-lg bg-blue-50' : 'border-gray-200 hover:shadow-md'
    }`}
    onClick={onOpenDetail}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{notebook.name}</h3>
        {notebook.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notebook.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4">
        <VisibilityIcon size={16} className={visibilityInfo.color} />
        {onDelete && (
          <Trash2 
            size={16} 
            className="text-red-500 cursor-pointer hover:text-red-700" 
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to delete "${notebook.name}"? This action cannot be undone.`)) {
                onDelete(notebook);
              }
            }}
            title="Delete notebook"
          />
        )}
        {onOpenSettings && (
          <Settings 
            size={16} 
            className="text-gray-400 cursor-pointer hover:text-purple-600" 
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings(notebook);
            }}
            title="Notebook settings"
          />
        )}
        <Share2 
          size={16} 
          className="text-gray-400 cursor-pointer hover:text-blue-600" 
          onClick={(e) => {
            e.stopPropagation();
            setShareDialogOpen(true);
          }}
          title="Share notebook"
        />
      </div>
    </div>

    {/* Drag overlay for the entire card */}
    {dragActive && !dragOverDocuments && (
      <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-95 rounded-xl">
        <div className="text-center">
          <Upload size={48} className="text-blue-600 mx-auto mb-2" />
          <div className="text-blue-700 font-semibold">Drop files to upload</div>
          <div className="text-blue-600 text-sm">to {notebook.name}</div>
        </div>
      </div>
    )}

    {/* Tags */}
    {notebook.tags && notebook.tags.length > 0 && (
      <div className="flex gap-1 mb-3 flex-wrap">
        {notebook.tags.slice(0, 3).map(tag => (
          <div key={tag} className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 flex items-center gap-1">
            <Tag size={10} />
            {tag}
          </div>
        ))}
        {notebook.tags.length > 3 && (
          <div className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
            +{notebook.tags.length - 3} more
          </div>
        )}
      </div>
    )}

    {/* Compliance Framework Indicators */}
    {complianceSettings && (
      <div className="flex gap-1 mb-3 flex-wrap">
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
          <div className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 flex items-center gap-1" title="GDPR Compliance">
            <ShieldCheck size={10} />
            GDPR
          </div>
        )}
        
        {/* SOC 2 */}
        {complianceSettings.complianceFrameworks?.includes('SOC2') && (
          <div className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 flex items-center gap-1" title="SOC 2 Compliance">
            <CheckCircle size={10} />
            SOC2
          </div>
        )}
        
        {/* ISO 27001 */}
        {complianceSettings.complianceFrameworks?.includes('ISO27001') && (
          <div className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 flex items-center gap-1" title="ISO 27001 Compliance">
            <Database size={10} />
            ISO27001
          </div>
        )}
        
        {/* PCI DSS */}
        {complianceSettings.complianceFrameworks?.includes('PCI-DSS') && (
          <div className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 flex items-center gap-1" title="PCI DSS Compliance">
            <CreditCard size={10} />
            PCI-DSS
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

    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
        <Calendar size={12} />
        Last Updated
      </div>
      <div className="text-sm text-gray-700">{formatDate(notebook.updatedAt)}</div>
    </div>
    
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div 
        className={`text-center p-3 rounded-lg transition-all relative ${
          dragOverDocuments 
            ? 'bg-blue-200 border-2 border-dashed border-blue-500' 
            : 'bg-blue-50 hover:bg-blue-100'
        }`}
        onDragOver={handleDocumentDragOver}
        onDragLeave={handleDocumentDragLeave}
        onClick={(e) => {
          e.stopPropagation();
          if (onUploadDocuments) {
            onUploadDocuments(notebook);
          }
        }}
        title="Click or drag files here to upload documents"
      >
        <div className="text-2xl font-bold text-blue-600">{notebook.documentCount || 0}</div>
        <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
          <FileText size={12} />
          Documents
        </div>
        {dragOverDocuments && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-90 rounded-lg">
            <div className="text-blue-600 font-medium text-sm">Drop files here</div>
          </div>
        )}
      </div>
      <div className="text-center p-3 bg-purple-50 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">{notebook.children?.length || 0}</div>
        <div className="text-sm text-gray-600">Sub-notebooks</div>
      </div>
    </div>
    
    <div className="flex justify-between items-center">
      <span className={`px-2 py-1 rounded-full text-xs ${visibilityInfo.bg}`}>
        {notebook.visibility}
      </span>
      <div className="flex items-center gap-2">
        {onUploadDocuments && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onUploadDocuments(notebook);
            }}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            title="Upload documents to this notebook"
          >
            <Upload size={14} />
            Upload
          </button>
        )}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail();
          }}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Open →
        </button>
      </div>
    </div>

    <ShareDialog
      isOpen={shareDialogOpen}
      onClose={() => setShareDialogOpen(false)}
      resourceId={notebook.id || '1'}
      resourceType="notebook"
      resourceName={notebook.name}
    />
  </div>
  );
};

export default NotebookCard;