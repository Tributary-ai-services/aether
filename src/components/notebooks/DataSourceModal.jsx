import React, { useState, useCallback } from 'react';
import { X, Upload, Globe, Database, Folder, ExternalLink, FileText, AlertCircle, Cloud } from 'lucide-react';
import { TextInputSource, WebScrapingSource, DatabaseSource } from './data-sources/index.js';

// Source type constants
const SOURCE_TYPES = {
  FILE_UPLOAD: 'file-upload',
  GOOGLE_DRIVE: 'google-drive',
  WEB_SCRAPING: 'web-scraping',
  DATABASE: 'database',
  API_INTEGRATION: 'api-integration',
  TEXT_INPUT: 'text-input',
  CLOUD_STORAGE: 'cloud-storage',
};

const DataSourceModal = ({
  isOpen,
  onClose,
  notebook,
  onSelectFileUpload,
  onSelectGoogleDrive,
  onSelectWebScraping,
  onSelectDatabase,
  onDocumentAdded
}) => {
  // Current view state - null means show source selection, otherwise show the source component
  const [activeSource, setActiveSource] = useState(null);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setActiveSource(null);
    onClose();
  }, [onClose]);

  // Handle going back to source selection
  const handleBack = useCallback(() => {
    setActiveSource(null);
  }, []);

  // Handle successful document addition
  const handleSuccess = useCallback((document) => {
    if (onDocumentAdded) {
      onDocumentAdded(document);
    }
  }, [onDocumentAdded]);

  if (!isOpen) return null;

  // Data source definitions
  const dataSources = [
    {
      id: SOURCE_TYPES.FILE_UPLOAD,
      name: 'File Upload',
      description: 'Upload documents from your computer',
      icon: Upload,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      borderColor: 'border-blue-200',
      available: true,
      onClick: () => {
        // File upload uses external handler (opens file picker)
        onSelectFileUpload();
        handleClose();
      }
    },
    {
      id: SOURCE_TYPES.TEXT_INPUT,
      name: 'Text Input',
      description: 'Manually enter or paste text content',
      icon: FileText,
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
      hoverColor: 'hover:bg-gray-100',
      borderColor: 'border-gray-200',
      available: true,
      onClick: () => setActiveSource(SOURCE_TYPES.TEXT_INPUT)
    },
    {
      id: SOURCE_TYPES.WEB_SCRAPING,
      name: 'Web Scraping',
      description: 'Extract content from web pages',
      icon: Globe,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      borderColor: 'border-purple-200',
      available: true,
      onClick: () => setActiveSource(SOURCE_TYPES.WEB_SCRAPING)
    },
    {
      id: SOURCE_TYPES.GOOGLE_DRIVE,
      name: 'Google Drive',
      description: 'Import files from your Google Drive',
      icon: Folder,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      borderColor: 'border-green-200',
      available: false, // Phase 2
      onClick: onSelectGoogleDrive
    },
    {
      id: SOURCE_TYPES.DATABASE,
      name: 'Database',
      description: 'Connect to SQL databases and data sources',
      icon: Database,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100',
      borderColor: 'border-orange-200',
      available: true,
      onClick: () => setActiveSource(SOURCE_TYPES.DATABASE)
    },
    {
      id: SOURCE_TYPES.CLOUD_STORAGE,
      name: 'Cloud Storage',
      description: 'Connect to S3, Azure Blob, or Google Cloud Storage',
      icon: Cloud,
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      hoverColor: 'hover:bg-cyan-100',
      borderColor: 'border-cyan-200',
      available: false, // Phase 3
      onClick: () => {}
    },
    {
      id: SOURCE_TYPES.API_INTEGRATION,
      name: 'API Integration',
      description: 'Connect to external APIs and services',
      icon: ExternalLink,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:bg-indigo-100',
      borderColor: 'border-indigo-200',
      available: false, // Phase 4
      onClick: () => {}
    }
  ];

  const handleSourceSelect = (source) => {
    if (!source.available) return;
    source.onClick();
  };

  // Render the active source component
  const renderActiveSource = () => {
    switch (activeSource) {
      case SOURCE_TYPES.TEXT_INPUT:
        return (
          <TextInputSource
            notebook={notebook}
            onBack={handleBack}
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        );

      case SOURCE_TYPES.WEB_SCRAPING:
        return (
          <WebScrapingSource
            notebook={notebook}
            onBack={handleBack}
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        );

      case SOURCE_TYPES.DATABASE:
        return (
          <DatabaseSource
            notebook={notebook}
            onBack={handleBack}
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        );

      // Future phases will add more cases here
      default:
        return null;
    }
  };

  // Render source selection grid
  const renderSourceSelection = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Add Data Source</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose how you want to add content to "{notebook?.name || 'this notebook'}"
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataSources.map((source) => {
            const IconComponent = source.icon;
            return (
              <button
                key={source.id}
                onClick={() => handleSourceSelect(source)}
                disabled={!source.available}
                className={`
                  p-4 border rounded-lg transition-all text-left relative
                  ${source.available
                    ? `${source.bgColor} ${source.borderColor} ${source.hoverColor} cursor-pointer`
                    : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                  }
                `}
              >
                {!source.available && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Coming Soon
                    </span>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <div className={`
                    p-2 rounded-lg
                    ${source.available ? source.bgColor : 'bg-gray-100'}
                  `}>
                    <IconComponent className={`
                      w-5 h-5
                      ${source.available ? source.iconColor : 'text-gray-400'}
                    `} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`
                      font-medium
                      ${source.available ? 'text-gray-900' : 'text-gray-500'}
                    `}>
                      {source.name}
                    </h3>
                    <p className={`
                      text-sm mt-1
                      ${source.available ? 'text-gray-600' : 'text-gray-400'}
                    `}>
                      {source.description}
                    </p>

                    {!source.available && (
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Will be available in a future release
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 text-sm">Data Source Options</h4>
              <p className="text-blue-700 text-sm mt-1">
                <strong>File Upload</strong>, <strong>Text Input</strong>, <strong>Web Scraping</strong>, and <strong>Database</strong> connections are now available.
                More integrations including Google Drive and cloud storage are coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end p-6 border-t border-gray-200">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {activeSource ? renderActiveSource() : renderSourceSelection()}
      </div>
    </div>
  );
};

export default DataSourceModal;
