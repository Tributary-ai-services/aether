import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProductionProgress } from '../store/slices/producersSlice.js';
import { tokenStorage } from '../services/tokenStorage';

const API_URL = import.meta.env.VITE_AETHER_API_URL || `${window.location.origin}/api/v1`;
const POLL_INTERVAL_MS = 3000;

/**
 * Custom hook that connects to the SSE endpoint for real-time production progress updates.
 * Falls back to polling if SSE connection fails.
 * Follows the same pattern as useCommentSSE.
 */
export function useProductionProgress(productionId, { enabled = true } = {}) {
  const dispatch = useDispatch();
  const eventSourceRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const isPollingRef = useRef(false);

  // Get current space context for query params (EventSource can't send custom headers)
  const spaceType = useSelector(state => state.spaces?.currentSpace?.space_type || 'personal');
  const spaceId = useSelector(state => state.spaces?.currentSpace?.space_id || '');

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    const token = tokenStorage.getAccessToken();
    if (token) params.set('token', token);
    if (spaceType) params.set('space_type', spaceType);
    if (spaceId) params.set('space_id', spaceId);
    return params.toString();
  }, [spaceType, spaceId]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  const startPolling = useCallback(() => {
    if (isPollingRef.current || !productionId) return;
    isPollingRef.current = true;

    const poll = async () => {
      try {
        const token = tokenStorage.getAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        if (spaceId) headers['X-Space-ID'] = spaceId;
        if (spaceType) headers['X-Space-Type'] = spaceType;
        const res = await fetch(`${API_URL}/productions/${productionId}/progress`, { headers });
        if (res.ok) {
          const data = await res.json();
          dispatch(updateProductionProgress({ productionId, progress: data }));

          // Stop polling if terminal state
          if (data.phase === 'completed' || data.phase === 'failed') {
            stopPolling();
          }
        }
      } catch (err) {
        // Ignore polling errors
      }
    };

    poll(); // Initial fetch
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
  }, [productionId, spaceId, spaceType, dispatch, stopPolling]);

  useEffect(() => {
    if (!productionId || !enabled) return;

    const connect = () => {
      const queryString = buildQueryParams();
      const url = `${API_URL}/productions/${productionId}/progress/stream?${queryString}`;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'heartbeat') return;

          // SSE events are wrapped as {production_id, state: {phase, clips_total, ...}}
          // Normalize to flat format matching the polling endpoint
          const progress = data.state ? { ...data.state } : data;

          dispatch(updateProductionProgress({ productionId, progress }));

          // Close SSE on terminal states
          if (progress.phase === 'completed' || progress.phase === 'failed') {
            es.close();
            eventSourceRef.current = null;
          }
        } catch (err) {
          // Ignore parse errors (heartbeats)
        }
      };

      es.onerror = () => {
        // SSE failed — fall back to polling
        es.close();
        eventSourceRef.current = null;
        startPolling();
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      stopPolling();
    };
  }, [productionId, enabled, dispatch, startPolling, stopPolling, buildQueryParams]);
}
