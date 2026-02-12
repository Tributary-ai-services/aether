import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// =====================
// Async Thunks
// =====================

/**
 * Fetch available producer agents for a notebook
 */
export const fetchNotebookProducers = createAsyncThunk(
  'producers/fetchNotebookProducers',
  async (notebookId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.producers.getNotebookProducers(notebookId);
      if (response.success) {
        return { notebookId, producers: response.data || [] };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch producers');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch producers');
    }
  }
);

/**
 * Execute a producer agent on a notebook
 */
export const executeProducer = createAsyncThunk(
  'producers/executeProducer',
  async ({ notebookId, agentId, request }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.producers.executeProducer(notebookId, agentId, request);
      if (response.success) {
        return { notebookId, agentId, production: response.data.production, content: response.data.content };
      } else {
        return rejectWithValue(response.error || 'Failed to execute producer');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to execute producer');
    }
  }
);

/**
 * Fetch productions for a notebook
 */
export const fetchNotebookProductions = createAsyncThunk(
  'producers/fetchNotebookProductions',
  async ({ notebookId, limit = 20, offset = 0 }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.productions.getByNotebook(notebookId, { limit, offset });
      if (response.success) {
        return {
          notebookId,
          productions: response.data.productions || [],
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false
        };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch productions');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch productions');
    }
  }
);

/**
 * Get a production by ID
 */
export const fetchProductionById = createAsyncThunk(
  'producers/fetchProductionById',
  async (productionId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.productions.getById(productionId);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch production');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch production');
    }
  }
);

/**
 * Get production content
 */
export const fetchProductionContent = createAsyncThunk(
  'producers/fetchProductionContent',
  async (productionId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.productions.getContent(productionId);
      if (response.success) {
        return { productionId, content: response.data.content };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch production content');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch production content');
    }
  }
);

/**
 * Delete a production
 */
export const deleteProduction = createAsyncThunk(
  'producers/deleteProduction',
  async ({ productionId, notebookId }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.productions.delete(productionId);
      if (response.success) {
        return { productionId, notebookId };
      } else {
        return rejectWithValue(response.error || 'Failed to delete production');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete production');
    }
  }
);

/**
 * Bulk delete multiple productions
 */
export const bulkDeleteProductions = createAsyncThunk(
  'producers/bulkDeleteProductions',
  async ({ productionIds, notebookId }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.productions.bulkDelete(productionIds);
      if (response.success) {
        return {
          deleted: response.data.deleted || [],
          failed: response.data.failed || [],
          notebookId,
        };
      } else {
        return rejectWithValue(response.error || 'Failed to bulk delete productions');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to bulk delete productions');
    }
  }
);

/**
 * Fetch producer preferences for current user
 */
export const fetchProducerPreferences = createAsyncThunk(
  'producers/fetchProducerPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.producers.getPreferences();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch preferences');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch preferences');
    }
  }
);

/**
 * Update producer preferences (pin/unpin agents, settings)
 */
export const updateProducerPreferences = createAsyncThunk(
  'producers/updateProducerPreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await aetherApi.producers.updatePreferences(preferences);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to update preferences');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update preferences');
    }
  }
);

// =====================
// Initial State
// =====================

const initialState = {
  // Producer agents by notebook
  byNotebook: {}, // { [notebookId]: { producers: [], loading: false, error: null } }

  // User preferences for producers
  preferences: {
    pinned: {
      global: [],
      bySpace: {},
      byNotebook: {},
    },
    order: {
      global: [], // Custom ordering of producer IDs
      bySpace: {},
      byNotebook: {},
    },
    recent: [],
    settings: {
      defaultFormat: 'markdown',
      defaultType: 'summary',
    },
    loading: false,
    error: null,
  },

  // Productions (artifacts) by notebook
  productions: {}, // { [notebookId]: { items: [], total: 0, hasMore: false, loading: false, error: null } }

  // Production content cache
  productionContent: {}, // { [productionId]: { content: string, loading: false, error: null } }

  // Execution state
  executing: {
    isExecuting: false,
    agentId: null,
    notebookId: null,
    status: null, // 'pending' | 'executing' | 'completed' | 'failed'
    error: null,
    production: null, // The created production after successful execution
  },

  // Global loading and error states
  loading: false,
  error: null,
};

// =====================
// Slice Definition
// =====================

const producersSlice = createSlice({
  name: 'producers',
  initialState,
  reducers: {
    // Clear error state
    clearError: (state) => {
      state.error = null;
    },

    // Clear execution state
    clearExecutionState: (state) => {
      state.executing = {
        isExecuting: false,
        agentId: null,
        notebookId: null,
        status: null,
        error: null,
        production: null,
      };
    },

    // Clear producers for a notebook (e.g., when leaving notebook view)
    clearNotebookProducers: (state, action) => {
      const { notebookId } = action.payload;
      delete state.byNotebook[notebookId];
    },

    // Clear productions for a notebook
    clearNotebookProductions: (state, action) => {
      const { notebookId } = action.payload;
      delete state.productions[notebookId];
    },

    // Clear production content cache
    clearProductionContent: (state, action) => {
      const { productionId } = action.payload;
      if (productionId) {
        delete state.productionContent[productionId];
      } else {
        state.productionContent = {};
      }
    },

    // Add to recent producers
    addToRecent: (state, action) => {
      const { agentId } = action.payload;
      const recent = state.preferences.recent.filter(id => id !== agentId);
      recent.unshift(agentId);
      // Keep only last 10 recent
      state.preferences.recent = recent.slice(0, 10);
    },

    // Set custom producer order (for drag-and-drop reordering)
    setProducerOrder: (state, action) => {
      const { order, scope = 'global', scopeId = null } = action.payload;
      if (scope === 'global') {
        state.preferences.order.global = order;
      } else if (scope === 'bySpace' && scopeId) {
        state.preferences.order.bySpace[scopeId] = order;
      } else if (scope === 'byNotebook' && scopeId) {
        state.preferences.order.byNotebook[scopeId] = order;
      }
    },
  },

  extraReducers: (builder) => {
    // =====================
    // Fetch Notebook Producers
    // =====================
    builder
      .addCase(fetchNotebookProducers.pending, (state, action) => {
        const notebookId = action.meta.arg;
        state.byNotebook[notebookId] = {
          ...state.byNotebook[notebookId],
          loading: true,
          error: null,
        };
      })
      .addCase(fetchNotebookProducers.fulfilled, (state, action) => {
        const { notebookId, producers } = action.payload;
        state.byNotebook[notebookId] = {
          producers,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchNotebookProducers.rejected, (state, action) => {
        const notebookId = action.meta.arg;
        state.byNotebook[notebookId] = {
          ...state.byNotebook[notebookId],
          loading: false,
          error: action.payload || 'Failed to fetch producers',
        };
      });

    // =====================
    // Execute Producer
    // =====================
    builder
      .addCase(executeProducer.pending, (state, action) => {
        const { notebookId, agentId } = action.meta.arg;
        state.executing = {
          isExecuting: true,
          agentId,
          notebookId,
          status: 'executing',
          error: null,
          production: null,
        };
      })
      .addCase(executeProducer.fulfilled, (state, action) => {
        const { notebookId, agentId, production, content } = action.payload;

        // Update execution state
        state.executing = {
          isExecuting: false,
          agentId,
          notebookId,
          status: 'completed',
          error: null,
          production: { ...production, content },
        };

        // Add to productions list for the notebook
        if (!state.productions[notebookId]) {
          state.productions[notebookId] = {
            items: [],
            total: 0,
            hasMore: false,
            loading: false,
            error: null,
          };
        }
        state.productions[notebookId].items.unshift(production);
        state.productions[notebookId].total += 1;

        // Add to recent producers
        const recent = state.preferences.recent.filter(id => id !== agentId);
        recent.unshift(agentId);
        state.preferences.recent = recent.slice(0, 10);
      })
      .addCase(executeProducer.rejected, (state, action) => {
        const { notebookId, agentId } = action.meta.arg;
        state.executing = {
          isExecuting: false,
          agentId,
          notebookId,
          status: 'failed',
          error: action.payload || 'Execution failed',
          production: null,
        };
      });

    // =====================
    // Fetch Notebook Productions
    // =====================
    builder
      .addCase(fetchNotebookProductions.pending, (state, action) => {
        const { notebookId } = action.meta.arg;
        state.productions[notebookId] = {
          ...state.productions[notebookId],
          loading: true,
          error: null,
        };
      })
      .addCase(fetchNotebookProductions.fulfilled, (state, action) => {
        const { notebookId, productions, total, hasMore } = action.payload;
        const existing = state.productions[notebookId]?.items || [];
        const offset = action.meta.arg.offset || 0;

        state.productions[notebookId] = {
          items: offset === 0 ? productions : [...existing, ...productions],
          total,
          hasMore,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchNotebookProductions.rejected, (state, action) => {
        const { notebookId } = action.meta.arg;
        state.productions[notebookId] = {
          ...state.productions[notebookId],
          loading: false,
          error: action.payload || 'Failed to fetch productions',
        };
      });

    // =====================
    // Fetch Production by ID
    // =====================
    builder
      .addCase(fetchProductionById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductionById.fulfilled, (state, action) => {
        state.loading = false;
        // Update production in the appropriate notebook's list if it exists
        const production = action.payload;
        if (production && production.notebookId) {
          const notebookProductions = state.productions[production.notebookId];
          if (notebookProductions) {
            const index = notebookProductions.items.findIndex(p => p.id === production.id);
            if (index !== -1) {
              notebookProductions.items[index] = production;
            }
          }
        }
      })
      .addCase(fetchProductionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch production';
      });

    // =====================
    // Fetch Production Content
    // =====================
    builder
      .addCase(fetchProductionContent.pending, (state, action) => {
        const productionId = action.meta.arg;
        state.productionContent[productionId] = {
          ...state.productionContent[productionId],
          loading: true,
          error: null,
        };
      })
      .addCase(fetchProductionContent.fulfilled, (state, action) => {
        const { productionId, content } = action.payload;
        state.productionContent[productionId] = {
          content,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchProductionContent.rejected, (state, action) => {
        const productionId = action.meta.arg;
        state.productionContent[productionId] = {
          ...state.productionContent[productionId],
          loading: false,
          error: action.payload || 'Failed to fetch content',
        };
      });

    // =====================
    // Delete Production
    // =====================
    builder
      .addCase(deleteProduction.fulfilled, (state, action) => {
        const { productionId, notebookId } = action.payload;

        // Remove from notebook's productions list
        if (state.productions[notebookId]) {
          state.productions[notebookId].items = state.productions[notebookId].items.filter(
            p => p.id !== productionId
          );
          state.productions[notebookId].total -= 1;
        }

        // Remove from content cache
        delete state.productionContent[productionId];
      });

    // =====================
    // Bulk Delete Productions
    // =====================
    builder
      .addCase(bulkDeleteProductions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkDeleteProductions.fulfilled, (state, action) => {
        const { deleted, notebookId } = action.payload;
        state.loading = false;

        // Remove deleted productions from notebook's list
        if (state.productions[notebookId] && deleted.length > 0) {
          const deletedSet = new Set(deleted);
          state.productions[notebookId].items = state.productions[notebookId].items.filter(
            p => !deletedSet.has(p.id)
          );
          state.productions[notebookId].total -= deleted.length;
        }

        // Remove deleted items from content cache
        deleted.forEach(productionId => {
          delete state.productionContent[productionId];
        });
      })
      .addCase(bulkDeleteProductions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Bulk delete failed';
      });

    // =====================
    // Fetch Producer Preferences
    // =====================
    builder
      .addCase(fetchProducerPreferences.pending, (state) => {
        state.preferences.loading = true;
        state.preferences.error = null;
      })
      .addCase(fetchProducerPreferences.fulfilled, (state, action) => {
        state.preferences = {
          ...state.preferences,
          ...action.payload,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchProducerPreferences.rejected, (state, action) => {
        state.preferences.loading = false;
        state.preferences.error = action.payload || 'Failed to fetch preferences';
      });

    // =====================
    // Update Producer Preferences
    // =====================
    builder
      .addCase(updateProducerPreferences.pending, (state) => {
        state.preferences.loading = true;
        state.preferences.error = null;
      })
      .addCase(updateProducerPreferences.fulfilled, (state, action) => {
        state.preferences = {
          ...state.preferences,
          ...action.payload,
          loading: false,
          error: null,
        };
      })
      .addCase(updateProducerPreferences.rejected, (state, action) => {
        state.preferences.loading = false;
        state.preferences.error = action.payload || 'Failed to update preferences';
      });
  },
});

// =====================
// Actions
// =====================

export const {
  clearError,
  clearExecutionState,
  clearNotebookProducers,
  clearNotebookProductions,
  clearProductionContent,
  addToRecent,
  setProducerOrder,
} = producersSlice.actions;

// =====================
// Selectors
// =====================

// Base selector
const selectProducersState = (state) => state.producers;

// Select producers for a specific notebook
export const selectNotebookProducers = createSelector(
  [selectProducersState, (_, notebookId) => notebookId],
  (state, notebookId) => state.byNotebook[notebookId]?.producers || []
);

// Select loading state for notebook producers
export const selectNotebookProducersLoading = createSelector(
  [selectProducersState, (_, notebookId) => notebookId],
  (state, notebookId) => state.byNotebook[notebookId]?.loading || false
);

// Select productions for a specific notebook
export const selectNotebookProductions = createSelector(
  [selectProducersState, (_, notebookId) => notebookId],
  (state, notebookId) => state.productions[notebookId]?.items || []
);

// Select production content
export const selectProductionContent = createSelector(
  [selectProducersState, (_, productionId) => productionId],
  (state, productionId) => state.productionContent[productionId]?.content || null
);

// Select execution state
export const selectExecutionState = createSelector(
  [selectProducersState],
  (state) => state.executing
);

// Select preferences
export const selectProducerPreferences = createSelector(
  [selectProducersState],
  (state) => state.preferences
);

// Select pinned producers for current context
export const selectPinnedProducers = createSelector(
  [selectProducerPreferences, (_, context) => context],
  (preferences, context) => {
    const pinned = new Set(preferences.pinned?.global || []);

    if (context?.spaceId && preferences.pinned?.bySpace?.[context.spaceId]) {
      preferences.pinned.bySpace[context.spaceId].forEach(id => pinned.add(id));
    }

    if (context?.notebookId && preferences.pinned?.byNotebook?.[context.notebookId]) {
      preferences.pinned.byNotebook[context.notebookId].forEach(id => pinned.add(id));
    }

    return Array.from(pinned);
  }
);

// Select recent producers
export const selectRecentProducers = createSelector(
  [selectProducerPreferences],
  (preferences) => preferences.recent || []
);

// Select producers sorted by pinned, then recent, then all
// Select custom order preference (notebook-specific or global fallback)
export const selectProducerOrder = createSelector(
  [selectProducerPreferences, (_, notebookId) => notebookId],
  (preferences, notebookId) => {
    // Prefer notebook-specific order, fall back to global
    const notebookOrder = preferences.order?.byNotebook?.[notebookId] || [];
    if (notebookOrder.length > 0) {
      return notebookOrder;
    }
    return preferences.order?.global || [];
  }
);

export const selectSortedProducers = createSelector(
  [
    selectNotebookProducers,
    selectPinnedProducers,
    selectRecentProducers,
    selectProducerPreferences,
    (_, notebookId) => notebookId,
  ],
  (producers, pinnedIds, recentIds, preferences, notebookId) => {
    const pinnedSet = new Set(pinnedIds);

    // Get custom order (notebook-specific or global fallback)
    const notebookOrder = preferences.order?.byNotebook?.[notebookId] || [];
    const customOrder = notebookOrder.length > 0 ? notebookOrder : (preferences.order?.global || []);

    // If there's a custom order, use it as the primary sort
    if (customOrder.length > 0) {
      // Sort by custom order, with items not in order at the end
      const sorted = [...producers].sort((a, b) => {
        const aIndex = customOrder.indexOf(a.id);
        const bIndex = customOrder.indexOf(b.id);
        const aPos = aIndex === -1 ? customOrder.length + producers.indexOf(a) : aIndex;
        const bPos = bIndex === -1 ? customOrder.length + producers.indexOf(b) : bIndex;
        return aPos - bPos;
      });

      // Mark pinned items
      return sorted.map(producer => ({
        ...producer,
        isPinned: pinnedSet.has(producer.id),
      }));
    }

    // Default behavior: pinned first, then recent, then rest
    const recentSet = new Set(recentIds);
    const pinned = [];
    const recent = [];
    const rest = [];

    producers.forEach(producer => {
      if (pinnedSet.has(producer.id)) {
        pinned.push({ ...producer, isPinned: true });
      } else if (recentSet.has(producer.id)) {
        recent.push({ ...producer, isRecent: true });
      } else {
        rest.push(producer);
      }
    });

    // Sort recent by order in recentIds
    recent.sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));

    return [...pinned, ...recent, ...rest];
  }
);

export default producersSlice.reducer;
