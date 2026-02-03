import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import {
  fetchNotebookProductions,
} from '../../store/slices/producersSlice.js';
import {
  Sparkles,
  FileText,
  HelpCircle,
  List,
  Lightbulb,
  FileCode,
  Eye,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Loader,
  Settings2,
  ExternalLink,
} from 'lucide-react';

const TYPE_CONFIG = {
  summary: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  qa: { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-50' },
  outline: { icon: List, color: 'text-purple-600', bg: 'bg-purple-50' },
  insight: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50' },
  custom: { icon: FileCode, color: 'text-gray-600', bg: 'bg-gray-50' },
  default: { icon: Sparkles, color: 'text-gray-600', bg: 'bg-gray-50' },
};

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, color: 'text-green-500' },
  processing: { icon: Loader, color: 'text-blue-500' },
  failed: { icon: XCircle, color: 'text-red-500' },
};

const ProductionsList = ({
  notebookId,
  onViewProduction,
  onDeleteProduction,
}) => {
  const dispatch = useAppDispatch();

  // Selectors
  const productionsState = useAppSelector(state => state.producers.productions[notebookId]);
  const productions = productionsState?.items || [];
  const loading = productionsState?.loading || false;
  const total = productionsState?.total || 0;

  // Load productions on mount
  useEffect(() => {
    if (notebookId) {
      dispatch(fetchNotebookProductions({ notebookId, limit: 20, offset: 0 }));
    }
  }, [dispatch, notebookId]);

  // Filter out failed productions and sort by date (newest first)
  const sortedProductions = [...productions]
    .filter(p => p.status !== 'failed')
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return dateB - dateA;
    });

  // Render production item
  const renderProductionItem = (production) => {
    const typeConfig = TYPE_CONFIG[production.type] || TYPE_CONFIG.default;
    const statusConfig = STATUS_CONFIG[production.status] || STATUS_CONFIG.completed;
    const TypeIcon = typeConfig.icon;
    const StatusIcon = statusConfig.icon;

    return (
      <div
        key={production.id}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 group ${typeConfig.bg}`}
        onClick={() => onViewProduction?.(production)}
        title={`${production.title} - ${production.status}`}
      >
        <TypeIcon size={16} className={typeConfig.color} />
        <span className="flex-1 text-sm text-gray-800 truncate">
          {production.title}
        </span>
        <StatusIcon
          size={14}
          className={`${statusConfig.color} ${production.status === 'processing' ? 'animate-spin' : ''}`}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewProduction?.(production);
          }}
          className="p-1 rounded text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Preview"
        >
          <Eye size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteProduction?.(production);
          }}
          className="p-1 rounded text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  if (loading && productions.length === 0) {
    return (
      <>
        <div className="p-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-medium text-gray-900 text-sm">Productions</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  // Handle opening manage page in new window
  const handleOpenManage = () => {
    const url = `/notebooks/${notebookId}/productions`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 text-sm">Productions</h3>
            {total > 0 && (
              <span className="text-xs text-gray-500">({total})</span>
            )}
          </div>
          {total > 0 && (
            <button
              onClick={handleOpenManage}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              title="Manage productions in new window"
            >
              <Settings2 size={12} />
              Manage
              <ExternalLink size={10} className="ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-2">
        {sortedProductions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Sparkles size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No productions yet</p>
            <p className="text-xs text-gray-400 mt-1">Run a producer to generate content</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedProductions.map(production => renderProductionItem(production))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductionsList;
