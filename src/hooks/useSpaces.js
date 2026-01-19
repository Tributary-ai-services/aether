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

/**
 * useSpaces - Redux-based hook for space management
 *
 * Replaces the SpaceContext useSpace() hook with Redux state management.
 * Provides the same API for backward compatibility.
 */
export const useSpaces = () => {
  const dispatch = useDispatch();
  const lastLoadAttempt = useRef(0);

  // Select state from Redux
  const currentSpace = useSelector(selectCurrentSpace);
  const availableSpaces = useSelector(selectAvailableSpaces);
  const loading = useSelector(selectSpacesLoading);
  const error = useSelector(selectSpacesError);
  const initialized = useSelector(selectSpacesInitialized);
  const isPersonalSpace = useSelector(selectIsPersonalSpace);
  const isOrganizationSpace = useSelector(selectIsOrganizationSpace);
  const currentRole = useSelector(selectCurrentSpaceRole);

  // Load available spaces with cooldown
  const loadSpaces = useCallback(async () => {
    // Add cooldown period between attempts (5 seconds)
    const now = Date.now();
    if (now - lastLoadAttempt.current < 5000) {
      console.log('Too soon since last attempt, waiting for cooldown');
      return;
    }
    lastLoadAttempt.current = now;

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

  // Initialize spaces on mount
  useEffect(() => {
    if (aetherApi.isAuthenticated()) {
      // Initialize from localStorage first
      dispatch(initializeFromStorage());

      // Then load available spaces
      const timeoutId = setTimeout(() => {
        loadSpaces();
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      resetState();
    }
  }, [dispatch, loadSpaces, resetState]);

  // Listen for authentication events
  useEffect(() => {
    const handleAuthChange = (event) => {
      console.log('Auth event received:', event.type, event.detail);

      if (event.type === 'userLoggedOut') {
        console.log('User logged out, resetting space state');
        resetState();
      } else if (event.type === 'tokenRefreshed' && aetherApi.isAuthenticated()) {
        console.log('Token refreshed, reloading spaces');
        dispatch(resetLoadingAttempts());
        // Add small delay to ensure token is fully refreshed
        setTimeout(() => {
          loadSpaces();
        }, 200);
      } else if (event.type === 'authenticationError') {
        console.log('Authentication error, resetting space state:', event.detail?.reason);
        resetState();
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
