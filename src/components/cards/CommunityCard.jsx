import React from 'react';
import { Bot, Workflow, BookOpen, Star, Eye, Wrench, Sparkles } from 'lucide-react';

const CommunityCard = ({ item, isSystemTool = false }) => {
  // Determine icon and colors based on type
  const getTypeIcon = () => {
    if (isSystemTool || item.type === 'system-tool') {
      return <Wrench size={16} className="text-purple-600" />;
    }
    switch (item.type) {
      case 'agent':
        return <Bot size={16} className="text-purple-600" />;
      case 'workflow':
        return <Workflow size={16} className="text-blue-600" />;
      case 'notebook':
        return <BookOpen size={16} className="text-green-600" />;
      default:
        return <Bot size={16} className="text-gray-600" />;
    }
  };

  const getTypeLabel = () => {
    if (isSystemTool || item.type === 'system-tool') {
      return 'System Tool';
    }
    return item.type;
  };

  const borderClass = isSystemTool
    ? 'border-purple-200 hover:border-purple-300'
    : 'border-gray-200';

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${borderClass} p-6 hover:shadow-md transition-all`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className="text-xs uppercase tracking-wide text-gray-500">{getTypeLabel()}</span>
          {isSystemTool && (
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
              System
            </span>
          )}
        </div>
        {!isSystemTool && (
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-500 fill-current" />
            <span className="text-sm text-gray-600">{item.rating}</span>
          </div>
        )}
        {isSystemTool && (
          <div className="p-1 bg-purple-50 rounded">
            <Sparkles size={14} className="text-purple-500" />
          </div>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 mb-2">{item.title || item.name}</h3>
      {item.description && (
        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>
      )}
      <p className="text-sm text-gray-600 mb-3">by {item.author}</p>

      {/* Tags for system tools */}
      {isSystemTool && item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500">
        {!isSystemTool && (
          <div className="flex items-center gap-1">
            <Eye size={14} />
            {item.downloads || item.views}
          </div>
        )}
        {isSystemTool && (
          <span className="text-xs text-gray-400">Available to all users</span>
        )}
        <button
          className={`font-medium ${
            isSystemTool
              ? 'text-purple-600 hover:text-purple-800'
              : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          {isSystemTool ? 'Use Tool' : 'Use Template'}
        </button>
      </div>
    </div>
  );
};

export default CommunityCard;