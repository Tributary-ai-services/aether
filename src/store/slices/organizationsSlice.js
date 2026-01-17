import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';
import { PERMISSIONS } from '../../utils/permissions.js';

// Mock organizations data following GitHub pattern
const mockOrganizations = [
  {
    id: '1',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    description: 'Leading provider of AI-powered enterprise solutions',
    avatarUrl: null,
    website: 'https://acme.com',
    location: 'San Francisco, CA',
    visibility: 'public',
    billing: {
      plan: 'enterprise',
      seats: 500,
      billingEmail: 'billing@acme.com'
    },
    settings: {
      membersCanCreateRepositories: true,
      membersCanCreateTeams: true,
      membersCanFork: true,
      defaultMemberPermissions: 'read',
      twoFactorRequired: true
    },
    memberCount: 47,
    teamCount: 12,
    repositoryCount: 156,
    userRole: PERMISSIONS.ENTITY_ROLES.OWNER,
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2024-08-08T14:30:00Z'
  },
  {
    id: '2',
    name: 'DataTech Labs',
    slug: 'datatech-labs',
    description: 'Research and development in machine learning',
    avatarUrl: null,
    website: 'https://datatech.io',
    location: 'Austin, TX',
    visibility: 'private',
    billing: {
      plan: 'pro',
      seats: 25,
      billingEmail: 'admin@datatech.io'
    },
    settings: {
      membersCanCreateRepositories: false,
      membersCanCreateTeams: false,
      membersCanFork: true,
      defaultMemberPermissions: 'read',
      twoFactorRequired: false
    },
    memberCount: 18,
    teamCount: 5,
    repositoryCount: 89,
    userRole: PERMISSIONS.ENTITY_ROLES.ADMIN,
    createdAt: '2023-09-22T15:30:00Z',
    updatedAt: '2024-08-07T11:45:00Z'
  }
];

// Standardized members data - removed redundant 'id' field, using userId as primary key
const mockMembers = {
  '1': [
    { 
      userId: '1', 
      name: 'John Doe', 
      email: 'john@acme.com', 
      role: PERMISSIONS.ENTITY_ROLES.OWNER,
      teams: ['1', '3'], // Use team IDs instead of names
      joinedAt: '2023-06-15T10:00:00Z',
      invitedBy: null,
      title: 'CEO',
      department: 'Executive' 
    },
    { 
      userId: '2', 
      name: 'Jane Smith', 
      email: 'jane@acme.com', 
      role: PERMISSIONS.ENTITY_ROLES.ADMIN,
      teams: ['1', '2'], // Use team IDs instead of names
      joinedAt: '2023-06-16T09:00:00Z',
      invitedBy: '1',
      title: 'CTO',
      department: 'Engineering' 
    },
    { 
      userId: '3', 
      name: 'Bob Wilson', 
      email: 'bob@acme.com', 
      role: PERMISSIONS.ENTITY_ROLES.MEMBER,
      teams: ['1'], // Use team IDs instead of names
      joinedAt: '2023-07-01T14:00:00Z',
      invitedBy: '2',
      title: 'Senior Engineer',
      department: 'Engineering' 
    }
  ],
  '2': [
    { 
      userId: '1', 
      name: 'John Doe', 
      email: 'john@datatech.io', 
      role: PERMISSIONS.ENTITY_ROLES.ADMIN,
      teams: ['4'], 
      joinedAt: '2023-09-01T12:00:00Z',
      invitedBy: null,
      title: 'Advisor',
      department: 'Advisory' 
    },
    { 
      userId: '8', 
      name: 'Maria Garcia', 
      email: 'maria@datatech.io', 
      role: PERMISSIONS.ENTITY_ROLES.OWNER,
      teams: ['4', '5'], 
      joinedAt: '2023-09-22T15:30:00Z',
      invitedBy: null,
      title: 'Founder & CEO',
      department: 'Executive' 
    }
  ]
};

// Async thunks
export const fetchOrganizations = createAsyncThunk(
  'organizations/fetchOrganizations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.getAll().catch(() => {
        console.log('Using mock organizations data');
        return { data: mockOrganizations };
      });
      return response.data;
    } catch (error) {
      console.log('Using mock organizations data due to error');
      return mockOrganizations;
    }
  }
);

export const fetchOrganization = createAsyncThunk(
  'organizations/fetchOrganization',
  async (orgId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.get(orgId).catch(() => {
        console.log('Using mock organization data');
        const org = mockOrganizations.find(o => o.id === orgId);
        return { data: org };
      });
      return response.data;
    } catch (error) {
      console.log('Using mock organization data due to error');
      const org = mockOrganizations.find(o => o.id === orgId);
      return org || rejectWithValue('Organization not found');
    }
  }
);

export const createOrganization = createAsyncThunk(
  'organizations/createOrganization',
  async (orgData, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.create(orgData).catch(() => {
        console.log('Using mock create organization');
        const newOrg = {
          id: Date.now().toString(),
          ...orgData,
          slug: orgData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          memberCount: 1,
          teamCount: 0,
          repositoryCount: 0,
          userRole: PERMISSIONS.ENTITY_ROLES.OWNER,
          billing: {
            plan: 'free',
            seats: 3,
            billingEmail: orgData.billingEmail || ''
          },
          settings: {
            membersCanCreateRepositories: true,
            membersCanCreateTeams: true,
            membersCanFork: true,
            defaultMemberPermissions: 'read',
            twoFactorRequired: false
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return { data: newOrg };
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateOrganization = createAsyncThunk(
  'organizations/updateOrganization',
  async ({ orgId, updates }, { getState, rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.update(orgId, updates).catch(() => {
        console.log('Using mock update organization');
        const state = getState();
        const org = state.organizations.organizations.find(o => o.id === orgId);
        const updatedOrg = {
          ...org,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        return { data: updatedOrg };
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteOrganization = createAsyncThunk(
  'organizations/deleteOrganization',
  async (orgId, { rejectWithValue }) => {
    try {
      await aetherApi.organizations.delete(orgId).catch(() => {
        console.log('Using mock delete organization');
        return { data: {} };
      });
      return orgId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Organization member operations
export const fetchOrganizationMembers = createAsyncThunk(
  'organizations/fetchMembers',
  async (orgId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.getMembers(orgId).catch(() => {
        console.log('Using mock organization members data');
        return { data: mockMembers[orgId] || [] };
      });
      return { orgId, members: response.data };
    } catch (error) {
      console.log('Using mock organization members data due to error');
      return { orgId, members: mockMembers[orgId] || [] };
    }
  }
);

export const inviteOrganizationMember = createAsyncThunk(
  'organizations/inviteMember',
  async ({ orgId, email, role }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.inviteMember(orgId, { email, role }).catch(() => {
        console.log('Using mock invite organization member');
        const newMember = {
          userId: Date.now().toString(),
          name: email.split('@')[0],
          email,
          role,
          teams: [],
          joinedAt: new Date().toISOString(),
          invitedBy: null, // Should be set to current user ID
          title: '',
          department: ''
        };
        return { data: newMember };
      });
      return { orgId, member: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateOrganizationMemberRole = createAsyncThunk(
  'organizations/updateMemberRole',
  async ({ orgId, userId, role }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.updateMemberRole(orgId, userId, { role }).catch(() => {
        console.log('Using mock update organization member role');
        return { data: { orgId, userId, role } };
      });
      return { orgId, userId, role };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeOrganizationMember = createAsyncThunk(
  'organizations/removeMember',
  async ({ orgId, userId }, { rejectWithValue }) => {
    try {
      await aetherApi.organizations.removeMember(orgId, userId).catch(() => {
        console.log('Using mock remove organization member');
        return { data: {} };
      });
      return { orgId, userId };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState: {
    organizations: [],
    currentOrganization: null,
    organizationMembers: {}, // { orgId: [members] }
    loading: false,
    error: null,
    invitationLoading: false,
    invitationError: null,
  },
  reducers: {
    clearOrganizationsError: (state) => {
      state.error = null;
    },
    clearInvitationError: (state) => {
      state.invitationError = null;
    },
    setCurrentOrganization: (state, action) => {
      state.currentOrganization = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch organizations
      .addCase(fetchOrganizations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.loading = false;
        state.organizations = action.payload;
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch single organization
      .addCase(fetchOrganization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganization.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrganization = action.payload;
        // Update in organizations list if exists
        const index = state.organizations.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.organizations[index] = action.payload;
        }
      })
      .addCase(fetchOrganization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create organization
      .addCase(createOrganization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.loading = false;
        state.organizations.push(action.payload);
        state.currentOrganization = action.payload;
      })
      .addCase(createOrganization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update organization
      .addCase(updateOrganization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrganization.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.organizations.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.organizations[index] = action.payload;
        }
        if (state.currentOrganization?.id === action.payload.id) {
          state.currentOrganization = action.payload;
        }
      })
      .addCase(updateOrganization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete organization
      .addCase(deleteOrganization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrganization.fulfilled, (state, action) => {
        state.loading = false;
        state.organizations = state.organizations.filter(o => o.id !== action.payload);
        if (state.currentOrganization?.id === action.payload) {
          state.currentOrganization = null;
        }
      })
      .addCase(deleteOrganization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch organization members
      .addCase(fetchOrganizationMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizationMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.organizationMembers[action.payload.orgId] = action.payload.members;
      })
      .addCase(fetchOrganizationMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Invite organization member
      .addCase(inviteOrganizationMember.pending, (state) => {
        state.invitationLoading = true;
        state.invitationError = null;
      })
      .addCase(inviteOrganizationMember.fulfilled, (state, action) => {
        state.invitationLoading = false;
        const { orgId, member } = action.payload;
        if (!state.organizationMembers[orgId]) {
          state.organizationMembers[orgId] = [];
        }
        state.organizationMembers[orgId].push(member);
      })
      .addCase(inviteOrganizationMember.rejected, (state, action) => {
        state.invitationLoading = false;
        state.invitationError = action.payload;
      })
      
      // Update member role
      .addCase(updateOrganizationMemberRole.fulfilled, (state, action) => {
        const { orgId, userId, role } = action.payload;
        const members = state.organizationMembers[orgId];
        if (members) {
          const member = members.find(m => m.userId === userId);
          if (member) {
            member.role = role;
          }
        }
      })
      
      // Remove organization member
      .addCase(removeOrganizationMember.fulfilled, (state, action) => {
        const { orgId, userId } = action.payload;
        if (state.organizationMembers[orgId]) {
          state.organizationMembers[orgId] = state.organizationMembers[orgId].filter(
            m => m.userId !== userId
          );
        }
      });
  },
});

export const { clearOrganizationsError, clearInvitationError, setCurrentOrganization } = organizationsSlice.actions;

// Selectors
export const selectAllOrganizations = (state) => state.organizations.organizations;
export const selectCurrentOrganization = (state) => state.organizations.currentOrganization;
export const selectOrganizationMembers = (orgId) => (state) => state.organizations.organizationMembers[orgId] || [];
export const selectOrganizationsLoading = (state) => state.organizations.loading;
export const selectOrganizationsError = (state) => state.organizations.error;
export const selectOrganizationInvitationLoading = (state) => state.organizations.invitationLoading;
export const selectOrganizationInvitationError = (state) => state.organizations.invitationError;

// Helper selectors
export const selectUserOrganizations = (userId) => (state) => {
  return state.organizations.organizations.filter(org => 
    state.organizations.organizationMembers[org.id]?.some(member => member.userId === userId)
  );
};

export const selectUserRoleInOrganization = (orgId, userId) => (state) => {
  const members = state.organizations.organizationMembers[orgId];
  const member = members?.find(m => m.userId === userId);
  return member?.role || null;
};

export const selectOrganizationsByPlan = (plan) => (state) => {
  return state.organizations.organizations.filter(org => org.billing?.plan === plan);
};

export default organizationsSlice.reducer;