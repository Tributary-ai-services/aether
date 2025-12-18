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
          console.log('🔍 User data fetched:', response.data);
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user info:', error);
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

  // Login with email and password
  const login = async (email, password, rememberMe = false) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      console.log('Attempting login with:', { email, rememberMe });
      
      // Use Keycloak authentication
      const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || window.location.origin;
      const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'master';
      const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'aether-frontend';
      
      const response = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: CLIENT_ID,
          username: email,
          password: password,
          scope: 'openid profile email',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Keycloak authentication failed:', response.status, errorData);
        
        if (response.status === 401) {
          throw new Error('Invalid email or password');
        } else {
          throw new Error('Authentication service error');
        }
      }
      
      const tokenData = await response.json();
      console.log('Authentication successful!', {
        hasAccessToken: !!tokenData.access_token,
        hasIdToken: !!tokenData.id_token,
        hasRefreshToken: !!tokenData.refresh_token,
      });
      
      // Store tokens using ID token for authentication
      const authToken = tokenData.id_token || tokenData.access_token;
      aetherApi.setTokens(
        authToken,
        tokenData.refresh_token,
        tokenData.expires_in,
        tokenData.refresh_expires_in || 1800
      );
      
      setIsAuthenticated(true);

      // Try to fetch user info
      try {
        const userResponse = await aetherApi.users.getCurrentUser();
        console.log('User data fetched:', userResponse.data);
        setUser(userResponse.data);

        // Check onboarding status for new users
        try {
          const onboardingResponse = await aetherApi.users.getOnboardingStatus();
          console.log('Onboarding status:', onboardingResponse.data);

          // Store onboarding status with user data
          if (onboardingResponse.data && !onboardingResponse.data.is_complete) {
            console.log('User needs to complete onboarding');
            // You could set a flag here to show an onboarding modal or redirect
          }
        } catch (onboardingError) {
          console.error('Failed to check onboarding status:', onboardingError);
          // Don't fail login if onboarding check fails
        }
      } catch (userError) {
        console.error('Failed to fetch user info:', userError);
        // Don't fail login if user fetch fails - user creation might be in progress
      }

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError(error.message);
      setIsAuthenticated(false);
      setUser(null);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login with tokens (after successful Keycloak authentication)
  const loginWithTokens = async (accessToken, refreshToken, expiresIn, refreshExpiresIn) => {
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
      console.error('Token login failed:', error);
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

  // Sign up new user
  const signup = async (userData) => {
    try {
      setIsLoading(true);
      setAuthError(null);

      console.log('Attempting signup with:', userData);

      const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || window.location.origin;
      const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'master';

      // Step 1: Register user in Keycloak via backend onboarding endpoint
      // Note: Since we need authentication to call the backend, we'll use a different approach
      // For now, we'll login with credentials and then call the onboarding endpoint
      // In production, Keycloak registration should be done via Keycloak's registration page
      // or via an unauthenticated registration endpoint on the backend

      // For demonstration, try to authenticate and create user profile
      // This assumes the user was already created in Keycloak
      const result = await login(userData.email, userData.password, false);

      if (result.success) {
        // User authenticated, now call onboarding endpoint to ensure profile is complete
        try {
          const onboardingResponse = await aetherApi.users.getOnboardingStatus();
          console.log('Onboarding status:', onboardingResponse.data);

          // If onboarding is incomplete, you might want to redirect to onboarding flow
          if (!onboardingResponse.data.is_complete) {
            console.log('User needs to complete onboarding');
          }
        } catch (onboardingError) {
          console.error('Failed to check onboarding status:', onboardingError);
          // Don't fail signup if onboarding check fails
        }

        return { success: true, user: result.user };
      } else {
        // If login fails, it means the user doesn't exist in Keycloak yet
        // In production, this should redirect to Keycloak's registration page
        throw new Error('User registration requires Keycloak admin setup. Please contact administrator.');
      }
    } catch (error) {
      console.error('Signup failed:', error);
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login with social provider
  const loginWithProvider = async (provider) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      // TODO: Implement Keycloak social authentication
      console.log('Attempting social login with:', provider);
      
      // For now, redirect to Keycloak social login URL
      // In production, this would redirect to Keycloak
      const keycloakUrl = process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080';
      const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'master';
      const clientId = process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'aether-frontend';
      
      const socialLoginUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin)}/auth/callback&` +
        `response_type=code&` +
        `scope=openid%20profile%20email&` +
        `kc_idp_hint=${provider}`;
      
      // For demo purposes, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: Date.now().toString(),
        email: `user@${provider}.com`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        provider: provider,
        roles: ['user']
      };
      
      const mockTokens = {
        accessToken: `mock-${provider}-access-token`,
        refreshToken: `mock-${provider}-refresh-token`,
        expiresIn: 3600,
        refreshExpiresIn: 86400
      };
      
      aetherApi.setTokens(
        mockTokens.accessToken,
        mockTokens.refreshToken,
        mockTokens.expiresIn,
        mockTokens.refreshExpiresIn
      );
      
      setUser(mockUser);
      setIsAuthenticated(true);
      
      return { success: true, user: mockUser };
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      setAuthError(`${provider} authentication failed`);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
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
    loginWithTokens,
    signup,
    loginWithProvider,
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