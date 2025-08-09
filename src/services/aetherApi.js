// Aether Backend API Service
import { tokenStorage } from './tokenStorage.js';

const API_BASE = import.meta.env.VITE_AETHER_API_BASE || window.location.origin;
const API_URL = import.meta.env.VITE_AETHER_API_URL || `${window.location.origin}/api/v1`;
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

// Keycloak configuration
// Use relative URL to work with nginx proxy in production
const KEYCLOAK_BASE_URL = import.meta.env.VITE_KEYCLOAK_URL || window.location.origin;
const KEYCLOAK_REALM = 'aether';
const KEYCLOAK_CLIENT_ID = 'admin-cli';  // Changed to match backend configuration
// admin-cli doesn't need client secret


class AetherApiService {
  constructor() {
    this.baseURL = API_URL;
    this.healthURL = `${API_BASE}/health`;
    this.keycloakTokenUrl = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
    this.refreshPromise = null; // Prevent concurrent refresh requests
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    // Removed DEV MODE mock - we want to test real authentication
    
    // Check if token needs refresh before making request
    await this.ensureValidToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await this.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await this.makeRequest(url, config);
      
      // If we get 401, try to refresh token and retry once
      if (response.status === 401) {
        console.log('Received 401, attempting token refresh...');
        await this.refreshToken();
        
        // Update auth header and retry
        config.headers['Authorization'] = await this.getAuthHeader();
        const retryResponse = await this.makeRequest(url, config);
        
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          throw new Error(`HTTP ${retryResponse.status}: ${errorText || retryResponse.statusText}`);
        }
        
        // Handle responses with no content (like 204 No Content for DELETE)
        let data = null;
        if (retryResponse.status !== 204) {
          const contentType = retryResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await retryResponse.json();
          } else {
            // For non-JSON responses, get text
            const text = await retryResponse.text();
            data = text || null;
          }
        }
        
        return { data, success: true };
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
      
      // Handle responses with no content (like 204 No Content for DELETE)
      let data = null;
      if (response.status !== 204) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // For non-JSON responses, get text
          const text = await response.text();
          data = text || null;
        }
      }
      
      return { data, success: true };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Helper method to make the actual fetch request
  async makeRequest(url, config) {
    return await fetch(url, config);
  }

  // Ensure we have a valid token before making requests
  async ensureValidToken() {
    // Check if we have any token at all
    if (!tokenStorage.getAccessToken()) {
      if (DEV_MODE) {
        console.log('No token found, getting dev token...');
        const { getDevToken } = await import('../utils/getDevToken.js');
        await getDevToken();
      } else {
        this.triggerAuthenticationError('no_token');
        throw new Error('No authentication token found. Please log in.');
      }
    }

    // Check if token is expired or will expire soon (preemptive refresh at 80% of lifetime)
    if (tokenStorage.isAccessTokenExpired(2)) { // 2 minute buffer for preemptive refresh
      if (tokenStorage.isRefreshTokenExpired()) {
        // Clear expired tokens and trigger logout
        tokenStorage.clearTokens();
        this.triggerAuthenticationError('refresh_token_expired');
        throw new Error('Session expired. Please log in again.');
      }
      await this.refreshToken();
    }
  }

  // Trigger authentication error event for the UI to handle
  triggerAuthenticationError(reason = 'unknown') {
    const event = new CustomEvent('authenticationError', { 
      detail: { reason, timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
  }


  // Get authorization header for requests
  async getAuthHeader() {
    const token = tokenStorage.getAccessToken();
    return token ? `Bearer ${token}` : '';
  }

  // Refresh the access token using refresh token
  async refreshToken() {
    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (DEV_MODE) {
      console.log('DEV_MODE: Getting fresh token from Keycloak...');
      try {
        // Use getDevToken to get real tokens from Keycloak
        const { getDevToken } = await import('../utils/getDevToken.js');
        const tokenData = await getDevToken();
        if (tokenData) {
          console.log('✅ Got fresh tokens from Keycloak in dev mode');
          return;
        } else {
          console.error('❌ Failed to get fresh tokens in dev mode');
          throw new Error('Dev token refresh failed');
        }
      } catch (error) {
        console.error('❌ Dev token refresh error:', error);
        throw error;
      }
    }

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available. Please log in again.');
    }

    if (tokenStorage.isRefreshTokenExpired()) {
      tokenStorage.clearTokens();
      throw new Error('Refresh token expired. Please log in again.');
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  // Perform the actual token refresh request
  async performTokenRefresh(refreshToken) {
    try {
      const response = await fetch(this.keycloakTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: KEYCLOAK_CLIENT_ID,
          scope: 'openid profile email', // Request ID token with proper scopes
          // admin-cli doesn't need client_secret
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', response.status, errorText);
        
        // Clear tokens on refresh failure
        tokenStorage.clearTokens();
        
        // Handle specific error cases
        if (response.status === 400) {
          this.triggerAuthenticationError('invalid_refresh_token');
          throw new Error('Invalid refresh token. Please log in again.');
        } else if (response.status === 401) {
          this.triggerAuthenticationError('refresh_token_expired');
          throw new Error('Refresh token expired. Please log in again.');
        } else {
          this.triggerAuthenticationError('refresh_failed');
          throw new Error(`Token refresh failed (${response.status}). Please log in again.`);
        }
      }

      const tokenData = await response.json();
      
      // Validate response data and prefer ID token
      if (!tokenData.access_token && !tokenData.id_token) {
        throw new Error('Invalid token response: missing both access_token and id_token');
      }
      
      // Store new tokens - prefer ID token for authentication
      const tokenToUse = tokenData.id_token || tokenData.access_token;
      tokenStorage.setAccessToken(tokenToUse, tokenData.expires_in);
      if (tokenData.refresh_token) {
        tokenStorage.setRefreshToken(tokenData.refresh_token, tokenData.refresh_expires_in || 1800); // 30 mins default
      }
      
      console.log('Token refreshed successfully', {
        hasIdToken: !!tokenData.id_token,
        hasAccessToken: !!tokenData.access_token,
        usingIdToken: tokenToUse === tokenData.id_token
      });
      
      // Trigger success event
      const event = new CustomEvent('tokenRefreshed', { 
        detail: { timestamp: Date.now() } 
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Token refresh error:', error);
      tokenStorage.clearTokens();
      
      // Ensure authentication error is triggered
      if (!error.message.includes('Please log in again')) {
        this.triggerAuthenticationError('refresh_error');
      }
      
      throw error;
    }
  }

  // Set initial tokens (for login)
  setTokens(accessToken, refreshToken, expiresIn = 300, refreshExpiresIn = 1800) {
    tokenStorage.setAccessToken(accessToken, expiresIn);
    tokenStorage.setRefreshToken(refreshToken, refreshExpiresIn);
  }

  // Clear all tokens (for logout)
  clearTokens() {
    tokenStorage.clearTokens();
  }

  // Full logout with optional server-side token revocation
  async logout(revokeOnServer = true) {
    try {
      if (revokeOnServer && !DEV_MODE) {
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken) {
          try {
            // Attempt to revoke refresh token on server
            await fetch(`${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: KEYCLOAK_CLIENT_ID,
                client_secret: KEYCLOAK_CLIENT_SECRET,
                refresh_token: refreshToken,
              }),
            });
            console.log('Tokens revoked on server');
          } catch (error) {
            console.warn('Failed to revoke tokens on server:', error);
            // Continue with client-side cleanup even if server revocation fails
          }
        }
      }

      // Clear tokens locally
      tokenStorage.clearTokens();
      
      // Clear any pending refresh promises
      this.refreshPromise = null;
      
      // Trigger logout event
      const event = new CustomEvent('userLoggedOut', { 
        detail: { timestamp: Date.now(), revokedOnServer: revokeOnServer } 
      });
      window.dispatchEvent(event);
      
      console.log('Logout completed');
      return { success: true };
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear tokens locally even if there was an error
      tokenStorage.clearTokens();
      this.refreshPromise = null;
      
      return { success: false, error: error.message };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    if (DEV_MODE) return true;
    return tokenStorage.hasValidTokens();
  }

  // Health check
  async checkHealth() {
    try {
      const response = await fetch(this.healthURL);
      const data = await response.json();
      return { data, success: response.ok };
    } catch (error) {
      console.warn('Health check failed:', error.message);
      return { data: { status: 'unhealthy', error: error.message }, success: false };
    }
  }

  // Notebooks API
  notebooks = {
    getAll: () => this.request('/notebooks'),
    getById: (id) => this.request(`/notebooks/${id}`),
    create: (data) => this.request('/notebooks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => this.request(`/notebooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => this.request(`/notebooks/${id}`, {
      method: 'DELETE',
    }),
    
    // Team sharing operations
    shareWithTeam: (notebookId, data) => this.request(`/notebooks/${notebookId}/teams`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    unshareFromTeam: (notebookId, teamId) => this.request(`/notebooks/${notebookId}/teams/${teamId}`, {
      method: 'DELETE',
    }),
    getTeams: (notebookId) => this.request(`/notebooks/${notebookId}/teams`),
    updateTeamPermission: (notebookId, teamId, data) => this.request(`/notebooks/${notebookId}/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  };

  // Users API
  users = {
    getCurrentUser: () => this.request('/users/me'),
    updateCurrentUser: (data) => this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    getUserStats: () => this.request('/users/me/stats'),
  };

  // Documents API
  documents = {
    getAll: () => this.request('/documents'),
    getById: (id) => this.request(`/documents/${id}`),
    search: (query) => this.request(`/documents/search?q=${encodeURIComponent(query)}`),
    upload: (formData) => this.request('/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    }),
    getByNotebook: (notebookId) => this.request(`/notebooks/${notebookId}/documents`),
  };

  // Teams API
  teams = {
    getAll: () => this.request('/teams'),
    get: (id) => this.request(`/teams/${id}`),
    create: (data) => this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => this.request(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => this.request(`/teams/${id}`, {
      method: 'DELETE',
    }),
    
    // Team member operations
    getMembers: (teamId) => this.request(`/teams/${teamId}/members`),
    inviteMember: (teamId, data) => this.request(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateMemberRole: (teamId, userId, data) => this.request(`/teams/${teamId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    removeMember: (teamId, userId) => this.request(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    }),
    
    // Team invitations
    getInvitations: (teamId) => this.request(`/teams/${teamId}/invitations`),
    acceptInvitation: (invitationId) => this.request(`/invitations/${invitationId}/accept`, {
      method: 'POST',
    }),
    declineInvitation: (invitationId) => this.request(`/invitations/${invitationId}/decline`, {
      method: 'POST',
    }),
  };

  // Organizations API
  organizations = {
    getAll: () => this.request('/organizations'),
    get: (id) => this.request(`/organizations/${id}`),
    create: (data) => this.request('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => this.request(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => this.request(`/organizations/${id}`, {
      method: 'DELETE',
    }),
    
    // Organization member operations
    getMembers: (orgId) => this.request(`/organizations/${orgId}/members`),
    inviteMember: (orgId, data) => this.request(`/organizations/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateMemberRole: (orgId, userId, data) => this.request(`/organizations/${orgId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    removeMember: (orgId, userId) => this.request(`/organizations/${orgId}/members/${userId}`, {
      method: 'DELETE',
    }),
    
    // Organization settings
    getSettings: (orgId) => this.request(`/organizations/${orgId}/settings`),
    updateSettings: (orgId, data) => this.request(`/organizations/${orgId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
    // Organization billing
    getBilling: (orgId) => this.request(`/organizations/${orgId}/billing`),
    updateBilling: (orgId, data) => this.request(`/organizations/${orgId}/billing`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
    // Organization invitations
    getInvitations: (orgId) => this.request(`/organizations/${orgId}/invitations`),
    acceptInvitation: (invitationId) => this.request(`/organization-invitations/${invitationId}/accept`, {
      method: 'POST',
    }),
    declineInvitation: (invitationId) => this.request(`/organization-invitations/${invitationId}/decline`, {
      method: 'POST',
    }),
  };
}

// Create singleton instance
export const aetherApi = new AetherApiService();

// Export for backward compatibility
export { aetherApi as api };