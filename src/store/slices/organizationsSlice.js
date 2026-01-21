import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// Async thunks
export const fetchOrganizations = createAsyncThunk(
  'organizations/fetchOrganizations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.getAll();
      return response.data;
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch organizations');
    }
  }
);

export const fetchOrganization = createAsyncThunk(
  'organizations/fetchOrganization',
  async (orgId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.get(orgId);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Organization not found');
    }
  }
);

export const createOrganization = createAsyncThunk(
  'organizations/createOrganization',
  async (orgData, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.create(orgData);
      return response.data;
    } catch (error) {
      console.error('Failed to create organization:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create organization');
    }
  }
);

export const updateOrganization = createAsyncThunk(
  'organizations/updateOrganization',
  async ({ orgId, updates }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.update(orgId, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update organization:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update organization');
    }
  }
);

export const deleteOrganization = createAsyncThunk(
  'organizations/deleteOrganization',
  async (orgId, { rejectWithValue }) => {
    try {
      await aetherApi.organizations.delete(orgId);
      return orgId;
    } catch (error) {
      console.error('Failed to delete organization:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete organization');
    }
  }
);

// Organization member operations
export const fetchOrganizationMembers = createAsyncThunk(
  'organizations/fetchMembers',
  async (orgId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.getMembers(orgId);
      return { orgId, members: response.data };
    } catch (error) {
      console.error('Failed to fetch organization members:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch organization members');
    }
  }
);

export const inviteOrganizationMember = createAsyncThunk(
  'organizations/inviteMember',
  async ({ orgId, email, role }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.organizations.inviteMember(orgId, { email, role });
      return { orgId, member: response.data };
    } catch (error) {
      console.error('Failed to invite organization member:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to invite member');
    }
  }
);

export const updateOrganizationMemberRole = createAsyncThunk(
  'organizations/updateMemberRole',
  async ({ orgId, userId, role }, { rejectWithValue }) => {
    try {
      await aetherApi.organizations.updateMemberRole(orgId, userId, { role });
      return { orgId, userId, role };
    } catch (error) {
      console.error('Failed to update member role:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update member role');
    }
  }
);

export const removeOrganizationMember = createAsyncThunk(
  'organizations/removeMember',
  async ({ orgId, userId }, { rejectWithValue }) => {
    try {
      await aetherApi.organizations.removeMember(orgId, userId);
      return { orgId, userId };
    } catch (error) {
      console.error('Failed to remove organization member:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to remove member');
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