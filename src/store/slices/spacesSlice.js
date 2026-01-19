import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// Space Types
export const SPACE_TYPES = {
  PERSONAL: 'personal',
  ORGANIZATION: 'organization'
};

// Async thunks for space operations
export const loadAvailableSpaces = createAsyncThunk(
  'spaces/loadAvailableSpaces',
  async (_, { rejectWithValue, getState }) => {
    // Don't try to load spaces if not authenticated
    if (!aetherApi.isAuthenticated()) {
      return rejectWithValue('User not authenticated');
    }

    // Check if already loading to prevent duplicate requests
    const state = getState();
    if (state.spaces.loading) {
      return rejectWithValue('Already loading');
    }

    // Limit loading attempts to prevent infinite loops
    if (state.spaces.loadingAttempts >= 3) {
      return rejectWithValue('Too many loading attempts');
    }

    try {
      const { data } = await aetherApi.request('/users/me/spaces');
      return data;
    } catch (error) {
      // Handle auth errors specially
      if (error.response?.status === 401 || error.response?.status === 403) {
        return rejectWithValue('Authentication failed');
      }
      return rejectWithValue(error.message || 'Failed to load available spaces');
    }
  }
);

export const switchSpace = createAsyncThunk(
  'spaces/switchSpace',
  async (space, { rejectWithValue }) => {
    try {
      if (!space || !space.space_id || !space.space_type) {
        throw new Error('Invalid space object');
      }

      // Validate space access by making a test request
      const headers = {
        'X-Space-Type': space.space_type,
        'X-Space-ID': space.space_id
      };

      await aetherApi.request('/health', { headers });

      // Store in localStorage for persistence
      localStorage.setItem('currentSpace', JSON.stringify(space));

      return space;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to switch space');
    }
  }
);

// Initial state - supports multiple spaces per user (1 personal + N organization spaces)
const initialState = {
  currentSpace: null,
  availableSpaces: {
    personal_space: null,        // User's personal space (typically 1)
    organization_spaces: []      // Org spaces user is member of
  },
  loading: false,
  error: null,
  initialized: false,
  loadingAttempts: 0,           // Track loading attempts to prevent loops
  lastLoadAttempt: 0            // Timestamp of last load attempt for cooldown
};

// Helper function to get space headers for API requests
export const getSpaceHeaders = (currentSpace) => {
  if (!currentSpace) {
    return {};
  }
  
  return {
    'X-Space-Type': currentSpace.space_type,
    'X-Space-ID': currentSpace.space_id
  };
};

// Helper function to check permissions
export const hasSpacePermission = (currentSpace, permission) => {
  if (!currentSpace || !currentSpace.permissions) {
    return false;
  }
  return currentSpace.permissions.includes(permission);
};

const spacesSlice = createSlice({
  name: 'spaces',
  initialState,
  reducers: {
    // Set current space without async validation (for initialization from localStorage)
    setCurrentSpace: (state, action) => {
      state.currentSpace = action.payload;
      state.error = null;
      if (action.payload) {
        localStorage.setItem('currentSpace', JSON.stringify(action.payload));
      }
    },

    // Clear space error
    clearSpaceError: (state) => {
      state.error = null;
    },

    // Reset space state (for logout)
    resetSpaceState: (state) => {
      localStorage.removeItem('currentSpace');
      state.currentSpace = null;
      state.availableSpaces = {
        personal_space: null,
        organization_spaces: []
      };
      state.loading = false;
      state.error = null;
      state.initialized = false;
      state.loadingAttempts = 0;
      state.lastLoadAttempt = 0;
    },

    // Initialize from localStorage
    initializeFromStorage: (state) => {
      const savedSpace = localStorage.getItem('currentSpace');
      if (savedSpace) {
        try {
          const parsedSpace = JSON.parse(savedSpace);
          state.currentSpace = parsedSpace;
        } catch (error) {
          console.warn('Failed to parse saved space:', error);
          localStorage.removeItem('currentSpace');
        }
      }
    },

    // Switch to personal space
    switchToPersonalSpace: (state) => {
      if (state.availableSpaces.personal_space) {
        state.currentSpace = state.availableSpaces.personal_space;
        state.error = null;
        localStorage.setItem('currentSpace', JSON.stringify(state.availableSpaces.personal_space));
      } else {
        state.error = 'Personal space not available';
      }
    },

    // Switch to organization space by ID
    switchToOrganizationSpace: (state, action) => {
      const orgSpace = state.availableSpaces.organization_spaces.find(
        space => space.space_id === action.payload
      );

      if (orgSpace) {
        state.currentSpace = orgSpace;
        state.error = null;
        localStorage.setItem('currentSpace', JSON.stringify(orgSpace));
      } else {
        state.error = 'Organization space not found or not accessible';
      }
    },

    // Reset loading attempts (e.g., after successful auth refresh)
    resetLoadingAttempts: (state) => {
      state.loadingAttempts = 0;
      state.lastLoadAttempt = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load available spaces
      .addCase(loadAvailableSpaces.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.loadingAttempts += 1;
        state.lastLoadAttempt = Date.now();
      })
      .addCase(loadAvailableSpaces.fulfilled, (state, action) => {
        state.loading = false;
        state.availableSpaces = action.payload;
        state.initialized = true;
        state.error = null;
        state.loadingAttempts = 0; // Reset attempts on success

        // Auto-select space if none selected
        if (!state.currentSpace) {
          if (action.payload.personal_space) {
            state.currentSpace = action.payload.personal_space;
            localStorage.setItem('currentSpace', JSON.stringify(action.payload.personal_space));
          } else if (action.payload.organization_spaces && action.payload.organization_spaces.length > 0) {
            state.currentSpace = action.payload.organization_spaces[0];
            localStorage.setItem('currentSpace', JSON.stringify(action.payload.organization_spaces[0]));
          }
        }
      })
      .addCase(loadAvailableSpaces.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        // Don't reset loadingAttempts for "Too many" errors
        if (!action.payload?.includes?.('Too many')) {
          state.loadingAttempts = 0;
        }
        // Don't show error for "Already loading" rejections
        if (action.payload !== 'Already loading') {
          state.error = action.payload;
        }
      })

      // Switch space
      .addCase(switchSpace.pending, (state) => {
        state.error = null;
      })
      .addCase(switchSpace.fulfilled, (state, action) => {
        state.currentSpace = action.payload;
        state.error = null;
      })
      .addCase(switchSpace.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const {
  setCurrentSpace,
  clearSpaceError,
  resetSpaceState,
  initializeFromStorage,
  switchToPersonalSpace,
  switchToOrganizationSpace,
  resetLoadingAttempts
} = spacesSlice.actions;

// Selectors
export const selectCurrentSpace = (state) => state.spaces.currentSpace;
export const selectAvailableSpaces = (state) => state.spaces.availableSpaces;
export const selectPersonalSpace = (state) => state.spaces.availableSpaces.personal_space;
export const selectOrganizationSpaces = (state) => state.spaces.availableSpaces.organization_spaces;
export const selectSpacesLoading = (state) => state.spaces.loading;
export const selectSpacesError = (state) => state.spaces.error;
export const selectSpacesInitialized = (state) => state.spaces.initialized;

// Computed selectors
export const selectIsPersonalSpace = (state) =>
  state.spaces.currentSpace?.space_type === SPACE_TYPES.PERSONAL;

export const selectIsOrganizationSpace = (state) =>
  state.spaces.currentSpace?.space_type === SPACE_TYPES.ORGANIZATION;

// Check if user has permission in current space
export const selectHasSpacePermission = (permission) => (state) => {
  const currentSpace = state.spaces.currentSpace;
  if (!currentSpace || !currentSpace.permissions) {
    return false;
  }
  return currentSpace.permissions.includes(permission);
};

// Get user's role in current space
export const selectCurrentSpaceRole = (state) =>
  state.spaces.currentSpace?.user_role || 'viewer';

export default spacesSlice.reducer;