import React, { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import {
  updateProducerPreferences,
  selectProducerPreferences,
  setProducerOrder,
} from '../../store/slices/producersSlice.js';
import {
  X,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  Pin,
  FileText,
  HelpCircle,
  List,
  Lightbulb,
  FileCode,
  Bot,
  Loader2,
  GripVertical,
} from 'lucide-react';

const TYPE_CONFIG = {
  summary: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Summary' },
  qa: { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Q&A' },
  outline: { icon: List, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Outline' },
  insight: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Insight' },
  custom: { icon: FileCode, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Custom' },
  producer: { icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Producer' },
  default: { icon: Bot, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Agent' },
};

const ProducersManagementModal = ({
  isOpen,
  onClose,
  notebookId,
  producers = [],
  onExecuteProducer,
  onRefresh,
}) => {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(selectProducerPreferences);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('custom'); // Default to custom order for drag-drop
  const [sortOrder, setSortOrder] = useState('desc');

  // Drag and drop state
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [customOrder, setCustomOrder] = useState([]);

  // Initialize custom order from preferences or producers list
  // Prefer notebook-specific order, fall back to global order
  useEffect(() => {
    const notebookOrder = preferences.order?.byNotebook?.[notebookId] || [];
    const globalOrder = preferences.order?.global || [];
    const savedOrder = notebookOrder.length > 0 ? notebookOrder : globalOrder;

    if (savedOrder.length > 0) {
      setCustomOrder(savedOrder);
    } else if (producers.length > 0) {
      setCustomOrder(producers.map(p => p.id));
    }
  }, [producers, preferences.order?.byNotebook, preferences.order?.global, notebookId]);

  // Check if a producer is pinned
  const isPinned = (producer) => {
    return producer.isPinned || preferences.pinned?.global?.includes(producer.id);
  };

  // Get producer type for display
  const getProducerType = (producer) => {
    // Check if it has a specific production type
    if (producer.productionType) return producer.productionType;
    // Check name for hints
    const name = (producer.name || '').toLowerCase();
    if (name.includes('summary') || name.includes('summariz')) return 'summary';
    if (name.includes('q&a') || name.includes('qa') || name.includes('question')) return 'qa';
    if (name.includes('outline')) return 'outline';
    if (name.includes('insight')) return 'insight';
    if (producer.type === 'producer') return 'producer';
    return 'default';
  };

  // Filtered and sorted producers
  const filteredProducers = useMemo(() => {
    let filtered = [...producers];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      if (filterType === 'internal') {
        filtered = filtered.filter(p => p.is_internal || p.isInternal);
      } else if (filterType === 'custom') {
        filtered = filtered.filter(p => !p.is_internal && !p.isInternal);
      } else if (filterType === 'pinned') {
        filtered = filtered.filter(p => isPinned(p));
      }
    }

    // Sort
    if (sortBy === 'custom' && customOrder.length > 0) {
      // Use custom order from drag-drop
      filtered.sort((a, b) => {
        const aIndex = customOrder.indexOf(a.id);
        const bIndex = customOrder.indexOf(b.id);
        // Items not in customOrder go to the end
        const aPos = aIndex === -1 ? customOrder.length : aIndex;
        const bPos = bIndex === -1 ? customOrder.length : bIndex;
        return aPos - bPos;
      });
    } else {
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'most_used':
            // Placeholder - will use execution_count when available
            // For now, prioritize pinned items
            const aScore = isPinned(a) ? 1000 : 0;
            const bScore = isPinned(b) ? 1000 : 0;
            comparison = bScore - aScore;
            break;
          case 'name':
            comparison = (a.name || '').localeCompare(b.name || '');
            break;
          case 'type':
            comparison = getProducerType(a).localeCompare(getProducerType(b));
            break;
          case 'recent':
            // Placeholder - will use last_executed_at when available
            comparison = 0;
            break;
          default:
            comparison = 0;
        }
        return sortOrder === 'asc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [producers, searchQuery, filterType, sortBy, sortOrder, preferences, customOrder]);

  // Toggle pin for a producer
  const handleTogglePin = async (e, producer) => {
    e.stopPropagation();
    const pinned = isPinned(producer);

    await dispatch(updateProducerPreferences({
      [pinned ? 'unpin_global' : 'pin_global']: producer.id,
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e, producerId) => {
    setDraggedId(producerId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', producerId);
    // Add a slight delay to show the drag styling
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e, producerId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (producerId !== draggedId) {
      setDragOverId(producerId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) return;

    // Create new order
    const currentOrder = customOrder.length > 0 ? [...customOrder] : producers.map(p => p.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged item and insert at new position
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedId);

    setCustomOrder(currentOrder);
    setSortBy('custom'); // Switch to custom sort when reordering

    // Save to Redux state locally (notebook-specific)
    dispatch(setProducerOrder({ order: currentOrder, scope: 'byNotebook', scopeId: notebookId }));

    // Save to backend (notebook-specific)
    try {
      await dispatch(updateProducerPreferences({
        set_order_for_notebook: currentOrder,
        notebook_id: notebookId,
      }));
    } catch (error) {
      console.log('Failed to save order preference:', error);
    }

    setDraggedId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Producers</h2>
            <p className="text-sm text-gray-500 mt-1">
              {producers.length} producer{producers.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search producers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Producers</option>
                <option value="internal">Internal</option>
                <option value="custom">Custom</option>
                <option value="pinned">Pinned</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown size={14} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="custom">Custom Order (drag to reorder)</option>
                <option value="most_used">Most Used (coming soon)</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="recent" disabled>Recently Used (coming soon)</option>
              </select>
              {sortBy !== 'custom' && (
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Producer List */}
        <div className="flex-1 overflow-auto p-4">
          {filteredProducers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bot size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No producers found</p>
              <p className="text-sm mt-1">
                {searchQuery || filterType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No producer agents are available'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {sortBy === 'custom' && (
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                  <GripVertical size={14} />
                  Drag items to reorder. Your custom order will be saved automatically.
                </p>
              )}
              {filteredProducers.map((producer) => {
                const producerType = getProducerType(producer);
                const typeConfig = TYPE_CONFIG[producerType] || TYPE_CONFIG.default;
                const TypeIcon = typeConfig.icon;
                const pinned = isPinned(producer);
                const isDragging = draggedId === producer.id;
                const isDragOver = dragOverId === producer.id;

                return (
                  <div
                    key={producer.id}
                    draggable={sortBy === 'custom'}
                    onDragStart={(e) => handleDragStart(e, producer.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, producer.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, producer.id)}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${typeConfig.bg} ${
                      isDragging
                        ? 'opacity-50 border-blue-400 shadow-lg'
                        : isDragOver
                        ? 'border-blue-500 border-2 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    } ${sortBy === 'custom' ? 'cursor-move' : ''}`}
                  >
                    {/* Drag Handle */}
                    {sortBy === 'custom' && (
                      <div className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                        <GripVertical size={20} />
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm`}>
                      <TypeIcon size={20} className={typeConfig.color} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">{producer.name}</h3>
                        {(producer.is_internal || producer.isInternal) && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            Internal
                          </span>
                        )}
                        {pinned && (
                          <Pin size={12} className="text-amber-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {producer.description || 'No description'}
                      </p>
                      {/* Placeholder for usage stats */}
                      <p className="text-xs text-gray-400 mt-1">
                        {producer.execution_count
                          ? `Used ${producer.execution_count} times`
                          : 'Usage stats coming soon'}
                      </p>
                    </div>

                    {/* Actions - Pin only, no Run button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleTogglePin(e, producer)}
                        className={`p-2 rounded-lg transition-colors ${
                          pinned
                            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title={pinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin size={16} className={pinned ? 'fill-current' : ''} />
                      </button>
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
};

export default ProducersManagementModal;
