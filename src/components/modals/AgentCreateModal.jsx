import React, { useState, useEffect, useMemo } from 'react';
import { useSpace } from '../../hooks/useSpaces.js';
import { useAgentBuilder, useAgentProviders } from '../../hooks/useAgentBuilder.js';
import { api } from '../../services/api.js';
import Modal from '../ui/Modal.jsx';
import RetryConfigurationForm from '../agent/RetryConfigurationForm.jsx';
import FallbackConfigurationForm from '../agent/FallbackConfigurationForm.jsx';
import KnowledgeConfigurationForm from '../agent/KnowledgeConfigurationForm.jsx';
import { AIAssistLabel } from '../agent/AIAssistButton.jsx';
import PromptAssistDialog from '../agent/PromptAssistDialog.jsx';
import SkillCard from '../community/SkillCard.jsx';
import { mockSkills } from '../../data/mockData.js';
import {
  Bot,
  Settings,
  Brain,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  BookOpen,
  Wrench,
  Shield,
  Tag,
  Database
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDatabaseConnections, selectConnections } from '../../store/slices/databaseConnectionsSlice';

const AgentCreateModal = ({ isOpen, onClose, agent, onCreateAgent, onUpdateAgent }) => {
  const { currentSpace } = useSpace();
  const { createAgent } = useAgentBuilder();
  const dispatch = useDispatch();
  const allConnections = useSelector(selectConnections);
  const { providers, models, fetchModels, validateConfig } = useAgentProviders();
  
  // Handle both array and object with providers property
  const providersArray = Array.isArray(providers) ? providers : (providers?.providers || []);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'qa', // Default to Q&A agent type
    system_prompt: '',
    llm_config: {
      provider: '',
      model: '',
      temperature: 0.7,
      max_tokens: 1000,
      optimize_for: 'quality',
      streaming: true,
      retry_config: {
        max_attempts: 3,
        backoff_type: 'exponential',
        base_delay: '1s',
        max_delay: '30s',
        retryable_errors: ['timeout', 'connection', 'unavailable', 'rate_limit']
      },
      fallback_config: {
        enabled: true,
        max_cost_increase: 0.5,
        require_same_features: true
      }
    },
    is_public: false,
    is_template: false,
    tags: [],
    skills: [],
    notebook_ids: [],
    // Knowledge configuration
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
  });

  const [currentTag, setCurrentTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [configValidation, setConfigValidation] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('Balanced');

  // Prompt Assist Dialog state
  const [promptAssistOpen, setPromptAssistOpen] = useState(false);
  const [promptAssistField, setPromptAssistField] = useState('description'); // 'description' or 'system_prompt'

  // Modal tab state
  const [activeModalTab, setActiveModalTab] = useState('general');

  // Skills state
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [autoDetectSkills, setAutoDetectSkills] = useState(true);
  // Per-skill connection overrides: { skillName: { connectionId, serverId } }
  const [skillConnections, setSkillConnections] = useState({});

  // Fetch available skills
  useEffect(() => {
    if (!isOpen) return;
    const fetchSkills = async () => {
      try {
        setLoadingSkills(true);
        const response = await api.skills.list();
        const skillList = response.skills || response || [];
        setAvailableSkills(Array.isArray(skillList) ? skillList : []);
      } catch (err) {
        console.warn('[AgentCreate] Failed to fetch skills, using mocks:', err);
        setAvailableSkills(mockSkills);
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchSkills();
  }, [isOpen]);

  // Fetch connections for MCP skill connection selectors
  useEffect(() => {
    if (isOpen && (!allConnections || allConnections.length === 0)) {
      dispatch(fetchDatabaseConnections());
    }
  }, [isOpen, allConnections, dispatch]);

  // Auto-detect skills from system prompt keywords
  const autoDetectedSkills = useMemo(() => {
    if (!autoDetectSkills || !formData.system_prompt) return [];
    const promptLower = formData.system_prompt.toLowerCase();
    return availableSkills
      .filter(skill => {
        const keywords = Array.isArray(skill.keywords)
          ? skill.keywords
          : (typeof skill.keywords === 'string' ? JSON.parse(skill.keywords || '[]') : []);
        return keywords.some(kw => promptLower.includes(kw.toLowerCase()));
      })
      .map(s => s.name)
      .filter(name => !formData.skills.includes(name));
  }, [formData.system_prompt, formData.skills, availableSkills, autoDetectSkills]);

  // Combined skills (explicit + auto-detected)
  const effectiveSkills = useMemo(() => {
    return [...new Set([...formData.skills, ...autoDetectedSkills])];
  }, [formData.skills, autoDetectedSkills]);

  const handleToggleSkill = (skillName) => {
    setFormData(prev => {
      const current = prev.skills || [];
      const updated = current.includes(skillName)
        ? current.filter(s => s !== skillName)
        : [...current, skillName];
      return { ...prev, skills: updated };
    });
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (agent) {
        // Editing mode - populate with existing agent data
        setFormData({
          name: agent.name || '',
          description: agent.description || '',
          type: agent.type || 'qa',
          system_prompt: agent.system_prompt || '',
          llm_config: {
            provider: agent.llm_config?.provider || (providers.length > 0 ? providers[0].name : ''),
            model: agent.llm_config?.model || '',
            temperature: agent.llm_config?.temperature || 0.7,
            max_tokens: agent.llm_config?.max_tokens || 1000,
            optimize_for: agent.llm_config?.optimize_for || 'quality',
            streaming: agent.llm_config?.streaming !== false, // default true if absent
            retry_config: agent.llm_config?.retry_config || {
              max_attempts: 3,
              backoff_type: 'exponential',
              base_delay: '1s',
              max_delay: '30s',
              retryable_errors: ['timeout', 'connection', 'unavailable', 'rate_limit']
            },
            fallback_config: agent.llm_config?.fallback_config || {
              enabled: true,
              max_cost_increase: 0.5,
              require_same_features: true
            }
          },
          is_public: agent.is_public || false,
          is_template: agent.is_template || false,
          tags: agent.tags || [],
          skills: agent.skills || [],
          notebook_ids: agent.notebook_ids || [],
          // Knowledge configuration
          enable_knowledge: agent.enable_knowledge !== false,
          context_strategy: agent.context_strategy || 'hybrid',
          include_sub_notebooks: agent.include_sub_notebooks || false,
          max_context_tokens: agent.max_context_tokens || 8000,
          multi_pass_enabled: agent.multi_pass_enabled || false,
          hybrid_config: agent.hybrid_config || {
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
        });
      } else {
        // Creation mode - use defaults
        setFormData({
          name: '',
          description: '',
          system_prompt: '',
          llm_config: {
            provider: providers.length > 0 ? providers[0].name : '',
            model: '',
            temperature: 0.7,
            max_tokens: 1000,
            optimize_for: 'quality',
            streaming: true,
            retry_config: {
              max_attempts: 3,
              backoff_type: 'exponential',
              base_delay: '1s',
              max_delay: '30s',
              retryable_errors: ['timeout', 'connection', 'unavailable', 'rate_limit']
            },
            fallback_config: {
              enabled: true,
              max_cost_increase: 0.5,
              require_same_features: true
            }
          },
          is_public: false,
          is_template: false,
          tags: [],
          skills: [],
          notebook_ids: [],
          // Knowledge configuration
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
        });
      }
      setError(null);
      setValidationErrors({});
      setConfigValidation(null);
      setActiveModalTab('general');
    }
  }, [isOpen, agent, providers]);

  // Load models when provider changes
  useEffect(() => {
    if (formData.llm_config.provider && !models[formData.llm_config.provider]) {
      fetchModels(formData.llm_config.provider);
    }
  }, [formData.llm_config.provider, models, fetchModels]);

  // Validate configuration when it changes
  useEffect(() => {
    const validateConfiguration = async () => {
      console.log('Validating config:', { provider: formData.llm_config.provider, model: formData.llm_config.model });
      if (formData.llm_config.provider && formData.llm_config.model) {
        try {
          const validation = await validateConfig(formData.llm_config);
          console.log('Validation result:', validation);
          setConfigValidation(validation);
        } catch (err) {
          console.warn('Config validation failed:', err);
          // Don't show validation errors if the endpoint isn't available yet
          setConfigValidation({ valid: true, errors: [] });
        }
      } else {
        // Reset validation if required fields are missing - show as valid (no config yet)
        console.log('No provider/model, setting valid');
        setConfigValidation({ valid: true, errors: [] });
      }
    };

    const timeoutId = setTimeout(validateConfiguration, 500);
    return () => clearTimeout(timeoutId);
    // Note: validateConfig excluded from deps to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.llm_config.provider, formData.llm_config.model]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleLLMConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      llm_config: { ...prev.llm_config, [field]: value }
    }));
  };

  const handleKnowledgeConfigChange = (knowledgeConfig) => {
    setFormData(prev => ({
      ...prev,
      enable_knowledge: knowledgeConfig.enable_knowledge,
      context_strategy: knowledgeConfig.context_strategy,
      include_sub_notebooks: knowledgeConfig.include_sub_notebooks,
      max_context_tokens: knowledgeConfig.max_context_tokens,
      multi_pass_enabled: knowledgeConfig.multi_pass_enabled,
      hybrid_config: knowledgeConfig.hybrid_config
    }));
  };

  const handleTemplateChange = (templateName) => {
    setSelectedTemplate(templateName);
    
    // Simple template configurations
    const templates = {
      'Balanced': {
        retry_config: {
          max_attempts: 3,
          backoff_type: 'exponential',
          base_delay: '1s',
          max_delay: '30s',
          retryable_errors: ['timeout', 'connection', 'unavailable', 'rate_limit']
        },
        fallback_config: {
          enabled: true,
          max_cost_increase: 0.5,
          require_same_features: true
        }
      },
      'High Reliability': {
        retry_config: {
          max_attempts: 5,
          backoff_type: 'exponential',
          base_delay: '500ms',
          max_delay: '60s',
          retryable_errors: ['timeout', 'connection', 'unavailable', 'rate_limit', 'server_error']
        },
        fallback_config: {
          enabled: true,
          max_cost_increase: 1.0,
          require_same_features: true
        }
      },
      'Cost Optimized': {
        retry_config: {
          max_attempts: 2,
          backoff_type: 'linear',
          base_delay: '2s',
          max_delay: '10s',
          retryable_errors: ['timeout', 'connection']
        },
        fallback_config: {
          enabled: false,
          max_cost_increase: 0.2,
          require_same_features: true
        }
      },
      'Performance': {
        retry_config: {
          max_attempts: 1,
          backoff_type: 'linear',
          base_delay: '500ms',
          max_delay: '5s',
          retryable_errors: ['timeout']
        },
        fallback_config: {
          enabled: false,
          max_cost_increase: 0.1,
          require_same_features: false
        }
      }
    };
    
    const templateConfig = templates[templateName] || templates['Balanced'];
    setFormData(prev => ({
      ...prev,
      llm_config: { ...prev.llm_config, ...templateConfig }
    }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Agent name is required';
    } else if (formData.name.length > 255) {
      errors.name = 'Agent name must be less than 255 characters';
    }

    if (formData.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }

    if (!formData.system_prompt.trim()) {
      errors.system_prompt = 'System prompt is required';
    }

    if (!formData.llm_config.provider) {
      errors.provider = 'Provider is required';
    }

    if (!formData.llm_config.model) {
      errors.model = 'Model is required';
    }

    if (formData.llm_config.temperature < 0 || formData.llm_config.temperature > 1) {
      errors.temperature = 'Temperature must be between 0 and 1';
    }

    if (formData.llm_config.max_tokens < 1 || formData.llm_config.max_tokens > 32000) {
      errors.max_tokens = 'Max tokens must be between 1 and 32000';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Debug space context
      console.log('Current space context:', currentSpace);
      console.log('Form data before building agentData:', JSON.stringify(formData, null, 2));
      
      // Ensure we have proper space context before making the API call
      if (!currentSpace || !currentSpace.space_type || !currentSpace.space_id) {
        throw new Error('Invalid space context. Please refresh the page and try again.');
      }
      
      // Validate that space_type is either 'personal' or 'organization', not 'notebook'
      if (currentSpace.space_type !== 'personal' && currentSpace.space_type !== 'organization') {
        console.error('Invalid space_type detected:', currentSpace.space_type);
        throw new Error(`Invalid space type: ${currentSpace.space_type}. Expected 'personal' or 'organization'.`);
      }
      
      // Make sure localStorage has correct space context
      const savedSpace = localStorage.getItem('currentSpace');
      if (savedSpace) {
        try {
          const parsedSpace = JSON.parse(savedSpace);
          if (parsedSpace.space_type === 'notebook') {
            console.error('Found corrupted space context in localStorage with space_type=notebook:', parsedSpace);
            // Remove corrupted space context
            localStorage.removeItem('currentSpace');
            throw new Error('Corrupted space context detected. Please refresh the page and try again.');
          }
        } catch (parseError) {
          console.error('Error parsing saved space:', parseError);
          localStorage.removeItem('currentSpace');
        }
      }
      
      const agentData = {
        ...formData,
        type: formData.type || 'qa', // Explicitly ensure type is included
        skills: effectiveSkills, // Include both explicit and auto-detected skills
        skill_connections: Object.keys(skillConnections).length > 0 ? skillConnections : undefined,
        space_id: currentSpace.space_id
      };
      
      console.log('Agent data being sent:', JSON.stringify(agentData, null, 2));
      console.log('Space headers that will be sent:', {
        'X-Space-Type': currentSpace.space_type,
        'X-Space-ID': currentSpace.space_id
      });

      let resultAgent;
      if (agent) {
        // Editing mode - use update callback or fallback to internal hook
        if (onUpdateAgent) {
          resultAgent = await onUpdateAgent(agent.id, agentData);
        } else {
          const { updateAgent } = useAgentBuilder();
          resultAgent = await updateAgent(agent.id, agentData);
        }
      } else {
        // Creation mode - use create callback or fallback to internal hook
        if (onCreateAgent) {
          resultAgent = await onCreateAgent(agentData);
        } else {
          resultAgent = await createAgent(agentData);
        }
      }
      
      onClose();
    } catch (err) {
      console.error(`Failed to ${agent ? 'update' : 'create'} agent:`, err);
      setError(err.message || `Failed to ${agent ? 'update' : 'create'} agent`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get models from either the models object (if fetched) or from the provider's models array
  const selectedProvider = providersArray.find(p => (p.id || p.name) === formData.llm_config.provider);
  // Handle both array and object with models property
  let availableModels = [];
  if (formData.llm_config.provider) {
    const providerModels = models[formData.llm_config.provider];
    if (Array.isArray(providerModels)) {
      availableModels = providerModels;
    } else if (providerModels?.models) {
      availableModels = providerModels.models;
    } else if (selectedProvider?.models) {
      availableModels = selectedProvider.models;
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Bot className="text-blue-600" size={20} />
          {agent ? 'Edit Agent' : 'Create New Agent'}
        </div>
      }
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5" size={16} />
            <div>
              <h4 className="font-medium text-red-800">Creation Failed</h4>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter agent name"
            />
            {validationErrors.name && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
            >
              <option value="qa">Q&A Agent - Answer questions based on knowledge sources</option>
              <option value="conversational">Conversational Agent - Chat-based with memory</option>
              <option value="producer">Producer Agent - Generate content using templates</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
            >
              <option value="Balanced">Balanced (Recommended)</option>
              <option value="High Reliability">High Reliability</option>
              <option value="Cost Optimized">Cost Optimized</option>
              <option value="Performance">Performance</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <AIAssistLabel
            htmlFor="description"
            label="Description"
            onAssistClick={() => {
              setPromptAssistField('description');
              setPromptAssistOpen(true);
            }}
            assistTooltip="Get AI help with description"
            className="mb-2"
          />
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) ${
              validationErrors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe what this agent does..."
          />
          {validationErrors.description && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.description}</p>
          )}
        </div>

        {/* System Prompt */}
        <div>
          <AIAssistLabel
            htmlFor="system_prompt"
            label="System Prompt"
            required={true}
            onAssistClick={() => {
              setPromptAssistField('system_prompt');
              setPromptAssistOpen(true);
            }}
            assistTooltip="Get AI help with system prompt"
            className="mb-2"
          />
          <textarea
            id="system_prompt"
            value={formData.system_prompt}
            onChange={(e) => handleInputChange('system_prompt', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) ${
              validationErrors.system_prompt ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter the system prompt that defines the agent's behavior..."
          />
          {validationErrors.system_prompt && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.system_prompt}</p>
          )}
        </div>

        {/* LLM Configuration */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="text-purple-600" size={18} />
            LLM Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider *
              </label>
              <select
                value={formData.llm_config.provider}
                onChange={(e) => handleLLMConfigChange('provider', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) ${
                  validationErrors.provider ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Provider</option>
                {providersArray.map(provider => (
                  <option key={provider.id || provider.name} value={provider.id || provider.name}>
                    {provider.name || provider.display_name}
                  </option>
                ))}
              </select>
              {validationErrors.provider && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.provider}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model *
              </label>
              <select
                value={formData.llm_config.model}
                onChange={(e) => handleLLMConfigChange('model', e.target.value)}
                disabled={!formData.llm_config.provider || availableModels.length === 0}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) ${
                  validationErrors.model ? 'border-red-300' : 'border-gray-300'
                } ${!formData.llm_config.provider ? 'bg-gray-100' : ''}`}
              >
                <option value="">Select Model</option>
                {(availableModels || []).map(model => {
                  // Handle both string models and object models
                  const modelName = typeof model === 'string' ? model : (model.id || model.name);
                  const modelDisplay = typeof model === 'string' ? model : (model.name || model.display_name);
                  return (
                    <option key={modelName} value={modelName}>
                      {modelDisplay}
                    </option>
                  );
                })}
              </select>
              {validationErrors.model && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.model}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={formData.llm_config.temperature}
                onChange={(e) => handleLLMConfigChange('temperature', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="1"
                max="32000"
                value={formData.llm_config.max_tokens}
                onChange={(e) => handleLLMConfigChange('max_tokens', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optimize For
              </label>
              <select
                value={formData.llm_config.optimize_for}
                onChange={(e) => handleLLMConfigChange('optimize_for', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              >
                <option value="quality">Quality</option>
                <option value="cost">Cost</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.llm_config.streaming !== false}
                onChange={(e) => handleLLMConfigChange('streaming', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-(--color-primary-500)"
              />
              <span className="text-sm text-gray-700">Enable Streaming</span>
              <span className="text-xs text-gray-400">Stream LLM responses for faster time-to-first-token</span>
            </label>
          </div>

          {/* Configuration Validation */}
          {configValidation && (
            <div className={`mt-4 p-3 rounded-lg border ${
              configValidation.valid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-2">
                {configValidation.valid ? (
                  <CheckCircle className="text-green-500 mt-0.5" size={16} />
                ) : (
                  <Info className="text-yellow-500 mt-0.5" size={16} />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    configValidation.valid ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {configValidation.valid ? 'Configuration Valid' : 'Configuration Issues'}
                  </p>
                  {configValidation.errors?.length > 0 && (
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      {(configValidation.errors || []).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Tabs */}
        <div className="border border-gray-200 rounded-lg">
          {/* Tab Bar */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
              { id: 'skills', label: 'Skills', icon: Wrench, count: effectiveSkills.length },
              { id: 'reliability', label: 'Reliability', icon: Shield },
              { id: 'advanced', label: 'Advanced', icon: Tag },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeModalTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveModalTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon size={15} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* General Tab - placeholder, content is above */}
            {activeModalTab === 'general' && (
              <div className="text-sm text-gray-500">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-blue-500" />
                  <span className="font-medium text-gray-700">General Configuration</span>
                </div>
                <p>The general agent settings (name, type, description, system prompt, and LLM configuration) are shown above. Use the other tabs to configure additional capabilities.</p>
              </div>
            )}

            {/* Knowledge Tab */}
            {activeModalTab === 'knowledge' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="text-blue-600" size={16} />
                  Knowledge & Document Context
                </h4>
                <KnowledgeConfigurationForm
                  config={{
                    enable_knowledge: formData.enable_knowledge,
                    context_strategy: formData.context_strategy,
                    include_sub_notebooks: formData.include_sub_notebooks,
                    max_context_tokens: formData.max_context_tokens,
                    multi_pass_enabled: formData.multi_pass_enabled,
                    hybrid_config: formData.hybrid_config
                  }}
                  onChange={handleKnowledgeConfigChange}
                  agentType={formData.type}
                />
              </div>
            )}

            {/* Skills Tab */}
            {activeModalTab === 'skills' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Wrench className="text-purple-600" size={16} />
                      Agent Skills
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Skills give your agent access to MCP tools and external capabilities.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoDetectSkills}
                      onChange={(e) => setAutoDetectSkills(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-(--color-primary-500)"
                    />
                    <span className="text-gray-600">Auto-detect from prompt</span>
                  </label>
                </div>

                {loadingSkills ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : availableSkills.length > 0 ? (
                  <div className="space-y-2">
                    {availableSkills.map(skill => {
                      const isExplicit = formData.skills.includes(skill.name);
                      const isAutoDetected = autoDetectedSkills.includes(skill.name);
                      const isSelected = isExplicit || isAutoDetected;
                      const isMCP = skill.type === 'mcp';
                      const skillConn = skillConnections[skill.name];
                      return (
                        <div key={skill.id || skill.name}>
                          <SkillCard
                            skill={skill}
                            compact={true}
                            selected={isSelected}
                            autoDetected={isAutoDetected && !isExplicit}
                            onSelect={() => handleToggleSkill(skill.name)}
                          />
                          {isSelected && isMCP && allConnections && allConnections.length > 0 && (
                            <div className="ml-4 mt-1 mb-2 flex items-center gap-2">
                              <Database size={12} className="text-gray-400 flex-shrink-0" />
                              <select
                                value={skillConn?.connectionId || ''}
                                onChange={(e) => {
                                  const connId = e.target.value;
                                  if (!connId) {
                                    setSkillConnections(prev => {
                                      const next = { ...prev };
                                      delete next[skill.name];
                                      return next;
                                    });
                                  } else {
                                    const conn = allConnections.find(c => c.id === connId);
                                    const typeToServerId = { neo4j: 'mcp-neo4j', postgres: 'mcp-postgres', minio: 'mcp-minio', kafka: 'mcp-kafka', grafana: 'mcp-grafana' };
                                    setSkillConnections(prev => ({
                                      ...prev,
                                      [skill.name]: {
                                        connectionId: connId,
                                        serverId: conn ? (typeToServerId[conn.type || conn.databaseType] || '') : '',
                                      }
                                    }));
                                  }
                                }}
                                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                              >
                                <option value="">Default connection</option>
                                {allConnections.map(conn => (
                                  <option key={conn.id} value={conn.id}>
                                    {conn.name} ({conn.type || conn.databaseType})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench size={24} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No skills available yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Skills will appear here once configured in the platform.</p>
                  </div>
                )}

                {effectiveSkills.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Active Skills ({effectiveSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {effectiveSkills.map(name => {
                        const skill = availableSkills.find(s => s.name === name);
                        const isAuto = autoDetectedSkills.includes(name) && !formData.skills.includes(name);
                        return (
                          <span
                            key={name}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              isAuto
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {skill?.display_name || name}
                            {isAuto && <span className="text-[10px] opacity-75">(auto)</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reliability Tab */}
            {activeModalTab === 'reliability' && (
              <div className="space-y-4">
                <RetryConfigurationForm
                  config={formData.llm_config.retry_config}
                  onChange={(config) => handleLLMConfigChange('retry_config', config)}
                />
                <FallbackConfigurationForm
                  config={formData.llm_config.fallback_config}
                  onChange={(config) => handleLLMConfigChange('fallback_config', config)}
                />
              </div>
            )}

            {/* Advanced Tab */}
            {activeModalTab === 'advanced' && (
              <div className="space-y-4">
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                      placeholder="Add tag..."
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700)"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(formData.tags || []).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Publishing Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => handleInputChange('is_public', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-(--color-primary-500)"
                    />
                    <span className="text-sm text-gray-700">Make Public</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_template}
                      onChange={(e) => handleInputChange('is_template', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-(--color-primary-500)"
                    />
                    <span className="text-sm text-gray-700">Save as Template</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (configValidation && !configValidation.valid)}
            className="px-6 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {agent ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {agent ? 'Update Agent' : 'Create Agent'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Prompt Assist Dialog */}
      <PromptAssistDialog
        isOpen={promptAssistOpen}
        onClose={() => setPromptAssistOpen(false)}
        onApply={(suggestion) => {
          if (promptAssistField === 'description') {
            handleInputChange('description', suggestion);
          } else if (promptAssistField === 'system_prompt') {
            handleInputChange('system_prompt', suggestion);
          }
        }}
        assistFor={promptAssistField}
        agentName={formData.name}
        agentType={formData.type}
        currentValue={promptAssistField === 'description' ? formData.description : formData.system_prompt}
      />
    </Modal>
  );
};

export default AgentCreateModal;