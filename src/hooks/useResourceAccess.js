/**
 * useResourceAccess Hook
 *
 * Provides resource-specific access control checks.
 * Handles permission checks for specific resources like notebooks, documents, etc.
 * Considers both space-level permissions and resource-level permissions.
 */
import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSpace } from './useSpaces.js';
import { PermissionManager, PERMISSIONS } from '../utils/permissions.js';

/**
 * Hook for checking access to specific resources
 *
 * @param {Object} resource - The resource to check access for
 * @param {string} resource.id - Resource ID
 * @param {string} resource.ownerId - Owner user ID
 * @param {string} resource.space_id - Space the resource belongs to
 * @param {Object} resource.permissions - Resource-level permission map { userId: permission }
 * @param {string} resource.visibility - 'private', 'space', 'public'
 *
 * @returns {Object} Resource access utilities
 *
 * @example
 * const { canRead, canEdit, canDelete, canShare } = useResourceAccess(notebook);
 *
 * // Check if user can edit this specific notebook
 * if (canEdit) {
 *   // Show edit button
 * }
 */
export function useResourceAccess(resource) {
  const { currentSpace } = useSpace();
  const user = useSelector((state) => state.auth.user);
  const reduxCurrentSpace = useSelector((state) => state.spaces.currentSpace);

  // Use context space first, fall back to Redux
  const activeSpace = currentSpace || reduxCurrentSpace;

  /**
   * Check if user is the resource owner
   */
  const isOwner = useMemo(() => {
    if (!user?.id || !resource) return false;
    return resource.ownerId === user.id || resource.owner_id === user.id;
  }, [user?.id, resource]);

  /**
   * Get the user's permission level on this resource
   */
  const resourcePermission = useMemo(() => {
    if (!user?.id || !resource) return null;

    // Owner has admin permission
    if (isOwner) {
      return PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN;
    }

    // Check direct resource permissions
    if (resource.permissions && resource.permissions[user.id]) {
      return resource.permissions[user.id];
    }

    // Check shared_with array
    if (resource.shared_with) {
      const share = resource.shared_with.find(s => s.user_id === user.id);
      if (share) {
        return share.permission || PERMISSIONS.RESOURCE_PERMISSIONS.VIEW;
      }
    }

    // Fall back to space-level permissions
    if (resource.space_id === activeSpace?.space_id) {
      // User has access through space membership
      if (activeSpace?.permissions?.includes('update')) {
        return PERMISSIONS.RESOURCE_PERMISSIONS.EDIT;
      }
      if (activeSpace?.permissions?.includes('read')) {
        return PERMISSIONS.RESOURCE_PERMISSIONS.VIEW;
      }
    }

    // Public resources
    if (resource.visibility === 'public') {
      return PERMISSIONS.RESOURCE_PERMISSIONS.VIEW;
    }

    return null;
  }, [user?.id, resource, isOwner, activeSpace]);

  /**
   * Get effective permissions considering all access paths
   */
  const effectivePermissions = useMemo(() => {
    if (!user || !resource) return [];

    const context = {
      teamRole: null, // TODO: Get from team membership
      organizationRole: null // TODO: Get from org membership
    };

    return PermissionManager.getEffectivePermissions(user, resource, context);
  }, [user, resource]);

  /**
   * Check if user has a specific permission on this resource
   *
   * @param {string} requiredPermission - 'admin', 'edit', 'view'
   * @returns {boolean}
   */
  const hasResourcePermission = useCallback((requiredPermission) => {
    if (!resourcePermission) return false;

    // Direct match
    if (resourcePermission === requiredPermission) return true;

    // Check hierarchy
    return PermissionManager.hasPermission(resourcePermission, requiredPermission);
  }, [resourcePermission]);

  /**
   * Check if user can access this resource through any path
   * (direct, space, team, org, public)
   */
  const hasAccess = useMemo(() => {
    if (!user || !resource) return false;

    // System admin override
    if (user.systemRole === 'admin') return true;

    // Owner always has access
    if (isOwner) return true;

    // Has direct resource permission
    if (resourcePermission) return true;

    // Resource is public
    if (resource.visibility === 'public') return true;

    // Resource is in current space (space-level access)
    if (resource.space_id === activeSpace?.space_id && activeSpace?.permissions?.includes('read')) {
      return true;
    }

    return false;
  }, [user, resource, isOwner, resourcePermission, activeSpace]);

  // Permission convenience flags
  const canRead = useMemo(() => {
    return hasAccess;
  }, [hasAccess]);

  const canEdit = useMemo(() => {
    if (isOwner) return true;
    return hasResourcePermission(PERMISSIONS.RESOURCE_PERMISSIONS.EDIT);
  }, [isOwner, hasResourcePermission]);

  const canDelete = useMemo(() => {
    // Only owner or resource admin can delete
    if (isOwner) return true;
    return hasResourcePermission(PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN);
  }, [isOwner, hasResourcePermission]);

  const canShare = useMemo(() => {
    // Owner or resource admin can share
    if (isOwner) return true;
    return hasResourcePermission(PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN);
  }, [isOwner, hasResourcePermission]);

  const canManage = useMemo(() => {
    // Full management requires admin permission
    return hasResourcePermission(PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN);
  }, [hasResourcePermission]);

  /**
   * Get the permission level for display purposes
   */
  const permissionLevel = useMemo(() => {
    if (isOwner) return 'owner';
    if (resourcePermission === PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN) return 'admin';
    if (resourcePermission === PERMISSIONS.RESOURCE_PERMISSIONS.EDIT) return 'edit';
    if (resourcePermission === PERMISSIONS.RESOURCE_PERMISSIONS.VIEW) return 'view';
    if (hasAccess) return 'view'; // Space-level or public access
    return 'none';
  }, [isOwner, resourcePermission, hasAccess]);

  /**
   * Get display name for permission level
   */
  const permissionDisplayName = useMemo(() => {
    const displayNames = {
      'owner': 'Owner',
      'admin': 'Admin',
      'edit': 'Can Edit',
      'view': 'Can View',
      'none': 'No Access'
    };
    return displayNames[permissionLevel] || permissionLevel;
  }, [permissionLevel]);

  /**
   * Check if this resource belongs to the current space
   */
  const isInCurrentSpace = useMemo(() => {
    if (!resource || !activeSpace) return false;
    return resource.space_id === activeSpace.space_id;
  }, [resource, activeSpace]);

  /**
   * Get access reason for UI display
   */
  const accessReason = useMemo(() => {
    if (isOwner) return 'You are the owner';
    if (resourcePermission === PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN) return 'You have admin access';
    if (resourcePermission === PERMISSIONS.RESOURCE_PERMISSIONS.EDIT) return 'You have edit access';
    if (resource?.visibility === 'public') return 'This is a public resource';
    if (isInCurrentSpace && activeSpace?.permissions?.includes('read')) return 'Access through space membership';
    if (resourcePermission === PERMISSIONS.RESOURCE_PERMISSIONS.VIEW) return 'You have view access';
    return 'No access';
  }, [isOwner, resourcePermission, resource?.visibility, isInCurrentSpace, activeSpace]);

  return {
    // Access flags
    hasAccess,
    canRead,
    canEdit,
    canDelete,
    canShare,
    canManage,

    // Ownership
    isOwner,
    isInCurrentSpace,

    // Permission details
    resourcePermission,
    permissionLevel,
    permissionDisplayName,
    accessReason,
    effectivePermissions,

    // Methods
    hasResourcePermission,

    // Context
    user,
    currentSpace: activeSpace,
    resource,

    // Constants
    RESOURCE_PERMISSIONS: PERMISSIONS.RESOURCE_PERMISSIONS
  };
}

/**
 * Hook for checking access to a notebook specifically
 * Wrapper around useResourceAccess with notebook-specific logic
 */
export function useNotebookAccess(notebook) {
  const access = useResourceAccess(notebook);

  // Add notebook-specific permissions
  const canAddDocuments = useMemo(() => {
    return access.canEdit;
  }, [access.canEdit]);

  const canCreateSubNotebooks = useMemo(() => {
    return access.canEdit;
  }, [access.canEdit]);

  const canMoveNotebook = useMemo(() => {
    return access.isOwner || access.canManage;
  }, [access.isOwner, access.canManage]);

  const canArchive = useMemo(() => {
    return access.canManage;
  }, [access.canManage]);

  return {
    ...access,
    canAddDocuments,
    canCreateSubNotebooks,
    canMoveNotebook,
    canArchive
  };
}

/**
 * Hook for checking access to a document specifically
 * Wrapper around useResourceAccess with document-specific logic
 */
export function useDocumentAccess(document) {
  const access = useResourceAccess(document);

  // Add document-specific permissions
  const canDownload = useMemo(() => {
    return access.canRead;
  }, [access.canRead]);

  const canAnnotate = useMemo(() => {
    return access.canEdit;
  }, [access.canEdit]);

  const canExtract = useMemo(() => {
    return access.canEdit;
  }, [access.canEdit]);

  return {
    ...access,
    canDownload,
    canAnnotate,
    canExtract
  };
}

export default useResourceAccess;
