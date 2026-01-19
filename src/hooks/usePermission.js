/**
 * usePermission Hook
 *
 * Central hook for permission checking across the application.
 * Bridges the PermissionManager utility with React components.
 * Works with both SpaceContext and Redux for flexibility.
 */
import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSpace } from './useSpaces.js';
import { PermissionManager, PERMISSIONS, PermissionUtils } from '../utils/permissions.js';

/**
 * Hook for checking permissions in the current space context
 *
 * @returns {Object} Permission checking utilities
 *
 * @example
 * const { canPerformAction, hasSpacePermission, canEdit, canDelete } = usePermission();
 *
 * // Check if user can perform an action on an entity type
 * if (canPerformAction('notebook', 'update')) {
 *   // Show edit button
 * }
 *
 * // Check space-level permission
 * if (hasSpacePermission('create')) {
 *   // Show create button
 * }
 */
export function usePermission() {
  const { currentSpace, hasPermission: contextHasPermission } = useSpace();
  const user = useSelector((state) => state.auth.user);
  const reduxCurrentSpace = useSelector((state) => state.spaces.currentSpace);

  // Use context space first, fall back to Redux
  const activeSpace = currentSpace || reduxCurrentSpace;

  /**
   * Get the user's role in the current space
   */
  const userRole = useMemo(() => {
    if (!activeSpace) return null;

    // If space has explicit role property
    if (activeSpace.role) {
      return activeSpace.role;
    }

    // For personal spaces, user is always owner
    if (activeSpace.space_type === 'personal') {
      return PERMISSIONS.ENTITY_ROLES.OWNER;
    }

    // Check permissions array for role indicators
    if (activeSpace.permissions) {
      if (activeSpace.permissions.includes('delete') && activeSpace.permissions.includes('manage_members')) {
        return PERMISSIONS.ENTITY_ROLES.OWNER;
      }
      if (activeSpace.permissions.includes('manage_members')) {
        return PERMISSIONS.ENTITY_ROLES.ADMIN;
      }
      if (activeSpace.permissions.includes('create') || activeSpace.permissions.includes('update')) {
        return PERMISSIONS.ENTITY_ROLES.MEMBER;
      }
      if (activeSpace.permissions.includes('read')) {
        return PERMISSIONS.ENTITY_ROLES.VIEWER;
      }
    }

    return PERMISSIONS.ENTITY_ROLES.VIEWER;
  }, [activeSpace]);

  /**
   * Check if user can perform a specific action on an entity type
   *
   * @param {string} entityType - 'organization', 'team', 'resource', 'notebook', 'space'
   * @param {string} action - 'create', 'read', 'update', 'delete', 'share', etc.
   * @returns {boolean}
   */
  const canPerformAction = useCallback((entityType, action) => {
    if (!userRole) return false;

    // Map common entity types to ROLE_ACTION_MATRIX keys
    const entityTypeMap = {
      'notebook': 'RESOURCE',
      'document': 'RESOURCE',
      'space': 'ORGANIZATION',
      'organization': 'ORGANIZATION',
      'team': 'TEAM',
      'resource': 'RESOURCE'
    };

    const mappedEntityType = entityTypeMap[entityType.toLowerCase()] || entityType.toUpperCase();

    return PermissionManager.canPerformAction(userRole, mappedEntityType, action);
  }, [userRole]);

  /**
   * Check if user has a specific permission in the current space
   * Uses the context's hasPermission method
   *
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  const hasSpacePermission = useCallback((permission) => {
    // First try context method
    if (contextHasPermission) {
      return contextHasPermission(permission);
    }

    // Fall back to checking permissions array
    if (activeSpace?.permissions) {
      return activeSpace.permissions.includes(permission);
    }

    return false;
  }, [contextHasPermission, activeSpace]);

  /**
   * Check if user has a role-based permission
   *
   * @param {string} requiredRole - Minimum required role
   * @returns {boolean}
   */
  const hasRolePermission = useCallback((requiredRole) => {
    if (!userRole) return false;
    return PermissionManager.hasPermission(userRole, requiredRole);
  }, [userRole]);

  /**
   * Convenience methods for common permission checks
   */
  const canCreate = useMemo(() => hasSpacePermission('create'), [hasSpacePermission]);
  const canRead = useMemo(() => hasSpacePermission('read'), [hasSpacePermission]);
  const canUpdate = useMemo(() => hasSpacePermission('update'), [hasSpacePermission]);
  const canDelete = useMemo(() => hasSpacePermission('delete'), [hasSpacePermission]);
  const canShare = useMemo(() => hasSpacePermission('share'), [hasSpacePermission]);
  const canManageMembers = useMemo(() => hasSpacePermission('manage_members'), [hasSpacePermission]);
  const canInvite = useMemo(() => hasSpacePermission('invite'), [hasSpacePermission]);

  /**
   * Alias methods matching common naming conventions
   */
  const canEdit = canUpdate;

  /**
   * Check if user is owner of the current space
   */
  const isOwner = useMemo(() => {
    return userRole === PERMISSIONS.ENTITY_ROLES.OWNER;
  }, [userRole]);

  /**
   * Check if user is admin or higher
   */
  const isAdmin = useMemo(() => {
    return userRole === PERMISSIONS.ENTITY_ROLES.OWNER ||
           userRole === PERMISSIONS.ENTITY_ROLES.ADMIN;
  }, [userRole]);

  /**
   * Check if user is member or higher (can contribute)
   */
  const isMember = useMemo(() => {
    return PermissionUtils.isAdminOrHigher(userRole) ||
           userRole === PERMISSIONS.ENTITY_ROLES.MEMBER;
  }, [userRole]);

  /**
   * Check if user is only a viewer (read-only access)
   */
  const isViewer = useMemo(() => {
    return userRole === PERMISSIONS.ENTITY_ROLES.VIEWER;
  }, [userRole]);

  return {
    // Current context
    userRole,
    currentSpace: activeSpace,
    user,

    // Action checks
    canPerformAction,
    hasSpacePermission,
    hasRolePermission,

    // Convenience permission checks
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canShare,
    canManageMembers,
    canInvite,
    canEdit,

    // Role checks
    isOwner,
    isAdmin,
    isMember,
    isViewer,

    // Expose permission constants for components
    PERMISSIONS
  };
}

export default usePermission;
