import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectConversations,
  selectActiveConversationId,
  selectConversationsLoading,
  fetchConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  setActiveConversation,
} from '../../store/slices/conversationsSlice';
import {
  Plus,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';

const ConversationSidebar = ({ notebookId, collapsed, onToggle }) => {
  const dispatch = useDispatch();
  const conversations = useSelector((state) => selectConversations(state, notebookId));
  const activeConversationId = useSelector(selectActiveConversationId);
  const loading = useSelector(selectConversationsLoading);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  // Fetch conversations when notebook changes
  useEffect(() => {
    if (notebookId) {
      dispatch(fetchConversations(notebookId));
    }
  }, [dispatch, notebookId]);

  const handleNewConversation = () => {
    if (notebookId) {
      dispatch(createConversation({ notebookId }));
    }
  };

  const handleSelect = (convId) => {
    dispatch(setActiveConversation(convId));
    setOpenMenuId(null);
  };

  const handleStartRename = (conv) => {
    setEditingId(conv.id);
    setEditName(conv.name);
    setOpenMenuId(null);
  };

  const handleSaveRename = (convId) => {
    if (editName.trim() && notebookId) {
      dispatch(updateConversation({ notebookId, conversationId: convId, name: editName.trim() }));
    }
    setEditingId(null);
    setEditName('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (convId) => {
    if (notebookId && window.confirm('Delete this conversation and all its messages?')) {
      dispatch(deleteConversation({ notebookId, conversationId: convId }));
      setOpenMenuId(null);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-2 border-r border-gray-200 bg-gray-50 w-10">
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-gray-600"
          title="Expand conversations"
        >
          <ChevronRight size={16} />
        </button>
        <div className="text-xs text-gray-400 mt-2 transform -rotate-90 whitespace-nowrap">Chats</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-r border-gray-200 bg-gray-50 w-52 min-w-[208px] min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Conversations</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewConversation}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
            title="New conversation"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Collapse"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="flex items-center justify-center py-4 text-gray-400">
            <Loader2 className="animate-spin" size={16} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-6 px-3">
            <MessageSquare size={24} className="mx-auto mb-2 text-gray-300" />
            <p className="text-xs text-gray-400">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Send a message to start one</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = activeConversationId === conv.id;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                className={`group relative px-3 py-2 cursor-pointer border-b border-gray-100 ${
                  isActive
                    ? 'bg-white border-l-2 border-l-(--color-primary-500)'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => !isEditing && handleSelect(conv.id)}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(conv.id);
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                      className="flex-1 text-sm px-1 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-(--color-primary-500)"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button onClick={(e) => { e.stopPropagation(); handleSaveRename(conv.id); }} className="p-0.5 text-green-600 hover:text-green-700">
                      <Check size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleCancelRename(); }} className="p-0.5 text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 truncate flex-1 pr-1">
                        {conv.name}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                          }}
                          className="p-0.5 text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400 truncate flex-1">
                        {conv.lastMessage || `${conv.messageCount || 0} messages`}
                      </span>
                      <span className="text-xs text-gray-400 ml-1 shrink-0">
                        {formatTimeAgo(conv.updatedAt)}
                      </span>
                    </div>
                  </>
                )}

                {/* Kebab menu */}
                {openMenuId === conv.id && (
                  <div
                    className="absolute right-2 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 w-28"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleStartRename(conv)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={12} /> Rename
                    </button>
                    <button
                      onClick={() => handleDelete(conv.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;
