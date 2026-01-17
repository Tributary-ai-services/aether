import React, { useState } from 'react';
import { useCollaboration } from '../../context/CollaborationContext.jsx';
import { 
  MessageCircle, 
  Send, 
  Reply, 
  MoreVertical,
  Clock,
  AtSign
} from 'lucide-react';

const Comments = ({ resourceId, resourceType = 'notebook' }) => {
  const { getComments, addComment, activeUsers, getMentions } = useCollaboration();
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);

  const comments = getComments(resourceId);
  const currentUser = activeUsers[0]; // Assume first user is current user

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
    if (newComment.trim()) {
      addComment(resourceId, newComment);
      setNewComment('');
    }
  };

  const handleSubmitReply = (e, parentId) => {
    e.preventDefault();
    if (replyContent.trim()) {
      addComment(resourceId, replyContent, parentId);
      setReplyContent('');
      setReplyToId(null);
    }
  };

  const handleMention = (user) => {
    const mention = `@${user.name.replace(' ', '')} `;
    if (replyToId) {
      setReplyContent(prev => prev + mention);
    } else {
      setNewComment(prev => prev + mention);
    }
    setShowMentions(false);
  };

  const UserAvatar = ({ user, size = 'default' }) => {
    const sizeClasses = {
      small: 'w-6 h-6 text-xs',
      default: 'w-8 h-8 text-sm',
      large: 'w-10 h-10 text-base'
    };

    return (
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-medium`}
        style={{ backgroundColor: user.color }}
      >
        {user.avatar}
      </div>
    );
  };

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
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <div className="flex gap-3">
          <UserAvatar user={currentUser} />
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment... Use @username to mention someone"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
            {showMentions && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                {activeUsers.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleMention(user)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-left"
                  >
                    <UserAvatar user={user} size="small" />
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center ml-11">
          <button
            type="button"
            onClick={() => setShowMentions(!showMentions)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <AtSign size={14} />
            Mention someone
          </button>
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            Comment
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to start the conversation</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="space-y-3">
              {/* Main Comment */}
              <div className="flex gap-3">
                <UserAvatar user={comment.user} />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{comment.user.name}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={10} />
                          {formatTimeAgo(comment.timestamp)}
                        </span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                    <p className="text-gray-800">{comment.content}</p>
                  </div>
                  
                  {/* Reply Button */}
                  <button
                    onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800"
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
                        <UserAvatar user={currentUser} size="small" />
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-end gap-2 ml-8">
                        <button
                          type="button"
                          onClick={() => setReplyToId(null)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!replyContent.trim()}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Reply
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-3 ml-4 space-y-3">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="flex gap-2">
                          <UserAvatar user={reply.user} size="small" />
                          <div className="flex-1">
                            <div className="bg-white border border-gray-200 rounded-lg p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">{reply.user.name}</span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock size={8} />
                                  {formatTimeAgo(reply.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800">{reply.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;