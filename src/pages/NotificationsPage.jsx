import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNotifications } from '../context/NotificationContext.jsx';
import { fetchNotifications, fetchUnreadCount } from '../store/slices/notificationsSlice.js';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Trash2,
  Check,
  Clock,
  Copy,
  Download,
  CheckSquare,
  Square,
  Filter,
  X,
} from 'lucide-react';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const {
    notifications,
    removeNotification,
    clearAllNotifications,
    markAsRead,
  } = useNotifications();

  // Fetch fresh notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, unread, success, error, warning, info
  const [copiedId, setCopiedId] = useState(null);

  const getNotificationIcon = (type, size = 18) => {
    switch (type) {
      case 'success': return <CheckCircle size={size} className="text-green-600" />;
      case 'warning': return <AlertTriangle size={size} className="text-yellow-600" />;
      case 'error': return <XCircle size={size} className="text-red-600" />;
      case 'info': return <Info size={size} className="text-blue-600" />;
      default: return <Bell size={size} className="text-gray-600" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.read;
    return n.type === filterType;
  });

  const allSelected = filteredNotifications.length > 0 && filteredNotifications.every(n => selectedIds.has(n.id));

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => removeNotification(id));
    setSelectedIds(new Set());
  };

  const handleBulkMarkRead = () => {
    selectedIds.forEach(id => {
      const n = notifications.find(n => n.id === id);
      if (n && !n.read) markAsRead(id);
    });
    setSelectedIds(new Set());
  };

  const handleCopy = useCallback(async (notification) => {
    const text = `${notification.title}\n\n${notification.message || 'No details.'}\n\nSource: ${notification.source || 'Unknown'}\nTime: ${formatTime(notification.created_at || notification.timestamp)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(notification.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(notification.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleDownload = useCallback((notification) => {
    const text = `Title: ${notification.title}\nType: ${notification.type}\nSource: ${notification.source || 'Unknown'}\nTime: ${formatTime(notification.created_at || notification.timestamp)}\nRead: ${notification.read ? 'Yes' : 'No'}\n\n--- Message ---\n\n${notification.message || 'No details.'}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-${notification.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadAll = useCallback(() => {
    const target = selectedIds.size > 0
      ? filteredNotifications.filter(n => selectedIds.has(n.id))
      : filteredNotifications;
    if (target.length === 0) return;

    const text = target.map((n, i) => (
      `${'='.repeat(60)}\n[${i + 1}] ${n.title}\nType: ${n.type} | Source: ${n.source || 'Unknown'} | Time: ${formatTime(n.created_at || n.timestamp)}\n${'='.repeat(60)}\n\n${n.message || 'No details.'}\n`
    )).join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredNotifications, selectedIds]);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell size={24} className="text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <span className="text-sm text-gray-500">
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAll}
            disabled={filteredNotifications.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={selectedIds.size > 0 ? `Download ${selectedIds.size} selected` : 'Download all'}
          >
            <Download size={14} />
            {selectedIds.size > 0 ? `Download (${selectedIds.size})` : 'Download'}
          </button>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-t-xl px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Select all checkbox */}
          <button
            onClick={toggleSelectAll}
            className="p-0.5 text-gray-500 hover:text-gray-700 transition-colors"
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
          </button>

          {/* Bulk actions (visible when items selected) */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
              <button
                onClick={handleBulkMarkRead}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
              >
                <Check size={12} />
                Mark read
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <div className="flex gap-1">
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setFilterType(opt.value); setSelectedIds(new Set()); }}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  filterType === opt.value
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-xl divide-y divide-gray-100">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">
              {filterType === 'all' ? 'No notifications yet' : `No ${filterType} notifications`}
            </p>
            <p className="text-sm mt-1">
              {filterType !== 'all' && (
                <button onClick={() => setFilterType('all')} className="text-blue-600 hover:underline">
                  Show all notifications
                </button>
              )}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => {
            const isExpanded = expandedId === notification.id;
            const isSelected = selectedIds.has(notification.id);

            return (
              <div
                key={notification.id}
                className={`flex items-start gap-3 px-4 py-4 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-blue-50/40 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                } ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => {
                  setExpandedId(isExpanded ? null : notification.id);
                  if (!notification.read) markAsRead(notification.id);
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(notification.id); }}
                  className="flex-shrink-0 mt-0.5 p-0.5 text-gray-400 hover:text-gray-600"
                >
                  {isSelected
                    ? <CheckSquare size={16} className="text-blue-600" />
                    : <Square size={16} />
                  }
                </button>

                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-semibold text-gray-900 ${isExpanded ? '' : 'truncate'}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(notification); }}
                        className={`p-1 transition-colors rounded ${
                          copiedId === notification.id
                            ? 'text-green-600'
                            : 'text-gray-400 hover:text-blue-600'
                        }`}
                        title={copiedId === notification.id ? 'Copied!' : 'Copy message'}
                      >
                        {copiedId === notification.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(notification); }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded"
                        title="Download as text"
                      >
                        <Download size={14} />
                      </button>
                      {!notification.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors rounded"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap break-words bg-gray-50 rounded-lg p-3 border border-gray-100">
                      {notification.message || 'No additional details.'}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-500">{notification.source}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                        notification.type === 'success' ? 'bg-green-100 text-green-700' :
                        notification.type === 'error' ? 'bg-red-100 text-red-700' :
                        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        notification.type === 'info' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {notification.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatTime(notification.created_at || notification.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
