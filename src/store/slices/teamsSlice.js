import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';
import { PERMISSIONS } from '../../utils/permissions.js';

// Plan #22 A.5: no mock data. The thunks used to swallow every API failure
// and fabricate a successful result (a fake team, a fake member), so a create
// that failed on the backend looked like it worked until the page reloaded —
// which is how team creation stayed broken unnoticed. Errors now surface.

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
      const response = await aetherApi.teams.create(teamData);
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
      const response = await aetherApi.teams.update(teamId, updates);
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
      await aetherApi.teams.delete(teamId);
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
  async ({ teamId, email, role, joinedAt }, { rejectWithValue }) => {
    try {
      const body = { email, role };
      if (joinedAt) body.joined_at = joinedAt; // back-dated membership (Plan #22 A.3)
      const response = await aetherApi.teams.inviteMember(teamId, body);
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
      const response = await aetherApi.teams.updateMemberRole(teamId, userId, { role });
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
      await aetherApi.teams.removeMember(teamId, userId);
      return { teamId, userId };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// --- Plan #22 A.5: org teams (tree), joining, requests, moves, "since" ---

export const fetchOrgTeams = createAsyncThunk(
  'teams/fetchOrgTeams',
  async (organizationId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.teams.getAll(organizationId);
      return { organizationId, teams: response.data || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const joinTeam = createAsyncThunk(
  'teams/joinTeam',
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.teams.join(teamId);
      return { teamId, status: response.data?.status }; // 'joined' | 'requested'
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchJoinRequests = createAsyncThunk(
  'teams/fetchJoinRequests',
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.teams.getJoinRequests(teamId);
      return { teamId, requests: response.data?.requests || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const decideJoinRequest = createAsyncThunk(
  'teams/decideJoinRequest',
  async ({ teamId, requestId, approve, joinedAt }, { dispatch, rejectWithValue }) => {
    try {
      const body = { approve };
      if (approve && joinedAt) body.joined_at = joinedAt;
      await aetherApi.teams.decideJoinRequest(teamId, requestId, body);
      if (approve) dispatch(fetchTeamMembers(teamId));
      return { teamId, requestId };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const moveTeam = createAsyncThunk(
  'teams/moveTeam',
  async ({ teamId, parentTeamId }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.teams.move(teamId, { parent_team_id: parentTeamId || '' });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const setMemberJoinedAt = createAsyncThunk(
  'teams/setMemberJoinedAt',
  async ({ teamId, userId, joinedAt }, { rejectWithValue }) => {
    try {
      await aetherApi.teams.setMemberJoinedAt(teamId, userId, { joined_at: joinedAt });
      return { teamId, userId, joinedAt };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * buildTeamTree nests teams by parentTeamId. A team whose parent is not in the
 * list (archived, or not visible to this viewer) is shown at the top level, so
 * nothing disappears. Children are sorted by name; cycles cannot occur (the
 * backend refuses them) but are guarded against anyway.
 */
export function buildTeamTree(teams) {
  const byId = new Map((teams || []).map((t) => [t.id, { ...t, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    const parent = node.parentTeamId && byId.get(node.parentTeamId);
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }
  const seen = new Set();
  const sort = (nodes) => {
    nodes.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    for (const n of nodes) {
      if (seen.has(n.id)) { n.children = []; continue; }
      seen.add(n.id);
      sort(n.children);
    }
    return nodes;
  };
  return sort(roots);
}

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
    orgTeams: {}, // { organizationId: [teams] }
    joinRequests: {}, // { teamId: [requests] }
    joinStatus: {}, // { teamId: 'joined' | 'requested' }
    actionError: null, // last failed join / move / request decision, shown inline
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
    clearActionError: (state) => {
      state.actionError = null;
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
      })

      // Plan #22 A.5
      .addCase(fetchOrgTeams.fulfilled, (state, action) => {
        state.orgTeams[action.payload.organizationId] = action.payload.teams;
      })
      .addCase(joinTeam.pending, (state) => {
        state.actionError = null;
      })
      .addCase(joinTeam.fulfilled, (state, action) => {
        const { teamId, status } = action.payload;
        state.joinStatus[teamId] = status;
        if (state.currentTeam?.id === teamId) {
          if (status === 'joined') state.currentTeam.userRole = 'member';
          else state.currentTeam.joinRequest = 'pending';
        }
      })
      .addCase(joinTeam.rejected, (state, action) => {
        state.actionError = action.payload;
      })
      .addCase(fetchJoinRequests.fulfilled, (state, action) => {
        state.joinRequests[action.payload.teamId] = action.payload.requests;
      })
      .addCase(decideJoinRequest.fulfilled, (state, action) => {
        const { teamId, requestId } = action.payload;
        state.joinRequests[teamId] = (state.joinRequests[teamId] || []).filter((r) => r.id !== requestId);
      })
      .addCase(decideJoinRequest.rejected, (state, action) => {
        state.actionError = action.payload;
      })
      .addCase(moveTeam.fulfilled, (state, action) => {
        const t = action.payload;
        if (!t) return;
        const i = state.teams.findIndex((x) => x.id === t.id);
        if (i !== -1) state.teams[i] = t;
        if (state.currentTeam?.id === t.id) state.currentTeam = t;
        for (const list of Object.values(state.orgTeams)) {
          const j = list.findIndex((x) => x.id === t.id);
          if (j !== -1) list[j] = t;
        }
      })
      .addCase(moveTeam.rejected, (state, action) => {
        state.actionError = action.payload;
      })
      .addCase(setMemberJoinedAt.fulfilled, (state, action) => {
        const { teamId, userId, joinedAt } = action.payload;
        const m = state.teamMembers[teamId]?.find((x) => x.userId === userId);
        if (m) m.joinedAt = joinedAt;
      })
      .addCase(setMemberJoinedAt.rejected, (state, action) => {
        state.actionError = action.payload;
      });
  },
});

export const { clearTeamsError, clearInvitationError, setCurrentTeam, clearActionError } = teamsSlice.actions;

// Selectors
export const selectAllTeams = (state) => state.teams.teams;
export const selectCurrentTeam = (state) => state.teams.currentTeam;
export const selectTeamMembers = (teamId) => (state) => state.teams.teamMembers[teamId] || [];
export const selectTeamsLoading = (state) => state.teams.loading;
export const selectTeamsError = (state) => state.teams.error;
export const selectInvitationLoading = (state) => state.teams.invitationLoading;
export const selectInvitationError = (state) => state.teams.invitationError;
export const selectOrgTeams = (organizationId) => (state) => state.teams.orgTeams[organizationId] || [];
export const selectJoinRequests = (teamId) => (state) => state.teams.joinRequests[teamId] || [];
export const selectTeamActionError = (state) => state.teams.actionError;

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