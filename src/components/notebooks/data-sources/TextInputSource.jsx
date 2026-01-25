import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  FileText,
  Save,
  X,
  Type,
  Hash,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { createDataSource, selectDataSourcesLoading, selectDataSourcesError, clearError } from '../../../store/slices/dataSourcesSlice.js';
import { aetherApi } from '../../../services/aetherApi.js';

// Draft auto-save key prefix
const DRAFT_KEY_PREFIX = 'aether_text_draft_';

const TextInputSource = ({
  notebook,
  onBack,
  onSuccess,
  onClose
}) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectDataSourcesLoading);
  const error = useSelector(selectDataSourcesError);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('text'); // 'text' | 'markdown'
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'

  // Draft key for this notebook
  const draftKey = notebook?.id ? `${DRAFT_KEY_PREFIX}${notebook.id}` : null;

  // Load draft from localStorage on mount
  useEffect(() => {
    if (draftKey) {
      try {
        const draft = localStorage.getItem(draftKey);
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.content) setContent(parsed.content);
          if (parsed.contentType) setContentType(parsed.contentType);
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, [draftKey]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!draftKey) return;
    if (!title && !content) return; // Don't save empty drafts

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          title,
          content,
          contentType,
          savedAt: new Date().toISOString()
        }));
      } catch (e) {
        console.error('Failed to save draft:', e);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timer);
  }, [title, content, contentType, draftKey]);

  // Clear draft after successful submit
  const clearDraft = useCallback(() => {
    if (draftKey) {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Character and word counts
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    setSaveStatus('saving');

    try {
      // Create a document directly using the documents API
      // The text content will be processed and stored as a document
      const documentData = {
        title: title.trim() || `Text Document ${new Date().toLocaleDateString()}`,
        content: content,
        content_type: contentType === 'markdown' ? 'text/markdown' : 'text/plain',
        notebook_id: notebook?.id,
        source_type: 'text_input',
      };

      const response = await aetherApi.documents.create(documentData);

      if (response.success) {
        setSaveStatus('saved');
        clearDraft();

        // Notify parent of success
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Failed to create text document:', err);
      setSaveStatus('error');
    }
  };

  // Handle discard
  const handleDiscard = () => {
    if (content.trim() || title.trim()) {
      if (window.confirm('Discard unsaved content?')) {
        clearDraft();
        onBack();
      }
    } else {
      onBack();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleDiscard}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Text Input</h2>
              <p className="text-sm text-gray-500">
                Enter or paste text content for "{notebook?.name || 'this notebook'}"
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Error display */}
          {(error || saveStatus === 'error') && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">
                {error || 'Failed to save content. Please try again.'}
              </p>
            </div>
          )}

          {/* Title input */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Content type toggle */}
          <div className="mb-4 flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Format:</span>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setContentType('text')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  contentType === 'text'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Type className="w-4 h-4" />
                  <span>Plain Text</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setContentType('markdown')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  contentType === 'markdown'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Hash className="w-4 h-4" />
                  <span>Markdown</span>
                </span>
              </button>
            </div>
          </div>

          {/* Content textarea */}
          <div className="flex-1">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={contentType === 'markdown'
                ? "# Enter your markdown content here...\n\nSupports **bold**, *italic*, and more."
                : "Enter or paste your text content here..."
              }
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
              required
            />
          </div>

          {/* Stats bar */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Type className="w-3.5 h-3.5" />
                <span>{charCount.toLocaleString()} characters</span>
              </span>
              <span className="flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{wordCount.toLocaleString()} words</span>
              </span>
            </div>

            {/* Auto-save indicator */}
            {(title || content) && (
              <span className="flex items-center space-x-1 text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Draft auto-saved</span>
              </span>
            )}
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h4 className="font-medium text-blue-900">Tips</h4>
                <ul className="mt-1 text-blue-700 list-disc list-inside space-y-1">
                  <li>Paste text directly from other applications</li>
                  <li>Use Markdown format for structured content</li>
                  <li>Your draft is automatically saved locally</li>
                  <li>Large texts are processed and chunked for AI analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-3">
            {saveStatus === 'saved' && (
              <span className="flex items-center text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Saved successfully!
              </span>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim() || saveStatus === 'saving'}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                loading || !content.trim() || saveStatus === 'saving'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {(loading || saveStatus === 'saving') ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Add to Notebook</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TextInputSource;
