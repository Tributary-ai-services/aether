import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import {
  fetchNotebookProducers,
  fetchProducerPreferences,
  updateProducerPreferences,
  selectSortedProducers,
  selectNotebookProducersLoading,
  selectProducerPreferences,
} from '../../store/slices/producersSlice.js';
import {
  Sparkles,
  Pin,
  FileText,
  HelpCircle,
  List,
  Lightbulb,
  FileCode,
  Loader2,
} from 'lucide-react';

const TYPE_CONFIG = {
  summary: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  qa: { icon: HelpCircle, color: 'text-green-600', bg: 'bg-green-50' },
  outline: { icon: List, color: 'text-purple-600', bg: 'bg-purple-50' },
  insight: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50' },
  custom: { icon: FileCode, color: 'text-gray-600', bg: 'bg-gray-50' },
  default: { icon: Sparkles, color: 'text-gray-600', bg: 'bg-gray-50' },
};

// Map internal producer agent IDs to their production types (legacy support)
const PRODUCER_TYPE_MAP = {
  '00000000-0000-0000-0000-000000000010': 'summary',  // Document Summarizer
  '00000000-0000-0000-0000-000000000011': 'qa',       // Q&A Generator
  '00000000-0000-0000-0000-000000000012': 'outline',  // Outline Creator
  '00000000-0000-0000-0000-000000000013': 'insight',  // Insights Extractor
};

/**
 * Infer the production type from a producer's properties.
 * Used to determine the correct icon and color for display.
 */
const inferProductionType = (producer) => {
  if (!producer) return 'default';

  // 1. Check hardcoded UUID mapping (legacy support)
  if (PRODUCER_TYPE_MAP[producer.id]) {
    return PRODUCER_TYPE_MAP[producer.id];
  }

  // 2. Check if producer has explicit producerType or productionType field
  if (producer.producerType && TYPE_CONFIG[producer.producerType]) {
    return producer.producerType;
  }
  if (producer.productionType && TYPE_CONFIG[producer.productionType]) {
    return producer.productionType;
  }

  // 3. Check if producer.type matches a production type (not 'producer' agent type)
  if (producer.type && producer.type !== 'producer' && TYPE_CONFIG[producer.type]) {
    return producer.type;
  }

  // 4. Infer from producer name using keywords
  const nameLower = (producer.name || '').toLowerCase();
  if (nameLower.includes('summar')) return 'summary';
  if (nameLower.includes('q&a') || nameLower.includes('qa') || nameLower.includes('question')) return 'qa';
  if (nameLower.includes('outline')) return 'outline';
  if (nameLower.includes('insight') || nameLower.includes('extract')) return 'insight';

  // 5. Default for unknown producers
  return 'custom';
};

const ProducersList = ({ notebookId, onExecuteProducer }) => {
  const dispatch = useAppDispatch();

  // Get current space context
  const currentSpace = useAppSelector(state => state.spaces?.currentSpace);

  // Selectors
  const producers = useAppSelector(state =>
    selectSortedProducers(state, notebookId, {
      spaceId: currentSpace?.space_id,
      notebookId,
    })
  );
  const loading = useAppSelector(state => selectNotebookProducersLoading(state, notebookId));
  const preferences = useAppSelector(selectProducerPreferences);

  // Load producers and preferences on mount
  useEffect(() => {
    if (notebookId) {
      dispatch(fetchNotebookProducers(notebookId));
      dispatch(fetchProducerPreferences());
    }
  }, [dispatch, notebookId]);

  // Toggle pin for a producer
  const handleTogglePin = async (e, producer) => {
    e.stopPropagation();
    const isPinned = producer.isPinned || preferences.pinned?.global?.includes(producer.id);

    await dispatch(updateProducerPreferences({
      [isPinned ? 'unpin_global' : 'pin_global']: producer.id,
    }));
  };

  // Handle producer click
  const handleProducerClick = (producer) => {
    onExecuteProducer?.(producer);
  };

  // Separate pinned producers
  const pinnedProducers = producers.filter(p => p.isPinned || preferences.pinned?.global?.includes(p.id));
  const unpinnedProducers = producers.filter(p => !p.isPinned && !preferences.pinned?.global?.includes(p.id));

  // Render producer item
  const renderProducerItem = (producer) => {
    const isPinned = producer.isPinned || preferences.pinned?.global?.includes(producer.id);
    const inferredType = inferProductionType(producer);
    const config = TYPE_CONFIG[inferredType] || TYPE_CONFIG.default;
    const Icon = config.icon;

    return (
      <button
        key={producer.id}
        onClick={() => handleProducerClick(producer)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-gray-100 group ${config.bg}`}
        title={producer.description || producer.name}
      >
        <Icon size={16} className={config.color} />
        <span className="flex-1 text-sm font-medium text-gray-800 truncate">
          {producer.name}
        </span>
        <button
          onClick={(e) => handleTogglePin(e, producer)}
          className={`p-1 rounded transition-colors ${
            isPinned
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100'
          }`}
          title={isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin size={14} className={isPinned ? 'fill-current' : ''} />
        </button>
      </button>
    );
  };

  if (loading && producers.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (producers.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <Sparkles size={24} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No producers available</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1 flex-1 overflow-auto">
      {/* Pinned producers first */}
      {pinnedProducers.map(producer => renderProducerItem(producer))}

      {/* Divider if both sections have items */}
      {pinnedProducers.length > 0 && unpinnedProducers.length > 0 && (
        <div className="border-t border-gray-200 my-2" />
      )}

      {/* Unpinned producers */}
      {unpinnedProducers.map(producer => renderProducerItem(producer))}
    </div>
  );
};

export default ProducersList;
