import { aetherApi } from './aetherApi.js';

const LLM_ROUTER_URL = import.meta.env.VITE_LLM_ROUTER_URL || `${window.location.origin}`;

async function request(endpoint, options = {}) {
  const url = `${LLM_ROUTER_URL}${endpoint}`;

  const token = aetherApi.getAccessToken?.() || localStorage.getItem('aether_access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const bypassTokenService = {
  generate: (ttlHours, reason) =>
    request('/v1/scan/bypass-tokens', {
      method: 'POST',
      body: JSON.stringify({ ttl_hours: ttlHours, reason }),
    }),

  list: () => request('/v1/scan/bypass-tokens'),

  revoke: (tokenId) =>
    request(`/v1/scan/bypass-tokens/${tokenId}`, {
      method: 'DELETE',
    }),
};
