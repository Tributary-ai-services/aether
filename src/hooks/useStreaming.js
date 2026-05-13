import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../services/api.js';
import { aetherApi } from '../services/aetherApi.js';
import { StreamingSocket } from '../services/streamingSocket.js';
import { addRealtimeViolation } from '../store/slices/complianceSlice.js';

const MAX_EVENTS = 50;

// mapCEToUIEvent converts a CloudEvents 1.0 envelope from the WebSocket
// into the shape StreamingPage.jsx renders.
function mapCEToUIEvent(ce) {
  const isCompliance = ce.type?.startsWith('com.tas.compliance.');
  const severity = ce.severity || null;

  return {
    id: ce.id || `ce-${Date.now()}`,
    source: ce.source?.replace('urn:tas:service:', '') || 'unknown',
    type: ce.type?.split('.').pop() || 'event',
    content: summarizePayload(ce),
    sentiment: isCompliance ? getSentimentFromSeverity(severity) : 'neutral',
    timestamp: formatTimeAgo(ce.time),
    mediaType: isCompliance ? 'security' : 'text',
    hasAuditTrail: true,
    isComplianceEvent: isCompliance,
    severity,
    confidence: ce.data?.confidence || null,
    violationId: ce.id,
    ruleName: ce.data?.pattern_id || ce.data?.rule_id || null,
    fileName: ce.data?.file_name || ce.subject || null,
  };
}

function summarizePayload(ce) {
  const d = ce.data || {};
  const typeSuffix = ce.type?.split('.').slice(-2).join('.') || '';

  switch (typeSuffix) {
    case 'document.uploaded':
      return `Document uploaded: ${d.file_name || d.file_id || 'unknown'}`;
    case 'document.processed':
      return `Document processed: ${d.file_name || d.file_id || 'unknown'} (${d.chunk_count || '?'} chunks)`;
    case 'document.failed':
      return `Document failed: ${d.file_name || d.file_id || 'unknown'} — ${d.error || 'unknown error'}`;
    case 'llm.request':
      return `LLM request: ${d.model || 'unknown model'}`;
    case 'llm.response':
      return `LLM response: ${d.model || 'unknown'} (${d.tokens_out || '?'} tokens)`;
    case 'agent.executed':
      return `Agent executed: ${d.agent_name || d.agent_id || 'unknown'}`;
    case 'agent.failed':
      return `Agent failed: ${d.agent_name || 'unknown'} — ${d.error || ''}`;
    case 'workflow.started':
      return `Workflow started: ${d.workflow_name || d.workflow_id || 'unknown'}`;
    case 'workflow.completed':
      return `Workflow completed: ${d.workflow_name || 'unknown'}`;
    case 'workflow.failed':
      return `Workflow failed: ${d.workflow_name || 'unknown'} — ${d.error || ''}`;
    case 'mcp.tool_invoked':
      return `MCP tool: ${d.tool_name || 'unknown'} on ${d.server_name || d.server_id || 'unknown'}`;
    case 'finding.detected':
      return `Compliance finding: ${d.pattern_id || 'unknown pattern'} (${d.action_taken || 'detected'})`;
    default:
      return ce.type || 'Event received';
  }
}

export const useStreaming = () => {
  const dispatch = useDispatch();
  // Space context is REQUIRED by the backend WebSocket handler. Without it
  // the upgrade request fails with 400 and we fall back to mock data.
  const currentSpace = useSelector((state) => state.spaces?.currentSpace);
  const [liveEvents, setLiveEvents] = useState([]);
  const [streamSources, setStreamSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventsPerSecond, setEventsPerSecond] = useState(0);
  const [activeStreams, setActiveStreams] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const eventCountRef = useRef(0);
  const socketRef = useRef(null);

  // Fetch initial stream sources (still from mock/REST until backend wired)
  const fetchStreamSources = useCallback(async () => {
    try {
      const response = await api.streaming.getStreamSources();
      setStreamSources(response.data);
    } catch {
      // non-critical — keep whatever we have
    }
  }, []);

  // Fetch stats from backend (when /api/v1/streams/stats is available)
  const fetchStats = useCallback(async () => {
    try {
      const response = await aetherApi.get('/streams/stats');
      if (response.success && response.data) {
        setEventsPerSecond(response.data.events_per_min / 60);
        setActiveStreams(response.data.active_sources || 0);
        return;
      }
    } catch {
      // /stats not available yet — compute from local event rate
    }
    setEventsPerSecond(eventCountRef.current);
    eventCountRef.current = 0;
  }, []);

  // Handle incoming CloudEvent from WebSocket
  const handleEvent = useCallback((ce) => {
    eventCountRef.current += 1;

    const uiEvent = mapCEToUIEvent(ce);

    setLiveEvents(prev => [uiEvent, ...prev].slice(0, MAX_EVENTS));

    // Dispatch high-severity compliance events to Redux for toast notifications
    if (uiEvent.isComplianceEvent && (uiEvent.severity === 'critical' || uiEvent.severity === 'high')) {
      dispatch(addRealtimeViolation({
        id: uiEvent.violationId,
        rule_name: uiEvent.ruleName,
        file_name: uiEvent.fileName,
        severity: uiEvent.severity,
        confidence: uiEvent.confidence,
      }));
    }
  }, [dispatch]);

  // Set up WebSocket connection. Re-runs when the user switches spaces so
  // the new connection carries the right space context.
  useEffect(() => {
    // Wait for a space to be selected before connecting; otherwise the
    // backend would reject the upgrade with `Space context is required`
    // and we'd fall back to mock data even on a fully working pipeline.
    if (!currentSpace?.space_id || !currentSpace?.space_type) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    const socket = new StreamingSocket({
      space: { space_type: currentSpace.space_type, space_id: currentSpace.space_id },
      onEvent: handleEvent,
      onOpen: () => {
        setWsConnected(true);
        setError(null);
        setLoading(false);
      },
      onClose: () => {
        setWsConnected(false);
      },
      onError: () => {
        setWsConnected(false);
      },
    });

    socket.connect();
    socketRef.current = socket;

    // If WS doesn't connect within 3s, load mock data as fallback
    const fallbackTimer = setTimeout(async () => {
      if (!socketRef.current?.ws || socketRef.current.ws.readyState !== WebSocket.OPEN) {
        try {
          const [eventsRes, sourcesRes] = await Promise.all([
            api.streaming.getLiveEvents(),
            api.streaming.getStreamSources(),
          ]);
          setLiveEvents(eventsRes.data || []);
          setStreamSources(sourcesRes.data || []);
        } catch {
          setError('WebSocket unavailable and mock data failed');
        }
        setLoading(false);
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      socket.disconnect();
    };
  }, [handleEvent, currentSpace?.space_id, currentSpace?.space_type]);

  // Poll stream sources + stats every 30s
  useEffect(() => {
    fetchStreamSources();

    const interval = setInterval(() => {
      fetchStreamSources();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStreamSources, fetchStats]);

  const refreshLiveEvents = useCallback(async () => {
    try {
      const [eventsResponse] = await Promise.all([
        api.streaming.getLiveEvents(),
      ]);
      const regularEvents = eventsResponse.data || [];
      setLiveEvents(prev => {
        const wsEvents = prev.filter(e => e.id?.startsWith('ce-') || e.source !== 'Real-time Update');
        return [...wsEvents, ...regularEvents].slice(0, MAX_EVENTS);
      });
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
    wsConnected,
    refetch: fetchStreamSources,
    refreshLiveEvents,
  };
};

function getSentimentFromSeverity(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
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
