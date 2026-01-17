import React, { useState, useEffect } from 'react';
import { useNotebooks, useNotebookStats, useNotebookOperations } from '../../hooks/index.js';
import ExportDataModal from '../modals/ExportDataModal.jsx';
import { 
  Download, 
  Upload, 
  Trash2, 
  Copy, 
  Move, 
  Archive,
  RefreshCw,
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const NotebookManager = ({ 
  isOpen, 
  onClose, 
  notebooks, 
  metadata, 
  onRefetch, 
  onDeleteNotebook, 
  loading: parentLoading, 
  error: parentError 
}) => {
  const { stats } = useNotebookStats();
  const { 
    exportNotebooks, 
    importNotebooks,
    duplicateNotebook,
    bulkDeleteNotebooks,
    loading,
    error 
  } = useNotebookOperations();

  const [selectedNotebooks, setSelectedNotebooks] = useState(new Set());
  const [showStats, setShowStats] = useState(false);
  const [notification, setNotification] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportNotebooksList, setExportNotebooksList] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // No auto-refresh needed since we're sharing state with parent component

  const handleExport = async () => {
    const notebooksToExport = selectedNotebooks.size > 0 
      ? notebooks.filter(nb => selectedNotebooks.has(nb.id))
      : notebooks;
    
    setExportNotebooksList(notebooksToExport);
    setExportModalOpen(true);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = await importNotebooks(text);
      await onRefetch();
      showNotification(`Imported ${imported.length} notebooks successfully`);
    } catch (err) {
      showNotification(`Import failed: ${err.message}`, 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotebooks.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedNotebooks.size} notebooks? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const count = selectedNotebooks.size;
        await bulkDeleteNotebooks(Array.from(selectedNotebooks));
        setSelectedNotebooks(new Set());
        // No need to call refetch() - bulkDeleteNotebooks should handle state updates
        showNotification(`Deleted ${count} notebooks`);
      } catch (err) {
        showNotification(`Delete failed: ${err.message}`, 'error');
      }
    }
  };

  const handleDuplicate = async (notebook) => {
    try {
      await duplicateNotebook(notebook);
      await onRefetch();
      showNotification(`Duplicated "${notebook.name}"`);
    } catch (err) {
      showNotification(`Duplicate failed: ${err.message}`, 'error');
    }
  };

  const handleDeleteSingle = async (notebook) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${notebook.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        await onDeleteNotebook(notebook.id);
        // Remove from selection if it was selected
        const newSelection = new Set(selectedNotebooks);
        newSelection.delete(notebook.id);
        setSelectedNotebooks(newSelection);
        // No need to call onRefetch() - onDeleteNotebook already refreshes the state
        showNotification(`Deleted "${notebook.name}"`);
      } catch (err) {
        showNotification(`Delete failed: ${err.message}`, 'error');
      }
    }
  };

  const toggleNotebookSelection = (notebookId) => {
    const newSelection = new Set(selectedNotebooks);
    if (newSelection.has(notebookId)) {
      newSelection.delete(notebookId);
    } else {
      newSelection.add(notebookId);
    }
    setSelectedNotebooks(newSelection);
  };

  const selectAll = () => {
    setSelectedNotebooks(new Set(notebooks.map(nb => nb.id)));
  };

  const clearSelection = () => {
    setSelectedNotebooks(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Notebook Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Notification */}
          {notification && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              notification.type === 'error' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {notification.message}
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Stats Section */}
          <div className="mb-6">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <BarChart3 size={16} />
              {showStats ? 'Hide' : 'Show'} Statistics
            </button>
            
            {showStats && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{notebooks?.length || 0}</div>
                  <div className="text-sm text-gray-600">Total Notebooks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {notebooks?.reduce((total, nb) => total + (nb.documentCount || nb.document_count || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {notebooks?.filter(nb => nb.visibility === 'private').length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Private</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {notebooks?.filter(nb => nb.visibility === 'shared').length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Shared</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {notebooks?.filter(nb => nb.visibility === 'public').length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Public</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">
                    {notebooks?.filter(nb => (nb.parent_id || nb.parentId)).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Sub-notebooks</div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleExport}
              disabled={loading || parentLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Download size={16} />
              Export {selectedNotebooks.size > 0 ? `(${selectedNotebooks.size})` : 'All'}
            </button>
            
            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
              <Upload size={16} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={loading || parentLoading}
              />
            </label>
            
            {selectedNotebooks.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={loading || parentLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete ({selectedNotebooks.size})
              </button>
            )}
            
            <button
              onClick={onRefetch}
              disabled={parentLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={parentLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="text-gray-600">
              {selectedNotebooks.size} of {notebooks.length} selected
            </span>
            <button
              onClick={selectAll}
              className="text-blue-600 hover:text-blue-800"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </button>
          </div>

          {/* Notebooks List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedNotebooks.size === notebooks.length && notebooks.length > 0}
                      onChange={() => selectedNotebooks.size === notebooks.length ? clearSelection() : selectAll()}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notebooks.map(notebook => (
                  <tr 
                    key={notebook.id}
                    className={`hover:bg-gray-50 ${selectedNotebooks.has(notebook.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedNotebooks.has(notebook.id)}
                        onChange={() => toggleNotebookSelection(notebook.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{notebook.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{notebook.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        notebook.visibility === 'public' ? 'bg-green-100 text-green-800' :
                        notebook.visibility === 'shared' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notebook.visibility}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notebook.documentCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notebook.updatedAt && notebook.updatedAt !== 'Invalid Date' 
                        ? new Date(notebook.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric'
                          })
                        : notebook.updated_at 
                          ? new Date(notebook.updated_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Unknown'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDuplicate(notebook)}
                        disabled={loading || parentLoading}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSingle(notebook)}
                        disabled={loading || parentLoading}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Metadata */}
          {metadata && metadata.version && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
              <div>
                <span className="font-medium">Version:</span> {metadata.version}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Export Data Modal */}
      <ExportDataModal
        isOpen={exportModalOpen}
        onClose={() => {
          setExportModalOpen(false);
          setExportNotebooksList(null);
        }}
        notebooks={exportNotebooksList}
      />
    </div>
  );
};

export default NotebookManager;