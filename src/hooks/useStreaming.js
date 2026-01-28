import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { api } from '../services/api.js';
import { aetherApi } from '../services/aetherApi.js';
import { addRealtimeViolation } from '../store/slices/complianceSlice.js';

export const useStreaming = () => {
  const dispatch = useDispatch();
  const [liveEvents, setLiveEvents] = useState([]);
  const [streamSources, setStreamSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastComplianceCheck, setLastComplianceCheck] = useState(null);

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

  // Fetch recent compliance violations and merge into live events
  const fetchComplianceEvents = useCallback(async () => {
    try {
      const response = await aetherApi.compliance.getViolations({
        page: 1,
        pageSize: 10,
        acknowledged: false, // Only get unacknowledged violations
      });

      if (response.success && response.data?.data) {
        const violations = response.data.data || response.data || [];

        // Convert violations to live event format
        const complianceEvents = violations.map(violation => ({
          id: `compliance-${violation.id}`,
          source: 'Compliance',
          type: 'dlp_violation',
          content: `${violation.rule_name || violation.ruleName}: ${violation.file_name || violation.fileName || 'Unknown file'}`,
          sentiment: getSentimentFromSeverity(violation.severity),
          timestamp: formatTimeAgo(violation.created_at || violation.createdAt),
          mediaType: 'security',
          hasAuditTrail: true,
          // Additional compliance-specific fields
          severity: violation.severity,
          ruleName: violation.rule_name || violation.ruleName,
          fileName: violation.file_name || violation.fileName,
          confidence: violation.confidence,
          violationId: violation.id,
          isComplianceEvent: true,
        }));

        return complianceEvents;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch compliance events:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchStreamingData();
  }, []);

  // Simulate real-time updates and poll for compliance events
  const [eventsPerSecond, setEventsPerSecond] = useState(0);
  const [activeStreams, setActiveStreams] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      setActiveStreams(Math.floor(Math.random() * 5) + 8);
      setEventsPerSecond(Math.floor(Math.random() * 100) + 50);

      // Poll for new compliance violations every 10 seconds
      const now = Date.now();
      if (!lastComplianceCheck || now - lastComplianceCheck >= 10000) {
        setLastComplianceCheck(now);

        const complianceEvents = await fetchComplianceEvents();

        if (complianceEvents.length > 0) {
          // Add new compliance events to the feed
          setLiveEvents(prev => {
            // Remove old compliance events and add new ones
            const nonComplianceEvents = prev.filter(e => !e.isComplianceEvent);
            // Merge and sort by recency
            const merged = [...complianceEvents, ...nonComplianceEvents];
            return merged.slice(0, 20); // Keep max 20 events
          });

          // Dispatch new violations to Redux for toast notifications
          complianceEvents.forEach(event => {
            if (event.severity === 'critical' || event.severity === 'high') {
              dispatch(addRealtimeViolation({
                id: event.violationId,
                rule_name: event.ruleName,
                file_name: event.fileName,
                severity: event.severity,
                confidence: event.confidence,
              }));
            }
          });
        }
      }

      // Simulate new non-compliance events occasionally
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
        setLiveEvents(prev => [newEvent, ...prev.slice(0, 19)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [lastComplianceCheck, fetchComplianceEvents, dispatch]);

  const refreshLiveEvents = useCallback(async () => {
    try {
      const [eventsResponse, complianceEvents] = await Promise.all([
        api.streaming.getLiveEvents(),
        fetchComplianceEvents(),
      ]);

      // Merge compliance events with regular events
      const regularEvents = eventsResponse.data || [];
      const merged = [...complianceEvents, ...regularEvents];
      setLiveEvents(merged.slice(0, 20));
    } catch (err) {
      setError(err.message || 'Failed to refresh live events');
    }
  }, [fetchComplianceEvents]);

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

// Helper function to map severity to sentiment
function getSentimentFromSeverity(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'negative';
    case 'high':
      return 'negative';
    case 'medium':
      return 'neutral';
    case 'low':
      return 'positive';
    default:
      return 'neutral';
  }
}

// Helper function to format timestamp as "X ago"
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'just now';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
