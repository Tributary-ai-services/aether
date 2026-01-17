import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

export const useStreaming = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [streamSources, setStreamSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStreamingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventsResponse, sourcesResponse] = await Promise.all([
        api.streaming.getLiveEvents(),
        api.streaming.getStreamSources()
      ]);
      setLiveEvents(eventsResponse.data);
      setStreamSources(sourcesResponse.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch streaming data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamingData();
  }, []);

  // Simulate real-time updates
  const [eventsPerSecond, setEventsPerSecond] = useState(0);
  const [activeStreams, setActiveStreams] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStreams(Math.floor(Math.random() * 5) + 8);
      setEventsPerSecond(Math.floor(Math.random() * 100) + 50);
      
      // Simulate new events occasionally
      if (Math.random() < 0.3) {
        const newEvent = {
          id: Date.now(),
          source: 'Real-time Update',
          type: 'system',
          content: 'New data processed',
          sentiment: 'neutral',
          timestamp: 'now',
          mediaType: 'text',
          hasAuditTrail: true
        };
        setLiveEvents(prev => [newEvent, ...prev.slice(0, 9)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const refreshLiveEvents = useCallback(async () => {
    try {
      const response = await api.streaming.getLiveEvents();
      setLiveEvents(response.data);
    } catch (err) {
      setError(err.message || 'Failed to refresh live events');
    }
  }, []);

  return {
    liveEvents,
    streamSources,
    eventsPerSecond,
    activeStreams,
    loading,
    error,
    refetch: fetchStreamingData,
    refreshLiveEvents
  };
};