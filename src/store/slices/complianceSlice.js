import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// Async thunks for compliance operations

// Fetch paginated list of DLP violations
export const fetchViolations = createAsyncThunk(
  'compliance/fetchViolations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await aetherApi.compliance.getViolations(params);
      if (response.success) {
        // aetherApi.request() returns { data: <backend-response>, success: true }
        // Backend response is { success: true, data: [...violations...], meta: {...} }
        // So we need to access response.data.data and response.data.meta
        const backendResponse = response.data || {};
        return {
          data: backendResponse.data || [],
          meta: backendResponse.meta || {},
        };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch violations');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch violations');
    }
  }
);

// Fetch a single violation by ID
export const fetchViolation = createAsyncThunk(
  'compliance/fetchViolation',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.compliance.getViolation(id);
      if (response.success) {
        // aetherApi.request() returns { data: <backend-response>, success: true }
        // Backend response is { success: true, data: <violation> }
        const backendResponse = response.data || {};
        return backendResponse.data || backendResponse;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch violation');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch violation');
    }
  }
);

// Fetch compliance summary statistics
export const fetchSummary = createAsyncThunk(
  'compliance/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.compliance.getSummary();
      if (response.success) {
        // aetherApi.request() returns { data: <backend-response>, success: true }
        // Backend response is { success: true, data: <summary> }
        const backendResponse = response.data || {};
        return backendResponse.data || backendResponse;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch compliance summary');
      }
    } catch (error) {
      console.error('Failed to fetch compliance summary:', error);
      return rejectWithValue(error.message || 'Failed to fetch compliance summary');
    }
  }
);

// Acknowledge a violation
export const acknowledgeViolation = createAsyncThunk(
  'compliance/acknowledgeViolation',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.compliance.acknowledgeViolation(id);
      if (response.success) {
        // aetherApi.request() returns { data: <backend-response>, success: true }
        // Backend response is { success: true, data: <acknowledged-violation> }
        const backendResponse = response.data || {};
        return backendResponse.data || backendResponse;
      } else {
        return rejectWithValue(response.error || 'Failed to acknowledge violation');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to acknowledge violation');
    }
  }
);

// Bulk acknowledge multiple violations
export const bulkAcknowledgeViolations = createAsyncThunk(
  'compliance/bulkAcknowledgeViolations',
  async (violationIds, { rejectWithValue }) => {
    try {
      const response = await aetherApi.compliance.bulkAcknowledge(violationIds);
      if (response.success) {
        const backendResponse = response.data || {};
        return {
          acknowledgedIds: violationIds,
          results: backendResponse.data || backendResponse,
        };
      } else {
        return rejectWithValue(response.error || 'Failed to bulk acknowledge violations');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to bulk acknowledge violations');
    }
  }
);

const initialState = {
  // Violations list
  violations: [],
  violationsLoading: false,
  violationsError: null,

  // Pagination metadata
  meta: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },

  // Current filters
  filters: {
    severity: null,
    status: null,
    acknowledged: null,
  },

  // Selected violation for detail view
  selectedViolation: null,
  selectedViolationLoading: false,
  selectedViolationError: null,

  // Compliance summary
  summary: {
    totalViolations: 0,
    unacknowledgedCount: 0,
    complianceScore: 100,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    piiDetections: 0,
    bySeverity: {},
    byRuleType: {},
  },
  summaryLoading: false,
  summaryError: null,

  // Acknowledge operation
  acknowledgeLoading: false,
  acknowledgeError: null,

  // Bulk acknowledge operation
  bulkAcknowledgeLoading: false,
  bulkAcknowledgeError: null,

  // Real-time notifications (for toast alerts)
  recentViolations: [], // Last N violations for notifications
  hasNewCritical: false,
};

const complianceSlice = createSlice({
  name: 'compliance',
  initialState,
  reducers: {
    // Clear errors
    clearViolationsError: (state) => {
      state.violationsError = null;
    },
    clearSummaryError: (state) => {
      state.summaryError = null;
    },
    clearSelectedViolationError: (state) => {
      state.selectedViolationError = null;
    },
    clearAcknowledgeError: (state) => {
      state.acknowledgeError = null;
    },
    clearBulkAcknowledgeError: (state) => {
      state.bulkAcknowledgeError = null;
    },

    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        severity: null,
        status: null,
        acknowledged: null,
      };
    },

    // Select violation for detail view
    setSelectedViolation: (state, action) => {
      state.selectedViolation = action.payload;
    },
    clearSelectedViolation: (state) => {
      state.selectedViolation = null;
    },

    // Real-time violation updates (from SSE/polling)
    addRealtimeViolation: (state, action) => {
      const violation = action.payload;

      // Add to recent violations (keep last 10)
      state.recentViolations = [violation, ...state.recentViolations].slice(0, 10);

      // Mark if critical
      if (violation.severity === 'critical' || violation.severity === 'high') {
        state.hasNewCritical = true;
      }

      // Update unacknowledged count
      if (!violation.acknowledged) {
        state.summary.unacknowledgedCount += 1;
        state.summary.totalViolations += 1;
      }
    },

    // Clear new critical flag (after showing toast)
    clearNewCriticalFlag: (state) => {
      state.hasNewCritical = false;
    },

    // Clear recent violations
    clearRecentViolations: (state) => {
      state.recentViolations = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch violations
      .addCase(fetchViolations.pending, (state) => {
        state.violationsLoading = true;
        state.violationsError = null;
      })
      .addCase(fetchViolations.fulfilled, (state, action) => {
        state.violationsLoading = false;
        // Extract violations array from response
        const payload = action.payload || {};
        state.violations = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
        // Extract pagination metadata
        if (payload.meta) {
          state.meta = {
            page: payload.meta.page || 1,
            pageSize: payload.meta.page_size || payload.meta.pageSize || 20,
            total: payload.meta.total || 0,
            totalPages: payload.meta.total_pages || payload.meta.totalPages || 0,
          };
        }
      })
      .addCase(fetchViolations.rejected, (state, action) => {
        state.violationsLoading = false;
        state.violationsError = action.payload || 'Failed to fetch violations';
        console.error('Violations fetch error:', action.payload);
      })

      // Fetch single violation
      .addCase(fetchViolation.pending, (state) => {
        state.selectedViolationLoading = true;
        state.selectedViolationError = null;
      })
      .addCase(fetchViolation.fulfilled, (state, action) => {
        state.selectedViolationLoading = false;
        // Thunk now returns clean violation data directly
        state.selectedViolation = action.payload;
      })
      .addCase(fetchViolation.rejected, (state, action) => {
        state.selectedViolationLoading = false;
        state.selectedViolationError = action.payload || 'Failed to fetch violation';
      })

      // Fetch summary
      .addCase(fetchSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        // Thunk now returns clean summary data directly
        const data = action.payload || {};
        state.summary = {
          totalViolations: data.total_violations ?? data.totalViolations ?? 0,
          unacknowledgedCount: data.unacknowledged_count ?? data.unacknowledgedCount ?? 0,
          complianceScore: data.compliance_score ?? data.complianceScore ?? 100,
          criticalCount: data.critical_count ?? data.criticalCount ?? 0,
          highCount: data.high_count ?? data.highCount ?? 0,
          mediumCount: data.medium_count ?? data.mediumCount ?? 0,
          lowCount: data.low_count ?? data.lowCount ?? 0,
          piiDetections: data.pii_detections ?? data.piiDetections ?? 0,
          bySeverity: data.by_severity || data.bySeverity || {},
          byRuleType: data.by_rule_type || data.byRuleType || {},
        };
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload || 'Failed to fetch compliance summary';
        console.error('Summary fetch error:', action.payload);
      })

      // Acknowledge violation
      .addCase(acknowledgeViolation.pending, (state) => {
        state.acknowledgeLoading = true;
        state.acknowledgeError = null;
      })
      .addCase(acknowledgeViolation.fulfilled, (state, action) => {
        state.acknowledgeLoading = false;
        // Thunk now returns clean acknowledged violation data directly
        const acknowledged = action.payload;

        // Update the violation in the list
        const index = state.violations.findIndex(v => v.id === acknowledged.id);
        if (index !== -1) {
          state.violations[index] = { ...state.violations[index], ...acknowledged, acknowledged: true };
        }

        // Update selected violation if it matches
        if (state.selectedViolation?.id === acknowledged.id) {
          state.selectedViolation = { ...state.selectedViolation, ...acknowledged, acknowledged: true };
        }

        // Update summary counts
        if (state.summary.unacknowledgedCount > 0) {
          state.summary.unacknowledgedCount -= 1;
        }
      })
      .addCase(acknowledgeViolation.rejected, (state, action) => {
        state.acknowledgeLoading = false;
        state.acknowledgeError = action.payload || 'Failed to acknowledge violation';
      })

      // Bulk acknowledge violations
      .addCase(bulkAcknowledgeViolations.pending, (state) => {
        state.bulkAcknowledgeLoading = true;
        state.bulkAcknowledgeError = null;
      })
      .addCase(bulkAcknowledgeViolations.fulfilled, (state, action) => {
        state.bulkAcknowledgeLoading = false;
        const { acknowledgedIds } = action.payload;

        // Update all acknowledged violations in the list
        let acknowledgedCount = 0;
        state.violations = state.violations.map(v => {
          if (acknowledgedIds.includes(v.id) && !v.acknowledged) {
            acknowledgedCount++;
            return { ...v, acknowledged: true };
          }
          return v;
        });

        // Update summary counts
        state.summary.unacknowledgedCount = Math.max(0, state.summary.unacknowledgedCount - acknowledgedCount);

        // Clear selected violation if it was acknowledged
        if (state.selectedViolation && acknowledgedIds.includes(state.selectedViolation.id)) {
          state.selectedViolation = { ...state.selectedViolation, acknowledged: true };
        }
      })
      .addCase(bulkAcknowledgeViolations.rejected, (state, action) => {
        state.bulkAcknowledgeLoading = false;
        state.bulkAcknowledgeError = action.payload || 'Failed to bulk acknowledge violations';
      });
  },
});

export const {
  clearViolationsError,
  clearSummaryError,
  clearSelectedViolationError,
  clearAcknowledgeError,
  clearBulkAcknowledgeError,
  setFilters,
  clearFilters,
  setSelectedViolation,
  clearSelectedViolation,
  addRealtimeViolation,
  clearNewCriticalFlag,
  clearRecentViolations,
} = complianceSlice.actions;

// Selectors
export const selectViolations = (state) => state.compliance.violations;
export const selectViolationsLoading = (state) => state.compliance.violationsLoading;
export const selectViolationsError = (state) => state.compliance.violationsError;
export const selectViolationsMeta = (state) => state.compliance.meta;
export const selectFilters = (state) => state.compliance.filters;

export const selectSelectedViolation = (state) => state.compliance.selectedViolation;
export const selectSelectedViolationLoading = (state) => state.compliance.selectedViolationLoading;
export const selectSelectedViolationError = (state) => state.compliance.selectedViolationError;

export const selectSummary = (state) => state.compliance.summary;
export const selectSummaryLoading = (state) => state.compliance.summaryLoading;
export const selectSummaryError = (state) => state.compliance.summaryError;

export const selectAcknowledgeLoading = (state) => state.compliance.acknowledgeLoading;
export const selectAcknowledgeError = (state) => state.compliance.acknowledgeError;

export const selectBulkAcknowledgeLoading = (state) => state.compliance.bulkAcknowledgeLoading;
export const selectBulkAcknowledgeError = (state) => state.compliance.bulkAcknowledgeError;

export const selectRecentViolations = (state) => state.compliance.recentViolations;
export const selectHasNewCritical = (state) => state.compliance.hasNewCritical;

// Derived selectors
export const selectUnacknowledgedCount = createSelector(
  [selectSummary],
  (summary) => summary.unacknowledgedCount
);

export const selectComplianceScore = createSelector(
  [selectSummary],
  (summary) => summary.complianceScore
);

export const selectCriticalViolations = createSelector(
  [selectViolations],
  (violations) => violations.filter(v => v.severity === 'critical')
);

export const selectHighSeverityViolations = createSelector(
  [selectViolations],
  (violations) => violations.filter(v => v.severity === 'critical' || v.severity === 'high')
);

export const selectUnacknowledgedViolations = createSelector(
  [selectViolations],
  (violations) => violations.filter(v => !v.acknowledged)
);

export default complianceSlice.reducer;
