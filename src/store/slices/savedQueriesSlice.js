import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// ============================================================================
// Async Thunks for Saved Queries Operations
// ============================================================================

// Fetch all saved queries
export const fetchSavedQueries = createAsyncThunk(
  'savedQueries/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await aetherApi.savedQueries.getAll(filters);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch saved queries');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch saved queries');
    }
  }
);

// Create a new saved query
export const createSavedQuery = createAsyncThunk(
  'savedQueries/create',
  async (queryData, { rejectWithValue }) => {
    try {
      const response = await aetherApi.savedQueries.create(queryData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to create saved query');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create saved query');
    }
  }
);

// Update an existing saved query
export const updateSavedQuery = createAsyncThunk(
  'savedQueries/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.savedQueries.update(id, updates);
      if (response.success) {
        return { id, ...response.data };
      } else {
        return rejectWithValue(response.error || 'Failed to update saved query');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update saved query');
    }
  }
);

// Delete a saved query
export const deleteSavedQuery = createAsyncThunk(
  'savedQueries/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.savedQueries.delete(id);
      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.error || 'Failed to delete saved query');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete saved query');
    }
  }
);

// Execute a saved query
export const executeSavedQuery = createAsyncThunk(
  'savedQueries/execute',
  async ({ id, parameters = [] }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.savedQueries.execute(id, parameters);
      if (response.success) {
        return { id, result: response.data };
      } else {
        return rejectWithValue(response.error || 'Query execution failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Query execution failed');
    }
  }
);

// Duplicate a saved query
export const duplicateSavedQuery = createAsyncThunk(
  'savedQueries/duplicate',
  async ({ id, name }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.savedQueries.duplicate(id, name);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to duplicate saved query');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to duplicate saved query');
    }
  }
);

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  // Saved queries list
  queries: [],
  queriesLoading: false,
  queriesError: null,

  // Pagination
  pagination: {
    total: 0,
    page: 1,
    pageSize: 20,
  },

  // Filters
  filters: {
    databaseId: null,
    visibility: null,
    tags: [],
    folder: null,
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  },

  // Selected query for editing
  selectedQuery: null,

  // Query editor state
  editor: {
    content: '',
    isDirty: false,
    databaseId: null,
  },

  // Query execution
  execution: {
    status: 'idle', // 'idle' | 'executing' | 'complete' | 'failed'
    queryId: null,
    result: null,
    error: null,
  },

  // Folders for organization
  folders: [],

  // Recent queries (for quick access)
  recentQueries: [],
};

// ============================================================================
// Slice
// ============================================================================

const savedQueriesSlice = createSlice({
  name: 'savedQueries',
  initialState,
  reducers: {
    // Select a query for editing/viewing
    setSelectedQuery: (state, action) => {
      state.selectedQuery = action.payload;
      if (action.payload) {
        state.editor.content = action.payload.query || '';
        state.editor.databaseId = action.payload.database_id || null;
        state.editor.isDirty = false;
      }
    },

    clearSelectedQuery: (state) => {
      state.selectedQuery = null;
      state.editor.content = '';
      state.editor.isDirty = false;
      state.editor.databaseId = null;
    },

    // Update editor content
    setEditorContent: (state, action) => {
      state.editor.content = action.payload;
      state.editor.isDirty = true;
    },

    setEditorDatabase: (state, action) => {
      state.editor.databaseId = action.payload;
      state.editor.isDirty = true;
    },

    resetEditorDirty: (state) => {
      state.editor.isDirty = false;
    },

    // Filter management
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = {
        databaseId: null,
        visibility: null,
        tags: [],
        folder: null,
        search: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
      };
    },

    setSearchFilter: (state, action) => {
      state.filters.search = action.payload;
    },

    setDatabaseFilter: (state, action) => {
      state.filters.databaseId = action.payload;
    },

    setVisibilityFilter: (state, action) => {
      state.filters.visibility = action.payload;
    },

    setFolderFilter: (state, action) => {
      state.filters.folder = action.payload;
    },

    setSortBy: (state, action) => {
      state.filters.sortBy = action.payload.sortBy;
      state.filters.sortOrder = action.payload.sortOrder;
    },

    // Pagination
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },

    setPageSize: (state, action) => {
      state.pagination.pageSize = action.payload;
      state.pagination.page = 1; // Reset to first page when changing page size
    },

    // Clear errors
    clearQueriesError: (state) => {
      state.queriesError = null;
    },

    clearExecutionError: (state) => {
      state.execution.error = null;
      state.execution.status = 'idle';
    },

    // Reset execution state
    resetExecution: (state) => {
      state.execution = {
        status: 'idle',
        queryId: null,
        result: null,
        error: null,
      };
    },

    // Folders management
    setFolders: (state, action) => {
      state.folders = action.payload;
    },

    addFolder: (state, action) => {
      if (!state.folders.includes(action.payload)) {
        state.folders.push(action.payload);
      }
    },

    // Recent queries
    addToRecentQueries: (state, action) => {
      const query = action.payload;
      // Remove if already exists
      state.recentQueries = state.recentQueries.filter(q => q.id !== query.id);
      // Add to beginning
      state.recentQueries.unshift(query);
      // Keep only last 10
      state.recentQueries = state.recentQueries.slice(0, 10);
    },

    clearRecentQueries: (state) => {
      state.recentQueries = [];
    },
  },

  extraReducers: (builder) => {
    builder
      // ======== Fetch Saved Queries ========
      .addCase(fetchSavedQueries.pending, (state) => {
        state.queriesLoading = true;
        state.queriesError = null;
      })
      .addCase(fetchSavedQueries.fulfilled, (state, action) => {
        state.queriesLoading = false;
        state.queries = action.payload.queries || [];
        state.pagination.total = action.payload.total || 0;
        state.pagination.page = action.payload.page || 1;
        state.pagination.pageSize = action.payload.page_size || 20;

        // Extract unique folders from queries
        const folders = new Set(state.queries.map(q => q.folder).filter(Boolean));
        state.folders = Array.from(folders);
      })
      .addCase(fetchSavedQueries.rejected, (state, action) => {
        state.queriesLoading = false;
        state.queriesError = action.payload || 'Failed to fetch saved queries';
      })

      // ======== Create Saved Query ========
      .addCase(createSavedQuery.pending, (state) => {
        state.queriesLoading = true;
        state.queriesError = null;
      })
      .addCase(createSavedQuery.fulfilled, (state, action) => {
        state.queriesLoading = false;
        state.queries.unshift(action.payload);
        state.pagination.total += 1;
        state.selectedQuery = action.payload;
        state.editor.isDirty = false;

        // Add folder if new
        if (action.payload.folder && !state.folders.includes(action.payload.folder)) {
          state.folders.push(action.payload.folder);
        }
      })
      .addCase(createSavedQuery.rejected, (state, action) => {
        state.queriesLoading = false;
        state.queriesError = action.payload || 'Failed to create saved query';
      })

      // ======== Update Saved Query ========
      .addCase(updateSavedQuery.pending, (state) => {
        state.queriesError = null;
      })
      .addCase(updateSavedQuery.fulfilled, (state, action) => {
        const index = state.queries.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.queries[index] = { ...state.queries[index], ...action.payload };
        }
        if (state.selectedQuery?.id === action.payload.id) {
          state.selectedQuery = { ...state.selectedQuery, ...action.payload };
          state.editor.isDirty = false;
        }

        // Update folders if changed
        if (action.payload.folder && !state.folders.includes(action.payload.folder)) {
          state.folders.push(action.payload.folder);
        }
      })
      .addCase(updateSavedQuery.rejected, (state, action) => {
        state.queriesError = action.payload || 'Failed to update saved query';
      })

      // ======== Delete Saved Query ========
      .addCase(deleteSavedQuery.pending, (state) => {
        state.queriesError = null;
      })
      .addCase(deleteSavedQuery.fulfilled, (state, action) => {
        state.queries = state.queries.filter(q => q.id !== action.payload);
        state.pagination.total -= 1;
        if (state.selectedQuery?.id === action.payload) {
          state.selectedQuery = null;
          state.editor.content = '';
          state.editor.isDirty = false;
        }
        // Remove from recent queries
        state.recentQueries = state.recentQueries.filter(q => q.id !== action.payload);
      })
      .addCase(deleteSavedQuery.rejected, (state, action) => {
        state.queriesError = action.payload || 'Failed to delete saved query';
      })

      // ======== Execute Saved Query ========
      .addCase(executeSavedQuery.pending, (state, action) => {
        state.execution = {
          status: 'executing',
          queryId: action.meta.arg.id,
          result: null,
          error: null,
        };
      })
      .addCase(executeSavedQuery.fulfilled, (state, action) => {
        state.execution = {
          status: 'complete',
          queryId: action.payload.id,
          result: action.payload.result,
          error: null,
        };

        // Update execution stats on the query
        const query = state.queries.find(q => q.id === action.payload.id);
        if (query) {
          query.execution_count = (query.execution_count || 0) + 1;
          query.last_executed_at = new Date().toISOString();
          query.last_row_count = action.payload.result?.row_count;
        }

        // Add to recent queries
        if (query) {
          state.recentQueries = state.recentQueries.filter(q => q.id !== query.id);
          state.recentQueries.unshift(query);
          state.recentQueries = state.recentQueries.slice(0, 10);
        }
      })
      .addCase(executeSavedQuery.rejected, (state, action) => {
        state.execution = {
          status: 'failed',
          queryId: state.execution.queryId,
          result: null,
          error: action.payload || 'Query execution failed',
        };
      })

      // ======== Duplicate Saved Query ========
      .addCase(duplicateSavedQuery.pending, (state) => {
        state.queriesLoading = true;
        state.queriesError = null;
      })
      .addCase(duplicateSavedQuery.fulfilled, (state, action) => {
        state.queriesLoading = false;
        state.queries.unshift(action.payload);
        state.pagination.total += 1;
        state.selectedQuery = action.payload;
        state.editor.content = action.payload.query || '';
        state.editor.databaseId = action.payload.database_id;
        state.editor.isDirty = false;
      })
      .addCase(duplicateSavedQuery.rejected, (state, action) => {
        state.queriesLoading = false;
        state.queriesError = action.payload || 'Failed to duplicate saved query';
      });
  },
});

// ============================================================================
// Actions Export
// ============================================================================

export const {
  setSelectedQuery,
  clearSelectedQuery,
  setEditorContent,
  setEditorDatabase,
  resetEditorDirty,
  setFilters,
  clearFilters,
  setSearchFilter,
  setDatabaseFilter,
  setVisibilityFilter,
  setFolderFilter,
  setSortBy,
  setPage,
  setPageSize,
  clearQueriesError,
  clearExecutionError,
  resetExecution,
  setFolders,
  addFolder,
  addToRecentQueries,
  clearRecentQueries,
} = savedQueriesSlice.actions;

// ============================================================================
// Selectors
// ============================================================================

// Queries selectors
export const selectQueries = (state) => state.savedQueries.queries;
export const selectQueriesLoading = (state) => state.savedQueries.queriesLoading;
export const selectQueriesError = (state) => state.savedQueries.queriesError;
export const selectSelectedQuery = (state) => state.savedQueries.selectedQuery;

// Pagination selectors
export const selectPagination = (state) => state.savedQueries.pagination;

// Filter selectors
export const selectFilters = (state) => state.savedQueries.filters;

// Editor selectors
export const selectEditor = (state) => state.savedQueries.editor;
export const selectEditorContent = (state) => state.savedQueries.editor.content;
export const selectEditorIsDirty = (state) => state.savedQueries.editor.isDirty;

// Execution selectors
export const selectExecution = (state) => state.savedQueries.execution;
export const selectExecutionStatus = (state) => state.savedQueries.execution.status;
export const selectExecutionResult = (state) => state.savedQueries.execution.result;

// Folders selector
export const selectFolders = (state) => state.savedQueries.folders;

// Recent queries selector
export const selectRecentQueries = (state) => state.savedQueries.recentQueries;

// Get query by ID
export const selectQueryById = createSelector(
  [selectQueries, (state, queryId) => queryId],
  (queries, queryId) => queries.find(q => q.id === queryId) || null
);

// Get queries by database
export const selectQueriesByDatabase = createSelector(
  [selectQueries, (state, databaseId) => databaseId],
  (queries, databaseId) => queries.filter(q => q.database_id === databaseId)
);

// Get queries by folder
export const selectQueriesByFolder = createSelector(
  [selectQueries, (state, folder) => folder],
  (queries, folder) => queries.filter(q => q.folder === folder)
);

// Get queries by visibility
export const selectQueriesByVisibility = createSelector(
  [selectQueries, (state, visibility) => visibility],
  (queries, visibility) => queries.filter(q => q.visibility === visibility)
);

// Get filtered queries (applying all current filters)
export const selectFilteredQueries = createSelector(
  [selectQueries, selectFilters],
  (queries, filters) => {
    let filtered = [...queries];

    if (filters.databaseId) {
      filtered = filtered.filter(q => q.database_id === filters.databaseId);
    }

    if (filters.visibility) {
      filtered = filtered.filter(q => q.visibility === filters.visibility);
    }

    if (filters.folder) {
      filtered = filtered.filter(q => q.folder === filters.folder);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(q =>
        q.name?.toLowerCase().includes(search) ||
        q.description?.toLowerCase().includes(search) ||
        q.query?.toLowerCase().includes(search)
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(q =>
        filters.tags.some(tag => q.tags?.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy];
      const bVal = b[filters.sortBy];

      if (filters.sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }
);

export default savedQueriesSlice.reducer;
