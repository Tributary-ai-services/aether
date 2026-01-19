/**
 * ProtectedButton Component
 *
 * Button that automatically disables or hides based on user permissions.
 * Provides consistent permission-aware button behavior across the application.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { usePermission } from '../../hooks/usePermission.js';
import { useSpaceRole } from '../../hooks/useSpaceRole.js';
import { useResourceAccess } from '../../hooks/useResourceAccess.js';

/**
 * A button that automatically handles permission-based enabling/disabling
 *
 * @example
 * // Disable if no permission
 * <ProtectedButton permission="delete" onClick={handleDelete}>
 *   Delete
 * </ProtectedButton>
 *
 * @example
 * // Hide if no permission
 * <ProtectedButton permission="delete" hideWhenDisabled onClick={handleDelete}>
 *   Delete
 * </ProtectedButton>
 *
 * @example
 * // Resource-specific permission
 * <ProtectedButton resource={notebook} resourcePermission="edit" onClick={handleEdit}>
 *   Edit Notebook
 * </ProtectedButton>
 *
 * @example
 * // With custom disabled message
 * <ProtectedButton
 *   permission="create"
 *   disabledTitle="You need member access to create notebooks"
 *   onClick={handleCreate}
 * >
 *   Create Notebook
 * </ProtectedButton>
 */
export function ProtectedButton({
  // Permission checks (use one of these)
  permission,         // Space-level permission: 'create', 'read', 'update', 'delete'
  action,             // Action to check (used with entityType)
  entityType,         // Entity type: 'notebook', 'document', 'space', etc.
  role,               // Minimum role required: 'owner', 'admin', 'member', 'viewer'
  resource,           // Resource object for resource-level checks
  resourcePermission, // Resource permission: 'admin', 'edit', 'view'

  // Button behavior
  hideWhenDisabled = false, // If true, hides button instead of disabling
  disabledTitle = 'You do not have permission for this action',
  disabledClassName = 'opacity-50 cursor-not-allowed',

  // Standard button props
  onClick,
  disabled: externalDisabled = false,
  className = '',
  title,
  type = 'button',
  children,
  ...buttonProps
}) {
  const { hasSpacePermission, canPerformAction } = usePermission();
  const { hasMinimumRole } = useSpaceRole();
  const resourceAccess = useResourceAccess(resource);

  // Determine if user has permission
  let hasPermissionResult = true; // Default to true if no permission specified

  if (resource && resourcePermission) {
    hasPermissionResult = resourceAccess.hasResourcePermission(resourcePermission);
  } else if (entityType && action) {
    hasPermissionResult = canPerformAction(entityType, action);
  } else if (role) {
    hasPermissionResult = hasMinimumRole(role);
  } else if (permission) {
    hasPermissionResult = hasSpacePermission(permission);
  }

  // Calculate final disabled state
  const isDisabled = externalDisabled || !hasPermissionResult;

  // Hide button if no permission and hideWhenDisabled is true
  if (hideWhenDisabled && !hasPermissionResult) {
    return null;
  }

  // Build className
  const finalClassName = [
    className,
    isDisabled && !hasPermissionResult ? disabledClassName : ''
  ].filter(Boolean).join(' ');

  // Build title
  const finalTitle = !hasPermissionResult ? disabledTitle : title;

  return (
    <button
      type={type}
      className={finalClassName}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      title={finalTitle}
      aria-disabled={isDisabled}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

ProtectedButton.propTypes = {
  permission: PropTypes.string,
  action: PropTypes.string,
  entityType: PropTypes.string,
  role: PropTypes.oneOf(['owner', 'admin', 'member', 'viewer']),
  resource: PropTypes.object,
  resourcePermission: PropTypes.oneOf(['admin', 'edit', 'view']),
  hideWhenDisabled: PropTypes.bool,
  disabledTitle: PropTypes.string,
  disabledClassName: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  children: PropTypes.node.isRequired
};

/**
 * Protected icon button variant
 * Same as ProtectedButton but with icon-specific styling defaults
 */
export function ProtectedIconButton({
  className = '',
  disabledClassName = 'opacity-50 cursor-not-allowed',
  ...props
}) {
  return (
    <ProtectedButton
      className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
      disabledClassName={disabledClassName}
      {...props}
    />
  );
}

ProtectedIconButton.propTypes = {
  className: PropTypes.string,
  disabledClassName: PropTypes.string
};

/**
 * Protected action menu item
 * For use in dropdown menus with permission checks
 */
export function ProtectedMenuItem({
  permission,
  action,
  entityType,
  role,
  resource,
  resourcePermission,
  hideWhenDisabled = true, // Menu items typically hide instead of disable
  onClick,
  icon: Icon,
  className = '',
  disabledClassName = 'opacity-50 cursor-not-allowed',
  children,
  ...menuItemProps
}) {
  const { hasSpacePermission, canPerformAction } = usePermission();
  const { hasMinimumRole } = useSpaceRole();
  const resourceAccess = useResourceAccess(resource);

  // Determine permission
  let hasPermissionResult = true;

  if (resource && resourcePermission) {
    hasPermissionResult = resourceAccess.hasResourcePermission(resourcePermission);
  } else if (entityType && action) {
    hasPermissionResult = canPerformAction(entityType, action);
  } else if (role) {
    hasPermissionResult = hasMinimumRole(role);
  } else if (permission) {
    hasPermissionResult = hasSpacePermission(permission);
  }

  if (hideWhenDisabled && !hasPermissionResult) {
    return null;
  }

  const finalClassName = [
    'flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left',
    className,
    !hasPermissionResult ? disabledClassName : ''
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={finalClassName}
      onClick={hasPermissionResult ? onClick : undefined}
      disabled={!hasPermissionResult}
      {...menuItemProps}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{children}</span>
    </button>
  );
}

ProtectedMenuItem.propTypes = {
  permission: PropTypes.string,
  action: PropTypes.string,
  entityType: PropTypes.string,
  role: PropTypes.oneOf(['owner', 'admin', 'member', 'viewer']),
  resource: PropTypes.object,
  resourcePermission: PropTypes.oneOf(['admin', 'edit', 'view']),
  hideWhenDisabled: PropTypes.bool,
  onClick: PropTypes.func,
  icon: PropTypes.elementType,
  className: PropTypes.string,
  disabledClassName: PropTypes.string,
  children: PropTypes.node.isRequired
};

/**
 * Protected link component
 * For navigation links that should be disabled based on permissions
 */
export function ProtectedLink({
  permission,
  action,
  entityType,
  role,
  resource,
  resourcePermission,
  hideWhenDisabled = false,
  disabledTitle = 'You do not have permission to access this page',
  href,
  onClick,
  className = '',
  disabledClassName = 'opacity-50 cursor-not-allowed pointer-events-none',
  children,
  ...linkProps
}) {
  const { hasSpacePermission, canPerformAction } = usePermission();
  const { hasMinimumRole } = useSpaceRole();
  const resourceAccess = useResourceAccess(resource);

  let hasPermissionResult = true;

  if (resource && resourcePermission) {
    hasPermissionResult = resourceAccess.hasResourcePermission(resourcePermission);
  } else if (entityType && action) {
    hasPermissionResult = canPerformAction(entityType, action);
  } else if (role) {
    hasPermissionResult = hasMinimumRole(role);
  } else if (permission) {
    hasPermissionResult = hasSpacePermission(permission);
  }

  if (hideWhenDisabled && !hasPermissionResult) {
    return null;
  }

  const finalClassName = [
    className,
    !hasPermissionResult ? disabledClassName : ''
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!hasPermissionResult) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <a
      href={hasPermissionResult ? href : undefined}
      className={finalClassName}
      onClick={handleClick}
      title={!hasPermissionResult ? disabledTitle : undefined}
      aria-disabled={!hasPermissionResult}
      {...linkProps}
    >
      {children}
    </a>
  );
}

ProtectedLink.propTypes = {
  permission: PropTypes.string,
  action: PropTypes.string,
  entityType: PropTypes.string,
  role: PropTypes.oneOf(['owner', 'admin', 'member', 'viewer']),
  resource: PropTypes.object,
  resourcePermission: PropTypes.oneOf(['admin', 'edit', 'view']),
  hideWhenDisabled: PropTypes.bool,
  disabledTitle: PropTypes.string,
  href: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
  disabledClassName: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default ProtectedButton;
