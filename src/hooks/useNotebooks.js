import { useState, useEffect } from 'react';
import notebookService from '../services/notebookService.js';

export const useNotebooks = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notebookService.getAllNotebooks();
      setNotebooks(response.notebooks);
      setMetadata(response.metadata);
    } catch (err) {
      setError(err.message || 'Failed to fetch notebooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const createNotebook = async (notebookData) => {
    try {
      setError(null);
      const newNotebook = await notebookService.createNotebook(notebookData);
      setNotebooks(prev => [...prev, newNotebook]);
      
      // Update metadata
      const updatedResponse = await notebookService.getAllNotebooks();
      setMetadata(updatedResponse.metadata);
      
      return newNotebook;
    } catch (err) {
      setError(err.message || 'Failed to create notebook');
      throw err;
    }
  };

  const updateNotebook = async (id, updates) => {
    try {
      setError(null);
      const updatedNotebook = await notebookService.updateNotebook(id, updates);
      setNotebooks(prev => prev.map(notebook => 
        notebook.id === id ? updatedNotebook : notebook
      ));
      return updatedNotebook;
    } catch (err) {
      setError(err.message || 'Failed to update notebook');
      throw err;
    }
  };

  const deleteNotebook = async (id, deleteChildren = false) => {
    try {
      setError(null);
      await notebookService.deleteNotebook(id, deleteChildren);
      
      // Refresh all notebooks since hierarchical deletion might affect multiple notebooks
      const response = await notebookService.getAllNotebooks();
      setNotebooks(response.notebooks);
      setMetadata(response.metadata);
    } catch (err) {
      setError(err.message || 'Failed to delete notebook');
      throw err;
    }
  };

  const searchNotebooks = async (query, filters = {}) => {
    try {
      setError(null);
      const results = await notebookService.searchNotebooks(query, filters);
      return results;
    } catch (err) {
      setError(err.message || 'Failed to search notebooks');
      throw err;
    }
  };

  return {
    notebooks,
    loading,
    error,
    metadata,
    refetch: fetchNotebooks,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    searchNotebooks
  };
};

export const useNotebook = (id) => {
  const [notebook, setNotebook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotebook = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const fetchedNotebook = await notebookService.getNotebookById(id);
        setNotebook(fetchedNotebook);
      } catch (err) {
        setError(err.message || 'Failed to fetch notebook');
      } finally {
        setLoading(false);
      }
    };

    fetchNotebook();
  }, [id]);

  return { notebook, loading, error };
};

export const useNotebookTree = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const treeData = await notebookService.getNotebookTree();
      setTree(treeData);
    } catch (err) {
      setError(err.message || 'Failed to fetch notebook tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  return {
    tree,
    loading,
    error,
    refetch: fetchTree
  };
};

export const useNotebookStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const statistics = await notebookService.getStatistics();
      setStats(statistics);
    } catch (err) {
      setError(err.message || 'Failed to fetch notebook statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};