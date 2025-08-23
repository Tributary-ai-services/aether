import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';
import { PERMISSIONS } from '../../utils/permissions.js';

// Mock data for development with proper relationships - matches Neo4j data
const mockTeams = [
  {
    id: '1',
    name: 'Engineering Team',
    description: 'Core engineering and development team',
    organizationId: '1',
    visibility: 'private',
    userRole: PERMISSIONS.ENTITY_ROLES.OWNER,
    memberCount: 5,
    notebookCount: 12,
    icon: null,
    settings: {
      allowExternalSharing: false,
      requireApprovalForJoining: true,
      defaultNotebookVisibility: 'team'
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-08-08T15:30:00Z',
    createdBy: '1'
  },
  {
    id: '2',
    name: 'Data Science',
    description: 'ML and data analysis team',
    organizationId: '1',
    visibility: 'organization',
    userRole: PERMISSIONS.ENTITY_ROLES.OWNER,
    memberCount: 8,
    notebookCount: 24,
    icon: null,
    settings: {
      allowExternalSharing: true,
      requireApprovalForJoining: false,
      defaultNotebookVisibility: 'organization'
    },
    createdAt: '2024-02-20T14:00:00Z',
    updatedAt: '2024-08-07T09:15:00Z',
    createdBy: '1'
  },
  {
    id: '3',
    name: 'Research Team',
    description: 'Research and development initiatives',
    organizationId: '1',
    visibility: 'private',
    userRole: PERMISSIONS.ENTITY_ROLES.OWNER,
    memberCount: 3,
    notebookCount: 7,
    icon: null,
    settings: {
      allowExternalSharing: false,
      requireApprovalForJoining: true,
      defaultNotebookVisibility: 'team'
    },
    createdAt: '2024-03-10T11:30:00Z',
    updatedAt: '2024-08-06T16:45:00Z',
    createdBy: '1'
  },
  {
    id: '4',
    name: 'ML Research',
    description: 'Machine learning research and experiments',
    organizationId: '1',
    visibility: 'private',
    userRole: PERMISSIONS.ENTITY_ROLES.OWNER,
    memberCount: 4,
    notebookCount: 15,
    icon: null,
    settings: {
      allowExternalSharing: false,
      requireApprovalForJoining: true,
      defaultNotebookVisibility: 'team'
    },
    createdAt: '2024-03-05T14:00:00Z',
    updatedAt: '2024-08-05T12:00:00Z',
    createdBy: '1'
  }
];

// Standardized members data - removed redundant 'id' field, using userId as primary key
const mockMembers = {
  '1': [
    { userId: '1', name: 'John Doe', email: 'john@example.com', role: PERMISSIONS.ENTITY_ROLES.OWNER, joinedAt: '2024-01-15T10:00:00Z', invitedBy: null },
    { userId: '2', name: 'Jane Smith', email: 'jane@example.com', role: PERMISSIONS.ENTITY_ROLES.ADMIN, joinedAt: '2024-01-16T09:00:00Z', invitedBy: '1' },
    { userId: '3', name: 'Bob Wilson', email: 'bob@example.com', role: PERMISSIONS.ENTITY_ROLES.MEMBER, joinedAt: '2024-01-20T14:00:00Z', invitedBy: '1' },
    { userId: '4', name: 'Alice Brown', email: 'alice@example.com', role: PERMISSIONS.ENTITY_ROLES.MEMBER, joinedAt: '2024-02-01T10:30:00Z', invitedBy: '2' },
    { userId: '5', name: 'Charlie Davis', email: 'charlie@example.com', role: PERMISSIONS.ENTITY_ROLES.VIEWER, joinedAt: '2024-02-15T11:00:00Z', invitedBy: '1' }
  ],
  '2': [
    { userId: '1', name: 'John Doe', email: 'john@example.com', role: PERMISSIONS.ENTITY_ROLES.OWNER, joinedAt: '2024-02-20T14:00:00Z', invitedBy: null },
    { userId: '2', name: 'Jane Smith', email: 'jane@example.com', role: PERMISSIONS.ENTITY_ROLES.ADMIN, joinedAt: '2024-02-20T14:30:00Z', invitedBy: '1' },
    { userId: '6', name: 'David Lee', email: 'david@example.com', role: PERMISSIONS.ENTITY_ROLES.MEMBER, joinedAt: '2024-03-01T10:00:00Z', invitedBy: '2' }
  ],
  '3': [
    { userId: '1', name: 'John Doe', email: 'john@example.com', role: PERMISSIONS.ENTITY_ROLES.OWNER, joinedAt: '2024-03-10T11:30:00Z', invitedBy: null },
    { userId: '3', name: 'Bob Wilson', email: 'bob@example.com', role: PERMISSIONS.ENTITY_ROLES.MEMBER, joinedAt: '2024-03-15T09:00:00Z', invitedBy: '1' },
    { userId: '7', name: 'Sarah Johnson', email: 'sarah@example.com', role: PERMISSIONS.ENTITY_ROLES.VIEWER, joinedAt: '2024-04-01T14:00:00Z', invitedBy: '1' }
  ],
  '4': [
    { userId: '1', name: 'John Doe', email: 'john@example.com', role: PERMISSIONS.ENTITY_ROLES.OWNER, joinedAt: '2024-03-05T14:00:00Z', invitedBy: null },
    { userId: '2', name: 'Jane Smith', email: 'jane@example.com', role: PERMISSIONS.ENTITY_ROLES.MEMBER, joinedAt: '2024-03-06T10:00:00Z', invitedBy: '1' },
    { userId: '8', name: 'Alex Chen', email: 'alex@example.com', role: PERMISSIONS.ENTITY_ROLES.MEMBER, joinedAt: '2024-03-10T15:00:00Z', invitedBy: '1' },
    { userId: '9', name: 'Maria Rodriguez', email: 'maria@example.com', role: PERMISSIONS.ENTITY_ROLES.VIEWER, joinedAt: '2024-03-20T11:00:00Z', invitedBy: '2' }
  ]
};

// Async thunks
export const fetchTeams = createAsyncThunk(
  'teams/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.teams.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTeam = createAsyncThunk(
  'teams/fetchTeam',
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.teams.get(teamId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createTeam = createAsyncThunk(
  'teams/createTeam',
  async (teamData, { rejectWithValue }) => {
    try {
      const response = await aetherApi.teams.create(teamData).catch(() => {
        console.log('Using mock create team');
        const newTeam = {
          id: Date.now().toString(),
          ...teamData,
          userRole: 'owner',
          memberCount: 1,
          notebookCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return { data: newTeam };
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateTeam = createAsyncThunk(
  'teams/updateTeam',
  async ({ teamId, updates }, { getState, rejectWithValue }) => {
    try {
      const response = await aetherApi.teams.update(teamId, updates).catch(() => {
        console.log('Using mock update team');
        const state = getState();
        const team = state.teams.teams.find(t => t.id === teamId);
        const updatedTeam = {
          ...team,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        return { data: updatedTeam };
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteTeam = createAsyncThunk(
  'teams/deleteTeam',
  async (teamId, { rejectWithValue }) => {
    try {
      await aetherApi.teams.delete(teamId).catch(() => {
        console.log('Using mock delete team');
        return { data: {} };
      });
      return teamId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Team member operations
export const fetchTeamMembers = createAsyncThunk(
  'teams/fetchTeamMembers',
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.teams.getMembers(teamId);
      return { teamId, members: response.data };
    } catch (error) {
      const errorData = error.response?.data || error.message;
      const status = error.response?.status;
      
      // For development/testing, fall back to mock data for certain errors
      if (status === 404 || status === 500) {
        console.log(`API error ${status}, using mock team members data`);
        return { teamId, members: mockMembers[teamId] || [] };
      }
      
      // For permission errors (403) and other critical errors, propagate them
      return rejectWithValue({
        message: errorData,
        status: status,
        teamId: teamId
      });
    }
  }
);

export const inviteTeamMember = createAsyncThunk(
  'teams/inviteTeamMember',
  async ({ teamId, email, role }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.teams.inviteMember(teamId, { email, role }).catch(() => {
        console.log('Using mock invite member');
        const newMember = {
          id: Date.now().toString(),
          userId: Date.now().toString(),
          name: email.split('@')[0],
          email,
          role,
          joinedAt: new Date().toISOString()
        };
        return { data: newMember };
      });
      return { teamId, member: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateTeamMemberRole = createAsyncThunk(
  'teams/updateTeamMemberRole',
  async ({ teamId, userId, role }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.teams.updateMemberRole(teamId, userId, { role }).catch(() => {
        console.log('Using mock update member role');
        return { data: { teamId, userId, role } };
      });
      return { teamId, userId, role };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeTeamMember = createAsyncThunk(
  'teams/removeTeamMember',
  async ({ teamId, userId }, { rejectWithValue }) => {
    try {
      await aetherApi.teams.removeMember(teamId, userId).catch(() => {
        console.log('Using mock remove member');
        return { data: {} };
      });
      return { teamId, userId };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const teamsSlice = createSlice({
  name: 'teams',
  initialState: {
    teams: [],
    currentTeam: null,
    teamMembers: {}, // { teamId: [members] }
    loading: false,
    error: null,
    invitationLoading: false,
    invitationError: null,
  },
  reducers: {
    clearTeamsError: (state) => {
      state.error = null;
    },
    clearInvitationError: (state) => {
      state.invitationError = null;
    },
    setCurrentTeam: (state, action) => {
      state.currentTeam = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch teams
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.teams = action.payload;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch single team
      .addCase(fetchTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTeam = action.payload;
        // Update in teams list if exists
        const index = state.teams.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.teams[index] = action.payload;
        }
      })
      .addCase(fetchTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create team
      .addCase(createTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.teams.push(action.payload);
        state.currentTeam = action.payload;
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update team
      .addCase(updateTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.teams.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.teams[index] = action.payload;
        }
        if (state.currentTeam?.id === action.payload.id) {
          state.currentTeam = action.payload;
        }
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete team
      .addCase(deleteTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.teams = state.teams.filter(t => t.id !== action.payload);
        if (state.currentTeam?.id === action.payload) {
          state.currentTeam = null;
        }
      })
      .addCase(deleteTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch team members
      .addCase(fetchTeamMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.teamMembers[action.payload.teamId] = action.payload.members;
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.loading = false;
        // Ensure error is serializable
        state.error = action.payload ? {
          message: action.payload.message || 'Unknown error',
          status: action.payload.status || null,
          teamId: action.payload.teamId || null
        } : 'Failed to fetch team members';
      })
      
      // Invite team member
      .addCase(inviteTeamMember.pending, (state) => {
        state.invitationLoading = true;
        state.invitationError = null;
      })
      .addCase(inviteTeamMember.fulfilled, (state, action) => {
        state.invitationLoading = false;
        const { teamId, member } = action.payload;
        if (!state.teamMembers[teamId]) {
          state.teamMembers[teamId] = [];
        }
        state.teamMembers[teamId].push(member);
      })
      .addCase(inviteTeamMember.rejected, (state, action) => {
        state.invitationLoading = false;
        state.invitationError = action.payload;
      })
      
      // Update member role
      .addCase(updateTeamMemberRole.fulfilled, (state, action) => {
        const { teamId, userId, role } = action.payload;
        const members = state.teamMembers[teamId];
        if (members) {
          const member = members.find(m => m.userId === userId);
          if (member) {
            member.role = role;
          }
        }
      })
      
      // Remove team member
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        const { teamId, userId } = action.payload;
        if (state.teamMembers[teamId]) {
          state.teamMembers[teamId] = state.teamMembers[teamId].filter(
            m => m.userId !== userId
          );
        }
      });
  },
});

export const { clearTeamsError, clearInvitationError, setCurrentTeam } = teamsSlice.actions;

// Selectors
export const selectAllTeams = (state) => state.teams.teams;
export const selectCurrentTeam = (state) => state.teams.currentTeam;
export const selectTeamMembers = (teamId) => (state) => state.teams.teamMembers[teamId] || [];
export const selectTeamsLoading = (state) => state.teams.loading;
export const selectTeamsError = (state) => state.teams.error;
export const selectInvitationLoading = (state) => state.teams.invitationLoading;
export const selectInvitationError = (state) => state.teams.invitationError;

// Helper selectors
export const selectUserTeams = (userId) => (state) => {
  return state.teams.teams.filter(team => 
    state.teams.teamMembers[team.id]?.some(member => member.userId === userId)
  );
};

export const selectUserRoleInTeam = (teamId, userId) => (state) => {
  const members = state.teams.teamMembers[teamId];
  const member = members?.find(m => m.userId === userId);
  return member?.role || null;
};

export default teamsSlice.reducer;