import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// =====================
// Async Thunks
// =====================

/**
 * Fetch workflows with pagination
 */
export const fetchWorkflows = createAsyncThunk(
  'workflows/fetchWorkflows',
  async ({ limit = 50, offset = 0 } = {}, { rejectWithValue }) => {
    try {
      const response = await aetherApi.workflows.getAll({ limit, offset });
      if (response.success) {
        return {
          workflows: response.data.workflows || [],
          pagination: response.data.pagination || { total: 0, limit, offset },
        };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch workflows');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch workflows');
    }
  }
);

/**
 * Fetch a single workflow by ID
 */
export const fetchWorkflowById = createAsyncThunk(
  'workflows/fetchWorkflowById',
  async (workflowId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.workflows.getById(workflowId);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch workflow');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch workflow');
    }
  }
);

/**
 * Create a new workflow
 */
export const createWorkflow = createAsyncThunk(
  'workflows/createWorkflow',
  async (workflowData, { rejectWithValue }) => {
    try {
      const response = await aetherApi.workflows.create(workflowData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to create workflow');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create workflow');
    }
  }
);

/**
 * Update an existing workflow
 */
export const updateWorkflow = createAsyncThunk(
  'workflows/updateWorkflow',
  async ({ workflowId, data }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.workflows.update(workflowId, data);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to update workflow');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update workflow');
    }
  }
);

/**
 * Delete a workflow
 */
export const deleteWorkflow = createAsyncThunk(
  'workflows/deleteWorkflow',
  async (workflowId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.workflows.delete(workflowId);
      if (response.success) {
        return workflowId;
      } else {
        return rejectWithValue(response.error || 'Failed to delete workflow');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete workflow');
    }
  }
);

/**
 * Execute a workflow
 */
export const executeWorkflow = createAsyncThunk(
  'workflows/executeWorkflow',
  async ({ workflowId, data = {} }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.workflows.execute(workflowId, data);
      if (response.success) {
        return { workflowId, execution: response.data };
      } else {
        return rejectWithValue(response.error || 'Failed to execute workflow');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to execute workflow');
    }
  }
);

/**
 * Update workflow status (active/paused/disabled)
 */
export const updateWorkflowStatus = createAsyncThunk(
  'workflows/updateWorkflowStatus',
  async ({ workflowId, status }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.workflows.updateStatus(workflowId, status);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to update workflow status');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update workflow status');
    }
  }
);

/**
 * Fetch executions for a specific workflow
 */
export const fetchWorkflowExecutions = createAsyncThunk(
  'workflows/fetchWorkflowExecutions',
  async ({ workflowId, limit = 20, offset = 0 }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.workflows.getExecutions(workflowId, { limit, offset });
      if (response.success) {
        return {
          workflowId,
          executions: response.data.executions || [],
          pagination: response.data.pagination || { total: 0, limit, offset },
        };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch executions');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch executions');
    }
  }
);

/**
 * Fetch workflow analytics
 */
export const fetchWorkflowAnalytics = createAsyncThunk(
  'workflows/fetchWorkflowAnalytics',
  async (period = 'monthly', { rejectWithValue }) => {
    try {
      const response = await aetherApi.workflows.getAnalytics(period);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch analytics');
    }
  }
);

// =====================
// Initial State
// =====================

const initialState = {
  // Workflow list
  items: [],
  pagination: { total: 0, limit: 50, offset: 0 },
  loading: false,
  error: null,

  // Selected workflow detail
  selectedWorkflow: null,
  selectedLoading: false,
  selectedError: null,

  // Executions for the selected workflow
  executions: {
    items: [],
    pagination: { total: 0, limit: 20, offset: 0 },
    loading: false,
    error: null,
  },

  // Execution state (for triggering a workflow)
  executing: {
    isExecuting: false,
    workflowId: null,
    execution: null,
    error: null,
  },

  // Analytics
  analytics: {
    data: null,
    loading: false,
    error: null,
  },
};

// =====================
// Slice Definition
// =====================

const workflowsSlice = createSlice({
  name: 'workflows',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.selectedError = null;
    },

    clearSelectedWorkflow: (state) => {
      state.selectedWorkflow = null;
      state.selectedError = null;
    },

    clearExecutions: (state) => {
      state.executions = {
        items: [],
        pagination: { total: 0, limit: 20, offset: 0 },
        loading: false,
        error: null,
      };
    },

    clearExecutionState: (state) => {
      state.executing = {
        isExecuting: false,
        workflowId: null,
        execution: null,
        error: null,
      };
    },

    setSelectedWorkflow: (state, action) => {
      state.selectedWorkflow = action.payload;
    },
  },

  extraReducers: (builder) => {
    // =====================
    // Fetch Workflows
    // =====================
    builder
      .addCase(fetchWorkflows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        const { workflows, pagination } = action.payload;
        const offset = pagination.offset || 0;
        state.items = offset === 0 ? workflows : [...state.items, ...workflows];
        state.pagination = pagination;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch workflows';
      });

    // =====================
    // Fetch Workflow By ID
    // =====================
    builder
      .addCase(fetchWorkflowById.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchWorkflowById.fulfilled, (state, action) => {
        state.selectedWorkflow = action.payload;
        state.selectedLoading = false;
        state.selectedError = null;
        // Also update in list if present
        const index = state.items.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(fetchWorkflowById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload || 'Failed to fetch workflow';
      });

    // =====================
    // Create Workflow
    // =====================
    builder
      .addCase(createWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.pagination.total += 1;
        state.loading = false;
        state.error = null;
      })
      .addCase(createWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create workflow';
      });

    // =====================
    // Update Workflow
    // =====================
    builder
      .addCase(updateWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.items.findIndex(w => w.id === updated.id);
        if (index !== -1) {
          state.items[index] = updated;
        }
        if (state.selectedWorkflow?.id === updated.id) {
          state.selectedWorkflow = updated;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update workflow';
      });

    // =====================
    // Delete Workflow
    // =====================
    builder
      .addCase(deleteWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.items = state.items.filter(w => w.id !== deletedId);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        if (state.selectedWorkflow?.id === deletedId) {
          state.selectedWorkflow = null;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete workflow';
      });

    // =====================
    // Execute Workflow
    // =====================
    builder
      .addCase(executeWorkflow.pending, (state, action) => {
        const { workflowId } = action.meta.arg;
        state.executing = {
          isExecuting: true,
          workflowId,
          execution: null,
          error: null,
        };
      })
      .addCase(executeWorkflow.fulfilled, (state, action) => {
        const { workflowId, execution } = action.payload;
        state.executing = {
          isExecuting: false,
          workflowId,
          execution,
          error: null,
        };
        // Update execution count on the workflow in the list
        const index = state.items.findIndex(w => w.id === workflowId);
        if (index !== -1) {
          state.items[index].execution_count = (state.items[index].execution_count || 0) + 1;
        }
        if (state.selectedWorkflow?.id === workflowId) {
          state.selectedWorkflow.execution_count = (state.selectedWorkflow.execution_count || 0) + 1;
        }
        // Prepend to executions list if viewing this workflow's executions
        if (state.executions.items.length > 0 || state.executions.pagination.total > 0) {
          state.executions.items.unshift(execution);
          state.executions.pagination.total += 1;
        }
      })
      .addCase(executeWorkflow.rejected, (state, action) => {
        state.executing = {
          isExecuting: false,
          workflowId: action.meta.arg.workflowId,
          execution: null,
          error: action.payload || 'Execution failed',
        };
      });

    // =====================
    // Update Workflow Status
    // =====================
    builder
      .addCase(updateWorkflowStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWorkflowStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.items.findIndex(w => w.id === updated.id);
        if (index !== -1) {
          state.items[index] = updated;
        }
        if (state.selectedWorkflow?.id === updated.id) {
          state.selectedWorkflow = updated;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateWorkflowStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update workflow status';
      });

    // =====================
    // Fetch Workflow Executions
    // =====================
    builder
      .addCase(fetchWorkflowExecutions.pending, (state) => {
        state.executions.loading = true;
        state.executions.error = null;
      })
      .addCase(fetchWorkflowExecutions.fulfilled, (state, action) => {
        const { executions, pagination } = action.payload;
        const offset = pagination.offset || 0;
        state.executions.items = offset === 0 ? executions : [...state.executions.items, ...executions];
        state.executions.pagination = pagination;
        state.executions.loading = false;
        state.executions.error = null;
      })
      .addCase(fetchWorkflowExecutions.rejected, (state, action) => {
        state.executions.loading = false;
        state.executions.error = action.payload || 'Failed to fetch executions';
      });

    // =====================
    // Fetch Workflow Analytics
    // =====================
    builder
      .addCase(fetchWorkflowAnalytics.pending, (state) => {
        state.analytics.loading = true;
        state.analytics.error = null;
      })
      .addCase(fetchWorkflowAnalytics.fulfilled, (state, action) => {
        state.analytics.data = action.payload;
        state.analytics.loading = false;
        state.analytics.error = null;
      })
      .addCase(fetchWorkflowAnalytics.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload || 'Failed to fetch analytics';
      });
  },
});

// =====================
// Actions
// =====================

export const {
  clearError,
  clearSelectedWorkflow,
  clearExecutions,
  clearExecutionState,
  setSelectedWorkflow,
} = workflowsSlice.actions;

// =====================
// Selectors
// =====================

const selectWorkflowsState = (state) => state.workflows;

export const selectAllWorkflows = createSelector(
  [selectWorkflowsState],
  (state) => state.items
);

export const selectWorkflowsLoading = createSelector(
  [selectWorkflowsState],
  (state) => state.loading
);

export const selectWorkflowsError = createSelector(
  [selectWorkflowsState],
  (state) => state.error
);

export const selectWorkflowsPagination = createSelector(
  [selectWorkflowsState],
  (state) => state.pagination
);

export const selectSelectedWorkflow = createSelector(
  [selectWorkflowsState],
  (state) => state.selectedWorkflow
);

export const selectSelectedWorkflowLoading = createSelector(
  [selectWorkflowsState],
  (state) => state.selectedLoading
);

export const selectWorkflowById = createSelector(
  [selectAllWorkflows, (_, workflowId) => workflowId],
  (items, workflowId) => items.find(w => w.id === workflowId) || null
);

export const selectWorkflowExecutions = createSelector(
  [selectWorkflowsState],
  (state) => state.executions.items
);

export const selectWorkflowExecutionsLoading = createSelector(
  [selectWorkflowsState],
  (state) => state.executions.loading
);

export const selectWorkflowExecutionsPagination = createSelector(
  [selectWorkflowsState],
  (state) => state.executions.pagination
);

export const selectExecutionState = createSelector(
  [selectWorkflowsState],
  (state) => state.executing
);

export const selectWorkflowAnalytics = createSelector(
  [selectWorkflowsState],
  (state) => state.analytics.data
);

export const selectWorkflowAnalyticsLoading = createSelector(
  [selectWorkflowsState],
  (state) => state.analytics.loading
);

// Derived selectors
export const selectActiveWorkflows = createSelector(
  [selectAllWorkflows],
  (workflows) => workflows.filter(w => w.status === 'active')
);

export const selectWorkflowsByType = createSelector(
  [selectAllWorkflows, (_, type) => type],
  (workflows, type) => workflows.filter(w => w.type === type)
);

export const selectWorkflowsCount = createSelector(
  [selectWorkflowsPagination],
  (pagination) => pagination.total
);

export default workflowsSlice.reducer;
