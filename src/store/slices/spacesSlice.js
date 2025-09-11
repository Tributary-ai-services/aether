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
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await aetherApi.request('/users/me/spaces');
      return data;
    } catch (error) {
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

// Initial state
const initialState = {
  currentSpace: null,
  availableSpaces: {
    personalSpace: null,
    organizationSpaces: []
  },
  loading: false,
  error: null,
  initialized: false
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
    },
    
    // Clear space error
    clearSpaceError: (state) => {
      state.error = null;
    },
    
    // Reset space state (for logout)
    resetSpaceState: (state) => {
      localStorage.removeItem('currentSpace');
      return initialState;
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
    }
  },
  extraReducers: (builder) => {
    builder
      // Load available spaces
      .addCase(loadAvailableSpaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAvailableSpaces.fulfilled, (state, action) => {
        state.loading = false;
        state.availableSpaces = action.payload;
        state.initialized = true;
        state.error = null;
        
        // Auto-select space if none selected
        if (!state.currentSpace) {
          if (action.payload.personalSpace) {
            state.currentSpace = action.payload.personalSpace;
            localStorage.setItem('currentSpace', JSON.stringify(action.payload.personalSpace));
          } else if (action.payload.organizationSpaces.length > 0) {
            state.currentSpace = action.payload.organizationSpaces[0];
            localStorage.setItem('currentSpace', JSON.stringify(action.payload.organizationSpaces[0]));
          }
        }
      })
      .addCase(loadAvailableSpaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.initialized = true;
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
  initializeFromStorage 
} = spacesSlice.actions;

export default spacesSlice.reducer;