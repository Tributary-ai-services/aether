import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export const useWorkflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.workflows.getAll();
      setWorkflows(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const toggleWorkflowStatus = async (id) => {
    try {
      setError(null);
      const response = await api.workflows.toggleStatus(id);
      setWorkflows(prev => prev.map(workflow => 
        workflow.id === id ? { ...workflow, status: response.data.status } : workflow
      ));
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to toggle workflow status');
      throw err;
    }
  };

  return {
    workflows,
    loading,
    error,
    refetch: fetchWorkflows,
    toggleWorkflowStatus
  };
};