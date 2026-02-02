import React, { useState, useMemo } from 'react';
import {
  History,
  X,
  Trash2,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Copy,
  Check,
  Database,
  ChevronDown,
  ChevronRight,
  Filter
} from 'lucide-react';

const QueryHistory = ({
  history = [],
  onSelectQuery,
  onClearHistory,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'success' | 'failed'
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  // Filter and search history
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      // Filter by status
      if (filterStatus === 'success' && !item.success) return false;
      if (filterStatus === 'failed' && item.success) return false;

      // Search in query and connection name
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const queryMatch = item.query?.toLowerCase().includes(search);
        const connectionMatch = item.connectionName?.toLowerCase().includes(search);
        return queryMatch || connectionMatch;
      }

      return true;
    });
  }, [history, searchTerm, filterStatus]);

  // Group history by date
  const groupedHistory = useMemo(() => {
    const groups = {};
    filteredHistory.forEach(item => {
      const date = new Date(item.executedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [filteredHistory]);

  // Toggle item expansion
  const toggleExpanded = (id) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Copy query to clipboard
  const handleCopy = async (item, event) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.query);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format query preview (first line, truncated)
  const formatQueryPreview = (query, maxLength = 60) => {
    const firstLine = query.split('\n')[0].trim();
    if (firstLine.length <= maxLength) return firstLine;
    return firstLine.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">Query History</h3>
          <span className="text-xs text-gray-400">({history.length})</span>
        </div>
        <div className="flex items-center space-x-1">
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Search and filter */}
      <div className="px-3 py-2 border-b border-gray-200 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
          />
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              filterStatus === 'all'
                ? 'bg-(--color-primary-100) text-(--color-primary-700)'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('success')}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
              filterStatus === 'success'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            <span>Success</span>
          </button>
          <button
            onClick={() => setFilterStatus('failed')}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
              filterStatus === 'failed'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>Failed</span>
          </button>
        </div>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <History className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm text-center">No query history yet</p>
            <p className="text-xs text-center mt-1">
              Your executed queries will appear here
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <Search className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No matching queries</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {Object.entries(groupedHistory).map(([dateGroup, items]) => (
              <div key={dateGroup}>
                <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 sticky top-0">
                  {dateGroup}
                </div>
                <div>
                  {items.map((item) => {
                    const isExpanded = expandedItems.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className="border-b border-gray-50 last:border-b-0"
                      >
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start space-x-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                {item.success ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                )}
                                <code className="text-xs text-gray-700 font-mono truncate flex-1">
                                  {formatQueryPreview(item.query)}
                                </code>
                              </div>

                              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTime(item.executedAt)}</span>
                                </span>
                                {item.connectionName && (
                                  <span className="flex items-center space-x-1">
                                    <Database className="w-3 h-3" />
                                    <span className="truncate max-w-[100px]">
                                      {item.connectionName}
                                    </span>
                                  </span>
                                )}
                                {item.success && item.rowCount !== undefined && (
                                  <span>{item.rowCount} rows</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Expanded view */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 bg-gray-50">
                            <div className="bg-white border border-gray-200 rounded p-2">
                              <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                {item.query}
                              </pre>
                            </div>

                            {item.error && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                {item.error}
                              </div>
                            )}

                            <div className="flex items-center space-x-2 mt-2">
                              <button
                                onClick={() => onSelectQuery(item)}
                                className="flex items-center space-x-1 px-2 py-1 bg-(--color-primary-600) text-(--color-primary-contrast) text-xs rounded hover:bg-(--color-primary-700) transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                <span>Use Query</span>
                              </button>

                              <button
                                onClick={(e) => handleCopy(item, e)}
                                className="flex items-center space-x-1 px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-100 transition-colors"
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-green-600" />
                                    <span className="text-green-600">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryHistory;
