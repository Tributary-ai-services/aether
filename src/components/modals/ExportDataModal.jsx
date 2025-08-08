import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { 
  Download,
  FileText,
  Image,
  Film,
  Music,
  Database,
  Archive,
  CheckCircle,
  Circle,
  FileJson,
  FileCode,
  Package,
  AlertCircle,
  Info
} from 'lucide-react';

const ExportDataModal = ({ isOpen, onClose, notebook, notebooks }) => {
  const [selectedTypes, setSelectedTypes] = useState({
    documents: true,
    images: false,
    vectors: false,
    audio: false,
    video: false,
    metadata: false
  });
  
  const [exportFormat, setExportFormat] = useState('zip');
  const [includeOptions, setIncludeOptions] = useState({
    originalFiles: true,
    processedText: true,
    vectorEmbeddings: false,
    metadata: true,
    annotations: false,
    auditTrail: false
  });
  
  const [isExporting, setIsExporting] = useState(false);

  // Handle both single notebook and multiple notebooks cases
  const targetNotebooks = notebooks || (notebook ? [notebook] : []);
  if (!targetNotebooks || targetNotebooks.length === 0) return null;
  
  const isMultiple = targetNotebooks.length > 1;
  const notebookName = isMultiple ? `${targetNotebooks.length} notebooks` : targetNotebooks[0].name;

  const dataTypes = [
    { id: 'documents', label: 'Documents', icon: FileText, count: 156, size: '245 MB' },
    { id: 'images', label: 'Images', icon: Image, count: 89, size: '312 MB' },
    { id: 'vectors', label: 'Vector Embeddings', icon: Database, count: 1245, size: '78 MB' },
    { id: 'audio', label: 'Audio Files', icon: Music, count: 23, size: '189 MB' },
    { id: 'video', label: 'Video Files', icon: Film, count: 12, size: '1.2 GB' },
    { id: 'metadata', label: 'Metadata & Annotations', icon: FileJson, count: null, size: '12 MB' }
  ];

  const exportFormats = [
    { value: 'zip', label: 'ZIP Archive', description: 'Compressed archive with folder structure' },
    { value: 'json', label: 'JSON Export', description: 'Structured data in JSON format' },
    { value: 'csv', label: 'CSV Files', description: 'Tabular data for spreadsheets' },
    { value: 'parquet', label: 'Parquet Files', description: 'Optimized for data analysis' }
  ];

  const handleTypeToggle = (typeId) => {
    setSelectedTypes(prev => ({
      ...prev,
      [typeId]: !prev[typeId]
    }));
  };

  const handleOptionToggle = (optionId) => {
    setIncludeOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      console.log('Exporting data:', {
        notebook: notebook.name,
        selectedTypes,
        exportFormat,
        includeOptions
      });
      
      setIsExporting(false);
      onClose();
      
      // In a real implementation, this would trigger a download
      // or send an email with the export link
    }, 2000);
  };

  const getSelectedSize = () => {
    let totalSize = 0;
    dataTypes.forEach(type => {
      if (selectedTypes[type.id] && type.size) {
        const sizeNum = parseFloat(type.size);
        const unit = type.size.includes('GB') ? 1024 : 1;
        totalSize += sizeNum * unit;
      }
    });
    return totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)} GB` : `${totalSize.toFixed(0)} MB`;
  };

  const getSelectedCount = () => {
    let totalCount = 0;
    dataTypes.forEach(type => {
      if (selectedTypes[type.id] && type.count) {
        totalCount += type.count;
      }
    });
    return totalCount;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Notebook Data" size="lg">
      <div className="space-y-6">
        {/* Export Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 mt-1" size={20} />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Export Summary</h3>
              <p className="text-sm text-blue-700">
                Exporting data from {notebookName}. Selected items will be packaged according to your preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Data Types Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Select Data Types</h3>
          <div className="space-y-2">
            {dataTypes.map(type => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedTypes[type.id] 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTypeToggle(type.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedTypes[type.id] ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Icon size={20} className={
                          selectedTypes[type.id] ? 'text-blue-600' : 'text-gray-600'
                        } />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-500">
                          {type.count ? `${type.count} items • ` : ''}{type.size}
                        </div>
                      </div>
                    </div>
                    <div>
                      {selectedTypes[type.id] ? (
                        <CheckCircle size={20} className="text-blue-600" />
                      ) : (
                        <Circle size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Format */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Export Format</h3>
          <div className="grid grid-cols-2 gap-3">
            {exportFormats.map(format => (
              <label
                key={format.value}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  exportFormat === format.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value={format.value}
                  checked={exportFormat === format.value}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {exportFormat === format.value ? (
                      <CheckCircle size={16} className="text-blue-600" />
                    ) : (
                      <Circle size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{format.label}</div>
                    <div className="text-xs text-gray-500">{format.description}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Include Options */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Include Options</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeOptions.originalFiles}
                onChange={() => handleOptionToggle('originalFiles')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Original uploaded files</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeOptions.processedText}
                onChange={() => handleOptionToggle('processedText')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Processed/extracted text</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeOptions.vectorEmbeddings}
                onChange={() => handleOptionToggle('vectorEmbeddings')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Vector embeddings</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeOptions.metadata}
                onChange={() => handleOptionToggle('metadata')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">File metadata & properties</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeOptions.annotations}
                onChange={() => handleOptionToggle('annotations')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">User annotations & comments</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeOptions.auditTrail}
                onChange={() => handleOptionToggle('auditTrail')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Audit trail & activity logs</span>
            </label>
          </div>
        </div>

        {/* Export Summary Stats */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Selected items:</span>
            <span className="font-medium text-gray-900">{getSelectedCount()} files</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Estimated size:</span>
            <span className="font-medium text-gray-900">{getSelectedSize()}</span>
          </div>
        </div>

        {/* Warning for large exports */}
        {parseFloat(getSelectedSize()) > 500 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-yellow-600 mt-0.5" size={16} />
              <div className="text-sm text-yellow-800">
                Large export detected. This may take several minutes to complete.
                You'll receive an email notification when the export is ready.
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || getSelectedCount() === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export Data
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportDataModal;