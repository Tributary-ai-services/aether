/**
 * RequirePermission Component
 *
 * Conditionally renders children based on user permissions.
 * Supports multiple permission checking strategies.
 */
import React from 'react';
import { usePermission } from '../../hooks/usePermission.js';
import { useSpaceRole } from '../../hooks/useSpaceRole.js';
import { useResourceAccess } from '../../hooks/useResourceAccess.js';

/**
 * Renders children only if user has required permission
 *
 * @example
 * // Check space-level permission
 * <RequirePermission permission="create">
 *   <CreateButton />
 * </RequirePermission>
 *
 * @example
 * // Check action on entity type
 * <RequirePermission entityType="notebook" action="delete">
 *   <DeleteButton />
 * </RequirePermission>
 *
 * @example
 * // Check minimum role
 * <RequirePermission role="admin">
 *   <AdminPanel />
 * </RequirePermission>
 *
 * @example
 * // Check resource-specific permission
 * <RequirePermission resource={notebook} resourcePermission="edit">
 *   <EditButton />
 * </RequirePermission>
 *
 * @example
 * // With fallback content
 * <RequirePermission permission="delete" fallback={<DisabledDeleteButton />}>
 *   <DeleteButton />
 * </RequirePermission>
 */
export function RequirePermission({
  // Permission checks (use one of these)
  permission,         // Space-level permission string: 'create', 'read', 'update', 'delete', etc.
  action,             // Action to check (used with entityType)
  entityType,         // Entity type: 'notebook', 'document', 'space', 'team', 'organization'
  role,               // Minimum role required: 'owner', 'admin', 'member', 'viewer'
  resource,           // Resource object for resource-level checks
  resourcePermission, // Resource permission: 'admin', 'edit', 'view'

  // Options
  fallback = null,    // Content to render if permission denied
  showFallback = true, // Whether to show fallback (if false, renders nothing on deny)

  // Children
  children
}) {
  const { hasSpacePermission, canPerformAction, hasRolePermission } = usePermission();
  const { hasMinimumRole } = useSpaceRole();
  const resourceAccess = useResourceAccess(resource);

  // Determine if user has permission
  let hasPermissionResult = false;

  // Check resource-level permission first (most specific)
  if (resource && resourcePermission) {
    hasPermissionResult = resourceAccess.hasResourcePermission(resourcePermission);
  }
  // Check action on entity type
  else if (entityType && action) {
    hasPermissionResult = canPerformAction(entityType, action);
  }
  // Check minimum role
  else if (role) {
    hasPermissionResult = hasMinimumRole(role);
  }
  // Check space-level permission
  else if (permission) {
    hasPermissionResult = hasSpacePermission(permission);
  }
  // No permission specified, deny by default
  else {
    console.warn('RequirePermission: No permission check specified. Denying access.');
    hasPermissionResult = false;
  }

  // Render based on permission
  if (hasPermissionResult) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
}


/**
 * Inverse of RequirePermission - shows content only when user LACKS permission
 * Useful for showing upgrade prompts or alternative UIs
 *
 * @example
 * <RequireNoPermission permission="create">
 *   <p>You need edit access to create notebooks</p>
 * </RequireNoPermission>
 */
export function RequireNoPermission({
  permission,
  action,
  entityType,
  role,
  resource,
  resourcePermission,
  children
}) {
  const { hasSpacePermission, canPerformAction } = usePermission();
  const { hasMinimumRole } = useSpaceRole();
  const resourceAccess = useResourceAccess(resource);

  let hasPermissionResult = false;

  if (resource && resourcePermission) {
    hasPermissionResult = resourceAccess.hasResourcePermission(resourcePermission);
  } else if (entityType && action) {
    hasPermissionResult = canPerformAction(entityType, action);
  } else if (role) {
    hasPermissionResult = hasMinimumRole(role);
  } else if (permission) {
    hasPermissionResult = hasSpacePermission(permission);
  }

  // Show children only when permission is NOT granted
  if (!hasPermissionResult) {
    return <>{children}</>;
  }

  return null;
}


/**
 * Higher-order component version of RequirePermission
 *
 * @example
 * const AdminOnlyComponent = withPermission(MyComponent, { role: 'admin' });
 */
export function withPermission(WrappedComponent, permissionConfig) {
  return function WithPermissionComponent(props) {
    return (
      <RequirePermission {...permissionConfig}>
        <WrappedComponent {...props} />
      </RequirePermission>
    );
  };
}

/**
 * Hook-based alternative for imperative permission checking
 * Returns a function that can be used to check permissions
 *
 * @example
 * const checkPermission = useCheckPermission();
 * if (checkPermission({ permission: 'delete' })) {
 *   // Do something
 * }
 */
export function useCheckPermission() {
  const { hasSpacePermission, canPerformAction } = usePermission();
  const { hasMinimumRole } = useSpaceRole();

  return ({ permission, action, entityType, role, resource, resourcePermission }) => {
    if (entityType && action) {
      return canPerformAction(entityType, action);
    }
    if (role) {
      return hasMinimumRole(role);
    }
    if (permission) {
      return hasSpacePermission(permission);
    }
    // Note: resource checks need the resource access hook which requires the resource
    // For resource checks, use useResourceAccess directly
    return false;
  };
}

export default RequirePermission;
