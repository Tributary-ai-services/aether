import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Sliders
} from 'lucide-react';

const CONTEXT_STRATEGIES = [
  {
    value: 'none',
    label: 'None',
    description: 'No document context injection',
    icon: null
  },
  {
    value: 'vector',
    label: 'Vector Search (RAG)',
    description: 'Semantic search for relevant chunks based on query',
    icon: Search,
    recommended: ['qa']
  },
  {
    value: 'full',
    label: 'Full Document',
    description: 'Include complete document content',
    icon: FileText,
    recommended: ['producer']
  },
  {
    value: 'hybrid',
    label: 'Hybrid (Recommended)',
    description: 'Combines vector search with document sections for balanced coverage',
    icon: Layers,
    recommended: ['qa', 'conversational', 'producer']
  }
];

const KNOWLEDGE_PRESETS = [
  {
    name: 'Q&A Agent',
    value: 'qa',
    description: 'Fast, focused answers',
    config: {
      context_strategy: 'vector',
      max_context_tokens: 4000,
      include_sub_notebooks: false
    }
  },
  {
    name: 'Research Agent',
    value: 'research',
    description: 'Comprehensive retrieval',
    config: {
      context_strategy: 'hybrid',
      max_context_tokens: 12000,
      include_sub_notebooks: true,
      hybrid_config: {
        vector_weight: 0.5,
        full_doc_weight: 0.4,
        position_weight: 0.1,
        token_budget: 12000
      }
    }
  },
  {
    name: 'Document Analyzer',
    value: 'analyzer',
    description: 'Full document access',
    config: {
      context_strategy: 'full',
      max_context_tokens: 16000,
      include_sub_notebooks: false,
      multi_pass_enabled: true
    }
  },
  {
    name: 'Custom',
    value: 'custom',
    description: 'Configure manually',
    config: null
  }
];

const KnowledgeConfigurationForm = ({ config, onChange, agentType = 'qa' }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('custom');

  // Default configuration
  const defaultConfig = {
    enable_knowledge: true,
    context_strategy: 'hybrid',
    include_sub_notebooks: false,
    max_context_tokens: 8000,
    multi_pass_enabled: false,
    hybrid_config: {
      vector_weight: 0.6,
      full_doc_weight: 0.3,
      position_weight: 0.1,
      summary_boost: 1.5,
      vector_top_k: 20,
      vector_min_score: 0.5,
      full_doc_max_chunks: 50,
      token_budget: 8000,
      include_summaries: true,
      deduplicate_by_content: true
    }
  };

  const currentConfig = { ...defaultConfig, ...config };

  const handleChange = (field, value) => {
    onChange({ ...currentConfig, [field]: value });
  };

  const handleHybridConfigChange = (field, value) => {
    onChange({
      ...currentConfig,
      hybrid_config: {
        ...currentConfig.hybrid_config,
        [field]: value
      }
    });
  };

  const handlePresetChange = (presetValue) => {
    setSelectedPreset(presetValue);
    const preset = KNOWLEDGE_PRESETS.find(p => p.value === presetValue);
    if (preset && preset.config) {
      onChange({
        ...currentConfig,
        ...preset.config,
        hybrid_config: {
          ...currentConfig.hybrid_config,
          ...preset.config.hybrid_config
        }
      });
    }
  };

  const getStrategyRecommendation = () => {
    const strategy = CONTEXT_STRATEGIES.find(s => s.recommended?.includes(agentType));
    return strategy?.value || 'hybrid';
  };

  return (
    <div className="space-y-4">
      {/* Enable Knowledge Toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <BookOpen className="text-blue-600" size={20} />
          <div>
            <p className="font-medium text-gray-900">Knowledge Retrieval</p>
            <p className="text-sm text-gray-500">
              Inject relevant document context into agent prompts
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={currentConfig.enable_knowledge}
            onChange={(e) => handleChange('enable_knowledge', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {currentConfig.enable_knowledge && (
        <>
          {/* Preset Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Knowledge Preset
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {KNOWLEDGE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetChange(preset.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedPreset === preset.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900">{preset.name}</p>
                  <p className="text-xs text-gray-500">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Context Strategy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Context Strategy
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {CONTEXT_STRATEGIES.filter(s => s.value !== 'none').map((strategy) => {
                const Icon = strategy.icon;
                const isRecommended = strategy.recommended?.includes(agentType);
                return (
                  <button
                    key={strategy.value}
                    type="button"
                    onClick={() => handleChange('context_strategy', strategy.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      currentConfig.context_strategy === strategy.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon size={16} className="text-gray-600" />}
                      <span className="font-medium text-sm text-gray-900">
                        {strategy.label}
                      </span>
                      {isRecommended && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{strategy.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Context Tokens
              </label>
              <input
                type="number"
                min="1000"
                max="32000"
                step="1000"
                value={currentConfig.max_context_tokens}
                onChange={(e) => handleChange('max_context_tokens', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum tokens for document context
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentConfig.include_sub_notebooks}
                  onChange={(e) => handleChange('include_sub_notebooks', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include sub-notebooks</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentConfig.multi_pass_enabled}
                  onChange={(e) => handleChange('multi_pass_enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Multi-pass processing</span>
              </label>
            </div>
          </div>

          {/* Advanced Hybrid Configuration */}
          {currentConfig.context_strategy === 'hybrid' && (
            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="text-gray-600" size={16} />
                  <span className="font-medium text-sm text-gray-900">
                    Hybrid Configuration
                  </span>
                </div>
                {showAdvanced ? (
                  <ChevronUp className="text-gray-400" size={16} />
                ) : (
                  <ChevronDown className="text-gray-400" size={16} />
                )}
              </button>

              {showAdvanced && (
                <div className="px-3 pb-3 space-y-4 border-t border-gray-200 pt-3">
                  {/* Weight Sliders */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Vector Search Weight</span>
                        <span className="text-gray-500">
                          {(currentConfig.hybrid_config?.vector_weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={currentConfig.hybrid_config?.vector_weight || 0.6}
                        onChange={(e) => handleHybridConfigChange('vector_weight', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Full Document Weight</span>
                        <span className="text-gray-500">
                          {(currentConfig.hybrid_config?.full_doc_weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={currentConfig.hybrid_config?.full_doc_weight || 0.3}
                        onChange={(e) => handleHybridConfigChange('full_doc_weight', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Position Weight</span>
                        <span className="text-gray-500">
                          {(currentConfig.hybrid_config?.position_weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.05"
                        value={currentConfig.hybrid_config?.position_weight || 0.1}
                        onChange={(e) => handleHybridConfigChange('position_weight', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Numeric Inputs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Vector Top-K
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={currentConfig.hybrid_config?.vector_top_k || 20}
                        onChange={(e) => handleHybridConfigChange('vector_top_k', parseInt(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Min Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={currentConfig.hybrid_config?.vector_min_score || 0.5}
                        onChange={(e) => handleHybridConfigChange('vector_min_score', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Max Full Doc Chunks
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={currentConfig.hybrid_config?.full_doc_max_chunks || 50}
                        onChange={(e) => handleHybridConfigChange('full_doc_max_chunks', parseInt(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Summary Boost
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="3"
                        step="0.1"
                        value={currentConfig.hybrid_config?.summary_boost || 1.5}
                        onChange={(e) => handleHybridConfigChange('summary_boost', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentConfig.hybrid_config?.include_summaries !== false}
                        onChange={(e) => handleHybridConfigChange('include_summaries', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Include summaries</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentConfig.hybrid_config?.deduplicate_by_content !== false}
                        onChange={(e) => handleHybridConfigChange('deduplicate_by_content', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Deduplicate content</span>
                    </label>
                  </div>

                  {/* Info Box */}
                  <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                    <Info className="text-blue-500 mt-0.5 flex-shrink-0" size={14} />
                    <p className="text-xs text-blue-700">
                      Hybrid context combines semantic search (finds relevant chunks) with
                      full document retrieval (ensures coverage) for optimal context.
                      Adjust weights based on your use case.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KnowledgeConfigurationForm;
