import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCommentSSE } from '../../hooks/useCommentSSE';
import {
  selectComments,
  selectCommentsLoading,
  selectCommentsCreating,
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
} from '../../store/slices/commentsSlice';
import {
  MessageCircle,
  Send,
  Reply,
  MoreVertical,
  Clock,
  AtSign,
  Pencil,
  Trash2,
  Loader2,
  X,
} from 'lucide-react';

const Comments = ({ resourceId, resourceType = 'notebook' }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const comments = useSelector((state) => selectComments(state, resourceId));
  const loading = useSelector(selectCommentsLoading);
  const creating = useSelector(selectCommentsCreating);

  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  // Subscribe to real-time SSE updates
  useCommentSSE(resourceId);

  // Fetch comments on mount / resource change
  useEffect(() => {
    if (resourceId) {
      dispatch(fetchComments(resourceId));
    }
  }, [dispatch, resourceId]);

  const currentUser = user ? {
    id: user.id || user.sub,
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    email: user.email,
    avatar: (user.name || user.email || '??').substring(0, 2).toUpperCase(),
    color: '#3b82f6',
  } : null;

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (newComment.trim() && resourceId) {
      dispatch(createComment({ notebookId: resourceId, content: newComment }));
      setNewComment('');
    }
  };

  const handleSubmitReply = (e, parentId) => {
    e.preventDefault();
    if (replyContent.trim() && resourceId) {
      dispatch(createComment({ notebookId: resourceId, content: replyContent, parentId }));
      setReplyContent('');
      setReplyToId(null);
    }
  };

  const handleEdit = (commentId) => {
    if (editContent.trim() && resourceId) {
      dispatch(updateComment({ notebookId: resourceId, commentId, content: editContent }));
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleDelete = (commentId) => {
    if (resourceId && window.confirm('Delete this comment?')) {
      dispatch(deleteComment({ notebookId: resourceId, commentId }));
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setOpenMenuId(null);
  };

  const getCommentAuthor = (comment) => {
    return comment.author || {
      name: comment.authorName || 'Unknown',
      avatar: (comment.authorName || '??').substring(0, 2).toUpperCase(),
      color: '#6b7280',
    };
  };

  const isOwnComment = (comment) => {
    if (!currentUser) return false;
    return comment.authorId === currentUser.id || comment.author_id === currentUser.id;
  };

  const UserAvatar = ({ userObj, size = 'default' }) => {
    const sizeClasses = {
      small: 'w-6 h-6 text-xs',
      default: 'w-8 h-8 text-sm',
      large: 'w-10 h-10 text-base'
    };
    const avatar = userObj?.avatar || '??';
    const color = userObj?.color || '#6b7280';

    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-medium`}
        style={{ backgroundColor: color }}
      >
        {avatar}
      </div>
    );
  };

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} />
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comments Header */}
      <div className="flex items-center gap-2">
        <MessageCircle size={20} className="text-gray-600" />
        <h3 className="font-medium text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* New Comment Form */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="flex gap-3">
            <UserAvatar userObj={currentUser} />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) resize-none"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end ml-11">
            <button
              type="submit"
              disabled={!newComment.trim() || creating}
              className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Comment
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to start the conversation</p>
          </div>
        ) : (
          comments.map(comment => {
            const author = getCommentAuthor(comment);
            const own = isOwnComment(comment);
            const replies = comment.replies || [];

            return (
              <div key={comment.id} className="space-y-3">
                {/* Main Comment */}
                <div className="flex gap-3">
                  <UserAvatar userObj={author} />
                  <div className="flex-1">
                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                          <button onClick={() => handleEdit(comment.id)} disabled={!editContent.trim()} className="px-3 py-1 text-sm bg-(--color-primary-600) text-white rounded hover:bg-(--color-primary-700) disabled:opacity-50">Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{author.name}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={10} />
                              {formatTimeAgo(comment.createdAt || comment.created_at || comment.timestamp)}
                            </span>
                            {comment.edited && <span className="text-xs text-gray-400">(edited)</span>}
                          </div>
                          {own && (
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <MoreVertical size={14} />
                              </button>
                              {openMenuId === comment.id && (
                                <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-28">
                                  <button onClick={() => startEdit(comment)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <Pencil size={12} /> Edit
                                  </button>
                                  <button onClick={() => { setOpenMenuId(null); handleDelete(comment.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-gray-800">{comment.content}</p>
                      </div>
                    )}

                    {/* Reply Button */}
                    <button
                      onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                      className="flex items-center gap-1 mt-2 text-sm text-(--color-primary-600) hover:text-(--color-primary-700)"
                    >
                      <Reply size={14} />
                      Reply
                    </button>

                    {/* Reply Form */}
                    {replyToId === comment.id && (
                      <form
                        onSubmit={(e) => handleSubmitReply(e, comment.id)}
                        className="mt-3 space-y-2"
                      >
                        <div className="flex gap-2">
                          {currentUser && <UserAvatar userObj={currentUser} size="small" />}
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) resize-none"
                            rows={2}
                          />
                        </div>
                        <div className="flex justify-end gap-2 ml-8">
                          <button type="button" onClick={() => setReplyToId(null)} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                          <button type="submit" disabled={!replyContent.trim() || creating} className="px-3 py-1 text-sm bg-(--color-primary-600) text-(--color-primary-contrast) rounded hover:bg-(--color-primary-700) disabled:opacity-50">Reply</button>
                        </div>
                      </form>
                    )}

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div className="mt-3 ml-4 space-y-3">
                        {replies.map(reply => {
                          const replyAuthor = getCommentAuthor(reply);
                          return (
                            <div key={reply.id} className="flex gap-2">
                              <UserAvatar userObj={replyAuthor} size="small" />
                              <div className="flex-1">
                                <div className="bg-white border border-gray-200 rounded-lg p-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900">{replyAuthor.name}</span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock size={8} />
                                      {formatTimeAgo(reply.createdAt || reply.created_at || reply.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-800">{reply.content}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

export default Comments;
