import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export const useAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.analytics.getMetrics();
      setAnalyticsData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analyticsData,
    loading,
    error,
    refetch: fetchAnalytics
  };
};

export const useMLModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.mlModels.getAll();
      setModels(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch ML models');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const retrainModel = async (id) => {
    try {
      setError(null);
      const response = await api.mlModels.retrain(id);
      setModels(prev => prev.map(model => 
        model.id === id ? { ...model, status: 'training' } : model
      ));
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to retrain model');
      throw err;
    }
  };

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
    retrainModel
  };
};

export const useExperiments = () => {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.analytics.getExperiments();
      setExperiments(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch experiments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  return {
    experiments,
    loading,
    error,
    refetch: fetchExperiments
  };
};