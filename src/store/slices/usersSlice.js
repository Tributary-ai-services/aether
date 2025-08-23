import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';
import { PERMISSIONS } from '../../utils/permissions.js';

// Mock user data with proper relationships - matches backend UserResponse structure
const mockUsers = [
  {
    id: '1',
    email: 'john@acme.com',
    username: 'john.doe',
    fullName: 'John Doe', // Backend field name
    avatarUrl: null, // Backend field name
    status: 'active',
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2024-08-08T14:30:00Z',
    // Extended profile data (not part of backend UserResponse)
    profile: {
      title: 'Senior Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      timezone: 'America/Los_Angeles',
      phone: '+1-555-0123',
      bio: 'Passionate about AI and machine learning applications.',
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          desktop: false
        },
        language: 'en-US'
      }
    }
  },
  {
    id: '2',
    email: 'jane@acme.com',
    username: 'jane.smith',
    fullName: 'Jane Smith',
    avatarUrl: null,
    status: 'active',
    createdAt: '2023-06-16T09:00:00Z',
    updatedAt: '2024-08-07T16:45:00Z',
    profile: {
      title: 'Data Scientist',
      department: 'Data Science',
      location: 'Austin, TX',
      timezone: 'America/Chicago',
      phone: '+1-555-0124',
      bio: 'Expert in machine learning and statistical analysis.',
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
          desktop: true
        },
        language: 'en-US'
      }
    }
  },
  {
    id: '3',
    email: 'bob@acme.com',
    username: 'bob.wilson',
    fullName: 'Bob Wilson',
    avatarUrl: null,
    status: 'active',
    createdAt: '2023-07-01T14:00:00Z',
    updatedAt: '2024-08-06T11:20:00Z',
    profile: {
      title: 'Product Manager',
      department: 'Product',
      location: 'New York, NY',
      timezone: 'America/New_York',
      phone: '+1-555-0125',
      bio: 'Building the future of AI-powered productivity tools.',
      preferences: {
        theme: 'system',
        notifications: {
          email: false,
          push: true,
          desktop: true
        },
        language: 'en-US'
      }
    }
  }
];

// Mock user relationships - centralized mapping
const mockUserRelationships = {
  '1': {
    organizations: [
      { organizationId: '1', role: PERMISSIONS.ENTITY_ROLES.OWNER, joinedAt: '2023-06-15T10:00:00Z' },
      { organizationId: '2', role: PERMISSIONS.ENTITY_ROLES.ADMIN, joinedAt: '2023-09-01T12:00:00Z' }
    ],
    teams: [
      { teamId: '1', role: PERMISSIONS.ENTITY_ROLES.OWNER, organizationId: '1', joinedAt: '2023-06-15T10:00:00Z' },
      { teamId: '3', role: PERMISSIONS.ENTITY_ROLES.ADMIN, organizationId: '1', joinedAt: '2023-07-01T10:00:00Z' }
    ],
    notebooks: [
      { notebookId: 'nb-1', permission: PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN, source: 'owner' },
      { notebookId: 'nb-2', permission: PERMISSIONS.RESOURCE_PERMISSIONS.EDIT, source: 'shared' }
    ]
  },
  '2': {
    organizations: [
      { organizationId: '1', role: PERMISSIONS.ENTITY_ROLES.ADMIN, joinedAt: '2023-06-16T09:00:00Z' }
    ],
    teams: [
      { teamId: '1', role: PERMISSIONS.ENTITY_ROLES.ADMIN, organizationId: '1', joinedAt: '2023-06-16T09:00:00Z' },
      { teamId: '2', role: PERMISSIONS.ENTITY_ROLES.MEMBER, organizationId: '1', joinedAt: '2023-06-20T14:00:00Z' }
    ],
    notebooks: [
      { notebookId: 'nb-2', permission: PERMISSIONS.RESOURCE_PERMISSIONS.ADMIN, source: 'owner' },
      { notebookId: 'nb-1', permission: PERMISSIONS.RESOURCE_PERMISSIONS.VIEW, source: 'team' }
    ]
  },
  '3': {
    organizations: [
      { organizationId: '1', role: PERMISSIONS.ENTITY_ROLES.MEMBER, joinedAt: '2023-07-01T14:00:00Z' }
    ],
    teams: [
      { teamId: '1', role: PERMISSIONS.ENTITY_ROLES.MEMBER, organizationId: '1', joinedAt: '2023-07-01T14:00:00Z' }
    ],
    notebooks: [
      { notebookId: 'nb-1', permission: PERMISSIONS.RESOURCE_PERMISSIONS.VIEW, source: 'team' }
    ]
  }
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await aetherApi.users.getAll(params).catch(() => {
        console.log('Using mock users data');
        return { data: mockUsers };
      });
      return response.data;
    } catch (error) {
      console.log('Using mock users data due to error');
      return mockUsers;
    }
  }
);

export const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.users.get(userId).catch(() => {
        console.log('Using mock user data');
        const user = mockUsers.find(u => u.id === userId);
        return { data: user };
      });
      return response.data;
    } catch (error) {
      console.log('Using mock user data due to error');
      const user = mockUsers.find(u => u.id === userId);
      return user || rejectWithValue('User not found');
    }
  }
);

export const fetchUserRelationships = createAsyncThunk(
  'users/fetchUserRelationships',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.users.getRelationships(userId).catch(() => {
        console.log('Using mock user relationships data');
        return { data: mockUserRelationships[userId] || { organizations: [], teams: [], notebooks: [] } };
      });
      return { userId, relationships: response.data };
    } catch (error) {
      console.log('Using mock user relationships data due to error');
      return { userId, relationships: mockUserRelationships[userId] || { organizations: [], teams: [], notebooks: [] } };
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, updates }, { getState, rejectWithValue }) => {
    try {
      const response = await aetherApi.users.update(userId, updates).catch(() => {
        console.log('Using mock update user');
        const state = getState();
        const user = state.users.users.find(u => u.id === userId);
        const updatedUser = {
          ...user,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        return { data: updatedUser };
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'users/updateUserProfile',
  async ({ userId, profileUpdates }, { getState, rejectWithValue }) => {
    try {
      const response = await aetherApi.users.updateProfile(userId, profileUpdates).catch(() => {
        console.log('Using mock update user profile');
        const state = getState();
        const user = state.users.users.find(u => u.id === userId);
        const updatedUser = {
          ...user,
          profile: { ...user.profile, ...profileUpdates },
          updatedAt: new Date().toISOString()
        };
        return { data: updatedUser };
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await aetherApi.users.search(searchParams).catch(() => {
        console.log('Using mock user search');
        const { query, organizationId, teamId } = searchParams;
        
        let filteredUsers = mockUsers;
        
        // Filter by search query
        if (query) {
          filteredUsers = filteredUsers.filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
          );
        }
        
        // Filter by organization membership
        if (organizationId) {
          filteredUsers = filteredUsers.filter(user => 
            mockUserRelationships[user.id]?.organizations?.some(org => org.organizationId === organizationId)
          );
        }
        
        // Filter by team membership
        if (teamId) {
          filteredUsers = filteredUsers.filter(user => 
            mockUserRelationships[user.id]?.teams?.some(team => team.teamId === teamId)
          );
        }
        
        return { data: filteredUsers };
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Helper async thunk to get user context for permission checking
export const fetchUserContext = createAsyncThunk(
  'users/fetchUserContext',
  async ({ userId, resourceType, resourceId }, { getState, dispatch, rejectWithValue }) => {
    try {
      // Fetch user relationships if not already loaded
      if (!getState().users.userRelationships[userId]) {
        await dispatch(fetchUserRelationships(userId));
      }
      
      const relationships = getState().users.userRelationships[userId];
      if (!relationships) {
        return rejectWithValue('User relationships not found');
      }
      
      const context = {
        userId,
        organizationRole: null,
        organizationId: null,
        teamRole: null,
        teamId: null,
        resourcePermission: null
      };
      
      // Determine context based on resource type
      if (resourceType === 'organization' && resourceId) {
        const orgMembership = relationships.organizations.find(org => org.organizationId === resourceId);
        if (orgMembership) {
          context.organizationRole = orgMembership.role;
          context.organizationId = resourceId;
        }
      } else if (resourceType === 'team' && resourceId) {
        const teamMembership = relationships.teams.find(team => team.teamId === resourceId);
        if (teamMembership) {
          context.teamRole = teamMembership.role;
          context.teamId = resourceId;
          context.organizationId = teamMembership.organizationId;
          
          // Also get organization role
          const orgMembership = relationships.organizations.find(org => org.organizationId === teamMembership.organizationId);
          if (orgMembership) {
            context.organizationRole = orgMembership.role;
          }
        }
      } else if (resourceType === 'notebook' && resourceId) {
        const notebookAccess = relationships.notebooks.find(nb => nb.notebookId === resourceId);
        if (notebookAccess) {
          context.resourcePermission = notebookAccess.permission;
        }
      }
      
      return context;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    // Core user data
    users: [],
    currentUser: null,
    
    // Relationship mappings
    userRelationships: {}, // { userId: { organizations: [], teams: [], notebooks: [] } }
    
    // Search and filtering
    searchResults: [],
    searchLoading: false,
    
    // Loading states
    loading: false,
    relationshipsLoading: {},
    
    // Error handling
    error: null,
    searchError: null,
    
    // User context for permissions (cached)
    userContexts: {}, // { userId: { organizationRole, teamRole, etc } }
    
    // Pagination
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      hasMore: true
    }
  },
  reducers: {
    clearUsersError: (state) => {
      state.error = null;
    },
    clearSearchError: (state) => {
      state.searchError = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    updateUserInList: (state, action) => {
      const { userId, updates } = action.payload;
      const userIndex = state.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        state.users[userIndex] = { ...state.users[userIndex], ...updates };
      }
    },
    cacheUserContext: (state, action) => {
      const { userId, context } = action.payload;
      state.userContexts[userId] = context;
    },
    invalidateUserContext: (state, action) => {
      const userId = action.payload;
      delete state.userContexts[userId];
      delete state.userRelationships[userId];
    },
    // Sync actions for cross-slice updates
    addUserToOrganization: (state, action) => {
      const { userId, organizationId, role, joinedAt } = action.payload;
      if (!state.userRelationships[userId]) {
        state.userRelationships[userId] = { organizations: [], teams: [], notebooks: [] };
      }
      const existing = state.userRelationships[userId].organizations.findIndex(
        org => org.organizationId === organizationId
      );
      if (existing === -1) {
        state.userRelationships[userId].organizations.push({
          organizationId,
          role,
          joinedAt: joinedAt || new Date().toISOString()
        });
      } else {
        state.userRelationships[userId].organizations[existing] = {
          organizationId,
          role,
          joinedAt: joinedAt || state.userRelationships[userId].organizations[existing].joinedAt
        };
      }
      // Invalidate cached context
      delete state.userContexts[userId];
    },
    removeUserFromOrganization: (state, action) => {
      const { userId, organizationId } = action.payload;
      if (state.userRelationships[userId]) {
        state.userRelationships[userId].organizations = state.userRelationships[userId].organizations.filter(
          org => org.organizationId !== organizationId
        );
        // Also remove from teams in that organization
        state.userRelationships[userId].teams = state.userRelationships[userId].teams.filter(
          team => team.organizationId !== organizationId
        );
      }
      // Invalidate cached context
      delete state.userContexts[userId];
    },
    addUserToTeam: (state, action) => {
      const { userId, teamId, role, organizationId, joinedAt } = action.payload;
      if (!state.userRelationships[userId]) {
        state.userRelationships[userId] = { organizations: [], teams: [], notebooks: [] };
      }
      const existing = state.userRelationships[userId].teams.findIndex(
        team => team.teamId === teamId
      );
      if (existing === -1) {
        state.userRelationships[userId].teams.push({
          teamId,
          role,
          organizationId,
          joinedAt: joinedAt || new Date().toISOString()
        });
      } else {
        state.userRelationships[userId].teams[existing] = {
          teamId,
          role,
          organizationId,
          joinedAt: joinedAt || state.userRelationships[userId].teams[existing].joinedAt
        };
      }
      // Invalidate cached context
      delete state.userContexts[userId];
    },
    removeUserFromTeam: (state, action) => {
      const { userId, teamId } = action.payload;
      if (state.userRelationships[userId]) {
        state.userRelationships[userId].teams = state.userRelationships[userId].teams.filter(
          team => team.teamId !== teamId
        );
      }
      // Invalidate cached context
      delete state.userContexts[userId];
    },
    updateUserResourcePermission: (state, action) => {
      const { userId, resourceId, permission, source } = action.payload;
      if (!state.userRelationships[userId]) {
        state.userRelationships[userId] = { organizations: [], teams: [], notebooks: [] };
      }
      const existing = state.userRelationships[userId].notebooks.findIndex(
        nb => nb.notebookId === resourceId
      );
      if (existing === -1) {
        state.userRelationships[userId].notebooks.push({
          notebookId: resourceId,
          permission,
          source: source || 'shared'
        });
      } else {
        state.userRelationships[userId].notebooks[existing] = {
          notebookId: resourceId,
          permission,
          source: source || state.userRelationships[userId].notebooks[existing].source
        };
      }
      // Invalidate cached context
      delete state.userContexts[userId];
    },
    removeUserResourcePermission: (state, action) => {
      const { userId, resourceId } = action.payload;
      if (state.userRelationships[userId]) {
        state.userRelationships[userId].notebooks = state.userRelationships[userId].notebooks.filter(
          nb => nb.notebookId !== resourceId
        );
      }
      // Invalidate cached context
      delete state.userContexts[userId];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch single user
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        const user = action.payload;
        const existingIndex = state.users.findIndex(u => u.id === user.id);
        if (existingIndex !== -1) {
          state.users[existingIndex] = user;
        } else {
          state.users.push(user);
        }
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch user relationships
      .addCase(fetchUserRelationships.pending, (state, action) => {
        const userId = action.meta.arg;
        state.relationshipsLoading[userId] = true;
      })
      .addCase(fetchUserRelationships.fulfilled, (state, action) => {
        const { userId, relationships } = action.payload;
        state.relationshipsLoading[userId] = false;
        state.userRelationships[userId] = relationships;
      })
      .addCase(fetchUserRelationships.rejected, (state, action) => {
        const userId = action.meta.arg;
        state.relationshipsLoading[userId] = false;
        state.error = action.payload;
      })
      
      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        const existingIndex = state.users.findIndex(u => u.id === updatedUser.id);
        if (existingIndex !== -1) {
          state.users[existingIndex] = updatedUser;
        }
        if (state.currentUser?.id === updatedUser.id) {
          state.currentUser = updatedUser;
        }
      })
      
      // Update user profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        const existingIndex = state.users.findIndex(u => u.id === updatedUser.id);
        if (existingIndex !== -1) {
          state.users[existingIndex] = updatedUser;
        }
        if (state.currentUser?.id === updatedUser.id) {
          state.currentUser = updatedUser;
        }
      })
      
      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      })
      
      // Fetch user context
      .addCase(fetchUserContext.fulfilled, (state, action) => {
        const context = action.payload;
        state.userContexts[context.userId] = context;
      });
  },
});

export const {
  clearUsersError,
  clearSearchError,
  clearSearchResults,
  setCurrentUser,
  updateUserInList,
  cacheUserContext,
  invalidateUserContext,
  addUserToOrganization,
  removeUserFromOrganization,
  addUserToTeam,
  removeUserFromTeam,
  updateUserResourcePermission,
  removeUserResourcePermission
} = usersSlice.actions;

// Selectors
export const selectAllUsers = (state) => state.users.users;
export const selectCurrentUser = (state) => state.users.currentUser;
export const selectUserById = (userId) => (state) => state.users.users.find(u => u.id === userId);
export const selectUserRelationships = (userId) => (state) => state.users.userRelationships[userId];
export const selectUserContext = (userId) => (state) => state.users.userContexts[userId];
export const selectSearchResults = (state) => state.users.searchResults;
export const selectUsersLoading = (state) => state.users.loading;
export const selectSearchLoading = (state) => state.users.searchLoading;
export const selectUsersError = (state) => state.users.error;
export const selectSearchError = (state) => state.users.searchError;

// Complex selectors
export const selectUsersInOrganization = (organizationId) => (state) => {
  return state.users.users.filter(user => 
    state.users.userRelationships[user.id]?.organizations?.some(org => org.organizationId === organizationId)
  );
};

export const selectUsersInTeam = (teamId) => (state) => {
  return state.users.users.filter(user => 
    state.users.userRelationships[user.id]?.teams?.some(team => team.teamId === teamId)
  );
};

export const selectUserOrganizations = (userId) => (state) => {
  return state.users.userRelationships[userId]?.organizations || [];
};

export const selectUserTeams = (userId) => (state) => {
  return state.users.userRelationships[userId]?.teams || [];
};

export const selectUserNotebooks = (userId) => (state) => {
  return state.users.userRelationships[userId]?.notebooks || [];
};

export const selectUserRoleInOrganization = (userId, organizationId) => (state) => {
  const relationships = state.users.userRelationships[userId];
  const orgMembership = relationships?.organizations?.find(org => org.organizationId === organizationId);
  return orgMembership?.role || null;
};

export const selectUserRoleInTeam = (userId, teamId) => (state) => {
  const relationships = state.users.userRelationships[userId];
  const teamMembership = relationships?.teams?.find(team => team.teamId === teamId);
  return teamMembership?.role || null;
};

export default usersSlice.reducer;