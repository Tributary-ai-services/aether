// Unified Permission Management System for Production
// Handles all role-based access control across Users, Organizations, Teams, and Resources

// Standardized permission constants
export const PERMISSIONS = {
  // Entity roles (Organizations, Teams)
  ENTITY_ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin', 
    MEMBER: 'member',
    VIEWER: 'viewer'
  },
  
  // Resource permissions (Notebooks, Documents)
  RESOURCE_PERMISSIONS: {
    ADMIN: 'admin',    // Can manage sharing, delete, full control
    EDIT: 'edit',      // Can edit content and settings
    VIEW: 'view'       // Read-only access
  },
  
  // System-wide actions
  ACTIONS: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    SHARE: 'share',
    INVITE: 'invite',
    MANAGE_MEMBERS: 'manage_members',
    MANAGE_BILLING: 'manage_billing',
    MANAGE_SETTINGS: 'manage_settings'
  }
};

// Permission hierarchy - higher roles inherit lower role permissions
export const PERMISSION_HIERARCHY = {
  [PERMISSIONS.ENTITY_ROLES.OWNER]: [
    PERMISSIONS.ENTITY_ROLES.ADMIN,
    PERMISSIONS.ENTITY_ROLES.MEMBER,
    PERMISSIONS.ENTITY_ROLES.VIEWER,
    PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN,
    PERMISSIONS.RESOURCE_PERMISSIONS.EDIT,
    PERMISSIONS.RESOURCE_PERMISSIONS.VIEW
  ],
  [PERMISSIONS.ENTITY_ROLES.ADMIN]: [
    PERMISSIONS.ENTITY_ROLES.MEMBER,
    PERMISSIONS.ENTITY_ROLES.VIEWER,
    PERMISSIONS.RESOURCE_PERMISSIONS.EDIT,
    PERMISSIONS.RESOURCE_PERMISSIONS.VIEW
  ],
  [PERMISSIONS.ENTITY_ROLES.MEMBER]: [
    PERMISSIONS.ENTITY_ROLES.VIEWER,
    PERMISSIONS.RESOURCE_PERMISSIONS.VIEW
  ],
  [PERMISSIONS.ENTITY_ROLES.VIEWER]: [
    PERMISSIONS.RESOURCE_PERMISSIONS.VIEW
  ],
  [PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN]: [
    PERMISSIONS.RESOURCE_PERMISSIONS.EDIT,
    PERMISSIONS.RESOURCE_PERMISSIONS.VIEW
  ],
  [PERMISSIONS.RESOURCE_PERMISSIONS.EDIT]: [
    PERMISSIONS.RESOURCE_PERMISSIONS.VIEW
  ],
  [PERMISSIONS.RESOURCE_PERMISSIONS.VIEW]: []
};

// Role-based action permissions
export const ROLE_ACTION_MATRIX = {
  // Organization-level actions
  ORGANIZATION: {
    [PERMISSIONS.ENTITY_ROLES.OWNER]: [
      PERMISSIONS.ACTIONS.CREATE,
      PERMISSIONS.ACTIONS.READ,
      PERMISSIONS.ACTIONS.UPDATE,
      PERMISSIONS.ACTIONS.DELETE,
      PERMISSIONS.ACTIONS.INVITE,
      PERMISSIONS.ACTIONS.MANAGE_MEMBERS,
      PERMISSIONS.ACTIONS.MANAGE_BILLING,
      PERMISSIONS.ACTIONS.MANAGE_SETTINGS
    ],
    [PERMISSIONS.ENTITY_ROLES.ADMIN]: [
      PERMISSIONS.ACTIONS.READ,
      PERMISSIONS.ACTIONS.UPDATE,
      PERMISSIONS.ACTIONS.INVITE,
      PERMISSIONS.ACTIONS.MANAGE_MEMBERS,
      PERMISSIONS.ACTIONS.MANAGE_SETTINGS
    ],
    [PERMISSIONS.ENTITY_ROLES.MEMBER]: [
      PERMISSIONS.ACTIONS.READ
    ]
  },
  
  // Team-level actions
  TEAM: {
    [PERMISSIONS.ENTITY_ROLES.OWNER]: [
      PERMISSIONS.ACTIONS.CREATE,
      PERMISSIONS.ACTIONS.READ,
      PERMISSIONS.ACTIONS.UPDATE,
      PERMISSIONS.ACTIONS.DELETE,
      PERMISSIONS.ACTIONS.INVITE,
      PERMISSIONS.ACTIONS.MANAGE_MEMBERS,
      PERMISSIONS.ACTIONS.SHARE
    ],
    [PERMISSIONS.ENTITY_ROLES.ADMIN]: [
      PERMISSIONS.ACTIONS.READ,
      PERMISSIONS.ACTIONS.UPDATE,
      PERMISSIONS.ACTIONS.INVITE,
      PERMISSIONS.ACTIONS.MANAGE_MEMBERS,
      PERMISSIONS.ACTIONS.SHARE
    ],
    [PERMISSIONS.ENTITY_ROLES.MEMBER]: [
      PERMISSIONS.ACTIONS.READ,
      PERMISSIONS.ACTIONS.SHARE
    ],
    [PERMISSIONS.ENTITY_ROLES.VIEWER]: [
      PERMISSIONS.ACTIONS.READ
    ]
  },
  
  // Resource-level actions (Notebooks)
  RESOURCE: {
    [PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN]: [
      PERMISSIONS.ACTIONS.READ,
      PERMISSIONS.ACTIONS.UPDATE,
      PERMISSIONS.ACTIONS.DELETE,
      PERMISSIONS.ACTIONS.SHARE,
      PERMISSIONS.ACTIONS.MANAGE_SETTINGS
    ],
    [PERMISSIONS.RESOURCE_PERMISSIONS.EDIT]: [
      PERMISSIONS.ACTIONS.READ,
      PERMISSIONS.ACTIONS.UPDATE
    ],
    [PERMISSIONS.RESOURCE_PERMISSIONS.VIEW]: [
      PERMISSIONS.ACTIONS.READ
    ]
  }
};

/**
 * Central Permission Manager Class
 * Handles all permission validation across the application
 */
export class PermissionManager {
  
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(userRole, requiredPermission) {
    if (!userRole || !requiredPermission) return false;
    
    if (userRole === requiredPermission) return true;
    
    const userPermissions = PERMISSION_HIERARCHY[userRole] || [];
    return userPermissions.includes(requiredPermission);
  }
  
  /**
   * Check if a user can perform an action on an entity
   */
  static canPerformAction(userRole, entityType, action) {
    if (!userRole || !entityType || !action) return false;
    
    const roleActions = ROLE_ACTION_MATRIX[entityType.toUpperCase()]?.[userRole] || [];
    return roleActions.includes(action);
  }
  
  /**
   * Get effective permissions for a user on a resource
   * Considers inheritance from Organization -> Team -> Resource
   */
  static getEffectivePermissions(user, resource, context = {}) {
    const permissions = new Set();
    
    // Add direct resource permissions
    if (resource.permissions && resource.permissions[user.id]) {
      permissions.add(resource.permissions[user.id]);
    }
    
    // Add team-inherited permissions
    if (context.teamRole) {
      const teamPerms = PERMISSION_HIERARCHY[context.teamRole] || [];
      teamPerms.forEach(perm => permissions.add(perm));
    }
    
    // Add organization-inherited permissions
    if (context.organizationRole) {
      const orgPerms = PERMISSION_HIERARCHY[context.organizationRole] || [];
      orgPerms.forEach(perm => permissions.add(perm));
    }
    
    // Resource owner gets admin permissions
    if (resource.ownerId === user.id) {
      permissions.add(PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN);
      const adminPerms = PERMISSION_HIERARCHY[PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN] || [];
      adminPerms.forEach(perm => permissions.add(perm));
    }
    
    return Array.from(permissions);
  }
  
  /**
   * Check if user can access a specific resource
   */
  static canAccessResource(user, resource, requiredPermission, context = {}) {
    if (!user || !resource || !requiredPermission) return false;
    
    // System admin override
    if (user.systemRole === 'admin') return true;
    
    // Resource owner check
    if (resource.ownerId === user.id) return true;
    
    const effectivePermissions = this.getEffectivePermissions(user, resource, context);
    return effectivePermissions.some(perm => 
      perm === requiredPermission || this.hasPermission(perm, requiredPermission)
    );
  }
  
  /**
   * Check if user can share a notebook
   */
  static canUserShareNotebook(user, notebook, context = {}) {
    return this.canAccessResource(
      user, 
      notebook, 
      PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN,
      context
    ) || this.canPerformAction(
      context.teamRole, 
      'TEAM', 
      PERMISSIONS.ACTIONS.SHARE
    );
  }
  
  /**
   * Check if user can manage team members
   */
  static canUserManageTeam(user, team, context = {}) {
    if (!user || !team) return false;
    
    // Team owner/admin can manage
    if (context.teamRole === PERMISSIONS.ENTITY_ROLES.OWNER || 
        context.teamRole === PERMISSIONS.ENTITY_ROLES.ADMIN) {
      return true;
    }
    
    // Organization admin can manage teams
    if (context.organizationRole === PERMISSIONS.ENTITY_ROLES.OWNER ||
        context.organizationRole === PERMISSIONS.ENTITY_ROLES.ADMIN) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if user can manage organization
   */
  static canUserManageOrganization(user, organization, context = {}) {
    if (!user || !organization) return false;
    
    return context.organizationRole === PERMISSIONS.ENTITY_ROLES.OWNER ||
           context.organizationRole === PERMISSIONS.ENTITY_ROLES.ADMIN;
  }
  
  /**
   * Check if user can invite members to entity
   */
  static canUserInviteMembers(userRole, entityType) {
    return this.canPerformAction(userRole, entityType, PERMISSIONS.ACTIONS.INVITE);
  }
  
  /**
   * Get the highest role among multiple roles
   */
  static getHighestRole(roles) {
    const roleHierarchy = [
      PERMISSIONS.ENTITY_ROLES.OWNER,
      PERMISSIONS.ENTITY_ROLES.ADMIN,
      PERMISSIONS.ENTITY_ROLES.MEMBER,
      PERMISSIONS.ENTITY_ROLES.VIEWER
    ];
    
    for (const role of roleHierarchy) {
      if (roles.includes(role)) return role;
    }
    
    return PERMISSIONS.ENTITY_ROLES.VIEWER;
  }
  
  /**
   * Validate permission consistency across hierarchy
   */
  static validatePermissionConsistency(user, resource, context = {}) {
    const issues = [];
    
    // Check if user has team access but not organization access
    if (context.teamRole && !context.organizationRole) {
      issues.push('User has team role but no organization membership');
    }
    
    // Check if resource team permissions are consistent with user team role
    if (resource.teamIds && context.teamRole) {
      const hasTeamAccess = resource.teamIds.some(teamId => 
        context.userTeams?.[teamId] === context.teamRole
      );
      if (!hasTeamAccess) {
        issues.push('Resource team access inconsistent with user team role');
      }
    }
    
    return issues;
  }
  
  /**
   * Get all users who have specific permission on a resource
   */
  static getUsersWithPermission(resource, requiredPermission, allUsers = [], context = {}) {
    return allUsers.filter(user => 
      this.canAccessResource(user, resource, requiredPermission, context)
    );
  }
  
  /**
   * Convert legacy permission to new system
   */
  static migrateLegacyPermission(oldPermission) {
    const migrationMap = {
      // Notebook sharing legacy permissions
      'view': PERMISSIONS.RESOURCE_PERMISSIONS.VIEW,
      'edit': PERMISSIONS.RESOURCE_PERMISSIONS.EDIT,
      'admin': PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN,
      
      // Team/Org legacy roles
      'owner': PERMISSIONS.ENTITY_ROLES.OWNER,
      'admin': PERMISSIONS.ENTITY_ROLES.ADMIN,
      'member': PERMISSIONS.ENTITY_ROLES.MEMBER,
      'viewer': PERMISSIONS.ENTITY_ROLES.VIEWER
    };
    
    return migrationMap[oldPermission] || oldPermission;
  }
}

// Utility functions for common permission checks
export const PermissionUtils = {
  
  /**
   * Check if user is owner of any entity
   */
  isOwner: (userRole) => userRole === PERMISSIONS.ENTITY_ROLES.OWNER,
  
  /**
   * Check if user is admin or higher
   */
  isAdminOrHigher: (userRole) => PermissionManager.hasPermission(
    userRole, 
    PERMISSIONS.ENTITY_ROLES.ADMIN
  ),
  
  /**
   * Check if user can edit resources
   */
  canEdit: (userPermission) => PermissionManager.hasPermission(
    userPermission,
    PERMISSIONS.RESOURCE_PERMISSIONS.EDIT
  ),
  
  /**
   * Check if user has read access
   */
  canView: (userPermission) => PermissionManager.hasPermission(
    userPermission,
    PERMISSIONS.RESOURCE_PERMISSIONS.VIEW
  ),
  
  /**
   * Get display name for permission
   */
  getPermissionDisplayName: (permission) => {
    const displayNames = {
      [PERMISSIONS.ENTITY_ROLES.OWNER]: 'Owner',
      [PERMISSIONS.ENTITY_ROLES.ADMIN]: 'Admin',
      [PERMISSIONS.ENTITY_ROLES.MEMBER]: 'Member',
      [PERMISSIONS.ENTITY_ROLES.VIEWER]: 'Viewer',
      [PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN]: 'Admin',
      [PERMISSIONS.RESOURCE_PERMISSIONS.EDIT]: 'Edit',
      [PERMISSIONS.RESOURCE_PERMISSIONS.VIEW]: 'View'
    };
    
    return displayNames[permission] || permission;
  }
};

export default PermissionManager;