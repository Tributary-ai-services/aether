import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import { aetherApi } from '../../services/aetherApi.js';
import JSZip from 'jszip';
import {
  X,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  File,
  Eye,
  Download,
  DownloadCloud,
  Trash2,
  RefreshCw,
  CheckSquare,
  Square,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings2,
  Pencil,
  Check,
} from 'lucide-react';

const TYPE_CONFIG = {
  pdf: { icon: FileText, color: 'text-red-600', bg: 'bg-red-50', label: 'PDF' },
  doc: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'DOC' },
  docx: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'DOCX' },
  txt: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', label: 'TXT' },
  jpg: { icon: Image, color: 'text-green-600', bg: 'bg-green-50', label: 'JPG' },
  jpeg: { icon: Image, color: 'text-green-600', bg: 'bg-green-50', label: 'JPEG' },
  png: { icon: Image, color: 'text-green-600', bg: 'bg-green-50', label: 'PNG' },
  gif: { icon: Image, color: 'text-purple-600', bg: 'bg-purple-50', label: 'GIF' },
  mp4: { icon: Film, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'MP4' },
  mov: { icon: Film, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'MOV' },
  mp3: { icon: Music, color: 'text-pink-600', bg: 'bg-pink-50', label: 'MP3' },
  wav: { icon: Music, color: 'text-pink-600', bg: 'bg-pink-50', label: 'WAV' },
  zip: { icon: Archive, color: 'text-amber-600', bg: 'bg-amber-50', label: 'ZIP' },
  default: { icon: File, color: 'text-gray-600', bg: 'bg-gray-50', label: 'File' },
};

const STATUS_CONFIG = {
  processed: { icon: CheckCircle, color: 'text-green-500', label: 'Processed' },
  processing: { icon: Clock, color: 'text-blue-500', label: 'Processing' },
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
};

const DocumentsManagementModal = ({
  isOpen,
  onClose,
  notebookId,
  documents = [],
  onRefresh,
  onPreviewDocument,
  onDownloadDocument,
  onDeleteDocument,
}) => {
  const dispatch = useAppDispatch();

  // Local state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // null for bulk, string for single
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Rename state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Get file extension from name or mime type
  const getFileType = (doc) => {
    if (doc.name) {
      const ext = doc.name.split('.').pop()?.toLowerCase();
      if (ext) return ext;
    }
    if (doc.mime_type) {
      const mimeMap = {
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'video/mp4': 'mp4',
        'audio/mpeg': 'mp3',
        'text/plain': 'txt',
      };
      return mimeMap[doc.mime_type] || 'default';
    }
    return 'default';
  };

  // Filtered and sorted documents
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        (doc.name || doc.original_name || '').toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => {
        const type = getFileType(doc);
        if (filterType === 'document') {
          return ['pdf', 'doc', 'docx', 'txt'].includes(type);
        }
        if (filterType === 'image') {
          return ['jpg', 'jpeg', 'png', 'gif'].includes(type);
        }
        if (filterType === 'video') {
          return ['mp4', 'mov', 'avi'].includes(type);
        }
        if (filterType === 'audio') {
          return ['mp3', 'wav', 'flac'].includes(type);
        }
        return true;
      });
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0);
          break;
        case 'name':
          comparison = (a.name || a.original_name || '').localeCompare(b.name || b.original_name || '');
          break;
        case 'size':
          comparison = (b.size_bytes || 0) - (a.size_bytes || 0);
          break;
        case 'type':
          comparison = getFileType(a).localeCompare(getFileType(b));
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'most_used':
          // Placeholder - will use view_count when available
          comparison = new Date(b.created_at || 0) - new Date(a.created_at || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [documents, searchQuery, filterType, filterStatus, sortBy, sortOrder]);

  // Handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map(d => d.id)));
    }
  };

  const handleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteClick = (documentId = null) => {
    setDeleteTarget(documentId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteTarget) {
        // Single delete
        await onDeleteDocument?.(deleteTarget);
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(deleteTarget);
          return newSet;
        });
      } else {
        // Bulk delete
        const idsToDelete = Array.from(selectedIds);
        for (const id of idsToDelete) {
          try {
            await aetherApi.documents.delete(id);
          } catch (err) {
            console.error(`Failed to delete document ${id}:`, err);
          }
        }
        setSelectedIds(new Set());
        onRefresh?.();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handleDownload = async (document) => {
    onDownloadDocument?.(document);
  };

  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) return;

    setIsDownloading(true);
    const docsToDownload = documents.filter(d => selectedIds.has(d.id));
    setDownloadProgress({ current: 0, total: docsToDownload.length });

    try {
      const zip = new JSZip();

      // Fetch all documents and add to ZIP
      for (let i = 0; i < docsToDownload.length; i++) {
        const doc = docsToDownload[i];
        setDownloadProgress({ current: i + 1, total: docsToDownload.length });

        try {
          const blob = await aetherApi.downloadDocument(doc.id);
          const fileName = doc.original_name || doc.name || `document-${doc.id}`;
          zip.file(fileName, blob);
        } catch (err) {
          console.error(`Failed to fetch document ${doc.id}:`, err);
        }
      }

      // Generate and download the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `documents-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Bulk download failed:', error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handlePreview = (document) => {
    onPreviewDocument?.(document);
  };

  // Rename handlers
  const handleStartRename = (doc) => {
    setEditingId(doc.id);
    setEditingName(doc.name || doc.original_name || '');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveRename = async (docId) => {
    if (!editingName.trim()) {
      handleCancelRename();
      return;
    }

    setIsSavingName(true);
    try {
      await aetherApi.documents.update(docId, { name: editingName.trim() });
      onRefresh?.();
    } catch (error) {
      console.error('Failed to rename document:', error);
    } finally {
      setIsSavingName(false);
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleRenameKeyDown = (e, docId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename(docId);
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Documents</h2>
            <p className="text-sm text-gray-500 mt-1">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
              {selectedIds.size > 0 && (
                <span className="ml-2 text-blue-600">
                  ({selectedIds.size} selected)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={handleBulkDownload}
                  disabled={isDownloading}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {downloadProgress.total > 0
                        ? `Zipping ${downloadProgress.current}/${downloadProgress.total}...`
                        : 'Preparing...'}
                    </>
                  ) : (
                    <>
                      <DownloadCloud size={14} />
                      Download ZIP ({selectedIds.size})
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteClick()}
                  disabled={isDeleting || isDownloading}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete ({selectedIds.size})
                </button>
              </>
            )}
            <button
              onClick={onRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="document">Documents</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="processed">Processed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown size={14} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
                <option value="most_used" disabled>Most Used (coming soon)</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
          <div className="col-span-1 flex items-center">
            <button onClick={handleSelectAll} className="p-1 hover:bg-gray-200 rounded">
              {selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0 ? (
                <CheckSquare size={16} className="text-blue-600" />
              ) : (
                <Square size={16} className="text-gray-400" />
              )}
            </button>
          </div>
          <div className="col-span-4">Name</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Uploaded</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto">
          {filteredDocuments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No documents found</p>
              <p className="text-sm mt-1">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Upload documents to get started'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredDocuments.map((document) => {
                const fileType = getFileType(document);
                const typeConfig = TYPE_CONFIG[fileType] || TYPE_CONFIG.default;
                const statusConfig = STATUS_CONFIG[document.status] || STATUS_CONFIG.processed;
                const TypeIcon = typeConfig.icon;
                const StatusIcon = statusConfig.icon;
                const isSelected = selectedIds.has(document.id);

                return (
                  <div
                    key={document.id}
                    className={`grid grid-cols-12 gap-3 px-6 py-3 items-center hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="col-span-1">
                      <button
                        onClick={() => handleSelectOne(document.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {isSelected ? (
                          <CheckSquare size={16} className="text-blue-600" />
                        ) : (
                          <Square size={16} className="text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Name */}
                    <div className="col-span-4">
                      {editingId === document.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => handleRenameKeyDown(e, document.id)}
                            onBlur={() => handleSaveRename(document.id)}
                            autoFocus
                            disabled={isSavingName}
                            className="flex-1 px-2 py-1 text-sm border border-blue-400 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          {isSavingName ? (
                            <Loader2 size={14} className="animate-spin text-blue-500" />
                          ) : (
                            <button
                              onClick={() => handleSaveRename(document.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <button
                            onClick={() => handlePreview(document)}
                            className="text-left hover:text-blue-600 font-medium text-gray-900 truncate text-sm flex-1"
                          >
                            {document.name || document.original_name || 'Untitled'}
                          </button>
                          <button
                            onClick={() => handleStartRename(document)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Rename"
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Type */}
                    <div className="col-span-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                        <TypeIcon size={10} />
                        {typeConfig.label}
                      </span>
                    </div>

                    {/* Size */}
                    <div className="col-span-1 text-sm text-gray-600">
                      {formatFileSize(document.size_bytes)}
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 text-sm ${statusConfig.color}`}>
                        <StatusIcon size={14} className={document.status === 'processing' ? 'animate-spin' : ''} />
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 text-sm text-gray-500">
                      {formatDate(document.created_at || document.updated_at)}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center gap-1">
                      <button
                        onClick={() => handlePreview(document)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDownload(document)}
                        className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(document.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {deleteTarget ? 'Delete Document?' : `Delete ${selectedIds.size} Documents?`}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {deleteTarget
                      ? 'This document will be permanently deleted. This action cannot be undone.'
                      : `These ${selectedIds.size} documents will be permanently deleted. This action cannot be undone.`}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsManagementModal;
