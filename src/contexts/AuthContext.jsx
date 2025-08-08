import React, { createContext, useContext, useState, useEffect } from 'react';
import { aetherApi } from '../services/aetherApi.js';
import { tokenStorage } from '../services/tokenStorage.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
    
    // Listen for authentication events
    const handleAuthError = (event) => {
      console.log('Authentication error detected:', event.detail);
      setAuthError(event.detail.reason);
      setIsAuthenticated(false);
      setUser(null);
      setIsRefreshing(false);
    };
    
    const handleTokenRefreshed = () => {
      console.log('Token refreshed successfully');
      setIsRefreshing(false);
      setAuthError(null);
    };
    
    const handleUserLoggedOut = () => {
      console.log('User logged out');
      setIsAuthenticated(false);
      setUser(null);
      setIsRefreshing(false);
      setAuthError(null);
    };
    
    window.addEventListener('authenticationError', handleAuthError);
    window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    window.addEventListener('userLoggedOut', handleUserLoggedOut);
    
    return () => {
      window.removeEventListener('authenticationError', handleAuthError);
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const authenticated = aetherApi.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Try to get current user info
        try {
          const response = await aetherApi.users.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          console.warn('Failed to fetch user info:', error);
          // Don't set authenticated to false here, as the token might still be valid
          // The error could be due to network issues or server problems
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with tokens (after successful Keycloak authentication)
  const login = async (accessToken, refreshToken, expiresIn, refreshExpiresIn) => {
    try {
      setIsLoading(true);
      
      // Store tokens
      aetherApi.setTokens(accessToken, refreshToken, expiresIn, refreshExpiresIn);
      
      // Fetch user info
      const response = await aetherApi.users.getCurrentUser();
      setUser(response.data);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      aetherApi.clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async (revokeOnServer = true) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      // Use the enhanced logout from aetherApi
      const result = await aetherApi.logout(revokeOnServer);
      
      // Reset auth state (this will also be handled by the event listener)
      setIsAuthenticated(false);
      setUser(null);
      setIsRefreshing(false);
      
      return result;
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthError('logout_failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user info
  const refreshUser = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await aetherApi.users.getCurrentUser();
      setUser(response.data);
      return { success: true, user: response.data };
    } catch (error) {
      console.error('Failed to refresh user info:', error);
      return { success: false, error: error.message };
    }
  };

  // Get token expiration info
  const getTokenInfo = () => {
    if (!isAuthenticated) return null;
    
    return {
      timeRemaining: tokenStorage.getAccessTokenTimeRemaining(),
      isExpired: tokenStorage.isAccessTokenExpired(),
      isRefreshExpired: tokenStorage.isRefreshTokenExpired(),
    };
  };

  // Clear auth error
  const clearAuthError = () => {
    setAuthError(null);
  };

  // Manual token refresh (for testing/debugging)
  const manualRefresh = async () => {
    try {
      setIsRefreshing(true);
      setAuthError(null);
      await aetherApi.refreshToken();
      return { success: true };
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setAuthError('manual_refresh_failed');
      return { success: false, error: error.message };
    } finally {
      setIsRefreshing(false);
    }
  };

  const value = {
    // State
    isAuthenticated,
    isLoading,
    isRefreshing,
    user,
    authError,
    
    // Actions
    login,
    logout,
    refreshUser,
    checkAuthStatus,
    getTokenInfo,
    clearAuthError,
    manualRefresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};