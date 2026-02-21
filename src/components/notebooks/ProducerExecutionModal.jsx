import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/index.js';
import {
  executeProducer,
  selectExecutionState,
  clearExecutionState,
  selectProducerPreferences,
} from '../../store/slices/producersSlice.js';
import aetherApi from '../../services/api.js';
import RendererSelectModal from './RendererSelectModal.jsx';
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
  Headphones,
  Wand2,
} from 'lucide-react';

const PRODUCTION_TYPES = [
  { value: 'summary', label: 'Summary', description: 'Generate a concise summary of the content' },
  { value: 'qa', label: 'Q&A', description: 'Generate questions and answers from the content' },
  { value: 'outline', label: 'Outline', description: 'Create a structured outline of the content' },
  { value: 'insight', label: 'Insights', description: 'Extract key insights and observations' },
  { value: 'custom', label: 'Custom', description: 'Custom production based on agent configuration' },
  { value: 'podcast', label: 'Podcast', description: 'Generate a podcast script from the content' },
];

// Map internal producer agent IDs to their production types
// IMPORTANT: These must match the agent-builder database (016_seed_producer_agents.sql)
const PRODUCER_TYPE_MAP = {
  '00000000-0000-0000-0000-000000000010': 'qa',       // Q&A Generator
  '00000000-0000-0000-0000-000000000011': 'outline',  // Outline Creator
  '00000000-0000-0000-0000-000000000012': 'summary',  // Document Summarizer
  '00000000-0000-0000-0000-000000000013': 'insight',  // Insights Extractor
  '00000000-0000-0000-0000-000000000014': 'podcast',  // Podcast Producer
};

/**
 * Infer the production type from a producer's properties.
 * Checks in order: UUID mapping, producer.producerType, producer.type, name-based inference.
 */
const inferProductionType = (producer) => {
  if (!producer) return 'custom';

  // 1. Check hardcoded UUID mapping (legacy support)
  if (PRODUCER_TYPE_MAP[producer.id]) {
    return PRODUCER_TYPE_MAP[producer.id];
  }

  // 2. Check if producer has explicit producerType or productionType field
  if (producer.producerType && PRODUCTION_TYPES.some(t => t.value === producer.producerType)) {
    return producer.producerType;
  }
  if (producer.productionType && PRODUCTION_TYPES.some(t => t.value === producer.productionType)) {
    return producer.productionType;
  }

  // 3. Check if producer.type matches a production type (not 'producer' agent type)
  if (producer.type && producer.type !== 'producer' && PRODUCTION_TYPES.some(t => t.value === producer.type)) {
    return producer.type;
  }

  // 4. Infer from producer name using keywords
  const nameLower = (producer.name || '').toLowerCase();
  if (nameLower.includes('summar')) return 'summary';
  if (nameLower.includes('q&a') || nameLower.includes('qa') || nameLower.includes('question')) return 'qa';
  if (nameLower.includes('outline')) return 'outline';
  if (nameLower.includes('insight') || nameLower.includes('extract')) return 'insight';
  if (nameLower.includes('podcast') || nameLower.includes('audio')) return 'podcast';

  // 5. Default to custom for unknown producers
  return 'custom';
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

  // Renderer state
  const [selectedRenderer, setSelectedRenderer] = useState(null);
  const [showRendererModal, setShowRendererModal] = useState(false);
  const [ttsProvider, setTtsProvider] = useState('elevenlabs');
  const [speakers, setSpeakers] = useState('Alex, Sam');
  const [providers, setProviders] = useState([
    { id: 'elevenlabs', name: 'ElevenLabs' },
    { id: 'kokoro', name: 'Kokoro' },
  ]);
  const [voices, setVoices] = useState([
    { id: 'Rachel', name: 'Rachel (Female)' },
    { id: 'Adam', name: 'Adam (Male)' },
    { id: 'Domi', name: 'Domi (Female)' },
    { id: 'Josh', name: 'Josh (Male)' },
  ]);
  const [voiceMapping, setVoiceMapping] = useState({});

  // Initialize production type based on selected producer
  useEffect(() => {
    if (producer) {
      // Infer the production type from producer properties
      const inferredType = inferProductionType(producer);
      setProductionType(inferredType);
    }
  }, [producer]);

  // Initialize format from preferences
  useEffect(() => {
    if (preferences.settings?.defaultFormat) {
      setFormat(preferences.settings.defaultFormat);
    }
  }, [preferences.settings?.defaultFormat]);

  // Generate default title when producer changes
  // Use producer name to reflect the type of producer being run
  useEffect(() => {
    if (producer) {
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setTitle(`${producer.name} - ${date}`);
    }
  }, [producer]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(clearExecutionState());
      setSelectedRenderer(null);
      setVoiceMapping({});
    }
  }, [isOpen, dispatch]);

  // Load voices when podcast renderer is selected and provider changes
  useEffect(() => {
    if (selectedRenderer && isPodcastRenderer(selectedRenderer)) {
      loadProviderVoices(ttsProvider);
    }
  }, [selectedRenderer, ttsProvider]);

  // Handle successful execution
  useEffect(() => {
    if (executionState.status === 'completed' && executionState.production) {
      onSuccess?.(executionState.production);
    }
  }, [executionState.status, executionState.production, onSuccess]);

  const isPodcastRenderer = (renderer) => {
    const name = (renderer?.name || '').toLowerCase();
    return name.includes('podcast') || renderer?.rendererType === 'podcast';
  };

  const loadProviderVoices = async (provider) => {
    try {
      const response = await aetherApi.post('/mcp/invoke', {
        server_id: 'mcp-podcast',
        tool_name: 'list_voices',
        arguments: { provider },
      });
      const voiceList = response.data?.content?.[0]?.text;
      if (voiceList) {
        const parsed = JSON.parse(voiceList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVoices(parsed.map(v => ({ id: v.id || v.name, name: v.name || v.id })));
          return;
        }
      }
    } catch (err) {
      // Use fallback voices
    }
  };

  const handleExecute = async () => {
    if (!producer || !notebookId) return;

    const context = {};

    // Add renderer config to context if a renderer is selected
    if (selectedRenderer) {
      context.renderer_id = selectedRenderer.id;
      context.renderer_type = isPodcastRenderer(selectedRenderer) ? 'podcast' : selectedRenderer.type;

      if (isPodcastRenderer(selectedRenderer)) {
        context.tts_provider = ttsProvider;
        context.speakers = speakers;
        if (Object.keys(voiceMapping).length > 0) {
          context.voice_mapping = voiceMapping;
        }
      }
    }

    const request = {
      title,
      type: productionType,
      format: selectedRenderer && isPodcastRenderer(selectedRenderer) ? 'audio' : format,
      source_documents: selectedDocuments.length > 0 ? selectedDocuments : undefined,
      context: Object.keys(context).length > 0 ? context : undefined,
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

          {/* Production Type - disabled for producers with a determined type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Production Type
              {inferProductionType(producer) !== 'custom' && (
                <span className="ml-2 text-xs text-gray-500 font-normal">(set by producer)</span>
              )}
            </label>
            <select
              value={productionType}
              onChange={(e) => setProductionType(e.target.value)}
              disabled={isExecuting || hasCompleted || inferProductionType(producer) !== 'custom'}
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

          {/* Renderer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Renderer (Optional)
            </label>
            {selectedRenderer ? (
              <div className="flex items-center gap-3 p-3 border border-rose-200 bg-rose-50 rounded-lg">
                <Headphones size={18} className="text-rose-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{selectedRenderer.name}</div>
                  <div className="text-xs text-gray-500 truncate">{selectedRenderer.description}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowRendererModal(true)}
                    disabled={isExecuting || hasCompleted}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-white transition-colors"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => setSelectedRenderer(null)}
                    disabled={isExecuting || hasCompleted}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-white transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRendererModal(true)}
                disabled={isExecuting || hasCompleted}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors w-full disabled:opacity-50"
              >
                <Wand2 size={16} />
                Add Renderer (e.g., Podcast, Presentation)
              </button>
            )}

            {/* Podcast-specific config */}
            {selectedRenderer && isPodcastRenderer(selectedRenderer) && (
              <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">TTS Provider</label>
                  <select
                    value={ttsProvider}
                    onChange={(e) => setTtsProvider(e.target.value)}
                    disabled={isExecuting || hasCompleted}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-(--color-primary-500) disabled:bg-gray-100"
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Speakers</label>
                  <input
                    type="text"
                    value={speakers}
                    onChange={(e) => setSpeakers(e.target.value)}
                    disabled={isExecuting || hasCompleted}
                    placeholder="Alex, Sam"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-(--color-primary-500) disabled:bg-gray-100"
                  />
                </div>
                {speakers.split(',').map(s => s.trim()).filter(Boolean).map(speaker => (
                  <div key={speaker}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Voice for {speaker}</label>
                    <select
                      value={voiceMapping[speaker] || ''}
                      onChange={(e) => setVoiceMapping(prev => ({ ...prev, [speaker]: e.target.value }))}
                      disabled={isExecuting || hasCompleted}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-(--color-primary-500) disabled:bg-gray-100"
                    >
                      <option value="">Auto-select</option>
                      {voices.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

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

      {/* Renderer selection modal */}
      <RendererSelectModal
        isOpen={showRendererModal}
        onClose={() => setShowRendererModal(false)}
        onSelect={(renderer) => setSelectedRenderer(renderer)}
      />
    </div>
  );
};

export default ProducerExecutionModal;
