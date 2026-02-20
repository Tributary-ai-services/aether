import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectNotebookTree,
  selectNotebooks,
  selectNotebooksLoading,
  fetchNotebooks,
} from '../../store/slices/notebooksSlice.js';
import Modal from '../ui/Modal.jsx';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  BookOpen,
  Globe,
  Users,
  Lock,
  Check,
  CheckSquare,
  Square,
} from 'lucide-react';

const NotebookSelectorModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedIds = [],
  multiSelect = true,
  title = 'Select Notebooks',
}) => {
  const dispatch = useDispatch();
  const tree = useSelector(selectNotebookTree);
  const notebooks = useSelector(selectNotebooks);
  const loading = useSelector(selectNotebooksLoading);

  const [localSelected, setLocalSelected] = useState(new Set(selectedIds));
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalSelected(new Set(selectedIds));
      setSearchQuery('');
      if (!notebooks.length) {
        dispatch(fetchNotebooks());
      }
      // Auto-expand all parent nodes
      const parents = notebooks
        .filter((nb) => {
          const pid = nb.parent_id || nb.parentId;
          return !pid || pid === '';
        })
        .map((nb) => nb.id);
      setExpandedNodes(new Set(parents));
    }
  }, [isOpen, selectedIds, notebooks.length, dispatch]);

  const toggleExpanded = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const toggleSelected = (notebookId) => {
    if (multiSelect) {
      setLocalSelected((prev) => {
        const next = new Set(prev);
        if (next.has(notebookId)) {
          next.delete(notebookId);
        } else {
          next.add(notebookId);
        }
        return next;
      });
    } else {
      setLocalSelected(new Set([notebookId]));
    }
  };

  const selectAllChildren = (notebook) => {
    const collectIds = (nb) => {
      const ids = [nb.id];
      if (nb.children) {
        nb.children.forEach((child) => {
          ids.push(...collectIds(child));
        });
      }
      return ids;
    };
    const allIds = collectIds(notebook);
    setLocalSelected((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleApply = () => {
    onSelect(Array.from(localSelected));
    onClose();
  };

  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'public':
        return <Globe size={12} className="text-green-600" />;
      case 'shared':
        return <Users size={12} className="text-blue-600" />;
      default:
        return <Lock size={12} className="text-gray-400" />;
    }
  };

  // Filter tree based on search
  const filterTree = (nodes, query) => {
    if (!query) return nodes;
    const lower = query.toLowerCase();
    const filterNode = (node) => {
      const nameMatch = node.name?.toLowerCase().includes(lower);
      const filteredChildren = node.children
        ? node.children.map(filterNode).filter(Boolean)
        : [];
      if (nameMatch || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };
    return nodes.map(filterNode).filter(Boolean);
  };

  const filteredTree = useMemo(
    () => filterTree(tree, searchQuery),
    [tree, searchQuery]
  );

  const renderNotebook = (notebook, depth = 0) => {
    const isExpanded = expandedNodes.has(notebook.id);
    const hasChildren = notebook.children && notebook.children.length > 0;
    const isSelected = localSelected.has(notebook.id);

    return (
      <div key={notebook.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-50 text-blue-900'
              : 'hover:bg-gray-50 text-gray-700'
          }`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
          onClick={() => toggleSelected(notebook.id)}
        >
          {/* Expand/Collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(notebook.id);
            }}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>

          {/* Checkbox / Radio indicator */}
          {multiSelect ? (
            isSelected ? (
              <CheckSquare size={16} className="text-blue-600 shrink-0" />
            ) : (
              <Square size={16} className="text-gray-400 shrink-0" />
            )
          ) : (
            <div
              className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                isSelected
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-400'
              }`}
            >
              {isSelected && (
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </div>
          )}

          {/* Icon */}
          <div className="shrink-0">
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

          {/* Name */}
          <span className="flex-1 truncate text-sm font-medium">
            {notebook.name}
          </span>

          {/* Metadata */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded-full">
              {notebook.documentCount || notebook.document_count || 0}
            </span>
            {getVisibilityIcon(notebook.visibility)}
          </div>

          {/* Select All Children */}
          {multiSelect && hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                selectAllChildren(notebook);
              }}
              className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline shrink-0"
              title="Select all children"
            >
              All
            </button>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {notebook.children.map((child) =>
              renderNotebook(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="default">
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notebooks..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tree */}
        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Loading notebooks...
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              {searchQuery ? 'No notebooks match your search' : 'No notebooks found'}
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filteredTree.map((nb) => renderNotebook(nb))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            {localSelected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply ({localSelected.size} selected)
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NotebookSelectorModal;
