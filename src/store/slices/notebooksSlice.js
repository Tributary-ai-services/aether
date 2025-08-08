import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// Async thunks for notebook operations
export const fetchNotebooks = createAsyncThunk(
  'notebooks/fetchNotebooks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.getAll();
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
        
        // Parse complianceSettings if it was sent as string
        const parsedUpdates = { ...updates };
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

// Helper function to build tree structure from flat notebooks array
const buildNotebookTree = (notebooks) => {
  if (!notebooks || notebooks.length === 0) {
    return [];
  }
  
  const buildTree = (parentId = null) => {
    return notebooks
      .filter(nb => {
        const parent = nb.parent_id || nb.parentId;
        // For root nodes, look for null, undefined, or empty string
        if (parentId === null) {
          return !parent || parent === '' || parent === null || parent === undefined;
        }
        // For child nodes, match exact parent ID
        return parent === parentId;
      })
      .map(notebook => ({
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
      });
  }
});

export const { setSelectedNotebook, clearSelectedNotebook, clearError } = notebooksSlice.actions;
export default notebooksSlice.reducer;