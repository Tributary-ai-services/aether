// Aether Backend API Service
import { tokenStorage } from './tokenStorage.js';

const API_BASE = import.meta.env.VITE_AETHER_API_BASE || window.location.origin;
const API_URL = import.meta.env.VITE_AETHER_API_URL || `${window.location.origin}/api/v1`;
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

// Keycloak configuration
// Use relative URL to work with nginx proxy in production
const KEYCLOAK_BASE_URL = import.meta.env.VITE_KEYCLOAK_URL || 'https://keycloak.tas.scharber.com';
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'aether';
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'aether-frontend';
// aether-frontend is a public client, doesn't need client secret


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
    
    // Get space context headers
    const spaceHeaders = this.getSpaceHeaders();
    
    // Build headers - handle FormData special case
    const headers = {
      'Authorization': await this.getAuthHeader(),
      ...spaceHeaders,
    };
    
    // Only set Content-Type if not FormData (browser needs to set boundary)
    if (!options.body || !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Merge with any provided headers
    Object.assign(headers, options.headers);
    
    // Remove any null/undefined headers
    Object.keys(headers).forEach(key => {
      if (headers[key] === null || headers[key] === undefined) {
        delete headers[key];
      }
    });
    
    const config = {
      ...options,
      headers,
    };

    try {
      const response = await this.makeRequest(url, config);
      
      // If we get 401, try to refresh token and retry once
      if (response.status === 401) {
        console.log('Received 401, attempting token refresh...');
        
        try {
          await this.refreshToken();
          
          // Update auth header and retry
          config.headers['Authorization'] = await this.getAuthHeader();
          const retryResponse = await this.makeRequest(url, config);
          
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text();
            
            // If retry also fails with 401, it's a definitive auth failure
            if (retryResponse.status === 401) {
              console.log('Retry also failed with 401, triggering auth error');
              this.triggerAuthenticationError('auth_failed_after_retry');
            }
            
            const error = new Error(`HTTP ${retryResponse.status}: ${errorText || retryResponse.statusText}`);
            error.response = { status: retryResponse.status };
            throw error;
          }
        } catch (refreshError) {
          console.log('Token refresh failed:', refreshError.message);
          // Re-throw the original 401 error with response info
          const error = new Error(`HTTP ${response.status}: Authentication failed`);
          error.response = { status: response.status };
          throw error;
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

        // Handle 403 Forbidden - check if it's a security block or permission error
        if (response.status === 403) {
          let errorMessage = 'You do not have permission for this action';
          let errorCode = 'FORBIDDEN';
          let errorDetails = null;

          try {
            const errorData = JSON.parse(errorText);
            errorCode = errorData.code || 'FORBIDDEN';
            errorMessage = errorData.message || errorMessage;
            errorDetails = errorData.details || null;
          } catch (e) {
            // Use text as-is if not JSON
            if (errorText) {
              errorMessage = errorText;
            }
          }

          // Check if this is a security block (distinct from permission denied)
          if (errorCode === 'SECURITY_BLOCKED') {
            this.triggerSecurityBlockedError({
              message: errorMessage,
              threatTypes: errorDetails?.threat_types || [],
              severity: errorDetails?.severity || 'unknown',
              action: config.method || 'GET',
              resource: endpoint
            });
          } else {
            // Regular permission error
            this.triggerPermissionError({
              message: errorMessage,
              action: config.method || 'GET',
              resource: endpoint
            });
          }

          const error = new Error(errorMessage);
          error.response = { status: 403, code: errorCode, data: { error: errorMessage, details: errorDetails } };
          throw error;
        }

        // Handle 400 "Space context required" - reload spaces and retry
        if (response.status === 400) {
          let errorData = {};
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            // Not JSON, use text
          }

          const isSpaceContextError = errorText.toLowerCase().includes('space context required') ||
                                       errorData?.error?.toLowerCase()?.includes('space context required');

          if (isSpaceContextError && !options._spaceRetried) {
            console.log('Space context lost, attempting to reload spaces and retry...');

            try {
              // Fetch available spaces (this endpoint doesn't require space context)
              const spacesResponse = await this.makeRequest(`${this.baseURL}/users/me/spaces`, {
                headers: {
                  'Authorization': await this.getAuthHeader(),
                  'Content-Type': 'application/json',
                }
              });

              if (spacesResponse.ok) {
                const spacesData = await spacesResponse.json();
                const spaces = spacesData?.spaces || spacesData || [];

                // Find personal space or use first available
                const personalSpace = spaces.find(s => s.space_type === 'personal') || spaces[0];

                if (personalSpace) {
                  // Save to localStorage
                  localStorage.setItem('currentSpace', JSON.stringify({
                    space_type: personalSpace.space_type,
                    space_id: personalSpace.space_id || personalSpace.id,
                  }));

                  console.log('Space context restored:', personalSpace.space_type, personalSpace.space_id || personalSpace.id);

                  // Dispatch event to notify Redux/hooks to sync
                  window.dispatchEvent(new CustomEvent('spaceContextRestored', {
                    detail: personalSpace
                  }));

                  // Retry the original request with new space headers
                  const retryOptions = { ...options, _spaceRetried: true };
                  return this.request(endpoint, retryOptions);
                }
              }
            } catch (spaceError) {
              console.error('Failed to reload spaces:', spaceError);
            }
          }
        }

        const error = new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        error.response = { status: response.status };
        throw error;
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

  // Trigger permission denied error event for the UI to handle (403)
  triggerPermissionError(details = {}) {
    const event = new CustomEvent('permissionError', {
      detail: {
        message: details.message || 'You do not have permission for this action',
        action: details.action || null,
        resource: details.resource || null,
        status: 403,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }

  // Trigger security blocked error event for the UI to handle (403 with SECURITY_BLOCKED code)
  triggerSecurityBlockedError(details = {}) {
    const event = new CustomEvent('securityBlocked', {
      detail: {
        message: details.message || 'Your input contains potentially unsafe content',
        threatTypes: details.threatTypes || [],
        severity: details.severity || 'unknown',
        action: details.action || null,
        resource: details.resource || null,
        status: 403,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }


  // Get authorization header for requests
  async getAuthHeader() {
    const token = tokenStorage.getAccessToken();
    return token ? `Bearer ${token}` : '';
  }

  // Get space context headers for requests
  getSpaceHeaders() {
    // Try to get current space from localStorage first (for immediate use)
    const savedSpace = localStorage.getItem('currentSpace');
    if (savedSpace) {
      try {
        const currentSpace = JSON.parse(savedSpace);
        if (currentSpace && currentSpace.space_type && currentSpace.space_id) {
          // Validate space_type to prevent sending invalid headers
          if (currentSpace.space_type !== 'personal' && currentSpace.space_type !== 'organization') {
            console.error('Invalid space_type in localStorage:', currentSpace.space_type, 'Expected: personal or organization');
            console.warn('Removing corrupted space context from localStorage:', currentSpace);
            localStorage.removeItem('currentSpace');
            return {};
          }
          
          console.log('Using space headers:', {
            'X-Space-Type': currentSpace.space_type,
            'X-Space-ID': currentSpace.space_id
          });
          
          return {
            'X-Space-Type': currentSpace.space_type,
            'X-Space-ID': currentSpace.space_id
          };
        }
      } catch (error) {
        console.warn('Failed to parse saved space for headers:', error);
      }
    }

    // If localStorage fails, try to get from Redux store (if available)
    if (typeof window !== 'undefined' && window.__REDUX_STORE__) {
      const state = window.__REDUX_STORE__.getState();
      const currentSpace = state?.spaces?.currentSpace;
      
      if (currentSpace && currentSpace.space_type && currentSpace.space_id) {
        // Validate space_type from Redux store as well
        if (currentSpace.space_type !== 'personal' && currentSpace.space_type !== 'organization') {
          console.error('Invalid space_type in Redux store:', currentSpace.space_type, 'Expected: personal or organization');
          return {};
        }
        
        console.log('Using space headers from Redux store:', {
          'X-Space-Type': currentSpace.space_type,
          'X-Space-ID': currentSpace.space_id
        });
        
        return {
          'X-Space-Type': currentSpace.space_type,
          'X-Space-ID': currentSpace.space_id
        };
      }
    }

    // Return empty headers if no space context available
    return {};
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
      
      // Implement token rotation - store new refresh token if provided
      const oldRefreshToken = tokenStorage.getRefreshToken();
      let rotatedRefreshToken = false;
      if (tokenData.refresh_token) {
        tokenStorage.setRefreshToken(tokenData.refresh_token, tokenData.refresh_expires_in || 1800);
        rotatedRefreshToken = oldRefreshToken !== tokenData.refresh_token;
      }
      
      console.log('Token refreshed successfully', {
        hasIdToken: !!tokenData.id_token,
        hasAccessToken: !!tokenData.access_token,
        usingIdToken: tokenToUse === tokenData.id_token,
        refreshTokenRotated: rotatedRefreshToken
      });
      
      // Trigger success event
      const event = new CustomEvent('tokenRefreshed', { 
        detail: { timestamp: Date.now() } 
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Clear all tokens on refresh failure to prevent reuse of potentially compromised tokens
      tokenStorage.clearTokens();
      this.stopTokenRotation();
      
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
    
    // Start automatic token rotation
    this.setupTokenRotation();
  }

  // Clear all tokens (for logout)
  clearTokens() {
    tokenStorage.clearTokens();
    this.stopTokenRotation();
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
      
      // Stop automatic token rotation
      this.stopTokenRotation();
      
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
      this.stopTokenRotation();
      this.refreshPromise = null;
      
      return { success: false, error: error.message };
    }
  }

  // Setup automatic token rotation
  setupTokenRotation() {
    // Clear any existing interval
    this.stopTokenRotation();
    
    // Set up interval to check token expiry every minute
    this.rotationInterval = setInterval(() => {
      this.checkAndRotateToken();
    }, 60000); // Check every minute
    
    console.log('🔄 Automatic token rotation setup');
  }
  
  // Stop automatic token rotation
  stopTokenRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
      console.log('⏹️ Automatic token rotation stopped');
    }
  }
  
  // Check and rotate token if needed
  async checkAndRotateToken() {
    try {
      // Don't rotate if we're not authenticated
      if (!this.isAuthenticated()) {
        return;
      }
      
      // Check if token will expire in the next 5 minutes (proactive rotation)
      if (tokenStorage.isAccessTokenExpired(5)) {
        console.log('🔄 Token will expire soon, starting proactive rotation...');
        
        // Check if refresh token is still valid
        if (tokenStorage.isRefreshTokenExpired()) {
          console.log('⚠️ Refresh token expired, forcing logout');
          this.triggerAuthenticationError('refresh_token_expired');
          return;
        }
        
        // Perform token refresh
        await this.refreshToken();
        console.log('✅ Proactive token rotation completed');
      }
    } catch (error) {
      console.error('❌ Token rotation failed:', error);
      // Don't trigger logout on rotation failure - wait for actual API failures
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    // Even in DEV_MODE, we should check if we have valid tokens
    // DEV_MODE just allows us to get tokens automatically, but we still need them
    const hasTokens = tokenStorage.hasValidTokens();
    
    if (DEV_MODE && !hasTokens) {
      // In dev mode, if we don't have tokens, we'll try to get them when needed
      // but we shouldn't claim to be authenticated until we actually have them
      console.log('DEV_MODE: No valid tokens found, will attempt to get them when needed');
      return false;
    }
    
    return hasTokens;
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
    getAll: (options = {}) => {
      const params = new URLSearchParams({
        limit: options.limit || 20,
        offset: options.offset || 0
      }).toString();
      return this.request(`/notebooks?${params}`);
    },
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
    getSpaces: () => this.request('/users/me/spaces'),
    getOnboardingStatus: () => this.request('/users/me/onboarding'),
  };

  // Spaces API
  spaces = {
    getAll: () => this.request('/spaces'),
    get: (id) => this.request(`/spaces/${id}`),
    create: (data) => this.request('/spaces', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => this.request(`/spaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => this.request(`/spaces/${id}`, {
      method: 'DELETE',
    }),
  };

  // Documents API
  documents = {
    getAll: () => this.request('/documents'),
    getById: (id) => this.request(`/documents/${id}`),
    search: (query) => this.request(`/documents/search?q=${encodeURIComponent(query)}`),
    upload: (formData) => this.request('/documents/upload', {
      method: 'POST',
      body: formData,
    }),
    uploadBase64: (data) => this.request('/documents/upload-base64', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getByNotebook: (notebookId) => this.request(`/notebooks/${notebookId}/documents`),
    create: (data) => this.request('/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    delete: (id) => this.request(`/documents/${id}`, { method: 'DELETE' }),
    // ML Analysis - fetches analysis summary from AudiModal via aether-be proxy
    getAnalysis: (id) => this.request(`/documents/${id}/analysis`),
    // Extracted text - fetches text content from AudiModal chunks
    getExtractedText: (id) => this.request(`/documents/${id}/text`),
  };

  // Download method with proper context
  async downloadDocument(id) {
    // Ensure we have valid token
    await this.ensureValidToken();
    
    // Build headers using existing methods
    const headers = {
      'Authorization': await this.getAuthHeader(),
      ...this.getSpaceHeaders(),
    };
    
    const response = await fetch(`${this.baseURL}/documents/${id}/download`, {
      method: 'GET',
      headers: headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download document: ${response.status} - ${errorText}`);
    }
    
    return response.blob();
  }

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

  // Teams API
  teams = {
    getAll: (organizationId) => {
      const params = organizationId ? `?organization_id=${organizationId}` : '';
      return this.request(`/teams${params}`);
    },
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

    // Team settings
    getSettings: (teamId) => this.request(`/teams/${teamId}/settings`),
    updateSettings: (teamId, data) => this.request(`/teams/${teamId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

    // Team invitations
    getInvitations: (teamId) => this.request(`/teams/${teamId}/invitations`),
    acceptInvitation: (invitationId) => this.request(`/team-invitations/${invitationId}/accept`, {
      method: 'POST',
    }),
    declineInvitation: (invitationId) => this.request(`/team-invitations/${invitationId}/decline`, {
      method: 'POST',
    }),
  };

  // Vector Search API - RAG-only lookup for testing vector store
  vectorSearch = {
    /**
     * Perform text-based vector search on a notebook's indexed documents
     * @param {string} notebookId - The notebook ID to search within
     * @param {string} queryText - The search query text
     * @param {object} options - Search options (top_k, min_score, deduplicate, rerank, etc.)
     * @returns {Promise} Search results with scores, distances, and content
     */
    textSearch: (notebookId, queryText, options = {}) => this.request(`/notebooks/${notebookId}/vector-search/text`, {
      method: 'POST',
      body: JSON.stringify({
        query_text: queryText,
        options: {
          top_k: options.topK || 10,
          min_score: options.minScore || 0.0,
          threshold: options.threshold || null,
          max_distance: options.maxDistance || null,
          deduplicate: options.deduplicate || false,
          group_by_document: options.groupByDocument || false,
          rerank: options.rerank || false,
          include_content: options.includeContent !== false,
          include_metadata: options.includeMetadata !== false,
          filters: options.filters || null,
        },
      }),
    }),

    /**
     * Perform hybrid search combining vector and text search
     * @param {string} notebookId - The notebook ID to search within
     * @param {string} queryText - The search query text
     * @param {object} options - Search options including vector_weight and text_weight
     * @returns {Promise} Search results with scores, distances, and content
     */
    hybridSearch: (notebookId, queryText, options = {}) => this.request(`/notebooks/${notebookId}/vector-search/hybrid`, {
      method: 'POST',
      body: JSON.stringify({
        query_text: queryText,
        options: {
          top_k: options.topK || 10,
          min_score: options.minScore || 0.0,
          threshold: options.threshold || null,
          max_distance: options.maxDistance || null,
          deduplicate: options.deduplicate || false,
          group_by_document: options.groupByDocument || false,
          rerank: options.rerank || false,
          include_content: options.includeContent !== false,
          include_metadata: options.includeMetadata !== false,
          filters: options.filters || null,
        },
        vector_weight: options.vectorWeight || 0.5,
        text_weight: options.textWeight || 0.5,
        fusion_method: options.fusionMethod || 'weighted_sum',
      }),
    }),

    /**
     * Get vector store info for a notebook (document count, vector count, etc.)
     * @param {string} notebookId - The notebook ID
     * @returns {Promise} Vector store information
     */
    getInfo: (notebookId) => this.request(`/notebooks/${notebookId}/vector-search/info`),
  };

// Compliance API - DLP violations from AudiModal
  compliance = {
    /**
     * Get paginated list of DLP violations
     * @param {object} params - Filter and pagination parameters
     * @param {string} params.severity - Filter by severity (critical, high, medium, low)
     * @param {string} params.status - Filter by status (detected, resolved, acknowledged)
     * @param {boolean} params.acknowledged - Filter by acknowledged status
     * @param {string} params.complianceType - Filter by compliance type (pii, hipaa, pci-dss, gdpr)
     * @param {string} params.from - Time range start (ISO 8601 or relative like 'now-24h')
     * @param {string} params.to - Time range end (ISO 8601 or 'now')
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.pageSize - Page size (default: 20, max: 100)
     * @returns {Promise} Paginated list of violations
     */
    getViolations: (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.severity) searchParams.append('severity', params.severity);
      if (params.status) searchParams.append('status', params.status);
      if (params.acknowledged !== undefined) searchParams.append('acknowledged', params.acknowledged);
      if (params.complianceType) searchParams.append('compliance_type', params.complianceType);
      if (params.from) searchParams.append('from', params.from);
      if (params.to) searchParams.append('to', params.to);
      if (params.page) searchParams.append('page', params.page);
      if (params.pageSize) searchParams.append('page_size', params.pageSize);
      const queryString = searchParams.toString();
      return this.request(`/compliance/violations${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get a specific DLP violation by ID
     * @param {string} id - Violation ID
     * @returns {Promise} Violation details
     */
    getViolation: (id) => this.request(`/compliance/violations/${id}`),

    /**
     * Get compliance summary statistics
     * @returns {Promise} Summary with total violations, score, counts by severity/type
     */
    getSummary: () => this.request('/compliance/summary'),

    /**
     * Acknowledge a DLP violation
     * @param {string} id - Violation ID to acknowledge
     * @returns {Promise} Updated violation
     */
    acknowledgeViolation: (id) => this.request(`/compliance/violations/${id}/acknowledge`, {
      method: 'POST',
    }),

    /**
     * Bulk acknowledge multiple DLP violations
     * @param {string[]} violationIds - Array of violation IDs to acknowledge
     * @returns {Promise} Results of bulk acknowledge operation
     */
    bulkAcknowledge: (violationIds) => this.request('/compliance/violations/acknowledge-bulk', {
      method: 'POST',
      body: JSON.stringify({ violation_ids: violationIds }),
    }),
  };

  // ============================================================================
  // Data Sources API
  // ============================================================================
  dataSources = {
    /**
     * Get all data sources for the current space
     * @param {Object} options - Pagination and filter options
     * @returns {Promise} List of data sources
     */
    getAll: (options = {}) => {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.type) params.append('type', options.type);
      const queryString = params.toString();
      return this.request(`/data-sources${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get a single data source by ID
     * @param {string} id - Data source ID
     * @returns {Promise} Data source details
     */
    get: (id) => this.request(`/data-sources/${id}`),

    /**
     * Create a new data source
     * @param {Object} data - Data source configuration
     * @returns {Promise} Created data source
     */
    create: (data) => this.request('/data-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    /**
     * Update an existing data source
     * @param {string} id - Data source ID
     * @param {Object} updates - Fields to update
     * @returns {Promise} Updated data source
     */
    update: (id, updates) => this.request(`/data-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

    /**
     * Delete a data source
     * @param {string} id - Data source ID
     * @returns {Promise} Deletion result
     */
    delete: (id) => this.request(`/data-sources/${id}`, {
      method: 'DELETE',
    }),

    /**
     * Test a data source connection
     * @param {string} id - Data source ID
     * @returns {Promise} Connection test result
     */
    testConnection: (id) => this.request(`/data-sources/${id}/test`, {
      method: 'POST',
    }),

    /**
     * Trigger a sync for a data source
     * @param {string} id - Data source ID
     * @param {Object} options - Sync options (full, incremental, etc.)
     * @returns {Promise} Sync job info
     */
    triggerSync: (id, options = {}) => this.request(`/data-sources/${id}/sync`, {
      method: 'POST',
      body: JSON.stringify(options),
    }),

    /**
     * Get sync status for a data source
     * @param {string} id - Data source ID
     * @returns {Promise} Sync status
     */
    getSyncStatus: (id) => this.request(`/data-sources/${id}/sync/status`),

    /**
     * List files/items in a data source (for browsing)
     * @param {string} id - Data source ID
     * @param {string} path - Path within the data source
     * @returns {Promise} List of files/items
     */
    listFiles: (id, path = '/') => this.request(`/data-sources/${id}/files?path=${encodeURIComponent(path)}`),

    /**
     * Probe a URL to detect AI-friendly content
     * @param {string} url - URL to probe
     * @returns {Promise} Probe results (llms.txt, ai.txt, robots.txt, paywall detection)
     */
    probeUrl: (url) => this.request('/data-sources/probe-url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

    /**
     * Scrape a URL using the recommended or specified scraper
     * @param {string} url - URL to scrape
     * @param {string} scraperType - Scraper type (crawl4ai, direct_fetch, archive_org, etc.)
     * @param {Object} options - Scraping options
     * @returns {Promise} Scraped content
     */
    scrapeUrl: (url, scraperType, options = {}) => this.request('/data-sources/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url, scraper_type: scraperType, options }),
    }),
  };

  // ============================================================================
  // Database Connections API
  // ============================================================================
  databases = {
    /**
     * Get all database connections
     * @returns {Promise} List of database connections
     */
    getAll: () => this.request('/databases'),

    /**
     * Get a single database connection
     * @param {string} id - Connection ID
     * @returns {Promise} Connection details
     */
    get: (id) => this.request(`/databases/${id}`),

    /**
     * Create a new database connection
     * @param {Object} data - Connection configuration
     * @returns {Promise} Created connection
     */
    create: (data) => this.request('/databases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    /**
     * Update an existing database connection
     * @param {string} id - Connection ID
     * @param {Object} updates - Fields to update
     * @returns {Promise} Updated connection
     */
    update: (id, updates) => this.request(`/databases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

    /**
     * Delete a database connection
     * @param {string} id - Connection ID
     * @returns {Promise} Deletion result
     */
    delete: (id) => this.request(`/databases/${id}`, {
      method: 'DELETE',
    }),

    /**
     * Test an existing database connection
     * @param {string} id - Connection ID
     * @returns {Promise} Connection test result
     */
    testConnection: (id) => this.request(`/databases/${id}/test`, {
      method: 'POST',
    }),

    /**
     * Test a new database connection without saving
     * @param {Object} connectionParams - Connection parameters to test
     * @returns {Promise} Connection test result
     */
    testNewConnection: (connectionParams) => this.request('/databases/test', {
      method: 'POST',
      body: JSON.stringify(connectionParams),
    }),

    /**
     * Get database schema (tables, views, etc.)
     * @param {string} id - Connection ID
     * @param {string} type - Schema type: 'database', 'schema', or 'table'
     * @returns {Promise} Schema information
     */
    getSchema: (id, type = 'table') => this.request(`/databases/${id}/schema?type=${type}`),

    /**
     * Get list of tables in a database
     * @param {string} id - Connection ID
     * @returns {Promise} List of tables with basic info
     */
    getTables: (id) => this.request(`/databases/${id}/tables`),

    /**
     * Get column information for a specific table
     * @param {string} id - Connection ID
     * @param {string} tableName - Table name
     * @param {string} schema - Schema name (optional, defaults to 'public')
     * @returns {Promise} Table columns with types, nullable, primary key info
     */
    getTableColumns: (id, tableName, schema) => {
      const params = schema ? `?schema=${encodeURIComponent(schema)}` : '';
      return this.request(`/databases/${id}/tables/${encodeURIComponent(tableName)}/columns${params}`);
    },

    /**
     * Execute a query on a database connection
     * @param {string} id - Connection ID
     * @param {string} query - SQL/query to execute
     * @param {Object} params - Query parameters
     * @returns {Promise} Query results
     */
    query: (id, query, params = {}) => this.request(`/databases/${id}/query`, {
      method: 'POST',
      body: JSON.stringify({ query, params }),
    }),
  };

  // ============================================================================
  // Credentials API
  // ============================================================================
  credentials = {
    /**
     * List all credentials (metadata only, no secrets)
     * @returns {Promise} List of credentials
     */
    list: () => this.request('/credentials'),

    /**
     * Create a new credential
     * @param {Object} data - Credential data (secrets encrypted server-side)
     * @returns {Promise} Created credential metadata
     */
    create: (data) => this.request('/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    /**
     * Delete a credential
     * @param {string} id - Credential ID
     * @returns {Promise} Deletion result
     */
    delete: (id) => this.request(`/credentials/${id}`, {
      method: 'DELETE',
    }),

    /**
     * Test a credential
     * @param {string} id - Credential ID
     * @returns {Promise} Test result
     */
    test: (id) => this.request(`/credentials/${id}/test`, {
      method: 'POST',
    }),
  };

  // ============================================================================
  // Compliance API - DLP Violations from AudiModal
  // ============================================================================
  compliance = {
    /**
     * Get paginated list of DLP violations
     * @param {Object} params - Query parameters
     * @param {string} params.severity - Filter by severity (critical, high, medium, low)
     * @param {string} params.status - Filter by status (detected, resolved, acknowledged)
     * @param {boolean} params.acknowledged - Filter by acknowledged status
     * @param {string} params.compliance_type - Filter by compliance type (pii, hipaa, pci-dss, gdpr)
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.page_size - Page size (default: 20, max: 100)
     * @returns {Promise} Paginated list of violations
     */
    getViolations: (params = {}) => {
      const queryParams = new URLSearchParams();
      if (params.severity) queryParams.append('severity', params.severity);
      if (params.status) queryParams.append('status', params.status);
      if (params.acknowledged !== undefined) queryParams.append('acknowledged', params.acknowledged);
      if (params.compliance_type) queryParams.append('compliance_type', params.compliance_type);
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);
      const queryString = queryParams.toString();
      return this.request(`/compliance/violations${queryString ? '?' + queryString : ''}`);
    },

    /**
     * Get a specific DLP violation by ID
     * @param {string} id - Violation ID
     * @returns {Promise} Violation details
     */
    getViolation: (id) => this.request(`/compliance/violations/${id}`),

    /**
     * Get compliance summary statistics
     * @returns {Promise} Compliance summary with violation counts and score
     */
    getSummary: () => this.request('/compliance/summary'),

    /**
     * Acknowledge a DLP violation
     * @param {string} id - Violation ID
     * @returns {Promise} Acknowledged violation
     */
    acknowledgeViolation: (id) => this.request(`/compliance/violations/${id}/acknowledge`, {
      method: 'POST',
    }),

    /**
     * Bulk acknowledge multiple DLP violations
     * @param {string[]} violationIds - Array of violation IDs to acknowledge
     * @returns {Promise} Bulk acknowledge result
     */
    bulkAcknowledge: (violationIds) => this.request('/compliance/violations/acknowledge-bulk', {
      method: 'POST',
      body: JSON.stringify({ violation_ids: violationIds }),
    }),
  };

  // ============================================================================
  // OAuth API
  // ============================================================================
  oauth = {
    /**
     * Initiate OAuth flow for a provider
     * @param {string} provider - OAuth provider (google, microsoft, dropbox, etc.)
     * @returns {Promise} OAuth authorization URL and state
     */
    initiateFlow: (provider) => this.request(`/oauth/${provider}/authorize`, {
      method: 'POST',
    }),

    /**
     * Handle OAuth callback
     * @param {string} provider - OAuth provider
     * @param {string} code - Authorization code
     * @param {string} state - CSRF state token
     * @returns {Promise} Created credential from OAuth
     */
    callback: (provider, code, state) => this.request(`/oauth/${provider}/callback`, {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    }),
  };

  // ============================================================================
  // MCP (Model Context Protocol) API
  // ============================================================================
  mcp = {
    /**
     * List available MCP servers
     * @returns {Promise} List of MCP servers
     */
    listServers: () => this.request('/mcp/servers'),

    /**
     * List available MCP database servers
     * @returns {Promise} List of database-specific MCP servers
     */
    listDatabaseServers: () => this.request('/mcp/servers?type=database'),

    /**
     * Invoke an MCP tool
     * @param {string} serverId - MCP server ID
     * @param {string} tool - Tool name
     * @param {Object} params - Tool parameters
     * @returns {Promise} Tool result
     */
    invokeTool: (serverId, tool, params) => this.request('/mcp/invoke', {
      method: 'POST',
      body: JSON.stringify({ server_id: serverId, tool, params }),
    }),

    /**
     * Get an MCP resource
     * @param {string} uri - Resource URI
     * @returns {Promise} Resource content
     */
    getResource: (uri) => this.request(`/mcp/resources?uri=${encodeURIComponent(uri)}`),

    /**
     * List tools for a specific MCP server
     * @param {string} serverId - MCP server ID
     * @returns {Promise} List of available tools
     */
    listTools: (serverId) => this.request(`/mcp/servers/${serverId}/tools`),
  };
}

// Create singleton instance
export const aetherApi = new AetherApiService();

// Export for backward compatibility
export { aetherApi as api };