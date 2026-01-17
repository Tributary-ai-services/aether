import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export const useCommunity = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCommunityItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.community.getAll();
      setItems(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch community items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityItems();
  }, []);

  const searchCommunity = async (query) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.community.search(query);
      setItems(response.data);
    } catch (err) {
      setError(err.message || 'Failed to search community');
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    loading,
    error,
    refetch: fetchCommunityItems,
    searchCommunity
  };
};