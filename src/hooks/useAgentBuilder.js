import { useState, useEffect } from 'react';
import { useSpace } from './useSpaces.js';
import { api } from '../services/api.js';

/**
 * Hook for Agent Builder operations
 * Comprehensive integration with real backend APIs including execution and stats
 */
export const useAgentBuilder = (filter = {}, { includeInternal = false } = {}) => {
  const { currentSpace } = useSpace();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchAgents = async (customFilter = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Combine space context with custom filter
      const requestFilter = {
        ...filter,
        ...customFilter,
        ...(currentSpace?.id && { space_id: currentSpace.id }),
        ...(includeInternal && { include_internal: true })
      };
      
      const response = await api.agentBuilder.getAll(requestFilter);
      // DEBUG: Log raw API response
      console.log('useAgentBuilder - Raw API response:', JSON.stringify(response, null, 2));
      const agentsData = response.agents || response.data || [];
      // DEBUG: Log first agent's type
      if (agentsData.length > 0) {
        console.log('useAgentBuilder - First agent type:', agentsData[0]?.type, '| Full agent:', agentsData[0]);
      }
      setAgents(agentsData);
      
      // Fetch user stats if available
      try {
        const userStats = await api.agentStats.getUser();
        setStats(userStats.data || userStats);
      } catch (statsError) {
        console.warn('Failed to fetch user stats:', statsError);
      }
      
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      setError(err.message || 'Failed to fetch agents');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch agents even without a space - the backend will handle filtering
    fetchAgents();
  }, [currentSpace?.id, includeInternal]);

  // Agent CRUD Operations
  const createAgent = async (agentData) => {
    try {
      setError(null);
      
      // Add current space context
      const requestData = {
        ...agentData,
        space_id: currentSpace?.id || agentData.space_id
      };
      
      const response = await api.agentBuilder.create(requestData);
      const newAgent = response.data || response;
      setAgents(prev => [newAgent, ...prev]);
      return newAgent;
    } catch (err) {
      console.error('Failed to create agent:', err);
      setError(err.message || 'Failed to create agent');
      throw err;
    }
  };

  const updateAgent = async (id, agentData) => {
    try {
      setError(null);
      const response = await api.agentBuilder.update(id, agentData);
      const updatedAgent = response.data || response;
      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, ...updatedAgent } : agent
      ));
      return updatedAgent;
    } catch (err) {
      console.error('Failed to update agent:', err);
      setError(err.message || 'Failed to update agent');
      throw err;
    }
  };

  const deleteAgent = async (id) => {
    try {
      setError(null);
      await api.agentBuilder.delete(id);
      setAgents(prev => prev.filter(agent => agent.id !== id));
    } catch (err) {
      console.error('Failed to delete agent:', err);
      setError(err.message || 'Failed to delete agent');
      throw err;
    }
  };

  // Agent Publishing
  const publishAgent = async (id) => {
    try {
      setError(null);
      await api.agentBuilder.publish(id);
      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, status: 'published' } : agent
      ));
    } catch (err) {
      console.error('Failed to publish agent:', err);
      setError(err.message || 'Failed to publish agent');
      throw err;
    }
  };

  const unpublishAgent = async (id) => {
    try {
      setError(null);
      await api.agentBuilder.unpublish(id);
      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, status: 'draft' } : agent
      ));
    } catch (err) {
      console.error('Failed to unpublish agent:', err);
      setError(err.message || 'Failed to unpublish agent');
      throw err;
    }
  };

  // Agent Duplication
  const duplicateAgent = async (sourceId, newName) => {
    try {
      setError(null);
      const response = await api.agentBuilder.duplicate(sourceId, newName);
      const duplicatedAgent = response.data || response;
      setAgents(prev => [duplicatedAgent, ...prev]);
      return duplicatedAgent;
    } catch (err) {
      console.error('Failed to duplicate agent:', err);
      setError(err.message || 'Failed to duplicate agent');
      throw err;
    }
  };

  return {
    agents,
    loading,
    error,
    stats,
    refetch: fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    publishAgent,
    unpublishAgent,
    duplicateAgent
  };
};

/**
 * Hook for agent execution operations
 */
export const useAgentExecution = (agentId = null) => {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startExecution = async (input, sessionId = null) => {
    if (!agentId) throw new Error('Agent ID is required for execution');
    
    try {
      setError(null);
      const response = await api.agentExecution.start(agentId, input, sessionId);
      const execution = response.data || response;
      setExecutions(prev => [execution, ...prev]);
      return execution;
    } catch (err) {
      console.error('Failed to start execution:', err);
      setError(err.message || 'Failed to start execution');
      throw err;
    }
  };

  const getExecution = async (executionId) => {
    try {
      setError(null);
      const response = await api.agentExecution.get(executionId);
      return response.data || response;
    } catch (err) {
      console.error('Failed to fetch execution:', err);
      setError(err.message || 'Failed to fetch execution');
      throw err;
    }
  };

  const cancelExecution = async (executionId) => {
    try {
      setError(null);
      await api.agentExecution.cancel(executionId);
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId ? { ...exec, status: 'cancelled' } : exec
      ));
    } catch (err) {
      console.error('Failed to cancel execution:', err);
      setError(err.message || 'Failed to cancel execution');
      throw err;
    }
  };

  const fetchExecutions = async (filter = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const requestFilter = agentId ? { ...filter, agent_id: agentId } : filter;
      const response = await api.agentExecution.list(requestFilter);
      const executionsData = response.executions || response.data || [];
      setExecutions(executionsData);
    } catch (err) {
      console.error('Failed to fetch executions:', err);
      setError(err.message || 'Failed to fetch executions');
      setExecutions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchExecutions();
    }
  }, [agentId]);

  return {
    executions,
    loading,
    error,
    startExecution,
    getExecution,
    cancelExecution,
    refetch: fetchExecutions
  };
};

/**
 * Hook for agent statistics and analytics
 */
export const useAgentStats = (agentId = null) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    if (!agentId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.agentStats.getAgent(agentId);
      setStats(response.data || response);
    } catch (err) {
      console.error('Failed to fetch agent stats:', err);
      setError(err.message || 'Failed to fetch agent stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchStats();
    }
  }, [agentId]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

/**
 * Hook for provider and model information
 */
export const useAgentProviders = () => {
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.agentRouter.getProviders();
      
      // Handle the response format: {"count":2,"providers":["openai","anthropic"]}
      const rawProviders = response.providers || response.data?.providers || response;
      
      // Transform string providers to objects expected by the frontend
      const transformedProviders = Array.isArray(rawProviders) 
        ? rawProviders.map(provider => {
            if (typeof provider === 'string') {
              return {
                id: provider,
                name: provider,
                display_name: provider.charAt(0).toUpperCase() + provider.slice(1)
              };
            }
            return provider;
          })
        : [];
      
      setProviders(transformedProviders);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      setError(err.message || 'Failed to fetch providers');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async (provider) => {
    try {
      setError(null);
      const response = await api.agentRouter.getModels(provider);
      
      // Handle the response format from provider details endpoint
      // Response: { capabilities: { supported_models: [...] }, name: "openai", ... }
      const providerModels = response.capabilities?.supported_models || 
                           response.data?.capabilities?.supported_models || 
                           response.models || 
                           response.data?.models || 
                           response;
      
      setModels(prev => ({
        ...prev,
        [provider]: Array.isArray(providerModels) ? providerModels : []
      }));
    } catch (err) {
      console.error(`Failed to fetch models for ${provider}:`, err);
      setError(err.message || `Failed to fetch models for ${provider}`);
    }
  };

  const validateConfig = async (config) => {
    try {
      setError(null);
      const response = await api.agentRouter.validateConfig(config);
      return response.data || response;
    } catch (err) {
      console.error('Failed to validate config:', err);
      setError(err.message || 'Failed to validate config');
      throw err;
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  return {
    providers,
    models,
    loading,
    error,
    fetchProviders,
    fetchModels,
    validateConfig
  };
};

/**
 * Hook for individual agent operations
 */
export const useAgent = (id) => {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const response = await api.agentBuilder.getById(id);
        setAgent(response.data || response);
      } catch (err) {
        console.error('Failed to fetch agent:', err);
        setError(err.message || 'Failed to fetch agent');
        setAgent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [id]);

  return { agent, loading, error };
};

// Backward compatibility - export the old hook name as well
export const useAgents = useAgentBuilder;