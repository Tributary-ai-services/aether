import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import {
  executeProducer,
  selectExecutionState,
  clearExecutionState,
  selectProducerPreferences,
} from '../../store/slices/producersSlice.js';
import {
  X,
  Play,
  Sparkles,
  FileText,
  Code,
  FileJson,
  AlignLeft,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
} from 'lucide-react';

const PRODUCTION_TYPES = [
  { value: 'summary', label: 'Summary', description: 'Generate a concise summary of the content' },
  { value: 'qa', label: 'Q&A', description: 'Generate questions and answers from the content' },
  { value: 'outline', label: 'Outline', description: 'Create a structured outline of the content' },
  { value: 'insight', label: 'Insights', description: 'Extract key insights and observations' },
  { value: 'custom', label: 'Custom', description: 'Custom production based on agent configuration' },
];

// Map internal producer agent IDs to their production types
const PRODUCER_TYPE_MAP = {
  '00000000-0000-0000-0000-000000000010': 'summary',  // Document Summarizer
  '00000000-0000-0000-0000-000000000011': 'qa',       // Q&A Generator
  '00000000-0000-0000-0000-000000000012': 'outline',  // Outline Creator
  '00000000-0000-0000-0000-000000000013': 'insight',  // Insights Extractor
};

const PRODUCTION_FORMATS = [
  { value: 'markdown', label: 'Markdown', icon: FileText },
  { value: 'html', label: 'HTML', icon: Code },
  { value: 'json', label: 'JSON', icon: FileJson },
  { value: 'text', label: 'Plain Text', icon: AlignLeft },
];

const ProducerExecutionModal = ({
  isOpen,
  onClose,
  producer,
  notebookId,
  documents = [],
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const executionState = useAppSelector(selectExecutionState);
  const preferences = useAppSelector(selectProducerPreferences);

  // Form state
  const [title, setTitle] = useState('');
  const [productionType, setProductionType] = useState('summary');
  const [format, setFormat] = useState('markdown');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);

  // Initialize production type based on selected producer
  useEffect(() => {
    if (producer?.id) {
      // Check if this is an internal producer with a known type
      const producerType = PRODUCER_TYPE_MAP[producer.id];
      if (producerType) {
        setProductionType(producerType);
      } else if (preferences.settings?.defaultType) {
        setProductionType(preferences.settings.defaultType);
      }
    }
  }, [producer?.id, preferences.settings?.defaultType]);

  // Initialize format from preferences
  useEffect(() => {
    if (preferences.settings?.defaultFormat) {
      setFormat(preferences.settings.defaultFormat);
    }
  }, [preferences.settings?.defaultFormat]);

  // Generate default title when producer or type changes
  useEffect(() => {
    if (producer) {
      const typeLabel = PRODUCTION_TYPES.find(t => t.value === productionType)?.label || productionType;
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setTitle(`${typeLabel} - ${date}`);
    }
  }, [producer, productionType]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(clearExecutionState());
    }
  }, [isOpen, dispatch]);

  // Handle successful execution
  useEffect(() => {
    if (executionState.status === 'completed' && executionState.production) {
      onSuccess?.(executionState.production);
    }
  }, [executionState.status, executionState.production, onSuccess]);

  const handleExecute = async () => {
    if (!producer || !notebookId) return;

    const request = {
      title,
      type: productionType,
      format,
      source_documents: selectedDocuments.length > 0 ? selectedDocuments : undefined,
    };

    await dispatch(executeProducer({
      notebookId,
      agentId: producer.id,
      request,
    }));
  };

  const toggleDocumentSelection = (docId) => {
    setSelectedDocuments(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  if (!isOpen || !producer) return null;

  const isExecuting = executionState.isExecuting;
  const hasCompleted = executionState.status === 'completed';
  const hasFailed = executionState.status === 'failed';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-(--color-primary-100) rounded-lg">
              <Sparkles size={20} className="text-(--color-primary-600)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Execute Producer</h2>
              <p className="text-sm text-gray-500">{producer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Production Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isExecuting || hasCompleted}
              placeholder="Enter a title for this production"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Production Type - disabled for internal producers as it's determined by the agent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Production Type
              {PRODUCER_TYPE_MAP[producer?.id] && (
                <span className="ml-2 text-xs text-gray-500 font-normal">(set by producer)</span>
              )}
            </label>
            <select
              value={productionType}
              onChange={(e) => setProductionType(e.target.value)}
              disabled={isExecuting || hasCompleted || !!PRODUCER_TYPE_MAP[producer?.id]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) disabled:bg-gray-50 disabled:text-gray-500"
            >
              {PRODUCTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* Output Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRODUCTION_FORMATS.map(fmt => {
                const Icon = fmt.icon;
                const isSelected = format === fmt.value;
                return (
                  <button
                    key={fmt.value}
                    onClick={() => setFormat(fmt.value)}
                    disabled={isExecuting || hasCompleted}
                    className={`flex flex-col items-center gap-1 px-3 py-2 border rounded-lg transition-colors ${
                      isSelected
                        ? 'border-(--color-primary-500) bg-(--color-primary-50) text-(--color-primary-700)'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Icon size={18} />
                    <span className="text-xs font-medium">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document Selection (if documents available) */}
          {documents.length > 0 && (
            <div>
              <button
                onClick={() => setShowDocumentSelector(!showDocumentSelector)}
                disabled={isExecuting || hasCompleted}
                className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm text-gray-700">
                  {selectedDocuments.length === 0
                    ? 'All documents (default)'
                    : `${selectedDocuments.length} document${selectedDocuments.length > 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${showDocumentSelector ? 'rotate-180' : ''}`} />
              </button>

              {showDocumentSelector && (
                <div className="mt-2 max-h-40 overflow-auto border border-gray-200 rounded-lg">
                  {documents.map(doc => (
                    <label
                      key={doc.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        disabled={isExecuting || hasCompleted}
                        className="w-4 h-4 text-(--color-primary-600) border-gray-300 rounded focus:ring-(--color-primary-500)"
                      />
                      <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Execution Status */}
          {(isExecuting || hasCompleted || hasFailed) && (
            <div className={`p-4 rounded-lg ${
              isExecuting ? 'bg-blue-50' :
              hasCompleted ? 'bg-green-50' :
              'bg-red-50'
            }`}>
              <div className="flex items-center gap-3">
                {isExecuting && <Loader2 size={20} className="text-blue-600 animate-spin" />}
                {hasCompleted && <CheckCircle size={20} className="text-green-600" />}
                {hasFailed && <XCircle size={20} className="text-red-600" />}
                <div>
                  <p className={`font-medium ${
                    isExecuting ? 'text-blue-800' :
                    hasCompleted ? 'text-green-800' :
                    'text-red-800'
                  }`}>
                    {isExecuting && 'Executing producer...'}
                    {hasCompleted && 'Production completed!'}
                    {hasFailed && 'Execution failed'}
                  </p>
                  {hasFailed && executionState.error && (
                    <p className="text-sm text-red-600 mt-1">{executionState.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {hasCompleted ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isExecuting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting || !title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExecuting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Execute
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProducerExecutionModal;
