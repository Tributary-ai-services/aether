// Cross-slice synchronization middleware
// Ensures data consistency across Users, Organizations, Teams, and Resources

import { 
  addUserToOrganization,
  removeUserFromOrganization,
  addUserToTeam,
  removeUserFromTeam,
  updateUserResourcePermission,
  removeUserResourcePermission
} from '../slices/usersSlice.js';

/**
 * Middleware to handle cross-slice data synchronization
 * This ensures that when data changes in one slice, related data in other slices is updated
 */
export const syncMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();
  
  // Handle organization member changes
  if (action.type === 'organizations/inviteOrganizationMember/fulfilled') {
    const { orgId, member } = action.payload;
    store.dispatch(addUserToOrganization({
      userId: member.userId,
      organizationId: orgId,
      role: member.role,
      joinedAt: member.joinedAt
    }));
  }
  
  if (action.type === 'organizations/removeOrganizationMember/fulfilled') {
    const { orgId, userId } = action.payload;
    store.dispatch(removeUserFromOrganization({
      userId,
      organizationId: orgId
    }));
  }
  
  if (action.type === 'organizations/updateOrganizationMemberRole/fulfilled') {
    const { orgId, userId, role } = action.payload;
    store.dispatch(addUserToOrganization({
      userId,
      organizationId: orgId,
      role,
      joinedAt: state.users.userRelationships[userId]?.organizations
        ?.find(org => org.organizationId === orgId)?.joinedAt || new Date().toISOString()
    }));
  }
  
  // Handle team member changes
  if (action.type === 'teams/inviteTeamMember/fulfilled') {
    const { teamId, member } = action.payload;
    const team = state.teams.teams.find(t => t.id === teamId);
    store.dispatch(addUserToTeam({
      userId: member.userId,
      teamId,
      role: member.role,
      organizationId: team?.organizationId,
      joinedAt: member.joinedAt
    }));
  }
  
  if (action.type === 'teams/removeTeamMember/fulfilled') {
    const { teamId, userId } = action.payload;
    store.dispatch(removeUserFromTeam({
      userId,
      teamId
    }));
  }
  
  if (action.type === 'teams/updateTeamMemberRole/fulfilled') {
    const { teamId, userId, role } = action.payload;
    const team = state.teams.teams.find(t => t.id === teamId);
    store.dispatch(addUserToTeam({
      userId,
      teamId,
      role,
      organizationId: team?.organizationId,
      joinedAt: state.users.userRelationships[userId]?.teams
        ?.find(team => team.teamId === teamId)?.joinedAt || new Date().toISOString()
    }));
  }
  
  // Handle notebook sharing changes
  if (action.type === 'notebooks/shareNotebookWithUser/fulfilled') {
    const { notebookId, userId, permission } = action.payload;
    store.dispatch(updateUserResourcePermission({
      userId,
      resourceId: notebookId,
      permission,
      source: 'shared'
    }));
  }
  
  if (action.type === 'notebooks/unshareNotebookFromUser/fulfilled') {
    const { notebookId, userId } = action.payload;
    store.dispatch(removeUserResourcePermission({
      userId,
      resourceId: notebookId
    }));
  }
  
  if (action.type === 'notebooks/shareNotebookWithTeam/fulfilled') {
    const { notebookId, teamId, permission } = action.payload;
    // Update all team members' resource permissions
    const teamMembers = state.teams.teamMembers[teamId] || [];
    teamMembers.forEach(member => {
      store.dispatch(updateUserResourcePermission({
        userId: member.userId,
        resourceId: notebookId,
        permission,
        source: 'team'
      }));
    });
  }
  
  if (action.type === 'notebooks/unshareNotebookFromTeam/fulfilled') {
    const { notebookId, teamId } = action.payload;
    // Remove team-based access for all team members
    const teamMembers = state.teams.teamMembers[teamId] || [];
    teamMembers.forEach(member => {
      // Only remove if the access was team-based, not direct
      const userNotebooks = state.users.userRelationships[member.userId]?.notebooks || [];
      const notebookAccess = userNotebooks.find(nb => nb.notebookId === notebookId);
      if (notebookAccess && notebookAccess.source === 'team') {
        store.dispatch(removeUserResourcePermission({
          userId: member.userId,
          resourceId: notebookId
        }));
      }
    });
  }
  
  if (action.type === 'notebooks/shareNotebookWithOrganization/fulfilled') {
    const { notebookId, organizationId, permission } = action.payload;
    // Update all organization members' resource permissions
    const orgMembers = state.organizations.organizationMembers[organizationId] || [];
    orgMembers.forEach(member => {
      store.dispatch(updateUserResourcePermission({
        userId: member.userId,
        resourceId: notebookId,
        permission,
        source: 'organization'
      }));
    });
  }
  
  if (action.type === 'notebooks/unshareNotebookFromOrganization/fulfilled') {
    const { notebookId, organizationId } = action.payload;
    // Remove organization-based access for all organization members
    const orgMembers = state.organizations.organizationMembers[organizationId] || [];
    orgMembers.forEach(member => {
      // Only remove if the access was organization-based, not direct
      const userNotebooks = state.users.userRelationships[member.userId]?.notebooks || [];
      const notebookAccess = userNotebooks.find(nb => nb.notebookId === notebookId);
      if (notebookAccess && notebookAccess.source === 'organization') {
        store.dispatch(removeUserResourcePermission({
          userId: member.userId,
          resourceId: notebookId
        }));
      }
    });
  }
  
  // Handle cascading deletions
  if (action.type === 'organizations/deleteOrganization/fulfilled') {
    const orgId = action.payload;
    const orgMembers = state.organizations.organizationMembers[orgId] || [];
    
    // Remove all members from the organization
    orgMembers.forEach(member => {
      store.dispatch(removeUserFromOrganization({
        userId: member.userId,
        organizationId: orgId
      }));
    });
  }
  
  if (action.type === 'teams/deleteTeam/fulfilled') {
    const teamId = action.payload;
    const teamMembers = state.teams.teamMembers[teamId] || [];
    
    // Remove all members from the team
    teamMembers.forEach(member => {
      store.dispatch(removeUserFromTeam({
        userId: member.userId,
        teamId
      }));
    });
  }
  
  // Handle team creation/updates to maintain organization relationship
  if (action.type === 'teams/createTeam/fulfilled') {
    const team = action.payload;
    if (team.organizationId) {
      // Ensure team creator is added to the team
      const creatorId = team.createdBy;
      if (creatorId) {
        store.dispatch(addUserToTeam({
          userId: creatorId,
          teamId: team.id,
          role: 'owner',
          organizationId: team.organizationId,
          joinedAt: team.createdAt
        }));
      }
    }
  }
  
  // Validate data consistency
  if (process.env.NODE_ENV === 'development') {
    // Run consistency checks in development mode
    validateDataConsistency(store.getState());
  }
  
  return result;
};

/**
 * Validation function to check data consistency across slices
 * Logs warnings in development mode when inconsistencies are detected
 */
function validateDataConsistency(state) {
  const warnings = [];
  
  // Check if all team members have corresponding organization memberships
  Object.keys(state.teams.teamMembers).forEach(teamId => {
    const team = state.teams.teams.find(t => t.id === teamId);
    if (!team?.organizationId) {
      warnings.push(`Team ${teamId} missing organizationId`);
      return;
    }
    
    const teamMembers = state.teams.teamMembers[teamId] || [];
    teamMembers.forEach(member => {
      const userRelationships = state.users.userRelationships[member.userId];
      if (userRelationships) {
        const hasOrgMembership = userRelationships.organizations?.some(
          org => org.organizationId === team.organizationId
        );
        if (!hasOrgMembership) {
          warnings.push(`User ${member.userId} in team ${teamId} but not in organization ${team.organizationId}`);
        }
      }
    });
  });
  
  // Check if user relationships are consistent with organization/team memberships
  Object.keys(state.users.userRelationships).forEach(userId => {
    const relationships = state.users.userRelationships[userId];
    
    // Check organization memberships
    relationships.organizations?.forEach(orgMembership => {
      const orgMembers = state.organizations.organizationMembers[orgMembership.organizationId] || [];
      const hasOrgRecord = orgMembers.some(member => member.userId === userId);
      if (!hasOrgRecord) {
        warnings.push(`User ${userId} has organization relationship but no organization member record`);
      }
    });
    
    // Check team memberships
    relationships.teams?.forEach(teamMembership => {
      const teamMembers = state.teams.teamMembers[teamMembership.teamId] || [];
      const hasTeamRecord = teamMembers.some(member => member.userId === userId);
      if (!hasTeamRecord) {
        warnings.push(`User ${userId} has team relationship but no team member record`);
      }
    });
  });
  
  if (warnings.length > 0) {
    console.warn('Data consistency warnings:', warnings);
  }
}

export default syncMiddleware;