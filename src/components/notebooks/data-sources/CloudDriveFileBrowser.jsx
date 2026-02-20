import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Folder,
  FileText,
  Image,
  Table,
  ChevronRight,
  Search,
  ArrowUp,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { listCloudDriveFiles, searchCloudDriveFiles } from '../../../store/slices/dataSourcesSlice.js';
import { formatFileSize } from '../../../config/cloudDriveProviders.js';

const ICON_MAP = {
  folder: Folder,
  document: FileText,
  spreadsheet: Table,
  presentation: FileText,
  image: Image,
  default: FileText,
};

const getFileIcon = (item) => {
  if (item.type === 'folder') return Folder;
  if (item.mimeType?.includes('spreadsheet') || item.mimeType?.includes('csv')) return Table;
  if (item.mimeType?.includes('image')) return Image;
  return FileText;
};

/**
 * CloudDriveFileBrowser
 *
 * Browsable file list for a connected cloud drive provider.
 * Supports folder navigation, search, multi-select, and sorting.
 */
const CloudDriveFileBrowser = ({
  provider,
  credentialId,
  rootPath = '',
  siteId = null,
  libraryId = null,
  onFilesSelected,
  onCancel,
}) => {
  const dispatch = useDispatch();
  const [currentPath, setCurrentPath] = useState(rootPath);
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Root', path: '' }]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // name | date | size
  const [sortAsc, setSortAsc] = useState(true);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // Load files for current path
  const loadFiles = useCallback(async (path) => {
    setLoading(true);
    setError(null);
    try {
      const result = await dispatch(
        listCloudDriveFiles({
          provider,
          credentialId,
          path,
          siteId,
          libraryId,
        })
      ).unwrap();
      setItems(result.items || []);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load files');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [dispatch, provider, credentialId, siteId, libraryId]);

  // Initial load
  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath, loadFiles]);

  // Navigate to folder
  const navigateToFolder = useCallback((folder) => {
    const newPath = folder.id || folder.path;
    setCurrentPath(newPath);
    setBreadcrumbs((prev) => [...prev, { name: folder.name, path: newPath }]);
    setSearchQuery('');
    setIsSearching(false);
  }, []);

  // Navigate via breadcrumb
  const navigateToBreadcrumb = useCallback((index) => {
    const crumb = breadcrumbs[index];
    setCurrentPath(crumb.path);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setSearchQuery('');
    setIsSearching(false);
  }, [breadcrumbs]);

  // Navigate up
  const navigateUp = useCallback(() => {
    if (breadcrumbs.length > 1) {
      navigateToBreadcrumb(breadcrumbs.length - 2);
    }
  }, [breadcrumbs, navigateToBreadcrumb]);

  // Search with debounce
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

    if (!query.trim()) {
      setIsSearching(false);
      loadFiles(currentPath);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setLoading(true);
      setError(null);
      try {
        const result = await dispatch(
          searchCloudDriveFiles({
            provider,
            credentialId,
            query: query.trim(),
          })
        ).unwrap();
        setItems(result.items || []);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 400);
    setSearchDebounceTimer(timer);
  }, [dispatch, provider, credentialId, currentPath, loadFiles, searchDebounceTimer]);

  // Toggle file selection
  const toggleFileSelection = useCallback((item) => {
    if (item.type === 'folder') {
      navigateToFolder(item);
      return;
    }
    setSelectedFiles((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = item;
      }
      return next;
    });
  }, [navigateToFolder]);

  // Select all files (not folders)
  const selectAll = useCallback(() => {
    const files = items.filter((i) => i.type !== 'folder');
    const allSelected = files.every((f) => selectedFiles[f.id]);
    if (allSelected) {
      // Deselect all
      const next = { ...selectedFiles };
      files.forEach((f) => delete next[f.id]);
      setSelectedFiles(next);
    } else {
      // Select all
      const next = { ...selectedFiles };
      files.forEach((f) => { next[f.id] = f; });
      setSelectedFiles(next);
    }
  }, [items, selectedFiles]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      // Folders always first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;

      let cmp = 0;
      switch (sortBy) {
        case 'date':
          cmp = new Date(a.modifiedAt || 0) - new Date(b.modifiedAt || 0);
          break;
        case 'size':
          cmp = (a.size || 0) - (b.size || 0);
          break;
        default:
          cmp = (a.name || '').localeCompare(b.name || '');
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [items, sortBy, sortAsc]);

  const selectedCount = Object.keys(selectedFiles).length;
  const fileCount = items.filter((i) => i.type !== 'folder').length;

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 flex-shrink-0">
        {/* Back button */}
        {breadcrumbs.length > 1 && !isSearching && (
          <button
            onClick={navigateUp}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Go up"
          >
            <ArrowUp className="w-4 h-4 text-gray-500" />
          </button>
        )}

        {/* Breadcrumbs */}
        {!isSearching && (
          <div className="flex items-center gap-1 text-sm text-gray-500 overflow-hidden">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                <button
                  onClick={() => navigateToBreadcrumb(idx)}
                  className={`truncate hover:text-gray-900 transition-colors ${
                    idx === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {isSearching && (
          <span className="text-sm text-gray-500">Search results for "{searchQuery}"</span>
        )}

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={() => loadFiles(currentPath)}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
            <span className="text-sm text-gray-500">Loading files...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => loadFiles(currentPath)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Folder className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              {isSearching ? 'No files match your search' : 'This folder is empty'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="w-8 px-4 py-2">
                  {fileCount > 0 && (
                    <input
                      type="checkbox"
                      checked={fileCount > 0 && items.filter(i => i.type !== 'folder').every(f => selectedFiles[f.id])}
                      onChange={selectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  )}
                </th>
                <th
                  className="px-4 py-2 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('name')}
                >
                  Name {sortBy === 'name' && (sortAsc ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-2 w-32 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('date')}
                >
                  Modified {sortBy === 'date' && (sortAsc ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-2 w-24 cursor-pointer hover:text-gray-700 text-right"
                  onClick={() => handleSort('size')}
                >
                  Size {sortBy === 'size' && (sortAsc ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => {
                const Icon = getFileIcon(item);
                const isSelected = !!selectedFiles[item.id];
                const isFolder = item.type === 'folder';

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleFileSelection(item)}
                    onDoubleClick={() => isFolder && navigateToFolder(item)}
                  >
                    <td className="px-4 py-2">
                      {!isFolder && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${
                          isFolder ? 'text-yellow-500' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm truncate ${isFolder ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {item.name}
                        </span>
                        {isFolder && <ChevronRight className="w-3 h-3 text-gray-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {formatDate(item.modifiedAt)}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500 text-right">
                      {isFolder ? '—' : formatFileSize(item.size)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer with selection count and import button */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <span className="text-sm text-gray-500">
          {selectedCount > 0
            ? `${selectedCount} file${selectedCount !== 1 ? 's' : ''} selected`
            : 'Select files to import'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onFilesSelected(Object.values(selectedFiles))}
            disabled={selectedCount === 0}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedCount > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Import {selectedCount > 0 ? `${selectedCount} File${selectedCount !== 1 ? 's' : ''}` : 'Files'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloudDriveFileBrowser;
