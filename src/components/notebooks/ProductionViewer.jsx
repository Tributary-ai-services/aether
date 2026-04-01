import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import {
  fetchProductionContent,
  selectProductionContent,
  deleteProduction,
  retryProduction,
  selectProductionProgress,
} from '../../store/slices/producersSlice.js';
import { useProductionProgress } from '../../hooks/useProductionProgress.js';
import {
  X,
  Download,
  Trash2,
  Copy,
  Check,
  FileText,
  Code,
  FileJson,
  AlignLeft,
  FileAudio,
  Clock,
  Sparkles,
  Headphones,
  Loader2,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

const FORMAT_ICONS = {
  markdown: FileText,
  html: Code,
  json: FileJson,
  text: AlignLeft,
  audio: FileAudio,
};

const TYPE_LABELS = {
  summary: 'Summary',
  qa: 'Q&A',
  outline: 'Outline',
  insight: 'Insights',
  custom: 'Custom',
  podcast: 'Podcast',
};

const ProductionViewer = ({
  isOpen,
  onClose,
  production: productionProp,
  notebookId,
  onDelete,
}) => {
  const dispatch = useAppDispatch();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Get refreshed production from store (may have updated mediaUrl after async rendering)
  const storeProduction = useAppSelector(state => {
    if (!productionProp || !notebookId) return null;
    const items = state.producers.productions[notebookId]?.items;
    return items?.find(p => p.id === productionProp.id) || null;
  });
  // Use store version if available (has fresh metadata), fall back to prop
  const production = storeProduction || productionProp;

  // Get content from store
  const contentState = useAppSelector(state =>
    production ? state.producers.productionContent[production.id] : null
  );
  const content = contentState?.content || production?.content;
  const contentLoading = contentState?.loading;
  const contentError = contentState?.error;

  // Production progress (for queued/rendering productions)
  const isInProgress = production && ['queued', 'rendering', 'retrying'].includes(production.status);
  const progress = useAppSelector(state =>
    production ? selectProductionProgress(state, production.id) : null
  );
  useProductionProgress(production?.id, { enabled: isOpen && isInProgress });

  // Track whether we've already fetched for this production to prevent infinite re-fetch loops
  const [fetchedId, setFetchedId] = useState(null);

  // Fetch content when modal opens
  useEffect(() => {
    if (isOpen && production && !contentLoading && production.id !== fetchedId) {
      setFetchedId(production.id);
      dispatch(fetchProductionContent(production.id));
    }
  }, [isOpen, production?.id, contentLoading, fetchedId, dispatch]);

  // Reset fetchedId when modal closes so re-opening triggers a fresh fetch
  useEffect(() => {
    if (!isOpen) {
      setFetchedId(null);
    }
  }, [isOpen]);

  // Reset copy state
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    if (content) {
      try {
        await navigator.clipboard.writeText(content);
        setCopied(true);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleDownload = () => {
    if (!content || !production) return;

    const extensions = {
      markdown: 'md',
      html: 'html',
      json: 'json',
      text: 'txt',
    };

    const ext = extensions[production.format] || 'txt';
    const filename = `${production.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!production || !notebookId) return;

    setDeleting(true);
    try {
      await dispatch(deleteProduction({ productionId: production.id, notebookId }));
      onDelete?.(production.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete production:', err);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRetry = async () => {
    if (!production || !notebookId) return;
    setRetrying(true);
    try {
      await dispatch(retryProduction({ productionId: production.id, notebookId }));
    } catch (err) {
      console.error('Failed to retry production:', err);
    } finally {
      setRetrying(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 10) / 10 + ' ' + sizes[i];
  };

  if (!isOpen || !production) return null;

  const FormatIcon = FORMAT_ICONS[production.format] || FileText;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-(--color-primary-100) rounded-lg">
              <Sparkles size={20} className="text-(--color-primary-600)" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{production.title}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FormatIcon size={14} />
                  {production.format}
                </span>
                <span>{TYPE_LABELS[production.type] || production.type}</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatDate(production.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!content}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Copy to clipboard"
            >
              {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
            </button>
            <button
              onClick={handleDownload}
              disabled={!content}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-6 text-sm">
          {production.tokensUsed > 0 && (
            <div>
              <span className="text-gray-500">Tokens:</span>{' '}
              <span className="font-medium text-gray-700">{production.tokensUsed.toLocaleString()}</span>
            </div>
          )}
          {production.costUsd > 0 && (
            <div>
              <span className="text-gray-500">Cost:</span>{' '}
              <span className="font-medium text-gray-700">${production.costUsd.toFixed(4)}</span>
            </div>
          )}
          {production.responseTimeMs > 0 && (
            <div>
              <span className="text-gray-500">Time:</span>{' '}
              <span className="font-medium text-gray-700">{(production.responseTimeMs / 1000).toFixed(1)}s</span>
            </div>
          )}
          {production.sizeBytes > 0 && (
            <div>
              <span className="text-gray-500">Size:</span>{' '}
              <span className="font-medium text-gray-700">{formatSize(production.sizeBytes)}</span>
            </div>
          )}
        </div>

        {/* Progress indicator for in-progress productions */}
        {isInProgress && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 size={18} className="text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-800">
                {progress?.message || `Status: ${production.status}`}
              </span>
            </div>
            {progress && progress.clipsTotal > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                  <span>
                    {progress.phase === 'tts_generating' && `Generating clip ${progress.clipsCompleted}/${progress.clipsTotal}`}
                    {progress.phase === 'assembling' && 'Assembling audio...'}
                    {progress.phase === 'uploading' && 'Uploading...'}
                  </span>
                  <span>{progress.phase === 'completed' ? 100 : Math.round((progress.clipsCompleted / progress.clipsTotal) * 100)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${progress.phase === 'uploading' ? 95 :
                        progress.phase === 'assembling' ? 85 :
                        Math.round((progress.clipsCompleted / progress.clipsTotal) * 80)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Retry banner for failed productions */}
        {production.status === 'failed' && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm text-red-800">This production failed.</span>
            </div>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {retrying ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RotateCcw size={14} />
              )}
              {retrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}

        {/* Audio Player (for productions with media URL) */}
        {production.mediaUrl && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200">
            <div className="flex items-center gap-3 mb-2">
              <Headphones size={18} className="text-rose-600" />
              <span className="text-sm font-medium text-rose-800">Podcast Audio</span>
              {production.mediaMetadata?.duration && (
                <span className="text-xs text-rose-600">
                  {Math.floor(production.mediaMetadata.duration / 60)}:{String(Math.floor(production.mediaMetadata.duration % 60)).padStart(2, '0')}
                </span>
              )}
              {production.mediaMetadata?.speakers && (
                <span className="text-xs text-rose-600">
                  Speakers: {Array.isArray(production.mediaMetadata.speakers)
                    ? production.mediaMetadata.speakers.join(', ')
                    : production.mediaMetadata.speakers}
                </span>
              )}
              <a
                href={production.mediaUrl}
                download
                className="ml-auto text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1"
              >
                <Download size={14} /> Download MP3
              </a>
            </div>
            <audio
              controls
              src={production.mediaUrl}
              className="w-full h-10"
              preload="metadata"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {contentLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-(--color-primary-600)" />
              <span className="ml-2 text-gray-500">Loading content...</span>
            </div>
          ) : contentError ? (
            <div className="flex items-center justify-center py-12">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <span className="ml-2 text-red-600">{contentError}</span>
            </div>
          ) : content ? (
            <div className="prose prose-sm max-w-none">
              {production.format === 'markdown' ? (
                <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                  {content}
                </pre>
              ) : production.format === 'json' ? (
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                  {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                </pre>
              ) : production.format === 'html' ? (
                <div
                  className="production-html-content"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                  {content}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">
              No content available
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
            <div className="bg-white rounded-lg shadow-lg p-6 mx-4 max-w-md">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Production?</h3>
                  <p className="mt-2 text-gray-600">
                    Are you sure you want to delete "{production.title}"? This action cannot be undone.
                  </p>
                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deleting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionViewer;
