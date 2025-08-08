import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export const useAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.agents.getAll();
      setAgents(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const createAgent = async (agentData) => {
    try {
      setError(null);
      const response = await api.agents.create(agentData);
      setAgents(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to create agent');
      throw err;
    }
  };

  const updateAgentStatus = async (id, status) => {
    try {
      setError(null);
      const response = await api.agents.updateStatus(id, status);
      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, status } : agent
      ));
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to update agent status');
      throw err;
    }
  };

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
    createAgent,
    updateAgentStatus
  };
};

export const useAgent = (id) => {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await api.agents.getById(id);
        setAgent(response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch agent');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [id]);

  return { agent, loading, error };
};