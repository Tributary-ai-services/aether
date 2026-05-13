import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
    fullType: ce.type || '',
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

// Service display metadata for the Data Streams panel, keyed on the
// short source name produced by mapCEToUIEvent (URN tail).
const SOURCE_DISPLAY = {
  audimodal:       { name: 'Document Ingest',   type: 'document', color: 'blue' },
  'llm-router':    { name: 'LLM Router',        type: 'llm',      color: 'purple' },
  'agent-builder': { name: 'Agent Builder',     type: 'agent',    color: 'green' },
  'aether-be':                 { name: 'Workflow Engine', type: 'workflow', color: 'amber' },
  'aether-be:mcp-proxy':       { name: 'MCP Proxy',       type: 'mcp',      color: 'cyan' },
  gatekeeper:      { name: 'Gatekeeper',        type: 'security', color: 'red' },
};

function buildStreamSources(events) {
  const byKey = new Map();
  for (const e of events) {
    const key = e.source || 'unknown';
    let s = byKey.get(key);
    if (!s) {
      const meta = SOURCE_DISPLAY[key] || { name: key, type: 'event', color: 'gray' };
      s = {
        id: key,
        name: meta.name,
        type: meta.type,
        color: meta.color,
        status: 'live',
        events: 0,
        rate: 0,
        lastSeen: 0,
      };
      byKey.set(key, s);
    }
    s.events += 1;
    s.lastSeen = Math.max(s.lastSeen, Date.now());
  }
  return Array.from(byKey.values()).sort((a, b) => b.events - a.events);
}

export const useStreaming = () => {
  const dispatch = useDispatch();
  // Two preconditions for the WS to succeed:
  //   1. The user is authenticated (token has been stored).
  //   2. A space is selected (the backend's RequireSpaceContext middleware
  //      rejects WS upgrades that don't carry space_type + space_id).
  // Gate the effect on both so we don't fire a connect attempt that's
  // guaranteed to be refused.
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  const currentSpace = useSelector((state) => state.spaces?.currentSpace);
  const [liveEvents, setLiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventsPerSecond, setEventsPerSecond] = useState(0);
  const [activeStreams, setActiveStreams] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const eventCountRef = useRef(0);
  const socketRef = useRef(null);

  // Fetch stats from the TimescaleDB-backed /streams/stats endpoint. Falls
  // back to a local-event rate calculation if the endpoint is unavailable.
  const fetchStats = useCallback(async () => {
    try {
      const response = await aetherApi.get('/streams/stats');
      if (response.success && response.data) {
        setEventsPerSecond(response.data.events_per_min / 60);
        setActiveStreams(response.data.active_sources || 0);
        return;
      }
    } catch {
      // ignore — fall through to local computation
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

  // Set up WebSocket connection. Re-runs when the user switches spaces, or
  // when auth state flips (sign-in / sign-out), so the connection always
  // carries a valid token + space context.
  useEffect(() => {
    if (!isAuthenticated) {
      // Pre-login or post-logout — don't attempt to connect.
      setLoading(false);
      setWsConnected(false);
      return undefined;
    }
    if (!currentSpace?.space_id || !currentSpace?.space_type) {
      // Authenticated but no space resolved yet — wait. The StreamingPage
      // shows a contextual empty state from `loading=false && !wsConnected`.
      setLoading(false);
      setWsConnected(false);
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
        // Surface a one-line hint, but keep retrying via StreamingSocket's
        // exponential backoff. The UI never falls back to mock data.
        setError('Live stream disconnected — reconnecting…');
        setLoading(false);
      },
    });

    socket.connect();
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [handleEvent, isAuthenticated, currentSpace?.space_id, currentSpace?.space_type]);

  // Poll the TimescaleDB-backed stats every 30s for the summary cards
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Derive the Data Streams panel from real events; no mock list.
  const streamSources = useMemo(() => buildStreamSources(liveEvents), [liveEvents]);

  return {
    liveEvents,
    streamSources,
    eventsPerSecond,
    activeStreams,
    loading,
    error,
    wsConnected,
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
