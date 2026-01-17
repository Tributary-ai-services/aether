import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen,
  BookOpen,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Share2,
  Plus,
  Lock,
  Globe,
  Users
} from 'lucide-react';

const NotebookTreeView = ({ 
  notebooks = [], 
  onSelectNotebook, 
  onCreateSubNotebook,
  onEditNotebook,
  onDeleteNotebook,
  selectedNotebookId 
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);

  const toggleExpanded = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleContextMenu = (e, notebook) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      notebook
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'public': return <Globe size={12} className="text-green-600" />;
      case 'shared': return <Users size={12} className="text-blue-600" />;
      default: return <Lock size={12} className="text-gray-400" />;
    }
  };

  const renderNotebook = (notebook, depth = 0) => {
    const isExpanded = expandedNodes.has(notebook.id);
    const hasChildren = notebook.children && notebook.children.length > 0;
    const isSelected = selectedNotebookId === notebook.id;

    return (
      <div key={notebook.id} className="select-none">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-blue-100 text-blue-900' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
          onClick={() => onSelectNotebook?.(notebook)}
          onContextMenu={(e) => handleContextMenu(e, notebook)}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(notebook.id);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
          >
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          {/* Folder/Notebook Icon */}
          <div className="flex-shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen size={16} className="text-blue-600" />
              ) : (
                <Folder size={16} className="text-blue-600" />
              )
            ) : (
              <BookOpen size={16} className="text-purple-600" />
            )}
          </div>

          {/* Notebook Name */}
          <span className="flex-1 truncate text-sm font-medium">
            {notebook.name}
          </span>

          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {/* Document Count */}
            <span className="bg-gray-100 px-2 py-1 rounded-full">
              {notebook.documentCount || 0}
            </span>

            {/* Visibility */}
            {getVisibilityIcon(notebook.visibility)}

            {/* More Actions */}
            <button
              onClick={(e) => handleContextMenu(e, notebook)}
              className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {notebook.children.map(child => renderNotebook(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Tree View */}
      <div className="space-y-1">
        {notebooks.map(notebook => renderNotebook(notebook))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={closeContextMenu}
          />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              onClick={() => {
                onCreateSubNotebook?.(contextMenu.notebook);
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Plus size={16} />
              Create Sub-notebook
            </button>
            
            <button
              onClick={() => {
                onEditNotebook?.(contextMenu.notebook);
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit size={16} />
              Edit
            </button>

            <button
              onClick={() => {
                // Handle duplicate
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Copy size={16} />
              Duplicate
            </button>

            <button
              onClick={() => {
                // Handle share
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Share2 size={16} />
              Share
            </button>

            <div className="border-t border-gray-200 my-1" />

            <button
              onClick={() => {
                onDeleteNotebook?.(contextMenu.notebook);
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Empty State */}
      {notebooks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
          <p>No notebooks yet</p>
          <p className="text-sm">Create your first notebook to get started</p>
        </div>
      )}
    </div>
  );
};

export default NotebookTreeView;