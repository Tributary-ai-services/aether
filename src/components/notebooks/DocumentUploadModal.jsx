import React, { useState, useRef } from 'react';
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
  Eye
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
    documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
    videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
    data: ['.csv', '.xlsx', '.json', '.xml', '.yaml', '.sql']
  };

  const maxFileSize = 100 * 1024 * 1024; // 100MB
  const maxFiles = 50;

  const getFileIcon = (type) => {
    const extension = type.toLowerCase();
    if (supportedFormats.documents.some(ext => extension.includes(ext.slice(1)))) {
      return <FileText size={20} className="text-red-600" />;
    }
    if (supportedFormats.images.some(ext => extension.includes(ext.slice(1)))) {
      return <Image size={20} className="text-green-600" />;
    }
    if (supportedFormats.videos.some(ext => extension.includes(ext.slice(1)))) {
      return <Film size={20} className="text-blue-600" />;
    }
    if (supportedFormats.audio.some(ext => extension.includes(ext.slice(1)))) {
      return <Music size={20} className="text-purple-600" />;
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
      ...supportedFormats.images,
      ...supportedFormats.videos,
      ...supportedFormats.audio,
      ...supportedFormats.data
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

          // Prepare base64 upload payload
          const uploadPayload = {
            name: fileData.name,
            description: `Uploaded document: ${fileData.name}`,
            notebook_id: notebook.id,
            file_name: fileData.name,
            mime_type: fileData.type || 'application/octet-stream',
            file_content: fileContent,
            tags: [`notebook:${notebook.name.replace(/\s+/g, '_').toLowerCase()}`, 'document']
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
          
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: 100
          }));

          setFiles(prev => prev.map(f => 
            f.id === fileData.id 
              ? { 
                  ...f, 
                  status: 'completed', 
                  statusText: 'Upload complete',
                  uploadResult: uploadResult.data
                }
              : f
          ));

          console.log(`File uploaded successfully via Aether Backend (base64):`, uploadResult.data);
          return uploadResult.data;

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
          throw error;
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

  const getStatusIcon = (status, progress) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-gray-500" />;
      case 'uploading':
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
              ? 'border-blue-500 bg-blue-50' 
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                        {fileData.status === 'uploading' && (
                          <div className="text-xs text-blue-600 font-medium">
                            {Math.round(uploadProgress[fileData.id] || 0)}%
                            {fileData.statusText && (
                              <span className="text-xs text-gray-600 ml-1">
                                - {fileData.statusText}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {fileData.status === 'uploading' && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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