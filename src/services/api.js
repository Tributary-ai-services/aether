// Mock API service to simulate real API calls
import { 
  notebooks, 
  workflows, 
  mlModels, 
  analyticsData, 
  experiments,
  communityItems,
  liveEvents,
  streamSources
} from '../data/mockData.js';
import { tokenStorage } from './tokenStorage.js';
import { aetherApi } from './aetherApi.js';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API endpoints
export const api = {
  // Notebooks endpoints
  notebooks: {
    getAll: async () => {
      await delay(500);
      return { data: notebooks, success: true };
    },
    getById: async (id) => {
      await delay(300);
      const notebook = notebooks.find(n => n.id === id);
      if (!notebook) {
        throw new Error('Notebook not found');
      }
      return { data: notebook, success: true };
    },
    create: async (notebookData) => {
      await delay(800);
      const newNotebook = {
        ...notebookData,
        id: Date.now(),
        documents: 0,
        collaborators: 1,
        likes: 0,
        auditScore: 100
      };
      return { data: newNotebook, success: true };
    },
    update: async (id, updates) => {
      await delay(600);
      return { data: { id, ...updates }, success: true };
    },
    delete: async (id) => {
      await delay(500);
      return { success: true };
    }
  },

  // Agent Builder endpoints - Real backend integration
  agentBuilder: {
    // Agent CRUD Operations
    getAll: async (filter = {}) => {
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      if (filter.space_id) queryParams.append('space_id', filter.space_id);
      if (filter.status) queryParams.append('status', filter.status);
      if (filter.is_public !== undefined) queryParams.append('is_public', filter.is_public);
      if (filter.is_template !== undefined) queryParams.append('is_template', filter.is_template);
      if (filter.include_internal) queryParams.append('include_internal', 'true');
      if (filter.search) queryParams.append('search', filter.search);
      if (filter.page) queryParams.append('page', filter.page);
      if (filter.size) queryParams.append('size', filter.size);
      if (filter.tags?.length) queryParams.append('tags', filter.tags.join(','));
      
      const url = `${import.meta.env.VITE_AETHER_API_URL}/agents${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch agents');
      return await response.json();
    },

    getById: async (id) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/${id}`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch agent');
      return await response.json();
    },

    create: async (agentData) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        },
        body: JSON.stringify(agentData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create agent');
      }
      return await response.json();
    },

    update: async (id, agentData) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        },
        body: JSON.stringify(agentData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update agent');
      }
      return await response.json();
    },

    delete: async (id) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete agent');
      }
      return await response.json();
    },

    // Agent Publishing
    publish: async (id) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/${id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to publish agent');
      return await response.json();
    },

    unpublish: async (id) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/${id}/unpublish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to unpublish agent');
      return await response.json();
    },

    // Agent Duplication
    duplicate: async (sourceId, newName) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/${sourceId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        },
        body: JSON.stringify({ new_name: newName })
      });
      if (!response.ok) throw new Error('Failed to duplicate agent');
      return await response.json();
    },

    // Space and Public Agents
    getBySpace: async (spaceId) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/spaces/${spaceId}/agents`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch space agents');
      return await response.json();
    },

    getPublic: async (filter = {}) => {
      const queryParams = new URLSearchParams();
      if (filter.search) queryParams.append('search', filter.search);
      if (filter.page) queryParams.append('page', filter.page);
      if (filter.size) queryParams.append('size', filter.size);
      
      const url = `${import.meta.env.VITE_AETHER_API_URL}/agents/public${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch public agents');
      return await response.json();
    },

    getTemplates: async (filter = {}) => {
      const queryParams = new URLSearchParams();
      if (filter.search) queryParams.append('search', filter.search);
      if (filter.page) queryParams.append('page', filter.page);
      if (filter.size) queryParams.append('size', filter.size);
      
      const url = `${import.meta.env.VITE_AETHER_API_URL}/agents/templates${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch agent templates');
      return await response.json();
    },

    // Knowledge Source Management
    addKnowledgeSource: async (agentId, knowledgeSourceData) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/${agentId}/knowledge-sources`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        },
        body: JSON.stringify(knowledgeSourceData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add knowledge source');
      }
      return await response.json();
    },

    getKnowledgeSources: async (agentId) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/${agentId}/knowledge-sources`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch knowledge sources');
      return await response.json();
    },

    removeKnowledgeSource: async (agentId, notebookId) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/${agentId}/knowledge-sources/${notebookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove knowledge source');
      }
      return { success: true };
    }
  },

  // Internal Agents endpoints - System agents like Prompt Assistant
  internalAgents: {
    // Get all internal (system) agents
    getAll: async () => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/internal`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch internal agents');
      return await response.json();
    },

    // Get a specific internal agent by ID
    getById: async (id) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/internal/${id}`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch internal agent');
      return await response.json();
    },

    // Execute an internal agent (e.g., Prompt Assistant)
    execute: async (input, history = [], sessionId = null, context = null) => {
      // The Prompt Assistant agent ID (seeded in database)
      const PROMPT_ASSISTANT_ID = '00000000-0000-0000-0000-000000000001';

      const payload = {
        input,
        history: history.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        ...(sessionId && { session_id: sessionId }),
        ...(context && { context })
      };

      const response = await fetch(
        `${import.meta.env.VITE_AETHER_API_URL}/agents/internal/${PROMPT_ASSISTANT_ID}/execute`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to execute internal agent');
      }
      return await response.json();
    },

    // Execute any internal agent by ID
    executeById: async (agentId, input, history = [], sessionId = null, context = null) => {
      const payload = {
        input,
        history: history.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        ...(sessionId && { session_id: sessionId }),
        ...(context && { context })
      };

      const response = await fetch(
        `${import.meta.env.VITE_AETHER_API_URL}/agents/internal/${agentId}/execute`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to execute internal agent');
      }
      return await response.json();
    }
  },

  // Agent Execution endpoints
  agentExecution: {
    start: async (agentId, input, sessionId = null) => {
      // Convert input to match backend's AgentExecuteRequest model
      const payload = typeof input === 'string' 
        ? { input: input }  // Simple string input
        : {
            input: input.message || input.input || '',
            ...(input.conversation_id && { conversation_id: input.conversation_id }),
            ...(input.history && { history: input.history }),
            ...(input.sources && { sources: input.sources }),
            ...(input.max_results && { max_results: input.max_results }),
            ...(input.template && { template: input.template }),
            ...(input.template_params && { template_params: input.template_params }),
            ...(input.output_format && { output_format: input.output_format })
          };

      // Call the correct backend endpoint: /agents/:id/execute
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/${agentId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start execution');
      }
      return await response.json();
    },

    get: async (executionId) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/executions/${executionId}`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch execution');
      return await response.json();
    },

    list: async (filter = {}) => {
      const queryParams = new URLSearchParams();
      if (filter.agent_id) queryParams.append('agent_id', filter.agent_id);
      if (filter.status) queryParams.append('status', filter.status);
      if (filter.session_id) queryParams.append('session_id', filter.session_id);
      if (filter.page) queryParams.append('page', filter.page);
      if (filter.size) queryParams.append('size', filter.size);
      
      const url = `${import.meta.env.VITE_AETHER_API_URL}/executions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch executions');
      return await response.json();
    },

    cancel: async (executionId) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/executions/${executionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to cancel execution');
      return await response.json();
    },

    getByAgent: async (agentId, limit = 50) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/agents/${agentId}/executions?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch agent executions');
      return await response.json();
    },

    getBySession: async (sessionId) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/executions/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch session executions');
      return await response.json();
    }
  },

  // Statistics and Analytics endpoints
  agentStats: {
    getAgent: async (agentId) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/stats/agents/${agentId}`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch agent stats');
      return await response.json();
    },

    getUser: async () => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/users/me/stats`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return await response.json();
    },

    getSpace: async (spaceId) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/stats/spaces/${spaceId}`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch space stats');
      return await response.json();
    }
  },

  // Onboarding endpoints
  onboarding: {
    getStatus: async () => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/users/me/onboarding`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch onboarding status');
      return await response.json();
    },

    markTutorialComplete: async () => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/users/me/onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to mark tutorial complete');
      return await response.json();
    },

    resetTutorial: async () => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/users/me/onboarding`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...aetherApi.getSpaceHeaders()
        }
      });
      if (!response.ok) throw new Error('Failed to reset tutorial');
      return await response.json();
    }
  },

  // Router Service endpoints
  agentRouter: {
    getProviders: async () => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/router/providers`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch providers');
      return await response.json();
    },

    getModels: async (provider) => {
      const response = await fetch(`${import.meta.env.VITE_AETHER_API_URL}/router/providers/${provider}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch models');
      return await response.json();
    },

    validateConfig: async (config) => {
      // Skip API call entirely - validation endpoint not implemented yet
      // Return default valid response without logging to avoid console spam
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to simulate API call
      return {
        valid: true,
        errors: [],
        warnings: [],
        message: 'Configuration validation not yet implemented in backend'
      };
    }
  },

  // Configuration Templates
  agentTemplates: {
    getPresets: async () => {
      // Return predefined configuration templates from TypeScript definitions
      const { 
        HIGH_RELIABILITY_RETRY_CONFIG, 
        HIGH_RELIABILITY_FALLBACK_CONFIG,
        COST_OPTIMIZED_RETRY_CONFIG,
        COST_OPTIMIZED_FALLBACK_CONFIG,
        PERFORMANCE_OPTIMIZED_RETRY_CONFIG,
        PERFORMANCE_OPTIMIZED_FALLBACK_CONFIG,
        DEFAULT_RETRY_CONFIG,
        DEFAULT_FALLBACK_CONFIG
      } = await import('../types/agentBuilder.ts');

      return {
        success: true,
        data: [
          {
            name: 'High Reliability',
            description: 'Maximum reliability with extensive retry and fallback options',
            optimize_for: 'quality',
            retry_config: HIGH_RELIABILITY_RETRY_CONFIG,
            fallback_config: HIGH_RELIABILITY_FALLBACK_CONFIG,
            recommended_for: ['Critical applications', 'Production systems', 'High-stakes decisions']
          },
          {
            name: 'Cost Optimized',
            description: 'Minimize costs while maintaining reasonable reliability',
            optimize_for: 'cost',
            retry_config: COST_OPTIMIZED_RETRY_CONFIG,
            fallback_config: COST_OPTIMIZED_FALLBACK_CONFIG,
            recommended_for: ['Development', 'Testing', 'High-volume processing']
          },
          {
            name: 'Performance',
            description: 'Optimized for speed and low latency',
            optimize_for: 'performance',
            retry_config: PERFORMANCE_OPTIMIZED_RETRY_CONFIG,
            fallback_config: PERFORMANCE_OPTIMIZED_FALLBACK_CONFIG,
            recommended_for: ['Real-time applications', 'Interactive systems', 'Low-latency requirements']
          },
          {
            name: 'Balanced',
            description: 'Balanced approach with moderate reliability and cost',
            optimize_for: 'quality',
            retry_config: DEFAULT_RETRY_CONFIG,
            fallback_config: DEFAULT_FALLBACK_CONFIG,
            recommended_for: ['General use', 'Most applications', 'Default choice']
          }
        ]
      };
    },

    applyTemplate: (templateName, existingConfig = {}) => {
      // This is a client-side helper to apply templates to agent configurations
      const templates = {
        'High Reliability': {
          optimize_for: 'quality',
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
            require_same_features: false
          }
        },
        'Cost Optimized': {
          optimize_for: 'cost',
          retry_config: {
            max_attempts: 2,
            backoff_type: 'linear',
            base_delay: '2s',
            max_delay: '10s',
            retryable_errors: ['timeout', 'connection']
          },
          fallback_config: {
            enabled: true,
            preferred_chain: ['openai', 'anthropic'],
            max_cost_increase: 0.2,
            require_same_features: true
          }
        },
        'Performance': {
          optimize_for: 'performance',
          retry_config: {
            max_attempts: 2,
            backoff_type: 'linear',
            base_delay: '100ms',
            max_delay: '2s',
            retryable_errors: ['timeout', 'connection']
          },
          fallback_config: {
            enabled: true,
            preferred_chain: ['openai', 'anthropic'],
            max_cost_increase: 0.3,
            require_same_features: true
          }
        },
        'Balanced': {
          optimize_for: 'quality',
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
        }
      };

      return {
        ...existingConfig,
        ...templates[templateName]
      };
    }
  },

  // Workflows endpoints
  workflows: {
    getAll: async () => {
      await delay(400);
      return { data: workflows, success: true };
    },
    getById: async (id) => {
      await delay(300);
      const workflow = workflows.find(w => w.id === id);
      if (!workflow) {
        throw new Error('Workflow not found');
      }
      return { data: workflow, success: true };
    },
    toggleStatus: async (id) => {
      await delay(500);
      const workflow = workflows.find(w => w.id === id);
      const newStatus = workflow.status === 'active' ? 'paused' : 'active';
      return { data: { id, status: newStatus }, success: true };
    }
  },

  // ML Models endpoints
  mlModels: {
    getAll: async () => {
      await delay(700);
      return { data: mlModels, success: true };
    },
    getById: async (id) => {
      await delay(300);
      const model = mlModels.find(m => m.id === id);
      if (!model) {
        throw new Error('Model not found');
      }
      return { data: model, success: true };
    },
    retrain: async (id) => {
      await delay(2000);
      return { data: { id, status: 'training' }, success: true };
    }
  },

  // Analytics endpoints
  analytics: {
    getMetrics: async () => {
      await delay(400);
      return { data: analyticsData, success: true };
    },
    getExperiments: async () => {
      await delay(500);
      return { data: experiments, success: true };
    }
  },

  // Note: Duplicate agentExecution mock implementation removed
  // The actual implementation is at lines 288-361 above

  // Community endpoints
  community: {
    getAll: async () => {
      await delay(600);
      return { data: communityItems, success: true };
    },
    search: async (query) => {
      await delay(400);
      const filtered = communityItems.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.author.toLowerCase().includes(query.toLowerCase())
      );
      return { data: filtered, success: true };
    }
  },

  // Streaming endpoints
  streaming: {
    getLiveEvents: async () => {
      await delay(200);
      return { data: liveEvents, success: true };
    },
    getStreamSources: async () => {
      await delay(300);
      return { data: streamSources, success: true };
    }
  }
};