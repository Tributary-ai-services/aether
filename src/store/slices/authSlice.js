import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tokenStorage } from '../../services/tokenStorage.js';

// Async thunks for auth operations
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || window.location.origin;
      const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'aether';
      const response = await fetch(`${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: 'admin-cli',
          username,
          password,
          grant_type: 'password'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error_description || 'Login failed');
      }

      const tokenData = await response.json();
      
      // Store tokens in localStorage for persistence
      localStorage.setItem('access_token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);
      
      // Parse user info from token (basic implementation)
      const tokenPayload = JSON.parse(atob(tokenData.access_token.split('.')[1]));
      
      return {
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        user: {
          id: tokenPayload.sub,
          username: tokenPayload.preferred_username,
          name: tokenPayload.name,
          email: tokenPayload.email
        }
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const refreshTokenValue = auth.refreshToken || localStorage.getItem('refresh_token');
      
      if (!refreshTokenValue) {
        return rejectWithValue('No refresh token available');
      }

      const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || window.location.origin;
      const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'aether';
      const response = await fetch(`${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: 'admin-cli',
          grant_type: 'refresh_token',
          refresh_token: refreshTokenValue
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error_description || 'Token refresh failed');
      }

      const tokenData = await response.json();
      
      // Update stored tokens
      localStorage.setItem('access_token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);
      
      return {
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Clear tokens from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Could also call Keycloak logout endpoint here if needed
      
      return null;
    } catch (error) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      // Use tokenStorage which uses the correct keys (aether_access_token, aether_refresh_token)
      const token = tokenStorage.getAccessToken();
      const refreshTokenValue = tokenStorage.getRefreshToken();

      if (!token) {
        return null;
      }

      // Check if token is expired using tokenStorage
      if (tokenStorage.isAccessTokenExpired()) {
        // Token expired, try to refresh
        if (refreshTokenValue && !tokenStorage.isRefreshTokenExpired()) {
          // This will trigger a refresh
          throw new Error('Token expired, needs refresh');
        } else {
          // No valid refresh token, clear everything
          tokenStorage.clearTokens();
          return null;
        }
      }

      // Parse user info from token
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));

      return {
        token,
        refreshToken: refreshTokenValue,
        user: {
          id: tokenPayload.sub,
          username: tokenPayload.preferred_username,
          name: tokenPayload.name,
          email: tokenPayload.email
        }
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  initialized: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize auth
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.initialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.initialized = true;
        state.isAuthenticated = false;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  }
});

export const { clearError, setToken } = authSlice.actions;
export default authSlice.reducer;