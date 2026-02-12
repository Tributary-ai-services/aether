import React, { useState, useRef, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal.jsx';
import { aetherApi } from '../../services/aetherApi.js';
import UploadSummaryModal from './UploadSummaryModal';
import { useAppDispatch } from '../../store/index.js';
import { fetchNotebooks } from '../../store/slices/notebooksSlice.js';
import {
  Upload,
  File,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Folder,
  Plus,
  Trash2,
  Shield,
  Eye,
  Presentation,
  Table,
  Mail
} from 'lucide-react';

const DocumentUploadModal = ({ isOpen, onClose, notebook, preSelectedFiles = null }) => {
  const dispatch = useAppDispatch();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const fileInputRef = useRef(null);
  const pollIntervalsRef = useRef({});
  const pollStartTimesRef = useRef({});

  const POLL_INTERVAL_MS = 3000;
  const MAX_POLL_DURATION_MS = 10 * 60 * 1000; // 10 minutes

  // Cleanup all polling intervals on unmount or modal close
  useEffect(() => {
    return () => {
      Object.values(pollIntervalsRef.current).forEach(clearInterval);
      pollIntervalsRef.current = {};
      pollStartTimesRef.current = {};
    };
  }, []);

  // Stop polling when modal closes
  useEffect(() => {
    if (!isOpen) {
      Object.values(pollIntervalsRef.current).forEach(clearInterval);
      pollIntervalsRef.current = {};
      pollStartTimesRef.current = {};
    }
  }, [isOpen]);

  // Start polling for a specific file's processing status
  const startStatusPolling = useCallback((fileId, documentId) => {
    // Don't start duplicate polling
    if (pollIntervalsRef.current[fileId]) return;

    pollStartTimesRef.current[fileId] = Date.now();

    const interval = setInterval(async () => {
      // Check for timeout
      const elapsed = Date.now() - pollStartTimesRef.current[fileId];
      if (elapsed > MAX_POLL_DURATION_MS) {
        clearInterval(pollIntervalsRef.current[fileId]);
        delete pollIntervalsRef.current[fileId];
        delete pollStartTimesRef.current[fileId];
        setFiles(prev => prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'error', errors: ['Processing timed out'], statusText: 'Processing timed out' }
            : f
        ));
        return;
      }

      try {
        const response = await aetherApi.documents.getStatus(documentId);
        const statusData = response.data || response;
        const backendStatus = statusData.status;
        const progress = statusData.progress || 0;

        if (backendStatus === 'processed') {
          clearInterval(pollIntervalsRef.current[fileId]);
          delete pollIntervalsRef.current[fileId];
          delete pollStartTimesRef.current[fileId];
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          setFiles(prev => prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'completed', statusText: 'Processing complete' }
              : f
          ));
        } else if (backendStatus === 'failed') {
          clearInterval(pollIntervalsRef.current[fileId]);
          delete pollIntervalsRef.current[fileId];
          delete pollStartTimesRef.current[fileId];
          setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
          setFiles(prev => prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'error', errors: ['Document processing failed'], statusText: 'Processing failed' }
              : f
          ));
        } else if (backendStatus === 'processing') {
          setUploadProgress(prev => ({ ...prev, [fileId]: Math.max(prev[fileId] || 0, 50) }));
          setFiles(prev => prev.map(f =>
            f.id === fileId
              ? { ...f, statusText: 'Processing document...' }
              : f
          ));
        } else if (backendStatus === 'uploading') {
          setUploadProgress(prev => ({ ...prev, [fileId]: Math.max(prev[fileId] || 0, 30) }));
          setFiles(prev => prev.map(f =>
            f.id === fileId
              ? { ...f, statusText: 'Uploading to storage...' }
              : f
          ));
        }
      } catch (err) {
        console.warn(`Failed to poll status for document ${documentId}:`, err);
        // Don't stop polling on transient errors — just log and retry
      }
    }, POLL_INTERVAL_MS);

    pollIntervalsRef.current[fileId] = interval;
  }, []);

  // Helper function to format file sizes
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle pre-selected files when modal opens
  React.useEffect(() => {
    if (isOpen && preSelectedFiles && preSelectedFiles.length > 0) {
      handleFileSelect(preSelectedFiles);
    } else if (!isOpen) {
      // Clear files when modal closes
      setFiles([]);
      setUploadProgress({});
    }
  }, [isOpen, preSelectedFiles]);

  const supportedFormats = {
    documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.html', '.htm', '.xhtml'],
    spreadsheets: ['.xlsx', '.xls', '.csv', '.tsv'],
    presentations: ['.pptx', '.ppt'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff'],
    videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
    email: ['.eml', '.msg', '.pst'],
    archives: ['.zip'],
    data: ['.json', '.xml', '.yaml', '.sql'],
    microsoft: ['.one']
  };

  const maxFileSize = 100 * 1024 * 1024; // 100MB
  const maxFiles = 50;

  const getFileIcon = (type) => {
    const extension = type.toLowerCase();
    if (supportedFormats.documents.some(ext => extension.includes(ext.slice(1)))) {
      return <FileText size={20} className="text-red-600" />;
    }
    if (supportedFormats.presentations.some(ext => extension.includes(ext.slice(1)))) {
      return <Presentation size={20} className="text-orange-600" />;
    }
    if (supportedFormats.spreadsheets.some(ext => extension.includes(ext.slice(1)))) {
      return <Table size={20} className="text-green-700" />;
    }
    if (supportedFormats.images.some(ext => extension.includes(ext.slice(1)))) {
      return <Image size={20} className="text-green-600" />;
    }
    if (supportedFormats.videos.some(ext => extension.includes(ext.slice(1)))) {
      return <Film size={20} className="text-(--color-primary-600)" />;
    }
    if (supportedFormats.audio.some(ext => extension.includes(ext.slice(1)))) {
      return <Music size={20} className="text-purple-600" />;
    }
    if (supportedFormats.email.some(ext => extension.includes(ext.slice(1)))) {
      return <Mail size={20} className="text-blue-600" />;
    }
    return <Archive size={20} className="text-gray-600" />;
  };

  const validateFile = (file) => {
    const errors = [];
    
    if (file.size > maxFileSize) {
      errors.push(`File size exceeds ${formatFileSize(maxFileSize)} limit`);
    }

    // Basic format validation
    const fileName = file.name.toLowerCase();
    const allFormats = [
      ...supportedFormats.documents,
      ...supportedFormats.presentations,
      ...supportedFormats.spreadsheets,
      ...supportedFormats.images,
      ...supportedFormats.videos,
      ...supportedFormats.audio,
      ...supportedFormats.email,
      ...supportedFormats.archives,
      ...supportedFormats.data,
      ...supportedFormats.microsoft
    ];
    
    const isSupported = allFormats.some(ext => fileName.endsWith(ext));
    if (!isSupported) {
      errors.push('File format not supported');
    }

    return { errors };
  };

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    
    if (files.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    fileArray.forEach(file => {
      const validation = validateFile(file);
      if (validation.errors.length === 0) {
        validFiles.push({
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          errors: [],
          progress: 0
        });
      } else {
        // Still add invalid files to show errors
        validFiles.push({
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error',
          errors: validation.errors,
          progress: 0
        });
      }
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = (fileId) => {
    // Stop polling for this file if active
    if (pollIntervalsRef.current[fileId]) {
      clearInterval(pollIntervalsRef.current[fileId]);
      delete pollIntervalsRef.current[fileId];
      delete pollStartTimesRef.current[fileId];
    }
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data URL prefix to get just the base64 string
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // NEW BASE64 UPLOAD FLOW: Frontend -> Aether-BE -> Storage
  const handleUpload = async () => {
    const validFiles = files.filter(f => f.status === 'pending');
    
    if (validFiles.length === 0) {
      alert('No valid files to upload');
      return;
    }

    setUploading(true);

    try {
      console.log(`Starting base64 upload of ${validFiles.length} files to notebook: ${notebook.name}`);
      
      // Update all valid files to uploading status
      setFiles(prev => prev.map(f => 
        f.status === 'pending' 
          ? { ...f, status: 'uploading' }
          : f
      ));

      // Upload files via Aether Backend using base64 encoding
      const uploadPromises = validFiles.map(async (fileData) => {
        console.log(`Uploading ${fileData.name} via Aether Backend (base64)`);
        
        try {
          // Update progress - encoding
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: 5
          }));

          setFiles(prev => prev.map(f => 
            f.id === fileData.id 
              ? { ...f, statusText: 'Encoding file...' }
              : f
          ));

          // Convert file to base64
          const fileContent = await fileToBase64(fileData.file);

          // Update progress - uploading
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: 20
          }));

          setFiles(prev => prev.map(f => 
            f.id === fileData.id 
              ? { ...f, statusText: 'Uploading to Aether Backend...' }
              : f
          ));

          // Ensure space context is set for upload - use default personal space if none exists
          let spaceContext = null;
          const savedSpace = localStorage.getItem('currentSpace');
          if (savedSpace) {
            try {
              const currentSpace = JSON.parse(savedSpace);
              if (currentSpace && currentSpace.space_type && currentSpace.space_id) {
                spaceContext = currentSpace;
              }
            } catch (e) {
              console.warn('Failed to parse space context:', e);
            }
          }
          
          // Fallback: Create default personal space context if none exists
          if (!spaceContext) {
            spaceContext = {
              space_type: 'personal',
              space_id: '00000000-0000-0000-0000-000000000000', // Default personal space ID
              tenant_id: 'default'
            };
            localStorage.setItem('currentSpace', JSON.stringify(spaceContext));
            console.log('Created default space context for upload:', spaceContext);
          }
          
          console.log('Upload debug - Space context:', spaceContext);

          // Get compliance settings from notebook (parse if string)
          let complianceSettings = notebook.complianceSettings || notebook.compliance_settings || {};
          if (typeof complianceSettings === 'string') {
            try {
              complianceSettings = JSON.parse(complianceSettings);
            } catch (e) {
              console.warn('Failed to parse compliance settings:', e);
              complianceSettings = {};
            }
          }

          // Prepare base64 upload payload with compliance settings
          const uploadPayload = {
            name: fileData.name,
            description: `Uploaded document: ${fileData.name}`,
            notebook_id: notebook.id,
            file_name: fileData.name,
            mime_type: fileData.type || 'application/octet-stream',
            file_content: fileContent,
            tags: [`notebook:${notebook.name.replace(/\s+/g, '_').toLowerCase()}`, 'document'],
            // Include compliance settings for DLP scanning and redaction
            compliance_settings: {
              dlp_scan_enabled: complianceSettings.piiDetection !== false,
              redaction_mode: complianceSettings.redactionMode || 'mask',
              hipaa_compliant: complianceSettings.hipaaCompliant || false,
              pii_detection: complianceSettings.piiDetection !== false,
              compliance_frameworks: complianceSettings.complianceFrameworks || []
            }
          };

          console.log('Upload debug - Base64 payload:', {
            name: uploadPayload.name,
            description: uploadPayload.description,
            notebook_id: uploadPayload.notebook_id,
            file_name: uploadPayload.file_name,
            mime_type: uploadPayload.mime_type,
            tags: uploadPayload.tags,
            file_content_length: uploadPayload.file_content.length
          });

          // Upload to aether-be /documents/upload-base64 endpoint
          const uploadResult = await aetherApi.documents.uploadBase64(uploadPayload);
          const resultData = uploadResult.data || uploadResult;
          const documentId = resultData.id;

          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: 30
          }));

          setFiles(prev => prev.map(f =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'uploading',
                  statusText: 'Uploaded — waiting for processing...',
                  uploadResult: resultData,
                  documentId: documentId
                }
              : f
          ));

          console.log(`File uploaded successfully via Aether Backend (base64):`, resultData);

          // Start polling for processing status
          if (documentId) {
            startStatusPolling(fileData.id, documentId);
          } else {
            // No document ID returned — mark as completed immediately
            setUploadProgress(prev => ({ ...prev, [fileData.id]: 100 }));
            setFiles(prev => prev.map(f =>
              f.id === fileData.id
                ? { ...f, status: 'completed', statusText: 'Upload complete' }
                : f
            ));
          }

          return resultData;

        } catch (error) {
          console.error(`Failed to upload ${fileData.name} via Aether Backend (base64):`, error);

          setFiles(prev => prev.map(f =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'error',
                  errors: [error.message || 'Upload failed'],
                  statusText: 'Upload failed'
                }
              : f
          ));
          // Enrich error with file context so UploadSummaryModal can display it
          const enrichedError = new Error(error.message || 'Upload failed');
          enrichedError.fileName = fileData.name;
          enrichedError.fileSize = fileData.size;
          enrichedError.originalError = error;
          throw enrichedError;
        }
      });

      // Wait for all uploads to complete
      const uploadResults = await Promise.allSettled(uploadPromises);
      const successfulUploads = uploadResults.filter(result => result.status === 'fulfilled');
      const failedUploads = uploadResults.filter(result => result.status === 'rejected');

      console.log(`Base64 upload complete: ${successfulUploads.length} successful, ${failedUploads.length} failed`);

      // Store results and show summary modal
      setTimeout(() => {
        setUploadResults(uploadResults);
        setShowSummaryModal(true);
        setUploading(false);
        
        // Refresh notebook data to update document counts
        dispatch(fetchNotebooks());
      }, 1000);

    } catch (error) {
      console.error('Base64 upload session failed:', error);
      
      // Update any remaining uploading files to error status
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' 
          ? { ...f, status: 'error', errors: [error.message || 'Base64 upload session failed'] }
          : f
      ));
      
      alert(`Upload failed: ${error.message}\\n\\nPlease check your connection and try again.`);
      
    } finally {
      setUploading(false);
    }
  };

  const isFileInProgress = (status) => status === 'uploading' || status === 'processing';

  const getStatusIcon = (status, progress) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-gray-500" />;
      case 'uploading':
      case 'processing':
        return (
          <div className="w-4 h-4 border-2 border-(--color-primary-500) border-t-transparent rounded-full animate-spin" />
        );
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const validFiles = files.filter(f => f.status !== 'error');
  const errorFiles = files.filter(f => f.status === 'error');

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={`Upload Documents to ${notebook?.name}`} size="large">
      <div className="p-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-(--color-primary-500) bg-(--color-primary-50)' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Support for documents, images, videos, audio, and data files
          </p>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors"
            disabled={uploading}
          >
            <Plus size={16} className="inline mr-2" />
            Select Files
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />
        </div>


        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                Selected Files ({files.length})
              </h4>
              <button
                onClick={() => setFiles([])}
                className="text-sm text-red-600 hover:text-red-800"
                disabled={uploading}
              >
                Clear All
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {files.map(fileData => (
                <div
                  key={fileData.id}
                  className={`flex items-center gap-4 p-3 border-b border-gray-100 last:border-b-0 ${
                    fileData.status === 'error' ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(fileData.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileData.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(fileData.status, uploadProgress[fileData.id])}
                        {!uploading && (
                          <button
                            onClick={() => removeFile(fileData.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileData.size)}
                        </p>
                        {isFileInProgress(fileData.status) && (
                          <div className="text-xs text-(--color-primary-600) font-medium">
                            {Math.round(uploadProgress[fileData.id] || 0)}%
                            {fileData.statusText && (
                              <span className="text-xs text-gray-600 ml-1">
                                - {fileData.statusText}
                              </span>
                            )}
                          </div>
                        )}
                        {fileData.status === 'completed' && fileData.statusText && (
                          <span className="text-xs text-green-600 font-medium">
                            {fileData.statusText}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {isFileInProgress(fileData.status) && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-(--color-primary-600) h-1 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[fileData.id] || 0}%` }}
                        />
                      </div>
                    )}

                    {/* Errors */}
                    {fileData.errors.length > 0 && (
                      <div className="mt-2">
                        {fileData.errors.map((error, index) => (
                          <p key={index} className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Summary */}
        {files.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <p className="mb-2">Ready to upload: <strong>{validFiles.length}</strong> files</p>
              {errorFiles.length > 0 && (
                <p className="text-red-600">Files with errors: <strong>{errorFiles.length}</strong></p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end items-center pt-6 border-t border-gray-200 mt-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
              disabled={validFiles.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading (Base64)...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload {validFiles.length} Files
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>

    {/* Upload Summary Modal */}
    <UploadSummaryModal
      isOpen={showSummaryModal}
      onClose={() => {
        setShowSummaryModal(false);
        setUploadResults([]);
        // Stop any active polling
        Object.values(pollIntervalsRef.current).forEach(clearInterval);
        pollIntervalsRef.current = {};
        pollStartTimesRef.current = {};
        onClose();
        setFiles([]);
        setUploadProgress({});
        // Refresh notebook data again when summary modal closes
        dispatch(fetchNotebooks());
      }}
      uploadResults={uploadResults}
      notebookName={notebook?.name || 'Unknown'}
    />
    </>
  );
};

export default DocumentUploadModal;