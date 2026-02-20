import React, { useState, useEffect, useRef } from 'react';
import { useFilters } from '../context/FilterContext.jsx';
import { useSpace } from '../hooks/useSpaces.js';
import { aetherApi } from '../services/aetherApi.js';
import {
  useAppDispatch,
  useAppSelector,
  fetchNotebooks,
  createNotebook as createNotebookAction,
  updateNotebook as updateNotebookAction,
  deleteNotebook as deleteNotebookAction,
  setSelectedNotebook,
  updateNotebookDocumentCount,
  fetchNotebookDocuments,
  selectAllDocuments,
  selectDocumentsLoading,
  openModal,
  closeModal,
  setViewMode,
  addNotification
} from '../store/index.js';
import NotebookCard from '../components/cards/NotebookCard.jsx';
import NotebookDetailModal from '../components/modals/NotebookDetailModal.jsx';
import ExportDataModal from '../components/modals/ExportDataModal.jsx';
import ContentsViewModal from '../components/modals/ContentsViewModal.jsx';
import CreateNotebookModal from '../components/notebooks/CreateNotebookModal.jsx';
import NotebookTreeView from '../components/notebooks/NotebookTreeView.jsx';
import NotebookDetailView from '../components/notebooks/NotebookDetailView.jsx';
import DocumentUploadModal from '../components/notebooks/DocumentUploadModal.jsx';
import NotebookSettingsModal from '../components/notebooks/NotebookSettingsModal.jsx';
import NotebookManager from '../components/notebooks/NotebookManager.jsx';
import ShareDialog from '../components/collaboration/ShareDialog.jsx';
import ShareNotebookModal from '../components/notebooks/ShareNotebookModal.jsx';
import DocumentAnalysisModal from '../components/modals/DocumentAnalysisModal.jsx';
import DataSourceModal from '../components/notebooks/DataSourceModal.jsx';
import ProducersList from '../components/notebooks/ProducersList.jsx';
import ProductionsList from '../components/notebooks/ProductionsList.jsx';
import ProducerExecutionModal from '../components/notebooks/ProducerExecutionModal.jsx';
import ProductionViewer from '../components/notebooks/ProductionViewer.jsx';
import DocumentsManagementModal from '../components/notebooks/DocumentsManagementModal.jsx';
import ProducersManagementModal from '../components/notebooks/ProducersManagementModal.jsx';
import { fetchNotebookProductions, deleteProduction, fetchNotebookProducers, selectSortedProducers } from '../store/slices/producersSlice.js';
import { LoadingWrapper, NotebookCardSkeleton } from '../components/skeletons/index.js';
import { FolderTree, Grid, Plus, Settings, AlertCircle, Share2, Download, ChevronLeft, ChevronRight, GripVertical, FileText, Trash2, BarChart3, Upload, Folder, CheckCircle2, Clock, XCircle, Circle, Square, CheckSquare, DownloadCloud, Eye, X, File, Image, Code, Settings2 } from 'lucide-react';

// Document Preview Modal Component
const DocumentPreviewModal = ({ document, isOpen, onClose }) => {
  const [documentDetails, setDocumentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (isOpen && document && document.id) {
      fetchDocumentDetails();
    }
  }, [isOpen, document]);

  const fetchDocumentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aetherApi.documents.getById(document.id);
      let docData = result.data;

      // If it's an image, load the image preview
      const mimeType = docData.mime_type || '';
      if (mimeType.startsWith('image/')) {
        loadImagePreview(document.id);
      }

      // If document is processed but has no extracted_text, fetch it from audimodal
      if (docData.status === 'processed' && !docData.extracted_text) {
        try {
          const textResult = await aetherApi.documents.getExtractedText(document.id);
          if (textResult?.data?.extracted_text) {
            docData = { ...docData, extracted_text: textResult.data.extracted_text };
          }
        } catch (textErr) {
          console.warn('Failed to fetch extracted text:', textErr);
          // Don't fail the whole request, just continue without text
        }
      }

      setDocumentDetails(docData);
    } catch (err) {
      setError(err.message || 'Failed to load document details');
      console.error('Failed to fetch document details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadImagePreview = async (documentId) => {
    setImageLoading(true);
    try {
      const blob = await aetherApi.downloadDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (err) {
      console.error('Failed to load image preview:', err);
    } finally {
      setImageLoading(false);
    }
  };

  // Clean up image URL when component unmounts or document changes
  useEffect(() => {
    return () => {
      if (imageUrl) {
        window.URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (mimeType, type) => {
    if (!mimeType && !type) return <File size={24} className="text-gray-500" />;
    
    const mime = (mimeType || '').toLowerCase();
    const docType = (type || '').toLowerCase();
    
    if (mime.startsWith('image/') || docType === 'image') {
      return <Image size={24} className="text-blue-500" />;
    }
    if (mime.includes('pdf') || docType === 'pdf') {
      return <FileText size={24} className="text-red-500" />;
    }
    if (mime.includes('text/') || mime.includes('json') || docType === 'text') {
      return <Code size={24} className="text-green-500" />;
    }
    return <File size={24} className="text-gray-500" />;
  };

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--color-primary-600)"></div>
          <span className="ml-2 text-gray-600">Loading preview...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Preview Error</p>
            <p className="text-gray-600 text-sm">{error}</p>
            <button 
              onClick={fetchDocumentDetails}
              className="mt-3 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded hover:bg-(--color-primary-700)"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (!documentDetails) return null;

    const extractedText = documentDetails.extracted_text;
    const hasText = extractedText && extractedText.trim().length > 0;
    const mimeType = documentDetails.mime_type || '';
    const isImage = mimeType.startsWith('image/');

    return (
      <div className="space-y-4">
        {/* Document Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            {getFileTypeIcon(documentDetails.mime_type, documentDetails.type)}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {documentDetails.original_name || documentDetails.name || 'Unknown file'}
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                {documentDetails.mime_type && (
                  <div>Type: {documentDetails.mime_type}</div>
                )}
                {documentDetails.size_bytes && (
                  <div>Size: {formatFileSize(documentDetails.size_bytes)}</div>
                )}
                {documentDetails.status && (
                  <div>Status: <span className="capitalize">{documentDetails.status}</span></div>
                )}
                {documentDetails.created_at && (
                  <div>Created: {new Date(documentDetails.created_at).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div>
          <h5 className="font-medium text-gray-900 mb-2">Preview</h5>
          {isImage ? (
            <div className="bg-white border rounded-lg p-4">
              <div className="text-center">
                {imageLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--color-primary-600)"></div>
                    <span className="ml-2 text-gray-600">Loading image...</span>
                  </div>
                ) : imageUrl ? (
                  <img 
                    src={imageUrl}
                    alt={documentDetails.original_name || 'Document preview'}
                    className="max-w-full max-h-96 mx-auto rounded shadow-sm border"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-2">
                      <Image size={48} className="mx-auto" />
                    </div>
                    <p className="text-gray-600">Image preview failed</p>
                    <p className="text-gray-500 text-sm">Unable to load image preview</p>
                    <button 
                      onClick={() => loadImagePreview(documentDetails.id)}
                      className="mt-2 px-3 py-1 bg-(--color-primary-600) text-(--color-primary-contrast) text-sm rounded hover:bg-(--color-primary-700)"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : hasText ? (
            <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="mb-2 text-xs text-gray-500 flex justify-between items-center">
                <span>Extracted Text Content</span>
                <span>{extractedText.length} characters</span>
              </div>
              <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                {extractedText.substring(0, 10000)}
                {extractedText.length > 10000 && (
                  <div className="mt-4 p-2 bg-gray-50 rounded text-center">
                    <span className="text-gray-500 text-sm">
                      ... {extractedText.length - 10000} more characters (showing first 10,000)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <FileText size={48} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No text content available</p>
              <p className="text-gray-500 text-sm mb-3">
                {isImage 
                  ? 'This is an image file. Text extraction may not be available.'
                  : 'Text extraction may be in progress or this file type may not support text extraction.'
                }
              </p>
              {documentDetails.status === 'processing' && (
                <div className="inline-flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-(--color-primary-600)"></div>
                  <span className="text-sm">Processing document...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Debug Info (only in dev mode) */}
        {window.location.hostname === 'localhost' && (
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(documentDetails, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Document Preview
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6 h-full overflow-y-auto">
            {renderPreviewContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotebooksPage = () => {
  // Utility function to format file sizes
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status icon and color for document
  const getStatusIcon = (status, document = {}) => {
    const normalizedStatus = (status || '').toLowerCase();
    
    // Check if document has placeholder data (indicates waiting for real AI processing)
    const hasPlaceholderData = document.extractedText && 
      (document.extractedText.includes('File uploaded to AudiModal') || 
       document.extractedText.includes('Status: discovered') ||
       (document.processingTime === 100 && normalizedStatus === 'processed')); // Hardcoded placeholder time
    
    if (['completed', 'processed', 'discovered', 'ready'].includes(normalizedStatus)) {
      if (hasPlaceholderData) {
        // Document is marked as processed but has placeholder data - awaiting real AI results
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          tooltip: 'AI Processing - Awaiting Results',
          isProcessing: true
        };
      } else {
        // Document has real AI processing results
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          tooltip: 'AI Analysis Complete'
        };
      }
    } else if (['processing', 'indexing', 'uploading'].includes(normalizedStatus)) {
      return {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        tooltip: 'Processing',
        isProcessing: true
      };
    } else if (['failed', 'error'].includes(normalizedStatus)) {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        tooltip: 'Processing Failed'
      };
    } else {
      return {
        icon: Circle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        tooltip: status || 'Unknown Status'
      };
    }
  };

  // Redux selectors
  const dispatch = useAppDispatch();
  const {
    data: notebooks,
    tree: notebookTree,
    loading,
    error,
    selectedNotebook,
    metadata
  } = useAppSelector(state => state.notebooks);

  // Documents from Redux
  const notebookDocuments = useAppSelector(selectAllDocuments);
  const loadingDocuments = useAppSelector(selectDocumentsLoading);

  const {
    modals,
    viewMode: currentViewMode
  } = useAppSelector(state => state.ui);
  
  const { filterNotebooks } = useFilters();
  
  // Space context
  const { currentSpace, loadAvailableSpaces, initialized } = useSpace();

  // Producers from Redux (for the management modal)
  const producers = useAppSelector(state =>
    selectedNotebook ? selectSortedProducers(state, selectedNotebook.id, {
      spaceId: currentSpace?.space_id,
      notebookId: selectedNotebook?.id,
    }) : []
  );

  // Local state for things not in Redux yet
  const [parentForCreate, setParentForCreate] = useState(null);
  const [uploadNotebook, setUploadNotebook] = useState(null);
  const [uploadFiles, setUploadFiles] = useState(null);
  const [settingsNotebook, setSettingsNotebook] = useState(null);
  const [exportNotebook, setExportNotebook] = useState(null);
  const [contentsNotebook, setContentsNotebook] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareNotebookModalOpen, setShareNotebookModalOpen] = useState(false);
  const [shareNotebook, setShareNotebook] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  
  // Document-related state
  const [notebookDocumentCounts, setNotebookDocumentCounts] = useState({});
  
  // Bulk selection state
  const [selectedDocuments, setSelectedDocuments] = useState(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  
  // Analysis modal state
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisDocument, setAnalysisDocument] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  
  // Data source modal state
  const [dataSourceModalOpen, setDataSourceModalOpen] = useState(false);
  const [dataSourceNotebook, setDataSourceNotebook] = useState(null);
  const [pendingRefreshAfterUpload, setPendingRefreshAfterUpload] = useState(false);

  // Cloud drive files for DocumentUploadModal
  const [cloudDriveFilesForUpload, setCloudDriveFilesForUpload] = useState(null);

  // Producer execution modal state
  const [producerModalOpen, setProducerModalOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState(null);

  // Production viewer modal state
  const [productionViewerOpen, setProductionViewerOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState(null);

  // Documents management modal state
  const [documentsManagementOpen, setDocumentsManagementOpen] = useState(false);

  // Producers management modal state
  const [producersManagementOpen, setProducersManagementOpen] = useState(false);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Initialize spaces first, then data
  useEffect(() => {
    if (!initialized) {
      loadAvailableSpaces();
    }
  }, [initialized, loadAvailableSpaces]);

  // Initialize notebooks data after spaces are loaded
  useEffect(() => {
    if (initialized && currentSpace) {
      dispatch(fetchNotebooks());
    }
  }, [dispatch, initialized, currentSpace]);
  
  // Fetch document counts for notebooks after notebooks are loaded
  useEffect(() => {
    if (notebooks.length > 0) {
      fetchNotebookDocumentCounts();
    }
  }, [notebooks]);

  // Fetch documents for selected notebook when component mounts with existing selection
  // This handles the case where user navigates away and back
  useEffect(() => {
    if (selectedNotebook && initialized && !notebookDocuments[selectedNotebook.id]) {
      console.log(`Component mounted with selectedNotebook: ${selectedNotebook.name}, fetching documents...`);
      dispatch(fetchNotebookDocuments({ notebookId: selectedNotebook.id, forceRefresh: false }));
    }
  }, [selectedNotebook, initialized, dispatch, notebookDocuments]);

  // Fetch document counts from aether backend
  const fetchNotebookDocumentCounts = async () => {
    // Extract document counts directly from notebook data (backend already provides this)
    const counts = {};

    try {
      for (const notebook of notebooks) {
        // Use the document count from the notebook object if available, otherwise default to 0
        counts[notebook.id] = notebook.documentCount || notebook.document_count || 0;
        console.log(`Document count for ${notebook.name}: ${counts[notebook.id]} files (from notebook data)`);
      }

      setNotebookDocumentCounts(counts);
    } catch (error) {
      console.error('Failed to extract document counts from notebook data:', error);
    }
  };

  // Helper to dispatch fetchNotebookDocuments and return the result
  const dispatchFetchDocuments = async (notebook, forceRefresh = false) => {
    const result = await dispatch(fetchNotebookDocuments({
      notebookId: notebook.id,
      forceRefresh
    })).unwrap();
    return { documents: result.documents, total: result.total };
  };

  // Listen for reset to list view event from top nav
  useEffect(() => {
    const handleResetToListView = () => {
      dispatch(setSelectedNotebook(null));
      dispatch(setViewMode('cards'));
    };
    
    window.addEventListener('resetToListView', handleResetToListView);
    return () => window.removeEventListener('resetToListView', handleResetToListView);
  }, [dispatch]);

  // Additional refresh when upload modal closes and we had a pending refresh
  useEffect(() => {
    if (!modals.uploadDocument && pendingRefreshAfterUpload) {
      console.log('Upload modal closed with pending refresh - performing additional refresh');
      // Small delay to ensure any background processes complete
      const timeoutId = setTimeout(() => {
        if (notebooks.length > 0) {
          fetchNotebookDocumentCounts();
          if (selectedNotebook) {
            dispatch(fetchNotebookDocuments({ notebookId: selectedNotebook.id, forceRefresh: true }));
          }
        }
        setPendingRefreshAfterUpload(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [modals.uploadDocument, pendingRefreshAfterUpload, notebooks.length, selectedNotebook, dispatch]);

  // Poll for processing documents — auto-refresh when documents are still being processed
  const processingPollRef = useRef(null);
  useEffect(() => {
    // Check if the currently selected notebook has any documents in "processing" status
    const currentDocs = selectedNotebook ? (notebookDocuments[selectedNotebook.id] || []) : [];
    const hasProcessingDocs = currentDocs.some(doc =>
      doc.status === 'processing' || doc.status === 'uploading'
    );

    if (hasProcessingDocs && selectedNotebook) {
      // Start polling if not already polling
      if (!processingPollRef.current) {
        processingPollRef.current = setInterval(() => {
          dispatch(fetchNotebookDocuments({ notebookId: selectedNotebook.id, forceRefresh: true }));
        }, 5000);
      }
    } else {
      // No processing docs — clear polling
      if (processingPollRef.current) {
        clearInterval(processingPollRef.current);
        processingPollRef.current = null;
      }
    }

    return () => {
      if (processingPollRef.current) {
        clearInterval(processingPollRef.current);
        processingPollRef.current = null;
      }
    };
  }, [selectedNotebook, notebookDocuments, dispatch]);

  // Apply filters to notebooks
  const allFilteredNotebooks = filterNotebooks(notebooks);
  
  // For card view, only show root notebooks (no parent_id) but include children count and document count
  const filteredNotebooks = currentViewMode === 'cards' 
    ? allFilteredNotebooks.filter(notebook => {
        const parentId = notebook.parent_id || notebook.parentId;
        return !parentId || parentId === '' || parentId === null || parentId === undefined;
      }).map(rootNotebook => ({
        ...rootNotebook,
        documentCount: notebookDocumentCounts[rootNotebook.id] || 0,
        children: allFilteredNotebooks.filter(nb => {
          const parent = nb.parent_id || nb.parentId;
          return parent === rootNotebook.id;
        })
      }))
    : allFilteredNotebooks.map(notebook => ({
        ...notebook,
        documentCount: notebookDocumentCounts[notebook.id] || 0
      }));

  const handleCreateNotebook = async () => {
    dispatch(openModal('createNotebook'));
  };

  const handleCreateSubNotebook = (parentNotebook) => {
    setParentForCreate(parentNotebook);
    dispatch(openModal('createNotebook'));
  };

  const handleSelectNotebook = async (notebook) => {
    console.log(`🔍 handleSelectNotebook called for: ${notebook.name} (ID: ${notebook.id})`);
    
    // Clear document selection when switching notebooks
    setSelectedDocuments(new Set());
    setSelectAllChecked(false);
    
    // Ensure the selected notebook includes its children and document count
    const notebookWithChildren = {
      ...notebook,
      documentCount: notebookDocumentCounts[notebook.id] || 0,
      children: notebooks.filter(nb => {
        const parent = nb.parent_id || nb.parentId;
        return parent === notebook.id;
      })
    };
    
    console.log(`📋 Setting selected notebook with document count: ${notebookWithChildren.documentCount}`);
    dispatch(setSelectedNotebook(notebookWithChildren));
    
    // Always switch to detail view when selecting a notebook
    console.log(`🔄 Switching to detail view (current mode: ${currentViewMode})`);
    dispatch(setViewMode('detail'));
    
    // Fetch documents for the selected notebook (force refresh to ensure latest data)
    console.log(`📂 About to fetch documents for: ${notebook.name}`);
    await dispatch(fetchNotebookDocuments({ notebookId: notebook.id, forceRefresh: true }));
    console.log(`✅ Finished fetching documents for: ${notebook.name}`);
  };

  const handleUploadDocuments = (notebook, files = null) => {
    setUploadNotebook(notebook);
    setUploadFiles(files);
    dispatch(openModal('uploadDocument'));
  };

  const handleOpenSettings = (notebook) => {
    setSettingsNotebook(notebook);
    dispatch(openModal('notebookSettings'));
  };

  const handleOpenExport = (notebook) => {
    setExportNotebook(notebook);
    dispatch(openModal('exportData'));
  };

  const handleViewContents = (notebook) => {
    setContentsNotebook(notebook);
    dispatch(openModal('contentsView'));
  };

  const handleDeleteDocument = async (document, notebookId) => {
    if (!confirm(`Are you sure you want to delete "${document.name || document.original_name || 'Unknown file'}"?`)) {
      return;
    }

    // Debug logging for delete operation
    const spaceContext = localStorage.getItem('currentSpace');
    console.log('Delete document request:', {
      documentId: document.id,
      documentName: document.name || document.original_name,
      notebookId: notebookId,
      spaceContext: spaceContext ? JSON.parse(spaceContext) : null
    });

    try {
      // Call the aether API to delete the document
      await aetherApi.documents.delete(document.id);
      
      // Refresh the documents list
      const notebook = notebooks.find(nb => nb.id === notebookId);
      if (notebook) {
        const result = await dispatchFetchDocuments(notebook, true);
        const newDocumentCount = result.total; // Use the total count, not the array length
        
        // Update the notebook document count in Redux state (for the cards view)
        dispatch(updateNotebookDocumentCount({
          notebookId: notebookId,
          documentCount: newDocumentCount
        }));
        
        // Update the local document counts state
        setNotebookDocumentCounts(prev => ({
          ...prev,
          [notebookId]: newDocumentCount
        }));
        
        // Update selected notebook's document count if it's the same notebook
        if (selectedNotebook && selectedNotebook.id === notebookId) {
          dispatch(setSelectedNotebook({
            ...selectedNotebook,
            documentCount: newDocumentCount
          }));
        }
      }
      
      dispatch(addNotification({
        type: 'success',
        title: 'Document Deleted',
        message: `Document has been deleted successfully.`
      }));
    } catch (error) {
      console.error('Failed to delete document:', error);

      // Provide more specific error messages
      let errorMessage = error.message || 'Failed to delete document. Please try again.';
      if (error.message?.includes('403') || error.response?.status === 403) {
        errorMessage = 'Access denied. You may not have permission to delete this document, or it may belong to a different workspace.';
        console.error('403 Error details:', {
          documentId: document.id,
          currentSpaceInStorage: localStorage.getItem('currentSpace')
        });
      }

      dispatch(addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: errorMessage
      }));
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const blob = await aetherApi.downloadDocument(doc.id);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.original_name || doc.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      dispatch(addNotification({
        type: 'success',
        title: 'Download Complete',
        message: `Downloaded ${doc.name || doc.original_name}`
      }));
    } catch (error) {
      console.error('Failed to download document:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Download Failed',
        message: error.message || 'Failed to download document. Please try again.'
      }));
    }
  };

  const handleToggleDocumentSelection = (documentId) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const handleSelectAllDocuments = (documents) => {
    if (selectAllChecked) {
      setSelectedDocuments(new Set());
      setSelectAllChecked(false);
    } else {
      const allIds = documents.map(doc => doc.id);
      setSelectedDocuments(new Set(allIds));
      setSelectAllChecked(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedDocuments.size} document(s)?`)) {
      return;
    }
    
    try {
      // Delete all selected documents
      const deletePromises = Array.from(selectedDocuments).map(docId => 
        aetherApi.documents.delete(docId)
      );
      await Promise.all(deletePromises);
      
      // Clear selection
      setSelectedDocuments(new Set());
      setSelectAllChecked(false);
      
      // Refresh the current notebook's documents
      if (selectedNotebook) {
        const result = await dispatchFetchDocuments(selectedNotebook, true);
        const newDocumentCount = result.total;
        
        dispatch(updateNotebookDocumentCount({
          notebookId: selectedNotebook.id,
          documentCount: newDocumentCount
        }));
        
        setNotebookDocumentCounts(prev => ({
          ...prev,
          [selectedNotebook.id]: newDocumentCount
        }));
        
        dispatch(setSelectedNotebook({
          ...selectedNotebook,
          documentCount: newDocumentCount,
          document_count: newDocumentCount
        }));
      }
      
      dispatch(addNotification({
        type: 'success',
        title: 'Bulk Delete Successful',
        message: `Successfully deleted ${selectedDocuments.size} document(s).`
      }));
    } catch (error) {
      console.error('Failed to bulk delete documents:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Bulk Delete Failed',
        message: error.message || 'Failed to delete some documents. Please try again.'
      }));
    }
  };

  const handleBulkDownload = async () => {
    if (selectedDocuments.size === 0) return;
    
    try {
      // Download each selected document
      const documents = notebookDocuments[selectedNotebook.id] || [];
      for (const docId of selectedDocuments) {
        const document = documents.find(d => d.id === docId);
        if (document) {
          await handleDownloadDocument(document);
          // Add a small delay between downloads to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Clear selection after download
      setSelectedDocuments(new Set());
      setSelectAllChecked(false);
      
      dispatch(addNotification({
        type: 'success',
        title: 'Bulk Download Complete',
        message: `Downloaded ${selectedDocuments.size} document(s).`
      }));
    } catch (error) {
      console.error('Failed to bulk download documents:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Bulk Download Failed',
        message: error.message || 'Failed to download some documents. Please try again.'
      }));
    }
  };

  const handlePreviewDocument = async (doc) => {
    try {
      setPreviewDocument(doc);
      setPreviewModalOpen(true);
    } catch (error) {
      console.error('Failed to preview document:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Preview Failed',
        message: error.message || 'Failed to open document preview. Please try again.'
      }));
    }
  };

  const handleShowMLStats = async (document) => {
    try {
      setAnalysisDocument(document);
      setAnalysisData(null);
      setAnalysisModalOpen(true);

      // Fetch ML analysis from AudiModal via aether-be
      const response = await aetherApi.documents.getAnalysis(document.id);
      console.log('ML Analysis response:', response);

      // The modal expects { data: {...} } structure
      if (response?.data?.analysis) {
        setAnalysisData({ data: response.data.analysis });
      } else if (response?.analysis) {
        setAnalysisData({ data: response.analysis });
      } else {
        setAnalysisData({ status: 'No analysis data available yet. Document may still be processing.' });
      }

    } catch (error) {
      console.error('Failed to fetch ML stats:', error);
      setAnalysisData({ status: 'Analysis unavailable', error: error.message });
    }
  };

  const handleCloseAnalysisModal = () => {
    setAnalysisModalOpen(false);
    setAnalysisDocument(null);
    setAnalysisData(null);
  };

  const handleOpenDataSource = (notebook) => {
    setDataSourceNotebook(notebook);
    setDataSourceModalOpen(true);
  };

  const handleCloseDataSource = () => {
    setDataSourceModalOpen(false);
    setDataSourceNotebook(null);
    // Don't refresh here - let the upload modal handle it
  };

  // Producer handlers
  const handleExecuteProducer = (producer) => {
    setSelectedProducer(producer);
    setProducerModalOpen(true);
  };

  const handleCloseProducerModal = () => {
    setProducerModalOpen(false);
    setSelectedProducer(null);
  };

  const handleProducerSuccess = (production) => {
    // Refresh the productions list to show the new production
    if (selectedNotebook?.id) {
      dispatch(fetchNotebookProductions({ notebookId: selectedNotebook.id, limit: 20, offset: 0 }));
    }
    // Close the modal
    handleCloseProducerModal();
  };

  // Production viewer handlers
  const handleViewProduction = (production) => {
    setSelectedProduction(production);
    setProductionViewerOpen(true);
  };

  const handleCloseProductionViewer = () => {
    setProductionViewerOpen(false);
    setSelectedProduction(null);
  };

  const handleDeleteProduction = async (production) => {
    if (!production?.id || !selectedNotebook?.id) return;

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${production.title}"?`)) {
      return;
    }

    try {
      await dispatch(deleteProduction({
        productionId: production.id,
        notebookId: selectedNotebook.id
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Production deleted successfully'
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Failed to delete production'
      }));
    }
  };

  const handleSelectFileUpload = () => {
    if (dataSourceNotebook) {
      // Set flag to indicate we expect uploads
      setPendingRefreshAfterUpload(true);
      handleUploadDocuments(dataSourceNotebook);
      // Close the data source modal immediately since user is proceeding to upload
      setDataSourceModalOpen(false);
    }
  };

  // Handle when a document is added from data source modal (web scraping, text input, etc.)
  const handleDocumentAdded = async (responseData) => {
    console.log('Document added from data source (raw response):', responseData);

    // Extract the actual document from the response
    // The API returns { success: true, data: {...document...} }
    const document = responseData?.data || responseData;
    console.log('Extracted document:', document);

    // Check if this is cloud drive files ready for upload (from CloudDrivesSource)
    if (document?.cloudDriveFiles && document.cloudDriveFiles.length > 0) {
      console.log('Cloud drive files selected — opening upload modal', document.cloudDriveFiles);

      // Close the data source modal
      const targetNotebook = dataSourceNotebook || selectedNotebook;
      setDataSourceModalOpen(false);
      setDataSourceNotebook(null);

      // Open DocumentUploadModal with cloud drive files
      setUploadNotebook(targetNotebook);
      setCloudDriveFilesForUpload(document.cloudDriveFiles);
      dispatch(openModal('uploadDocument'));
      return;
    }

    // Refresh document counts
    await fetchNotebookDocumentCounts();

    // Refresh documents for the notebook where the document was added
    const notebookId = document?.notebook_id || dataSourceNotebook?.id || selectedNotebook?.id;
    if (notebookId) {
      const result = await dispatch(fetchNotebookDocuments({ notebookId, forceRefresh: true })).unwrap();

      // Use the actual count from the response
      const newCount = result?.total || result?.documents?.length || 0;

      setNotebookDocumentCounts(prev => ({
        ...prev,
        [notebookId]: newCount
      }));

      // Update selected notebook's document count if it's the same notebook
      if (selectedNotebook && selectedNotebook.id === notebookId) {
        dispatch(setSelectedNotebook({
          ...selectedNotebook,
          documentCount: newCount
        }));
      }
    }

    // Show success notification
    dispatch(addNotification({
      type: 'success',
      title: 'Document Added',
      message: `"${document?.name || document?.title || 'Document'}" has been added to your notebook.`
    }));
  };

  const handleDeleteNotebook = async (notebook) => {
    try {
      await dispatch(deleteNotebookAction(notebook.id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Notebook Deleted',
        message: `"${notebook.name}" has been deleted successfully.`
      }));
    } catch (error) {
      console.error('Failed to delete notebook:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error || 'Failed to delete notebook. Please try again.'
      }));
    }
  };

  const handleCreateNotebookSubmit = async (notebookData) => {
    try {
      await dispatch(createNotebookAction(notebookData)).unwrap();
      dispatch(closeModal('createNotebook'));
      setParentForCreate(null);
      dispatch(addNotification({
        type: 'success',
        title: 'Notebook Created',
        message: `"${notebookData.name}" has been created successfully.`
      }));
    } catch (error) {
      console.error('Failed to create notebook:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error || 'Failed to create notebook. Please try again.'
      }));
    }
  };

  const handleUpdateNotebook = async (id, updates) => {
    try {
      await dispatch(updateNotebookAction({ id, updates })).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Notebook Updated',
        message: 'Notebook has been updated successfully.'
      }));
    } catch (error) {
      console.error('Failed to update notebook:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error || 'Failed to update notebook. Please try again.'
      }));
    }
  };

  const handleShare = (notebook) => {
    setShareNotebook(notebook);
    setShareNotebookModalOpen(true);
  };

  // Chat handlers
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedNotebook || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, newUserMessage]);
    setChatLoading(true);

    try {
      // Send message to the Notebook Chat Assistant via the backend
      const response = await aetherApi.chat.sendMessage(selectedNotebook.id, userMessage, chatMessages);

      // Extract assistant response from the new API format
      const assistantContent = response?.message
        || response?.data?.message
        || 'Sorry, I could not generate a response.';

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response. Please try again.'}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setChatMessages(prev => [...prev, errorMessage]);

      dispatch(addNotification({
        type: 'error',
        title: 'Chat Error',
        message: error.message || 'Failed to send message. Please try again.'
      }));
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear chat when notebook changes
  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
  }, [selectedNotebook?.id]);


  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {selectedNotebook ? (
            <>
              <button 
                onClick={() => {
                  dispatch(setSelectedNotebook(null));
                  dispatch(setViewMode('cards'));
                }}
                className="text-(--color-primary-600) hover:text-(--color-primary-700) transition-colors"
              >
                <h2 className="text-xl font-semibold">Notebooks</h2>
              </button>
              <span className="text-gray-400">/</span>
              <h2 className="text-xl font-semibold text-gray-900">{selectedNotebook.name}</h2>
            </>
          ) : (
            <h2 className="text-xl font-semibold text-gray-900">Notebooks</h2>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle and Manage Button - only show in list view */}
          {!selectedNotebook && (
            <div className="flex items-center gap-3">
              {/* Manage Notebooks Button */}
              <button
                onClick={() => dispatch(openModal('notebookManager'))}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                title="Manage notebooks"
              >
                Manage
              </button>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => dispatch(setViewMode('cards'))}
                  className={`p-2 rounded-lg transition-colors ${
                    currentViewMode === 'cards' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Card view"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => dispatch(setViewMode('tree'))}
                  className={`p-2 rounded-lg transition-colors ${
                    currentViewMode === 'tree' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Tree view"
                >
                  <FolderTree size={16} />
                </button>
              </div>
            </div>
          )}
          
          {/* Action Buttons - only show in detail view */}
          {selectedNotebook && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleShare(selectedNotebook)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 size={16} />
              </button>
              <button 
                onClick={() => handleOpenSettings(selectedNotebook)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span className="font-medium">Error loading notebooks:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0">
        {currentViewMode === 'cards' ? (
          <LoadingWrapper
            loading={loading}
            error={error}
            SkeletonComponent={NotebookCardSkeleton}
            skeletonCount={6}
            loadingText="Loading notebooks..."
            errorTitle="Error loading notebooks"
          >
            {filteredNotebooks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No notebooks found</div>
                <div className="text-gray-500 text-sm">Try adjusting your filters or create a new notebook</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotebooks.map(notebook => (
                  <NotebookCard 
                    key={notebook.id} 
                    notebook={notebook} 
                    onOpenDetail={() => handleSelectNotebook(notebook)}
                    onUploadDocuments={handleUploadDocuments}
                    onOpenSettings={handleOpenSettings}
                    onDelete={handleDeleteNotebook}
                  />
                ))}
              </div>
            )}
          </LoadingWrapper>
        ) : currentViewMode === 'tree' ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4 h-full">
            <LoadingWrapper
              loading={loading}
              error={error}
              loadingText="Loading notebook tree..."
              errorTitle="Error loading notebook tree"
            >
              {notebookTree.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm mb-2">No notebooks found</div>
                  <div className="text-xs text-gray-400">Create a notebook to get started</div>
                </div>
              ) : (
                <NotebookTreeView
                  notebooks={notebookTree}
                  onSelectNotebook={handleSelectNotebook}
                  onCreateSubNotebook={handleCreateSubNotebook}
                  selectedNotebookId={selectedNotebook?.id}
                />
              )}
            </LoadingWrapper>
          </div>
        ) : (
          <div className="flex h-full gap-1">
            {/* Left Panel - Documents Tree */}
            {!leftPanelCollapsed && (
              <>
                <div 
                  className="bg-white border border-gray-200 rounded-lg p-4 flex-shrink-0 relative"
                  style={{ width: `${leftPanelWidth}px` }}
                >
                  <div className="mb-4 pb-2 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">Documents</h3>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleCreateSubNotebook(selectedNotebook)}
                        className="flex items-center gap-1 text-(--color-primary-600) hover:text-(--color-primary-700) text-xs px-2 py-1 rounded hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
                        title="Create sub-notebook"
                      >
                        <Folder size={12} />
                        <span>Folder</span>
                      </button>
                      <button 
                        onClick={() => handleOpenDataSource(selectedNotebook)}
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 text-xs px-2 py-1 rounded hover:bg-green-50 border border-green-200 hover:border-green-300"
                        title="Add documents from various sources"
                      >
                        <Upload size={12} />
                        <span>Add Data</span>
                      </button>
                      <button 
                        onClick={() => setLeftPanelCollapsed(true)}
                        className="p-1 text-gray-400 hover:text-gray-600 ml-2"
                        title="Collapse panel"
                      >
                        <ChevronLeft size={14} />
                      </button>
                    </div>
                  </div>
                  {selectedNotebook ? (
                    <div className="space-y-4">
                      {/* Sub-notebooks section */}
                      {selectedNotebook.children && selectedNotebook.children.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-2">
                            <FolderTree size={14} />
                            Sub-notebooks ({selectedNotebook.children.length})
                          </h4>
                          <div className="space-y-1">
                            {selectedNotebook.children.map(subNotebook => (
                              <div 
                                key={subNotebook.id} 
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => handleSelectNotebook(subNotebook)}
                              >
                                <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                                  <FolderTree size={10} className="text-blue-600" />
                                </div>
                                <span className="text-sm text-gray-700 hover:text-gray-900 flex-1 truncate">
                                  {subNotebook.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Documents section */}
                      <div className={selectedNotebook.children && selectedNotebook.children.length > 0 ? 'border-t border-gray-200 pt-4' : ''}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                            <FileText size={14} />
                            Documents ({selectedNotebook.documentCount || 0})
                          </h4>
                          <div className="flex items-center gap-1">
                            {/* Bulk actions */}
                            {selectedDocuments.size > 0 && (
                              <>
                                <button
                                  onClick={handleBulkDownload}
                                  className="p-1 hover:bg-blue-100 rounded text-(--color-primary-600) hover:text-(--color-primary-700)"
                                  title={`Download ${selectedDocuments.size} selected`}
                                >
                                  <DownloadCloud size={14} />
                                </button>
                                <button
                                  onClick={handleBulkDelete}
                                  className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700"
                                  title={`Delete ${selectedDocuments.size} selected`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            {/* Manage button - always visible */}
                            <button
                              onClick={() => setDocumentsManagementOpen(true)}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                              title="Manage documents"
                            >
                              <Settings2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {loadingDocuments ? (
                          <div className="text-center py-4 text-gray-500">
                            <div className="text-sm">Loading documents...</div>
                          </div>
                        ) : (notebookDocuments[selectedNotebook.id] && notebookDocuments[selectedNotebook.id].length > 0) ? (
                          <div className="space-y-1">
                            {/* Select all checkbox */}
                            {notebookDocuments[selectedNotebook.id].length > 0 && (
                              <div className="flex items-center gap-2 p-2 border-b border-gray-100">
                                <button
                                  onClick={() => handleSelectAllDocuments(notebookDocuments[selectedNotebook.id])}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Select all"
                                >
                                  {selectAllChecked ? (
                                    <CheckSquare size={14} className="text-blue-600" />
                                  ) : (
                                    <Square size={14} className="text-gray-400" />
                                  )}
                                </button>
                                <span className="text-xs text-gray-500">Select all</span>
                              </div>
                            )}
                            
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                              {notebookDocuments[selectedNotebook.id].map(document => {
                                const statusInfo = getStatusIcon(document.status, document);
                                const StatusIcon = statusInfo.icon;
                                const isSelected = selectedDocuments.has(document.id);
                                
                                return (
                                  <div 
                                    key={document.id} 
                                    className={`flex items-center gap-2 p-2 hover:bg-gray-50 rounded group ${isSelected ? 'bg-blue-50' : ''}`}
                                  >
                                    {/* Selection checkbox */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleDocumentSelection(document.id);
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                    >
                                      {isSelected ? (
                                        <CheckSquare size={14} className="text-blue-600" />
                                      ) : (
                                        <Square size={14} className="text-gray-400" />
                                      )}
                                    </button>
                                    
                                    {/* Status icon */}
                                    <div 
                                      className={`w-5 h-5 ${statusInfo.bgColor} rounded flex items-center justify-center ${statusInfo.isProcessing ? 'animate-pulse' : ''}`}
                                      title={statusInfo.tooltip}
                                    >
                                      {statusInfo.isProcessing ? (
                                        <div className="flex items-center justify-center">
                                          <div className="w-2 h-2 border border-current rounded-full animate-spin border-t-transparent"></div>
                                        </div>
                                      ) : (
                                        <StatusIcon size={12} className={statusInfo.color} />
                                      )}
                                    </div>
                                    
                                    {/* Document info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-gray-700 truncate">
                                        {document.name || document.original_name || 'Unknown file'}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {document.size_bytes && document.size_bytes > 0 && (
                                          <span>{formatFileSize(document.size_bytes)}</span>
                                        )}
                                        <span>•</span>
                                        <span>
                                          {(() => {
                                            const dateStr = document.created_at || document.updated_at;
                                            if (!dateStr) return 'Date unknown';
                                            const date = new Date(dateStr);
                                            return isNaN(date.getTime()) ? 'Date unknown' : date.toLocaleDateString();
                                          })()}
                                        </span>
                                      </div>
                                      {statusInfo.isProcessing && (
                                        <div className="text-xs text-blue-600 font-medium animate-pulse">
                                          {statusInfo.tooltip}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePreviewDocument(document);
                                        }}
                                        className="p-1 hover:bg-purple-100 rounded text-purple-600 hover:text-purple-700"
                                        title="Preview"
                                      >
                                        <Eye size={14} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadDocument(document);
                                        }}
                                        className="p-1 hover:bg-green-100 rounded text-green-600 hover:text-green-700"
                                        title="Download"
                                      >
                                        <Download size={14} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleShowMLStats(document);
                                        }}
                                        className="p-1 hover:bg-blue-100 rounded text-(--color-primary-600) hover:text-(--color-primary-700)"
                                        title="View ML Analysis"
                                      >
                                        <BarChart3 size={14} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteDocument(document, selectedNotebook.id);
                                        }}
                                        className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700"
                                        title="Delete"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <div className="text-sm">No documents uploaded</div>
                            <button 
                              onClick={() => handleUploadDocuments(selectedNotebook)}
                              className="mt-2 text-(--color-primary-600) hover:text-(--color-primary-700) text-sm underline"
                            >
                              Upload documents
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Select a notebook to view documents
                    </div>
                  )}
                </div>
                
                {/* Left Resize Handle */}
                <div 
                  className="w-1 cursor-col-resize hover:bg-blue-300 bg-gray-200 rounded"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = leftPanelWidth;
                    
                    const handleMouseMove = (e) => {
                      const newWidth = Math.max(200, Math.min(500, startWidth + (e.clientX - startX)));
                      setLeftPanelWidth(newWidth);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                />
              </>
            )}
            
            {/* Left Panel Collapsed Button */}
            {leftPanelCollapsed && (
              <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg p-2">
                <button 
                  onClick={() => setLeftPanelCollapsed(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Expand Documents panel"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="text-xs text-gray-400 mt-2 transform -rotate-90 whitespace-nowrap">Docs</div>
              </div>
            )}
            
            {/* Center Panel - Chat History */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
              <div className="mb-4 pb-2 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">
                  {selectedNotebook ? `Chat: ${selectedNotebook.name}` : 'Chat History'}
                </h3>
              </div>
              
              {selectedNotebook ? (
                <div className="flex flex-col h-full">
                  {/* Chat Messages Area */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No messages yet. Start a conversation about your notebook content.
                      </div>
                    ) : (
                      chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-(--color-primary-600) text-white'
                                : message.isError
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                            }`}>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            <span className="text-sm">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-gray-200 pt-3 mb-4">
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Ask questions about your notebook content..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={handleChatKeyPress}
                        disabled={chatLoading}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || chatLoading}
                        className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {chatLoading ? 'Sending...' : 'Send'}
                      </button>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => { setChatInput('Summarize the key points from these documents'); }}
                        disabled={chatLoading}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        Summarize
                      </button>
                      <button
                        onClick={() => { setChatInput('What are the main takeaways from this content?'); }}
                        disabled={chatLoading}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        Extract Key Points
                      </button>
                      <button
                        onClick={() => { setChatInput('Generate some study questions based on this material'); }}
                        disabled={chatLoading}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors disabled:opacity-50"
                      >
                        Generate Questions
                      </button>
                      <button
                        onClick={() => { setChatInput('Create a detailed outline of this content'); }}
                        disabled={chatLoading}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors disabled:opacity-50"
                      >
                        Create Outline
                      </button>
                      <button
                        onClick={() => { setChatInput('Provide a deep analysis and insights on this topic'); }}
                        disabled={chatLoading}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:bg-indigo-200 transition-colors disabled:opacity-50"
                      >
                        Deep Research
                      </button>
                    </div>
                  </div>
                  
                  {/* Collaborator Comments at Bottom */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Collaborator Comments</h4>
                    <div className="max-h-32 overflow-y-auto mb-3">
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No comments yet. Start the conversation below.
                      </div>
                    </div>
                    
                    {/* Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a comment for collaborators..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) text-sm"
                      />
                      <button className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-lg mb-2">Select a notebook to start chatting</div>
                    <p className="text-sm">Choose a notebook to begin your AI-powered conversation</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Resize Handle */}
            {!rightPanelCollapsed && (
              <div 
                className="w-1 cursor-col-resize hover:bg-blue-300 bg-gray-200 rounded"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startWidth = rightPanelWidth;
                  
                  const handleMouseMove = (e) => {
                    const newWidth = Math.max(200, Math.min(500, startWidth - (e.clientX - startX)));
                    setRightPanelWidth(newWidth);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            )}
            
            {/* Right Panel - Producers & Productions */}
            {!rightPanelCollapsed && (
              <div
                className="flex flex-col gap-4 flex-shrink-0 overflow-hidden"
                style={{ width: `${rightPanelWidth}px` }}
              >
                {/* Producers Container */}
                <div className="bg-white border border-gray-200 rounded-lg flex-1 min-h-0 overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">Producers</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Generate content from your documents</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {selectedNotebook && (
                        <button
                          onClick={() => setProducersManagementOpen(true)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                          title="Manage producers"
                        >
                          <Settings2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setRightPanelCollapsed(true)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Collapse panel"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {selectedNotebook ? (
                    <div className="flex-1 overflow-auto">
                      <ProducersList
                        notebookId={selectedNotebook.id}
                        onExecuteProducer={handleExecuteProducer}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      <div className="text-center">
                        <div className="text-sm mb-1">Select a notebook</div>
                        <p className="text-xs">Producers will appear here</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Productions Container */}
                <div className="bg-white border border-gray-200 rounded-lg flex-1 min-h-0 overflow-hidden flex flex-col">
                  {selectedNotebook ? (
                    <ProductionsList
                      notebookId={selectedNotebook.id}
                      onViewProduction={handleViewProduction}
                      onDeleteProduction={handleDeleteProduction}
                    />
                  ) : (
                    <>
                      <div className="p-3 border-b border-gray-200 flex-shrink-0">
                        <h3 className="font-medium text-gray-900 text-sm">Productions</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Generated content history</p>
                      </div>
                      <div className="flex items-center justify-center flex-1 text-gray-500">
                        <div className="text-center">
                          <div className="text-sm mb-1">Select a notebook</div>
                          <p className="text-xs">Productions will appear here</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Right Panel Collapsed Button */}
            {rightPanelCollapsed && (
              <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg p-2">
                <button 
                  onClick={() => setRightPanelCollapsed(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Expand Producers panel"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-xs text-gray-400 mt-2 transform rotate-90 whitespace-nowrap">Producers</div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <CreateNotebookModal
        isOpen={modals.createNotebook}
        onClose={() => {
          dispatch(closeModal('createNotebook'));
          setParentForCreate(null);
        }}
        parentNotebook={parentForCreate}
        onCreateNotebook={handleCreateNotebookSubmit}
      />

      <NotebookDetailModal 
        isOpen={modals.notebookDetail}
        onClose={() => {
          dispatch(closeModal('notebookDetail'));
          dispatch(setSelectedNotebook(null));
        }}
        notebook={selectedNotebook}
        onOpenSettings={handleOpenSettings}
        onOpenExport={handleOpenExport}
        onViewContents={handleViewContents}
      />

      <DocumentUploadModal
        isOpen={modals.uploadDocument}
        onClose={() => {
          dispatch(closeModal('uploadDocument'));
          setUploadNotebook(null);
          setUploadFiles(null);
          setCloudDriveFilesForUpload(null);

          // Refresh document counts when upload modal closes
          if (notebooks.length > 0) {
            fetchNotebookDocumentCounts();
            // Refresh documents for selected notebook if any
            if (selectedNotebook) {
              dispatch(fetchNotebookDocuments({ notebookId: selectedNotebook.id, forceRefresh: true }));
            }
          }

          // Clear the pending refresh flag
          setPendingRefreshAfterUpload(false);
        }}
        notebook={uploadNotebook}
        preSelectedFiles={uploadFiles}
        cloudDriveFiles={cloudDriveFilesForUpload}
      />

      <NotebookSettingsModal
        isOpen={modals.notebookSettings}
        onClose={() => {
          dispatch(closeModal('notebookSettings'));
          setSettingsNotebook(null);
        }}
        notebook={settingsNotebook}
        onUpdateNotebook={handleUpdateNotebook}
      />

      <NotebookManager
        isOpen={modals.notebookManager}
        onClose={() => dispatch(closeModal('notebookManager'))}
        notebooks={notebooks}
        metadata={metadata}
        onRefetch={() => dispatch(fetchNotebooks())}
        onDeleteNotebook={(id) => dispatch(deleteNotebookAction(id))}
        loading={loading}
        error={error}
      />

      <ExportDataModal
        isOpen={modals.exportData}
        onClose={() => {
          dispatch(closeModal('exportData'));
          setExportNotebook(null);
        }}
        notebook={exportNotebook}
      />

      <ContentsViewModal
        isOpen={modals.contentsView}
        onClose={() => {
          dispatch(closeModal('contentsView'));
          setContentsNotebook(null);
        }}
        notebook={contentsNotebook}
      />
      
      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        resourceId={selectedNotebook?.id}
        resourceType="notebook"
        resourceName={selectedNotebook?.name}
      />
      
      <ShareNotebookModal
        isOpen={shareNotebookModalOpen}
        onClose={() => {
          setShareNotebookModalOpen(false);
          setShareNotebook(null);
        }}
        notebook={shareNotebook}
      />

      <DocumentAnalysisModal
        isOpen={analysisModalOpen}
        onClose={handleCloseAnalysisModal}
        document={analysisDocument}
        analysis={analysisData}
      />

      <DataSourceModal
        isOpen={dataSourceModalOpen}
        onClose={handleCloseDataSource}
        notebook={dataSourceNotebook}
        onSelectFileUpload={handleSelectFileUpload}
        onDocumentAdded={handleDocumentAdded}
        onSelectGoogleDrive={() => {
          // Future implementation for Google Drive integration
          console.log('Google Drive integration coming soon');
        }}
        onSelectWebScraping={() => {
          // Future implementation for web scraping
          console.log('Web scraping integration coming soon');
        }}
        onSelectDatabase={() => {
          // Future implementation for database integration
          console.log('Database integration coming soon');
        }}
      />

      {/* Document Preview Modal */}
      {previewModalOpen && previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setPreviewDocument(null);
          }}
        />
      )}

      {/* Producer Execution Modal */}
      {producerModalOpen && selectedProducer && selectedNotebook && (
        <ProducerExecutionModal
          isOpen={producerModalOpen}
          onClose={handleCloseProducerModal}
          producer={selectedProducer}
          notebookId={selectedNotebook.id}
          onSuccess={handleProducerSuccess}
        />
      )}

      {/* Production Viewer Modal */}
      {productionViewerOpen && selectedProduction && (
        <ProductionViewer
          isOpen={productionViewerOpen}
          onClose={handleCloseProductionViewer}
          production={selectedProduction}
        />
      )}

      {/* Documents Management Modal */}
      {documentsManagementOpen && selectedNotebook && (
        <DocumentsManagementModal
          isOpen={documentsManagementOpen}
          onClose={() => setDocumentsManagementOpen(false)}
          notebookId={selectedNotebook.id}
          documents={notebookDocuments[selectedNotebook.id] || []}
          onRefresh={() => {
            if (selectedNotebook) {
              dispatch(fetchNotebookDocuments({ notebookId: selectedNotebook.id, forceRefresh: true }));
            }
          }}
          onPreviewDocument={handlePreviewDocument}
          onDownloadDocument={handleDownloadDocument}
          onDeleteDocument={(docId) => handleDeleteDocument({ id: docId }, selectedNotebook.id)}
        />
      )}

      {/* Producers Management Modal */}
      {producersManagementOpen && selectedNotebook && (
        <ProducersManagementModal
          isOpen={producersManagementOpen}
          onClose={() => setProducersManagementOpen(false)}
          notebookId={selectedNotebook.id}
          producers={producers}
          onExecuteProducer={handleExecuteProducer}
          onRefresh={() => dispatch(fetchNotebookProducers(selectedNotebook.id))}
        />
      )}
    </div>
  );
};

export default NotebooksPage;