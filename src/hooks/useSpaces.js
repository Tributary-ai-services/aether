/**
 * useSpaces Hook
 *
 * Provides the same API as SpaceContext but uses Redux for state management.
 * This is the replacement for useSpace() from SpaceContext.jsx.
 */
import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { aetherApi } from '../services/aetherApi.js';
import {
  SPACE_TYPES,
  loadAvailableSpaces,
  switchSpace,
  setCurrentSpace,
  clearSpaceError,
  resetSpaceState,
  initializeFromStorage,
  switchToPersonalSpace as switchToPersonalSpaceAction,
  switchToOrganizationSpace as switchToOrganizationSpaceAction,
  resetLoadingAttempts,
  selectCurrentSpace,
  selectAvailableSpaces,
  selectSpacesLoading,
  selectSpacesError,
  selectSpacesInitialized,
  selectIsPersonalSpace,
  selectIsOrganizationSpace,
  selectCurrentSpaceRole,
  getSpaceHeaders,
  hasSpacePermission
} from '../store/slices/spacesSlice.js';

// Selector for auth state
const selectAuthState = (state) => ({
  isAuthenticated: state.auth?.isAuthenticated ?? false,
  initialized: state.auth?.initialized ?? false
});

/**
 * useSpaces - Redux-based hook for space management
 *
 * Replaces the SpaceContext useSpace() hook with Redux state management.
 * Provides the same API for backward compatibility.
 */
export const useSpaces = () => {
  const dispatch = useDispatch();
  const lastLoadAttempt = useRef(0);

  // Select auth state from Redux - this triggers re-render when auth changes
  const authState = useSelector(selectAuthState);

  // Select space state from Redux
  const currentSpace = useSelector(selectCurrentSpace);
  const availableSpaces = useSelector(selectAvailableSpaces);
  const loading = useSelector(selectSpacesLoading);
  const error = useSelector(selectSpacesError);
  const initialized = useSelector(selectSpacesInitialized);
  const isPersonalSpace = useSelector(selectIsPersonalSpace);
  const isOrganizationSpace = useSelector(selectIsOrganizationSpace);
  const currentRole = useSelector(selectCurrentSpaceRole);

  // Load available spaces with cooldown
  const loadSpaces = useCallback(async (force = false) => {
    // Add cooldown period between attempts (5 seconds) unless forced
    const now = Date.now();
    if (!force && now - lastLoadAttempt.current < 5000) {
      return;
    }
    lastLoadAttempt.current = now;

    // Reset loading attempts if forcing
    if (force) {
      dispatch(resetLoadingAttempts());
    }

    dispatch(loadAvailableSpaces());
  }, [dispatch]);

  // Set current space
  const setSpace = useCallback((space) => {
    if (!space) {
      return;
    }
    dispatch(setCurrentSpace(space));
  }, [dispatch]);

  // Switch space with validation
  const switchToSpace = useCallback(async (space) => {
    return dispatch(switchSpace(space)).unwrap();
  }, [dispatch]);

  // Switch to personal space
  const switchToPersonalSpace = useCallback(() => {
    dispatch(switchToPersonalSpaceAction());
  }, [dispatch]);

  // Switch to organization space by ID
  const switchToOrganizationSpace = useCallback((organizationId) => {
    dispatch(switchToOrganizationSpaceAction(organizationId));
  }, [dispatch]);

  // Check if user has permission in current space
  const hasPermission = useCallback((permission) => {
    return hasSpacePermission(currentSpace, permission);
  }, [currentSpace]);

  // Get space headers for API requests
  const getHeaders = useCallback(() => {
    return getSpaceHeaders(currentSpace);
  }, [currentSpace]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch(clearSpaceError());
  }, [dispatch]);

  // Reset space state (for logout)
  const resetState = useCallback(() => {
    dispatch(resetSpaceState());
  }, [dispatch]);

  // Initialize spaces when auth state changes
  useEffect(() => {
    // Wait for auth to be initialized before acting
    if (!authState.initialized) {
      return;
    }

    if (authState.isAuthenticated) {
      // Initialize from localStorage first
      dispatch(initializeFromStorage());

      // Then load available spaces - force on initial mount to bypass cooldown
      const timeoutId = setTimeout(() => {
        loadSpaces(true); // Force initial load
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      resetState();
    }
  }, [dispatch, loadSpaces, resetState, authState.isAuthenticated, authState.initialized]);

  // Listen for authentication events
  useEffect(() => {
    const handleAuthChange = (event) => {
      if (event.type === 'userLoggedOut') {
        resetState();
      } else if (event.type === 'tokenRefreshed' && aetherApi.isAuthenticated()) {
        dispatch(resetLoadingAttempts());
        // Reset cooldown ref so we can retry immediately
        lastLoadAttempt.current = 0;
        // Add small delay to ensure token is fully refreshed
        setTimeout(() => {
          loadSpaces();
        }, 200);
      } else if (event.type === 'authenticationError') {
        resetState();
      }
    };

    // Handle space context restoration from API error recovery
    const handleSpaceContextRestored = (event) => {
      const restoredSpace = event.detail;
      if (restoredSpace) {
        console.log('Space context restored by API, syncing Redux state:', restoredSpace);
        dispatch(setCurrentSpace({
          space_type: restoredSpace.space_type,
          space_id: restoredSpace.space_id || restoredSpace.id,
        }));
        // Also reload available spaces to ensure full sync
        dispatch(resetLoadingAttempts());
        lastLoadAttempt.current = 0;
        loadSpaces(true);
      }
    };

    window.addEventListener('userLoggedOut', handleAuthChange);
    window.addEventListener('tokenRefreshed', handleAuthChange);
    window.addEventListener('authenticationError', handleAuthChange);
    window.addEventListener('spaceContextRestored', handleSpaceContextRestored);

    return () => {
      window.removeEventListener('userLoggedOut', handleAuthChange);
      window.removeEventListener('tokenRefreshed', handleAuthChange);
      window.removeEventListener('authenticationError', handleAuthChange);
      window.removeEventListener('spaceContextRestored', handleSpaceContextRestored);
    };
  }, [dispatch, loadSpaces, resetState]);

  return {
    // State
    currentSpace,
    availableSpaces,
    loading,
    error,
    initialized,

    // Actions
    loadAvailableSpaces: loadSpaces,
    setCurrentSpace: setSpace,
    switchSpace: switchToSpace,
    switchToPersonalSpace,
    switchToOrganizationSpace,
    resetSpaceState: resetState,
    clearError,

    // Utilities
    hasPermission,
    isPersonalSpace: () => isPersonalSpace,
    isOrganizationSpace: () => isOrganizationSpace,
    getSpaceHeaders: getHeaders,
    currentRole,

    // Constants
    SPACE_TYPES
  };
};

// Alias for backward compatibility with SpaceContext
export const useSpace = useSpaces;

export default useSpaces;
