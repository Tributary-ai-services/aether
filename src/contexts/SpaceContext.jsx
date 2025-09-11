import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { aetherApi } from '../services/aetherApi.js';

// Space Types
export const SPACE_TYPES = {
  PERSONAL: 'personal',
  ORGANIZATION: 'organization'
};

// Action Types
const SPACE_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_AVAILABLE_SPACES: 'SET_AVAILABLE_SPACES',
  SET_CURRENT_SPACE: 'SET_CURRENT_SPACE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_SPACE_STATE: 'RESET_SPACE_STATE'
};

// Initial State
const initialState = {
  currentSpace: null,
  availableSpaces: {
    personal_space: null,
    organization_spaces: []
  },
  loading: false,
  error: null,
  initialized: false,
  loadingAttempts: 0 // Track loading attempts to prevent loops
};

// Reducer
const spaceReducer = (state, action) => {
  switch (action.type) {
    case SPACE_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        loadingAttempts: action.payload ? state.loadingAttempts + 1 : state.loadingAttempts
      };
      
    case SPACE_ACTIONS.SET_AVAILABLE_SPACES:
      return {
        ...state,
        availableSpaces: action.payload,
        loading: false,
        initialized: true,
        error: null,
        loadingAttempts: 0 // Reset attempts on success
      };
      
    case SPACE_ACTIONS.SET_CURRENT_SPACE:
      return {
        ...state,
        currentSpace: action.payload,
        error: null
      };
      
    case SPACE_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        loadingAttempts: action.payload?.includes('Too many') ? state.loadingAttempts : 0
      };
      
    case SPACE_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case SPACE_ACTIONS.RESET_SPACE_STATE:
      return initialState;
      
    default:
      return state;
  }
};

// Create Context
const SpaceContext = createContext();

// Space Provider Component
export const SpaceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(spaceReducer, initialState);
  const lastLoadAttempt = useRef(0); // Track when we last tried to load spaces

  // Load available spaces
  const loadAvailableSpaces = async () => {
    // Don't try to load spaces if not authenticated
    if (!aetherApi.isAuthenticated()) {
      console.log('User not authenticated, skipping space loading');
      dispatch({ 
        type: SPACE_ACTIONS.SET_ERROR, 
        payload: 'User not authenticated' 
      });
      return;
    }

    // Prevent multiple simultaneous loading attempts
    if (state.loading) {
      console.log('Space loading already in progress, skipping duplicate request');
      return;
    }

    // Limit the number of loading attempts to prevent infinite loops
    if (state.loadingAttempts >= 3) {
      console.log('Too many loading attempts, stopping to prevent loop');
      dispatch({ 
        type: SPACE_ACTIONS.SET_ERROR, 
        payload: 'Too many loading attempts' 
      });
      return;
    }

    // Add cooldown period between attempts (5 seconds)
    const now = Date.now();
    if (now - lastLoadAttempt.current < 5000) {
      console.log('Too soon since last attempt, waiting for cooldown');
      return;
    }
    lastLoadAttempt.current = now;

    try {
      dispatch({ type: SPACE_ACTIONS.SET_LOADING, payload: true });
      
      const { data } = await aetherApi.request('/users/me/spaces');
      
      dispatch({ 
        type: SPACE_ACTIONS.SET_AVAILABLE_SPACES, 
        payload: data 
      });
      
      // Auto-select personal space if no current space and personal space exists
      if (!state.currentSpace && data.personal_space) {
        setCurrentSpace(data.personal_space);
      } else if (!state.currentSpace && data.organization_spaces && data.organization_spaces.length > 0) {
        // Fall back to first organization space if no personal space
        setCurrentSpace(data.organization_spaces[0]);
      }
      
    } catch (error) {
      console.error('Failed to load available spaces:', error);
      
      // If it's an authentication error, don't retry automatically
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Authentication failed, resetting space state');
        resetSpaceState();
        // Don't show error for auth failures - let auth system handle it
        return;
      }
      
      dispatch({ 
        type: SPACE_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to load available spaces' 
      });
    }
  };

  // Set current space
  const setCurrentSpace = (space) => {
    if (!space) {
      dispatch({ type: SPACE_ACTIONS.SET_ERROR, payload: 'Invalid space selected' });
      return;
    }

    // Store current space in localStorage for persistence
    localStorage.setItem('currentSpace', JSON.stringify(space));
    
    dispatch({ 
      type: SPACE_ACTIONS.SET_CURRENT_SPACE, 
      payload: space 
    });
  };

  // Switch to personal space
  const switchToPersonalSpace = () => {
    if (state.availableSpaces.personal_space) {
      setCurrentSpace(state.availableSpaces.personal_space);
    } else {
      dispatch({ 
        type: SPACE_ACTIONS.SET_ERROR, 
        payload: 'Personal space not available' 
      });
    }
  };

  // Switch to organization space
  const switchToOrganizationSpace = (organizationId) => {
    const orgSpace = state.availableSpaces.organization_spaces.find(
      space => space.space_id === organizationId
    );
    
    if (orgSpace) {
      setCurrentSpace(orgSpace);
    } else {
      dispatch({ 
        type: SPACE_ACTIONS.SET_ERROR, 
        payload: 'Organization space not found or not accessible' 
      });
    }
  };

  // Check if user has permission in current space
  const hasPermission = (permission) => {
    if (!state.currentSpace) return false;
    return state.currentSpace.permissions.includes(permission);
  };

  // Check if current space is personal
  const isPersonalSpace = () => {
    return state.currentSpace?.space_type === SPACE_TYPES.PERSONAL;
  };

  // Check if current space is organization
  const isOrganizationSpace = () => {
    return state.currentSpace?.space_type === SPACE_TYPES.ORGANIZATION;
  };

  // Get space context headers for API requests
  const getSpaceHeaders = () => {
    if (!state.currentSpace) {
      return {};
    }
    
    return {
      'X-Space-Type': state.currentSpace.space_type,
      'X-Space-ID': state.currentSpace.space_id
    };
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: SPACE_ACTIONS.CLEAR_ERROR });
  };

  // Reset space state (for logout)
  const resetSpaceState = () => {
    localStorage.removeItem('currentSpace');
    dispatch({ type: SPACE_ACTIONS.RESET_SPACE_STATE });
  };

  // Initialize spaces on mount and auth changes
  useEffect(() => {
    if (aetherApi.isAuthenticated()) {
      // Try to restore last selected space from localStorage
      const savedSpace = localStorage.getItem('currentSpace');
      if (savedSpace) {
        try {
          const parsedSpace = JSON.parse(savedSpace);
          dispatch({ 
            type: SPACE_ACTIONS.SET_CURRENT_SPACE, 
            payload: parsedSpace 
          });
        } catch (error) {
          console.warn('Failed to parse saved space:', error);
          localStorage.removeItem('currentSpace');
        }
      }
      
      // Load available spaces with a small delay to avoid immediate auth failures
      const timeoutId = setTimeout(() => {
        loadAvailableSpaces();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else {
      console.log('User not authenticated, resetting space state');
      resetSpaceState();
    }
  }, []);

  // Listen for authentication events
  useEffect(() => {
    const handleAuthChange = (event) => {
      console.log('Auth event received:', event.type, event.detail);
      
      if (event.type === 'userLoggedOut') {
        console.log('User logged out, resetting space state');
        resetSpaceState();
      } else if (event.type === 'tokenRefreshed' && aetherApi.isAuthenticated()) {
        console.log('Token refreshed, reloading spaces');
        // Add small delay to ensure token is fully refreshed
        setTimeout(() => {
          loadAvailableSpaces();
        }, 200);
      } else if (event.type === 'authenticationError') {
        console.log('Authentication error, resetting space state:', event.detail?.reason);
        resetSpaceState();
      }
    };

    window.addEventListener('userLoggedOut', handleAuthChange);
    window.addEventListener('tokenRefreshed', handleAuthChange);
    window.addEventListener('authenticationError', handleAuthChange);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleAuthChange);
      window.removeEventListener('tokenRefreshed', handleAuthChange);
      window.removeEventListener('authenticationError', handleAuthChange);
    };
  }, []);

  const contextValue = {
    // State
    currentSpace: state.currentSpace,
    availableSpaces: state.availableSpaces,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    
    // Actions
    loadAvailableSpaces,
    setCurrentSpace,
    switchToPersonalSpace,
    switchToOrganizationSpace,
    resetSpaceState,
    clearError,
    
    // Utilities
    hasPermission,
    isPersonalSpace,
    isOrganizationSpace,
    getSpaceHeaders,
    
    // Constants
    SPACE_TYPES
  };

  return (
    <SpaceContext.Provider value={contextValue}>
      {children}
    </SpaceContext.Provider>
  );
};

// Custom hook to use space context
export const useSpace = () => {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
};

// HOC to inject space context
export const withSpaceContext = (Component) => {
  return function WithSpaceContextComponent(props) {
    return (
      <SpaceContext.Consumer>
        {(spaceContext) => <Component {...props} spaceContext={spaceContext} />}
      </SpaceContext.Consumer>
    );
  };
};

export default SpaceContext;