// WebSocket client for the Live Streams event feed.
// Connects to /api/v1/streams/live, auto-reconnects with exponential backoff.

import { tokenStorage } from './tokenStorage.js';

const WS_PATH = '/api/v1/streams/live';
const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;

export class StreamingSocket {
  constructor({ onEvent, onOpen, onClose, onError, space } = {}) {
    this.onEvent = onEvent || (() => {});
    this.onOpen = onOpen || (() => {});
    this.onClose = onClose || (() => {});
    this.onError = onError || (() => {});
    // Browser WebSocket upgrades cannot set custom headers, so the SpaceContext
    // middleware on the server has to read space_type / space_id from the
    // query string. Pass the current space here so the server passes its
    // RequireSpaceContext middleware; otherwise the upgrade 400s before the
    // hub ever sees the connection and the frontend falls back to mock data.
    this.space = space || null;
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

    // The token-storage service exposes getAccessToken(); the older getToken()
    // name doesn't exist, so `?.()` silently resolved to undefined and we
    // connected without a token. The server then dropped the upgrade because
    // the auth middleware had no JWT to verify.
    const token = tokenStorage.getAccessToken?.() || '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (this.space?.space_type && this.space?.space_id) {
      params.set('space_type', this.space.space_type);
      params.set('space_id', this.space.space_id);
    }
    const url = `${protocol}//${host}${WS_PATH}?${params.toString()}`;

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
