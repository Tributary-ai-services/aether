// WebSocket client for the Live Streams event feed.
// Connects to /api/v1/streams/live, auto-reconnects with exponential backoff.

import { tokenStorage } from './tokenStorage.js';

const WS_PATH = '/api/v1/streams/live';
const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;

export class StreamingSocket {
  constructor({ onEvent, onOpen, onClose, onError } = {}) {
    this.onEvent = onEvent || (() => {});
    this.onOpen = onOpen || (() => {});
    this.onClose = onClose || (() => {});
    this.onError = onError || (() => {});
    this.ws = null;
    this.retryMs = INITIAL_RETRY_MS;
    this.stopped = false;
    this.retryTimer = null;
  }

  connect() {
    this.stopped = false;
    this._open();
  }

  disconnect() {
    this.stopped = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'client disconnect');
      this.ws = null;
    }
  }

  _open() {
    if (this.stopped) return;

    const token = tokenStorage.getToken?.() || '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}${WS_PATH}?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      this.onError(err);
      this._scheduleRetry();
      return;
    }

    this.ws.onopen = () => {
      this.retryMs = INITIAL_RETRY_MS;
      this.onOpen();
    };

    this.ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        this.onEvent(event);
      } catch {
        // ignore non-JSON control messages
      }
    };

    this.ws.onclose = (e) => {
      this.onClose(e);
      if (!this.stopped) {
        this._scheduleRetry();
      }
    };

    this.ws.onerror = (err) => {
      this.onError(err);
    };
  }

  _scheduleRetry() {
    if (this.stopped) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this._open();
    }, this.retryMs);
    this.retryMs = Math.min(this.retryMs * 2, MAX_RETRY_MS);
  }
}
