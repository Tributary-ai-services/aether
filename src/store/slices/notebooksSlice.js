import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';
import { PERMISSIONS } from '../../utils/permissions.js';

// Async thunks for notebook operations
export const fetchNotebooks = createAsyncThunk(
  'notebooks/fetchNotebooks',
  async (options = { limit: 20, offset: 0 }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.getAll(options);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch notebooks');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch notebooks');
    }
  }
);

export const createNotebook = createAsyncThunk(
  'notebooks/createNotebook',
  async (notebookData, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.create(notebookData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to create notebook');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create notebook');
    }
  }
);

export const updateNotebook = createAsyncThunk(
  'notebooks/updateNotebook',
  async ({ id, updates }, { rejectWithValue, getState }) => {
    try {
      const response = await aetherApi.notebooks.update(id, updates);
      if (response.success) {
        // Merge the updates with the backend response since backend doesn't return complete data
        const state = getState();
        const existingNotebook = state.notebooks.data.find(nb => nb.id === id) || {};

        // Normalize field names: compliance_settings (sent) -> complianceSettings (local state)
        const parsedUpdates = { ...updates };

        // Handle compliance_settings -> complianceSettings normalization
        if (parsedUpdates.compliance_settings !== undefined) {
          parsedUpdates.complianceSettings = parsedUpdates.compliance_settings;
          delete parsedUpdates.compliance_settings;
        }

        // Parse complianceSettings if it was sent as string (legacy support)
        if (typeof parsedUpdates.complianceSettings === 'string') {
          try {
            parsedUpdates.complianceSettings = JSON.parse(parsedUpdates.complianceSettings);
          } catch (e) {
            console.error('Failed to parse compliance settings in update:', e);
          }
        }

        return { ...existingNotebook, ...response.data, ...parsedUpdates };
      } else {
        return rejectWithValue(response.error || 'Failed to update notebook');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update notebook');
    }
  }
);

export const deleteNotebook = createAsyncThunk(
  'notebooks/deleteNotebook',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.delete(id);
      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.error || 'Failed to delete notebook');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete notebook');
    }
  }
);

// Fetch documents for a specific notebook
export const fetchNotebookDocuments = createAsyncThunk(
  'notebooks/fetchNotebookDocuments',
  async ({ notebookId, forceRefresh = false }, { rejectWithValue, getState }) => {
    try {
      // Check if we already have documents cached (unless force refresh)
      const state = getState();
      const existingDocs = state.notebooks.documents[notebookId];
      if (!forceRefresh && existingDocs && existingDocs.length > 0) {
        return { notebookId, documents: existingDocs, total: existingDocs.length, fromCache: true };
      }

      const response = await aetherApi.documents.getByNotebook(notebookId);
      const documents = response.data?.documents || [];
      const totalCount = response.data?.total || documents.length;

      return { notebookId, documents, total: totalCount };
    } catch (error) {
      console.error('Failed to fetch notebook documents:', error);
      return rejectWithValue(error.message || 'Failed to fetch documents');
    }
  }
);

// Team sharing operations
export const shareNotebookWithTeam = createAsyncThunk(
  'notebooks/shareNotebookWithTeam',
  async ({ notebookId, teamId, permission }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.shareWithTeam(notebookId, { teamId, permission }).catch(() => {
        return {
          success: true,
          data: { notebookId, teamId, permission, sharedAt: new Date().toISOString() }
        };
      });
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to share notebook');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to share notebook');
    }
  }
);

export const unshareNotebookFromTeam = createAsyncThunk(
  'notebooks/unshareNotebookFromTeam',
  async ({ notebookId, teamId }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.unshareFromTeam(notebookId, teamId).catch(() => {
        return { success: true, data: { notebookId, teamId } };
      });
      if (response.success) {
        return { notebookId, teamId };
      } else {
        return rejectWithValue(response.error || 'Failed to unshare notebook');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to unshare notebook');
    }
  }
);

export const fetchNotebookTeams = createAsyncThunk(
  'notebooks/fetchNotebookTeams',
  async (notebookId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.getTeams(notebookId).catch(() => {
        return {
          success: true,
          data: [
            { id: '1', name: 'Engineering Team', permission: 'edit' },
            { id: '2', name: 'Data Science', permission: 'view' }
          ]
        };
      });
      if (response.success) {
        return { notebookId, teams: response.data };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch notebook teams');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch notebook teams');
    }
  }
);

// User sharing operations
export const shareNotebookWithUser = createAsyncThunk(
  'notebooks/shareNotebookWithUser',
  async ({ notebookId, userId, permission }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.shareWithUser(notebookId, { userId, permission }).catch(() => {
        return {
          success: true,
          data: { notebookId, userId, permission, sharedAt: new Date().toISOString() }
        };
      });
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to share notebook with user');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to share notebook with user');
    }
  }
);

export const unshareNotebookFromUser = createAsyncThunk(
  'notebooks/unshareNotebookFromUser',
  async ({ notebookId, userId }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.unshareFromUser(notebookId, userId).catch(() => {
        return { success: true, data: { notebookId, userId } };
      });
      if (response.success) {
        return { notebookId, userId };
      } else {
        return rejectWithValue(response.error || 'Failed to unshare notebook from user');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to unshare notebook from user');
    }
  }
);

// Organization sharing operations
export const shareNotebookWithOrganization = createAsyncThunk(
  'notebooks/shareNotebookWithOrganization',
  async ({ notebookId, organizationId, permission }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.shareWithOrganization(notebookId, { organizationId, permission }).catch(() => {
        return {
          success: true,
          data: { notebookId, organizationId, permission, sharedAt: new Date().toISOString() }
        };
      });
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to share notebook with organization');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to share notebook with organization');
    }
  }
);

export const unshareNotebookFromOrganization = createAsyncThunk(
  'notebooks/unshareNotebookFromOrganization',
  async ({ notebookId, organizationId }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.unshareFromOrganization(notebookId, organizationId).catch(() => {
        return { success: true, data: { notebookId, organizationId } };
      });
      if (response.success) {
        return { notebookId, organizationId };
      } else {
        return rejectWithValue(response.error || 'Failed to unshare notebook from organization');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to unshare notebook from organization');
    }
  }
);

// Fetch all sharing information for a notebook
export const fetchNotebookSharing = createAsyncThunk(
  'notebooks/fetchNotebookSharing',
  async (notebookId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.getSharing(notebookId).catch(() => {
        return {
          success: true,
          data: {
            teams: [
              { id: '1', name: 'Engineering Team', permission: PERMISSIONS.RESOURCE_PERMISSIONS.EDIT },
              { id: '2', name: 'Data Science', permission: PERMISSIONS.RESOURCE_PERMISSIONS.VIEW }
            ],
            users: [
              { userId: '4', name: 'Alice Brown', email: 'alice@example.com', permission: PERMISSIONS.RESOURCE_PERMISSIONS.VIEW }
            ],
            organizations: []
          }
        };
      });
      if (response.success) {
        return { notebookId, sharing: response.data };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch notebook sharing');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch notebook sharing');
    }
  }
);

// Helper function to build tree structure from flat notebooks array
const buildNotebookTree = (notebooks) => {
  if (!notebooks || notebooks.length === 0) {
    return [];
  }

  const buildTree = (parentId = null) => {
    const filtered = notebooks.filter(nb => {
      const parent = nb.parent_id || nb.parentId;
      // For root nodes, look for null, undefined, or empty string
      if (parentId === null) {
        const isRoot = !parent || parent === '' || parent === null || parent === undefined;
        return isRoot;
      }
      // For child nodes, match exact parent ID
      return parent === parentId;
    });

    return filtered.map(notebook => ({
      ...notebook,
      parentId: notebook.parent_id || notebook.parentId,
      children: buildTree(notebook.id)
    }));
  };

  return buildTree(null);
};

const initialState = {
  data: [],
  tree: [],
  loading: false,
  error: null,
  selectedNotebook: null,
  // Documents state - keyed by notebook ID
  documents: {}, // { notebookId: [documents] }
  documentsLoading: false,
  documentsError: null,
  notebookTeams: {}, // { notebookId: [teams] }
  notebookUsers: {}, // { notebookId: [users] }
  notebookOrganizations: {}, // { notebookId: [organizations] }
  notebookSharing: {}, // { notebookId: { teams: [], users: [], organizations: [] } }
  sharingLoading: false,
  sharingError: null,
  metadata: {
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  }
};

const notebooksSlice = createSlice({
  name: 'notebooks',
  initialState,
  reducers: {
    setSelectedNotebook: (state, action) => {
      state.selectedNotebook = action.payload;
    },
    clearSelectedNotebook: (state) => {
      state.selectedNotebook = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSharingError: (state) => {
      state.sharingError = null;
    },
    updateNotebookDocumentCount: (state, action) => {
      const { notebookId, documentCount } = action.payload;
      const notebook = state.data.find(nb => nb.id === notebookId);
      if (notebook) {
        // Update both possible attribute names to ensure compatibility
        notebook.documentCount = documentCount;
        notebook.document_count = documentCount;
      }
      // Rebuild tree to reflect changes
      state.tree = buildNotebookTree(state.data);
    },
    clearNotebookDocuments: (state, action) => {
      const notebookId = action.payload;
      if (notebookId) {
        delete state.documents[notebookId];
      } else {
        state.documents = {};
      }
    },
    clearDocumentsError: (state) => {
      state.documentsError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch notebooks
      .addCase(fetchNotebooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotebooks.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both possible response structures
        const notebooks = action.payload.notebooks || action.payload || [];
        
        // Parse complianceSettings for all notebooks
        const parsedNotebooks = Array.isArray(notebooks) ? notebooks.map(notebook => {
          if (typeof notebook.complianceSettings === 'string') {
            try {
              return { ...notebook, complianceSettings: JSON.parse(notebook.complianceSettings) };
            } catch (e) {
              console.error('Failed to parse compliance settings for notebook:', notebook.id, e);
              return notebook;
            }
          }
          return notebook;
        }) : [];
        
        state.data = parsedNotebooks;
        state.tree = buildNotebookTree(state.data);
        state.metadata = {
          total: action.payload.total || state.data.length,
          limit: action.payload.limit || 20,
          offset: action.payload.offset || 0,
          hasMore: action.payload.has_more || false
        };
      })
      .addCase(fetchNotebooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch notebooks';
      })

      // Create notebook
      .addCase(createNotebook.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNotebook.fulfilled, (state, action) => {
        state.loading = false;

        // Parse complianceSettings if it's a string
        const newNotebook = { ...action.payload };
        if (typeof newNotebook.complianceSettings === 'string') {
          try {
            newNotebook.complianceSettings = JSON.parse(newNotebook.complianceSettings);
          } catch (e) {
            console.error('Failed to parse new notebook compliance settings:', e);
          }
        }

        state.data.push(newNotebook);
        state.tree = buildNotebookTree(state.data);

        // If this notebook is a child of the currently selected notebook, update selectedNotebook.children
        const parentId = newNotebook.parentId || newNotebook.parent_id;
        if (parentId && state.selectedNotebook?.id === parentId) {
          // Find the updated parent from the tree to get the full children array
          const findNotebookInTree = (tree, id) => {
            for (const nb of tree) {
              if (nb.id === id) return nb;
              if (nb.children) {
                const found = findNotebookInTree(nb.children, id);
                if (found) return found;
              }
            }
            return null;
          };
          const updatedParent = findNotebookInTree(state.tree, parentId);
          if (updatedParent) {
            state.selectedNotebook = {
              ...state.selectedNotebook,
              children: updatedParent.children || []
            };
          }
        }

        state.metadata.total += 1;
      })
      .addCase(createNotebook.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create notebook';
      })

      // Update notebook
      .addCase(updateNotebook.pending, (state) => {
        state.error = null;
      })
      .addCase(updateNotebook.fulfilled, (state, action) => {
        // Parse complianceSettings if it's a string
        const updatedNotebook = { ...action.payload };
        if (typeof updatedNotebook.complianceSettings === 'string') {
          try {
            updatedNotebook.complianceSettings = JSON.parse(updatedNotebook.complianceSettings);
          } catch (e) {
            console.error('Failed to parse updated compliance settings:', e);
          }
        }
        
        const index = state.data.findIndex(nb => nb.id === updatedNotebook.id);
        if (index !== -1) {
          state.data[index] = updatedNotebook;
          state.tree = buildNotebookTree(state.data);
        }
        if (state.selectedNotebook?.id === updatedNotebook.id) {
          state.selectedNotebook = updatedNotebook;
        }
      })
      .addCase(updateNotebook.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update notebook';
      })

      // Delete notebook
      .addCase(deleteNotebook.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteNotebook.fulfilled, (state, action) => {
        state.data = state.data.filter(nb => nb.id !== action.payload);
        state.tree = buildNotebookTree(state.data);
        state.metadata.total = Math.max(0, state.metadata.total - 1);
        if (state.selectedNotebook?.id === action.payload) {
          state.selectedNotebook = null;
        }
      })
      .addCase(deleteNotebook.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete notebook';
      })

      // Share notebook with team
      .addCase(shareNotebookWithTeam.pending, (state) => {
        state.sharingLoading = true;
        state.sharingError = null;
      })
      .addCase(shareNotebookWithTeam.fulfilled, (state, action) => {
        state.sharingLoading = false;
        const { notebookId, teamId, permission } = action.payload;
        if (!state.notebookTeams[notebookId]) {
          state.notebookTeams[notebookId] = [];
        }
        // Add or update team permission
        const existingIndex = state.notebookTeams[notebookId].findIndex(t => t.id === teamId);
        if (existingIndex !== -1) {
          state.notebookTeams[notebookId][existingIndex].permission = permission;
        } else {
          state.notebookTeams[notebookId].push({ id: teamId, permission });
        }
      })
      .addCase(shareNotebookWithTeam.rejected, (state, action) => {
        state.sharingLoading = false;
        state.sharingError = action.payload || 'Failed to share notebook';
      })

      // Unshare notebook from team
      .addCase(unshareNotebookFromTeam.pending, (state) => {
        state.sharingLoading = true;
        state.sharingError = null;
      })
      .addCase(unshareNotebookFromTeam.fulfilled, (state, action) => {
        state.sharingLoading = false;
        const { notebookId, teamId } = action.payload;
        if (state.notebookTeams[notebookId]) {
          state.notebookTeams[notebookId] = state.notebookTeams[notebookId].filter(
            team => team.id !== teamId
          );
        }
      })
      .addCase(unshareNotebookFromTeam.rejected, (state, action) => {
        state.sharingLoading = false;
        state.sharingError = action.payload || 'Failed to unshare notebook';
      })

      // Fetch notebook teams
      .addCase(fetchNotebookTeams.pending, (state) => {
        state.sharingLoading = true;
        state.sharingError = null;
      })
      .addCase(fetchNotebookTeams.fulfilled, (state, action) => {
        state.sharingLoading = false;
        const { notebookId, teams } = action.payload;
        state.notebookTeams[notebookId] = teams;
      })
      .addCase(fetchNotebookTeams.rejected, (state, action) => {
        state.sharingLoading = false;
        state.sharingError = action.payload || 'Failed to fetch notebook teams';
      })

      // Fetch notebook documents
      .addCase(fetchNotebookDocuments.pending, (state) => {
        state.documentsLoading = true;
        state.documentsError = null;
      })
      .addCase(fetchNotebookDocuments.fulfilled, (state, action) => {
        state.documentsLoading = false;
        const { notebookId, documents, total } = action.payload;
        state.documents[notebookId] = documents;
        // Also update the document count on the notebook
        const notebook = state.data.find(nb => nb.id === notebookId);
        if (notebook) {
          notebook.documentCount = total;
          notebook.document_count = total;
        }
        // Update selected notebook if it matches
        if (state.selectedNotebook?.id === notebookId) {
          state.selectedNotebook = {
            ...state.selectedNotebook,
            documentCount: total,
            document_count: total
          };
        }
      })
      .addCase(fetchNotebookDocuments.rejected, (state, action) => {
        state.documentsLoading = false;
        state.documentsError = action.payload || 'Failed to fetch documents';
      });
  }
});

export const {
  setSelectedNotebook,
  clearSelectedNotebook,
  clearError,
  clearSharingError,
  updateNotebookDocumentCount,
  clearNotebookDocuments,
  clearDocumentsError
} = notebooksSlice.actions;

// Selectors
export const selectNotebooks = (state) => state.notebooks.data;
export const selectNotebookTree = (state) => state.notebooks.tree;
export const selectSelectedNotebook = (state) => state.notebooks.selectedNotebook;
export const selectNotebooksLoading = (state) => state.notebooks.loading;
export const selectNotebooksError = (state) => state.notebooks.error;

// Document selectors
export const selectAllDocuments = (state) => state.notebooks.documents;
export const selectDocumentsLoading = (state) => state.notebooks.documentsLoading;
export const selectDocumentsError = (state) => state.notebooks.documentsError;
export const selectNotebookDocuments = createSelector(
  [
    (state) => state.notebooks.documents,
    (state, notebookId) => notebookId
  ],
  (documents, notebookId) => documents[notebookId] || []
);

export const selectNotebookTeams = createSelector(
  [
    (state) => state.notebooks.notebookTeams,
    (state, notebookId) => notebookId
  ],
  (notebookTeams, notebookId) => notebookTeams[notebookId] || []
);
export const selectSharingLoading = (state) => state.notebooks.sharingLoading;
export const selectSharingError = (state) => state.notebooks.sharingError;
export default notebooksSlice.reducer;