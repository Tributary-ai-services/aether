import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/index.js';
import {
  fetchNotebookProductions,
  fetchProductionContent,
  deleteProduction,
  bulkDeleteProductions,
} from '../store/slices/producersSlice.js';
import {
  Sparkles,
  FileText,
  HelpCircle,
  List,
  Lightbulb,
  FileCode,
  Eye,
  Trash2,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Loader,
  ChevronLeft,
  CheckSquare,
  Square,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  X,
  ExternalLink,
} from 'lucide-react';

const TYPE_CONFIG = {
  summary: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Summary' },
  qa: { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Q&A' },
  outline: { icon: List, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Outline' },
  insight: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Insight' },
  custom: { icon: FileCode, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Custom' },
  default: { icon: Sparkles, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Production' },
};

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
  processing: { icon: Loader, color: 'text-blue-500', label: 'Processing' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
};

const ProductionsManagementPage = () => {
  const { notebookId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux state
  const productionsState = useAppSelector(state => state.producers.productions[notebookId]);
  const productions = productionsState?.items || [];
  const loading = productionsState?.loading || false;
  const total = productionsState?.total || 0;
  const globalLoading = useAppSelector(state => state.producers.loading);
  const productionContent = useAppSelector(state => state.producers.productionContent);

  // Local state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // null for bulk, string for single
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewProduction, setPreviewProduction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load productions on mount
  useEffect(() => {
    if (notebookId) {
      console.log('[ProductionsManagement] Loading productions for notebook:', notebookId);
      dispatch(fetchNotebookProductions({ notebookId, limit: 100, offset: 0 }))
        .unwrap()
        .then((result) => {
          console.log('[ProductionsManagement] Loaded productions:', result);
        })
        .catch((error) => {
          console.error('[ProductionsManagement] Failed to load productions:', error);
        });
    } else {
      console.warn('[ProductionsManagement] No notebookId provided');
    }
  }, [dispatch, notebookId]);

  // Filtered and sorted productions
  const filteredProductions = useMemo(() => {
    let filtered = [...productions];

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at);
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [productions, filterType, filterStatus, sortBy, sortOrder]);

  // Handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredProductions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProductions.map(p => p.id)));
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

  const handleDeleteClick = (productionId = null) => {
    setDeleteTarget(productionId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteTarget) {
        // Single delete
        await dispatch(deleteProduction({ productionId: deleteTarget, notebookId })).unwrap();
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(deleteTarget);
          return newSet;
        });
      } else {
        // Bulk delete
        const idsToDelete = Array.from(selectedIds);
        await dispatch(bulkDeleteProductions({ productionIds: idsToDelete, notebookId })).unwrap();
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handlePreview = async (production) => {
    setPreviewProduction(production);
    // Fetch content if not already cached
    if (!productionContent[production.id]?.content) {
      dispatch(fetchProductionContent(production.id));
    }
  };

  const handleDownload = async (production) => {
    // Fetch content if needed
    let content = productionContent[production.id]?.content;
    if (!content) {
      const result = await dispatch(fetchProductionContent(production.id)).unwrap();
      content = result;
    }

    // Create download
    const blob = new Blob([content || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${production.title || 'production'}.${production.format || 'md'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && productions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Loading productions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/notebooks"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Notebooks
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Productions</h1>
              <p className="text-gray-500 mt-1">
                {total} production{total !== 1 ? 's' : ''} total
                {selectedIds.size > 0 && (
                  <span className="ml-2 text-blue-600">
                    ({selectedIds.size} selected)
                  </span>
                )}
              </p>
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => handleDeleteClick()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Selected ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="summary">Summary</option>
                <option value="qa">Q&A</option>
                <option value="outline">Outline</option>
                <option value="insight">Insight</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown size={16} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? 'Asc' : 'Desc'}
              </button>
            </div>
          </div>
        </div>

        {/* Productions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
            <div className="col-span-1 flex items-center">
              <button
                onClick={handleSelectAll}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {selectedIds.size === filteredProductions.length && filteredProductions.length > 0 ? (
                  <CheckSquare size={18} className="text-blue-600" />
                ) : (
                  <Square size={18} className="text-gray-400" />
                )}
              </button>
            </div>
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-1">Actions</div>
          </div>

          {/* Table Body */}
          {filteredProductions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Sparkles size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No productions found</p>
              <p className="text-sm mt-1">
                {filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Run a producer to generate content'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredProductions.map((production) => {
                const typeConfig = TYPE_CONFIG[production.type] || TYPE_CONFIG.default;
                const statusConfig = STATUS_CONFIG[production.status] || STATUS_CONFIG.completed;
                const TypeIcon = typeConfig.icon;
                const StatusIcon = statusConfig.icon;
                const isSelected = selectedIds.has(production.id);

                return (
                  <div
                    key={production.id}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="col-span-1">
                      <button
                        onClick={() => handleSelectOne(production.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-blue-600" />
                        ) : (
                          <Square size={18} className="text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Title */}
                    <div className="col-span-4">
                      <button
                        onClick={() => handlePreview(production)}
                        className="text-left hover:text-blue-600 font-medium text-gray-900 truncate block w-full"
                      >
                        {production.title || 'Untitled'}
                      </button>
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                        <TypeIcon size={12} />
                        {typeConfig.label}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 text-sm ${statusConfig.color}`}>
                        <StatusIcon size={14} className={production.status === 'processing' ? 'animate-spin' : ''} />
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-sm text-gray-500">
                      {formatDate(production.createdAt || production.created_at)}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center gap-1">
                      <button
                        onClick={() => handlePreview(production)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(production)}
                        className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(production.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {deleteTarget ? 'Delete Production?' : `Delete ${selectedIds.size} Productions?`}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {deleteTarget
                      ? 'This production will be permanently deleted. This action cannot be undone.'
                      : `These ${selectedIds.size} productions will be permanently deleted. This action cannot be undone.`}
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

        {/* Preview Modal */}
        {previewProduction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {previewProduction.title || 'Production Preview'}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`inline-flex items-center gap-1 text-xs ${
                      TYPE_CONFIG[previewProduction.type]?.color || 'text-gray-500'
                    }`}>
                      {React.createElement(TYPE_CONFIG[previewProduction.type]?.icon || Sparkles, { size: 12 })}
                      {TYPE_CONFIG[previewProduction.type]?.label || 'Production'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(previewProduction.createdAt || previewProduction.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(previewProduction)}
                    className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                    title="Download"
                  >
                    <Download size={20} />
                  </button>
                  <button
                    onClick={() => setPreviewProduction(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6">
                {productionContent[previewProduction.id]?.loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-500">Loading content...</span>
                  </div>
                ) : productionContent[previewProduction.id]?.error ? (
                  <div className="text-center py-12 text-red-500">
                    <XCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>Failed to load content</p>
                    <p className="text-sm mt-1">{productionContent[previewProduction.id].error}</p>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {productionContent[previewProduction.id]?.content || 'No content available'}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionsManagementPage;
