/**
 * useSpaceRole Hook
 *
 * Provides detailed role management for the current space.
 * Handles role hierarchy, role comparison, and role-based feature flags.
 */
import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSpace } from '../contexts/SpaceContext.jsx';
import { PERMISSIONS, PermissionManager } from '../utils/permissions.js';

// Role hierarchy levels (higher number = more permissions)
const ROLE_LEVELS = {
  [PERMISSIONS.ENTITY_ROLES.OWNER]: 4,
  [PERMISSIONS.ENTITY_ROLES.ADMIN]: 3,
  [PERMISSIONS.ENTITY_ROLES.MEMBER]: 2,
  [PERMISSIONS.ENTITY_ROLES.VIEWER]: 1,
  'none': 0
};

/**
 * Hook for space role management and comparison
 *
 * @returns {Object} Space role utilities
 *
 * @example
 * const { role, isOwner, isAdmin, canEdit, hasMinimumRole } = useSpaceRole();
 *
 * // Check role level
 * if (hasMinimumRole('admin')) {
 *   // Show admin features
 * }
 *
 * // Check if user can edit
 * if (canEdit) {
 *   // Show edit button
 * }
 */
export function useSpaceRole() {
  const { currentSpace, isPersonalSpace, isOrganizationSpace } = useSpace();
  const user = useSelector((state) => state.auth.user);
  const reduxCurrentSpace = useSelector((state) => state.spaces.currentSpace);

  // Use context space first, fall back to Redux
  const activeSpace = currentSpace || reduxCurrentSpace;

  /**
   * Compute the user's role in the current space
   */
  const role = useMemo(() => {
    if (!activeSpace) return null;

    // If space has explicit role property
    if (activeSpace.role) {
      return activeSpace.role;
    }

    // For personal spaces, user is always owner
    if (activeSpace.space_type === 'personal') {
      return PERMISSIONS.ENTITY_ROLES.OWNER;
    }

    // Check owner_id if available
    if (activeSpace.owner_id && user?.id && activeSpace.owner_id === user.id) {
      return PERMISSIONS.ENTITY_ROLES.OWNER;
    }

    // Derive role from permissions array
    if (activeSpace.permissions) {
      const perms = activeSpace.permissions;

      // Owner has all permissions including delete and manage
      if (perms.includes('delete') && perms.includes('manage_members')) {
        return PERMISSIONS.ENTITY_ROLES.OWNER;
      }
      // Admin has manage but not full delete rights on space
      if (perms.includes('manage_members') || perms.includes('manage_settings')) {
        return PERMISSIONS.ENTITY_ROLES.ADMIN;
      }
      // Member can create and update
      if (perms.includes('create') || perms.includes('update')) {
        return PERMISSIONS.ENTITY_ROLES.MEMBER;
      }
      // Viewer can only read
      if (perms.includes('read')) {
        return PERMISSIONS.ENTITY_ROLES.VIEWER;
      }
    }

    // Default to viewer if we have a space but can't determine role
    return PERMISSIONS.ENTITY_ROLES.VIEWER;
  }, [activeSpace, user?.id]);

  /**
   * Get the numeric level of the current role
   */
  const roleLevel = useMemo(() => {
    return ROLE_LEVELS[role] || 0;
  }, [role]);

  /**
   * Check if user has at least the specified role
   *
   * @param {string} minimumRole - 'owner', 'admin', 'member', 'viewer'
   * @returns {boolean}
   */
  const hasMinimumRole = useCallback((minimumRole) => {
    const requiredLevel = ROLE_LEVELS[minimumRole] || 0;
    return roleLevel >= requiredLevel;
  }, [roleLevel]);

  /**
   * Compare two roles
   *
   * @param {string} roleA
   * @param {string} roleB
   * @returns {number} -1 if roleA < roleB, 0 if equal, 1 if roleA > roleB
   */
  const compareRoles = useCallback((roleA, roleB) => {
    const levelA = ROLE_LEVELS[roleA] || 0;
    const levelB = ROLE_LEVELS[roleB] || 0;
    if (levelA < levelB) return -1;
    if (levelA > levelB) return 1;
    return 0;
  }, []);

  /**
   * Get the display name for a role
   *
   * @param {string} roleKey - Role key
   * @returns {string} Display name
   */
  const getRoleDisplayName = useCallback((roleKey) => {
    const displayNames = {
      [PERMISSIONS.ENTITY_ROLES.OWNER]: 'Owner',
      [PERMISSIONS.ENTITY_ROLES.ADMIN]: 'Admin',
      [PERMISSIONS.ENTITY_ROLES.MEMBER]: 'Member',
      [PERMISSIONS.ENTITY_ROLES.VIEWER]: 'Viewer'
    };
    return displayNames[roleKey] || roleKey;
  }, []);

  /**
   * Get all roles the current user can assign (roles lower than their own)
   */
  const assignableRoles = useMemo(() => {
    if (!role) return [];

    const allRoles = [
      PERMISSIONS.ENTITY_ROLES.ADMIN,
      PERMISSIONS.ENTITY_ROLES.MEMBER,
      PERMISSIONS.ENTITY_ROLES.VIEWER
    ];

    // Owners can assign any role except owner
    if (role === PERMISSIONS.ENTITY_ROLES.OWNER) {
      return allRoles;
    }

    // Admins can assign member and viewer roles
    if (role === PERMISSIONS.ENTITY_ROLES.ADMIN) {
      return [PERMISSIONS.ENTITY_ROLES.MEMBER, PERMISSIONS.ENTITY_ROLES.VIEWER];
    }

    // Others cannot assign roles
    return [];
  }, [role]);

  // Role boolean flags
  const isOwner = role === PERMISSIONS.ENTITY_ROLES.OWNER;
  const isAdmin = role === PERMISSIONS.ENTITY_ROLES.OWNER || role === PERMISSIONS.ENTITY_ROLES.ADMIN;
  const isMember = hasMinimumRole(PERMISSIONS.ENTITY_ROLES.MEMBER);
  const isViewer = role === PERMISSIONS.ENTITY_ROLES.VIEWER;

  // Permission-based flags
  const canEdit = hasMinimumRole(PERMISSIONS.ENTITY_ROLES.MEMBER);
  const canDelete = isOwner; // Only owner can delete space
  const canManageMembers = isAdmin;
  const canChangeSettings = isAdmin;
  const canInvite = isAdmin;
  const canCreate = isMember; // Members+ can create content

  // Space type flags (from context)
  const isPersonal = isPersonalSpace ? isPersonalSpace() : activeSpace?.space_type === 'personal';
  const isOrganization = isOrganizationSpace ? isOrganizationSpace() : activeSpace?.space_type === 'organization';

  return {
    // Role information
    role,
    roleLevel,
    roleName: getRoleDisplayName(role),

    // Role checks
    hasMinimumRole,
    compareRoles,
    getRoleDisplayName,
    assignableRoles,

    // Boolean role flags
    isOwner,
    isAdmin,
    isMember,
    isViewer,

    // Permission flags
    canEdit,
    canDelete,
    canManageMembers,
    canChangeSettings,
    canInvite,
    canCreate,

    // Space type flags
    isPersonal,
    isOrganization,

    // Current context
    currentSpace: activeSpace,
    user,

    // Constants for use in components
    ROLE_LEVELS,
    ENTITY_ROLES: PERMISSIONS.ENTITY_ROLES
  };
}

export default useSpaceRole;
