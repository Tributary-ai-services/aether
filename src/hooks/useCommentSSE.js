import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { commentCreated, commentUpdated, commentDeleted } from '../store/slices/commentsSlice';
import { tokenStorage } from '../services/tokenStorage';

const API_URL = import.meta.env.VITE_AETHER_API_URL || `${window.location.origin}/api/v1`;

/**
 * Custom hook that connects to the SSE endpoint for real-time comment updates.
 * Dispatches Redux actions when events arrive.
 */
export function useCommentSSE(notebookId) {
  const dispatch = useDispatch();
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!notebookId) return;

    const connect = () => {
      // EventSource doesn't support custom headers, so we pass the token as query param
      const token = tokenStorage.getAccessToken();
      const url = `${API_URL}/notebooks/${notebookId}/comments/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'created':
              dispatch(commentCreated({ notebookId, comment: data.comment }));
              break;
            case 'updated':
              dispatch(commentUpdated({ notebookId, comment: data.comment }));
              break;
            case 'deleted':
              dispatch(commentDeleted({ notebookId, commentId: data.comment?.id }));
              break;
          }
        } catch (err) {
          // Ignore parse errors (e.g., heartbeat comments)
        }
      };

      es.onerror = () => {
        // EventSource auto-reconnects on error; no manual action needed
        // The browser will try to reconnect after a short delay
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [notebookId, dispatch]);
}
