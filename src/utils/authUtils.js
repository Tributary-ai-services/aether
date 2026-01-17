// Authentication Utilities
// Helper functions and utilities for the enhanced authentication system

import { aetherApi } from '../services/aetherApi.js';
import { tokenStorage } from '../services/tokenStorage.js';

// Authentication status checker
export const getAuthStatus = () => {
  const securityStatus = tokenStorage.getSecurityStatus();
  const isAuthenticated = aetherApi.isAuthenticated();
  
  return {
    isAuthenticated,
    ...securityStatus,
    recommendations: getSecurityRecommendations(securityStatus)
  };
};

// Get security recommendations based on current status
export const getSecurityRecommendations = (status) => {
  const recommendations = [];
  
  if (!status.isHttps && typeof window !== 'undefined' && window.location?.hostname !== 'localhost') {
    recommendations.push({
      type: 'warning',
      message: 'Consider using HTTPS for enhanced security',
      priority: 'high'
    });
  }
  
  if (status.storageType === 'localStorage') {
    recommendations.push({
      type: 'info',
      message: 'Using localStorage - tokens persist across browser sessions',
      priority: 'low'
    });
  }
  
  if (status.accessTokenTimeRemaining < 60 && status.accessTokenTimeRemaining > 0) {
    recommendations.push({
      type: 'info',
      message: 'Access token will expire soon',
      priority: 'medium'
    });
  }
  
  if (!status.tokenIntegrity) {
    recommendations.push({
      type: 'error',
      message: 'Token integrity check failed - tokens have been cleared',
      priority: 'high'
    });
  }
  
  return recommendations;
};

// Format time remaining for display
export const formatTimeRemaining = (seconds) => {
  if (seconds <= 0) return 'Expired';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

// Authentication event helpers
export const setupAuthEventHandlers = (callbacks = {}) => {
  const handleAuthError = (event) => {
    console.log('🚨 Authentication Error:', event.detail);
    if (callbacks.onAuthError) {
      callbacks.onAuthError(event.detail);
    }
  };
  
  const handleTokenRefreshed = (event) => {
    console.log('✅ Token Refreshed:', event.detail);
    if (callbacks.onTokenRefreshed) {
      callbacks.onTokenRefreshed(event.detail);
    }
  };
  
  const handleUserLoggedOut = (event) => {
    console.log('👋 User Logged Out:', event.detail);
    if (callbacks.onUserLoggedOut) {
      callbacks.onUserLoggedOut(event.detail);
    }
  };
  
  window.addEventListener('authenticationError', handleAuthError);
  window.addEventListener('tokenRefreshed', handleTokenRefreshed);
  window.addEventListener('userLoggedOut', handleUserLoggedOut);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('authenticationError', handleAuthError);
    window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
    window.removeEventListener('userLoggedOut', handleUserLoggedOut);
  };
};

// Debug helpers (development only)
export const debugAuth = {
  // Get current authentication state
  getState: () => {
    return {
      authStatus: getAuthStatus(),
      tokenInfo: {
        hasAccessToken: !!tokenStorage.getAccessToken(),
        hasRefreshToken: !!tokenStorage.getRefreshToken(),
        accessTokenTimeRemaining: tokenStorage.getAccessTokenTimeRemaining(),
        isAccessTokenExpired: tokenStorage.isAccessTokenExpired(),
        isRefreshTokenExpired: tokenStorage.isRefreshTokenExpired(),
      }
    };
  },
  
  // Force token refresh for testing
  forceRefresh: async () => {
    try {
      await aetherApi.refreshToken();
      console.log('✅ Force refresh completed');
      return true;
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      return false;
    }
  },
  
  // Log authentication status
  logStatus: () => {
    const status = debugAuth.getState();
    console.table(status.authStatus);
    console.table(status.tokenInfo);
  },
  
  // Test authentication flow
  testFlow: async () => {
    console.log('🧪 Testing authentication flow...');
    
    try {
      // Test health check
      const health = await aetherApi.checkHealth();
      console.log('Health check:', health.success ? '✅' : '❌');
      
      // Test authenticated request
      const user = await aetherApi.users.getCurrentUser();
      console.log('User request:', user.success ? '✅' : '❌');
      
      console.log('✅ Authentication flow test completed');
      return true;
    } catch (error) {
      console.error('❌ Authentication flow test failed:', error);
      return false;
    }
  }
};

// Attach debug helpers to window in development
if (typeof window !== 'undefined' && import.meta.env.VITE_DEV_MODE === 'true') {
  window.debugAuth = debugAuth;
  console.log('🛠️ [DEV] Authentication debug helpers available at window.debugAuth');
}

// Error message helpers
export const getErrorMessage = (errorCode) => {
  const errorMessages = {
    refresh_token_expired: 'Your session has expired. Please log in again.',
    invalid_refresh_token: 'Invalid session token. Please log in again.',
    refresh_failed: 'Failed to refresh your session. Please log in again.',
    refresh_error: 'Session refresh error. Please try logging in again.',
    logout_failed: 'Failed to log out properly. Please try again.',
    manual_refresh_failed: 'Manual session refresh failed. Please try again.',
    network_error: 'Network error occurred. Please check your connection.',
    unknown: 'An authentication error occurred. Please try again.',
  };
  
  return errorMessages[errorCode] || errorMessages.unknown;
};

// Token validation utilities
export const validateToken = (token) => {
  if (!token) return { valid: false, reason: 'Token is empty' };
  
  // Basic JWT structure validation
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Invalid JWT structure' };
  }
  
  try {
    // Decode header and payload (without verification)
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: 'Token expired', payload };
    }
    
    return { valid: true, header, payload };
  } catch (error) {
    return { valid: false, reason: 'Failed to decode token', error: error.message };
  }
};