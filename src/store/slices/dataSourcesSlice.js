import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// ============================================================================
// Data Source Types
// ============================================================================
export const DATA_SOURCE_TYPES = {
  FILE_UPLOAD: 'file_upload',
  TEXT_INPUT: 'text_input',
  WEB_SCRAPING: 'web_scraping',
  DATABASE: 'database',
  GOOGLE_DRIVE: 'google_drive',
  API_INTEGRATION: 'api_integration',
  CLOUD_STORAGE: 'cloud_storage',
};

// ============================================================================
// Async Thunks for Data Source Operations
// ============================================================================

// Fetch all data sources for the current space
export const fetchDataSources = createAsyncThunk(
  'dataSources/fetchDataSources',
  async (options = {}, { rejectWithValue }) => {
    try {
      const response = await aetherApi.dataSources.getAll(options);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch data sources');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch data sources');
    }
  }
);

// Create a new data source
export const createDataSource = createAsyncThunk(
  'dataSources/createDataSource',
  async (dataSourceData, { rejectWithValue }) => {
    try {
      const response = await aetherApi.dataSources.create(dataSourceData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to create data source');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create data source');
    }
  }
);

// Update an existing data source
export const updateDataSource = createAsyncThunk(
  'dataSources/updateDataSource',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.dataSources.update(id, updates);
      if (response.success) {
        return { id, ...response.data, ...updates };
      } else {
        return rejectWithValue(response.error || 'Failed to update data source');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update data source');
    }
  }
);

// Delete a data source
export const deleteDataSource = createAsyncThunk(
  'dataSources/deleteDataSource',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.dataSources.delete(id);
      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.error || 'Failed to delete data source');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete data source');
    }
  }
);

// Test a data source connection
export const testDataSourceConnection = createAsyncThunk(
  'dataSources/testConnection',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.dataSources.testConnection(id);
      if (response.success) {
        return { id, result: response.data };
      } else {
        return rejectWithValue(response.error || 'Connection test failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Connection test failed');
    }
  }
);

// Trigger a sync for a data source
export const triggerDataSourceSync = createAsyncThunk(
  'dataSources/triggerSync',
  async ({ id, options = {} }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.dataSources.triggerSync(id, options);
      if (response.success) {
        return { id, syncJob: response.data };
      } else {
        return rejectWithValue(response.error || 'Failed to trigger sync');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to trigger sync');
    }
  }
);

// Fetch sync status for a data source
export const fetchSyncStatus = createAsyncThunk(
  'dataSources/fetchSyncStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.dataSources.getSyncStatus(id);
      if (response.success) {
        return { id, status: response.data };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch sync status');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch sync status');
    }
  }
);

// ============================================================================
// URL Probing Thunks (for Web Scraping)
// ============================================================================

// Probe a URL to detect AI-friendly content (llms.txt, ai.txt, etc.)
export const probeUrl = createAsyncThunk(
  'dataSources/probeUrl',
  async (url, { rejectWithValue }) => {
    try {
      const response = await aetherApi.dataSources.probeUrl(url);
      if (response.success) {
        // Backend returns { success: true, data: {...} }, so unwrap the nested data
        const result = response.data?.data || response.data;
        return result;
      } else {
        return rejectWithValue(response.error || response.data?.error || 'Failed to probe URL');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to probe URL');
    }
  }
);

// Scrape a URL using the recommended scraper
export const scrapeUrl = createAsyncThunk(
  'dataSources/scrapeUrl',
  async ({ url, scraperType, options = {} }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.dataSources.scrapeUrl(url, scraperType, options);
      if (response.success) {
        // Backend returns { success: true, data: {...} }, so unwrap the nested data
        const result = response.data?.data || response.data;
        return result;
      } else {
        return rejectWithValue(response.error || response.data?.error || 'Failed to scrape URL');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to scrape URL');
    }
  }
);

// ============================================================================
// Credential Thunks
// ============================================================================

// Fetch all credentials (metadata only - never secrets)
export const fetchCredentials = createAsyncThunk(
  'dataSources/fetchCredentials',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.credentials.list();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch credentials');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch credentials');
    }
  }
);

// Create a new credential
export const createCredential = createAsyncThunk(
  'dataSources/createCredential',
  async (credentialData, { rejectWithValue }) => {
    try {
      const response = await aetherApi.credentials.create(credentialData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to create credential');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create credential');
    }
  }
);

// Delete a credential
export const deleteCredential = createAsyncThunk(
  'dataSources/deleteCredential',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.credentials.delete(id);
      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.error || 'Failed to delete credential');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete credential');
    }
  }
);

// Test a credential
export const testCredential = createAsyncThunk(
  'dataSources/testCredential',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.credentials.test(id);
      if (response.success) {
        return { id, result: response.data };
      } else {
        return rejectWithValue(response.error || 'Credential test failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Credential test failed');
    }
  }
);

// ============================================================================
// OAuth Thunks
// ============================================================================

// Initiate OAuth flow
export const initiateOAuthFlow = createAsyncThunk(
  'dataSources/initiateOAuthFlow',
  async (provider, { rejectWithValue }) => {
    try {
      const response = await aetherApi.oauth.initiateFlow(provider);
      if (response.success) {
        return { provider, ...response.data };
      } else {
        return rejectWithValue(response.error || 'Failed to initiate OAuth flow');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to initiate OAuth flow');
    }
  }
);

// Handle OAuth callback
export const handleOAuthCallback = createAsyncThunk(
  'dataSources/handleOAuthCallback',
  async ({ provider, code, state }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.oauth.callback(provider, code, state);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'OAuth callback failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'OAuth callback failed');
    }
  }
);

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  // Data sources list
  dataSources: [],
  dataSourcesLoading: false,
  dataSourcesError: null,

  // Selected data source for editing
  selectedDataSource: null,

  // OAuth state
  oauthState: null,          // CSRF protection token
  oauthProvider: null,       // Current OAuth provider
  oauthPending: false,
  oauthError: null,

  // Credentials (metadata only - secrets never in frontend)
  credentials: [],           // { id, provider, name, status, created_at }
  credentialsLoading: false,
  credentialsError: null,

  // Sync jobs by data source ID
  syncJobs: {},              // { dataSourceId: { status, progress, startedAt, ... } }
  syncJobsLoading: false,
  syncJobsError: null,

  // Connection testing
  connectionTest: {
    status: 'idle',          // 'idle' | 'testing' | 'success' | 'failed'
    dataSourceId: null,
    result: null,
    error: null,
  },

  // URL probing (for web scraping)
  urlProbe: {
    status: 'idle',          // 'idle' | 'probing' | 'complete' | 'failed'
    url: null,
    result: null,            // { hasLlmsTxt, hasAiTxt, robotsRules, recommendedScraper, ... }
    error: null,
  },

  // Web scraping
  scraping: {
    status: 'idle',          // 'idle' | 'scraping' | 'complete' | 'failed'
    url: null,
    result: null,
    error: null,
  },

  // Metadata
  metadata: {
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  },
};

// ============================================================================
// Slice
// ============================================================================

const dataSourcesSlice = createSlice({
  name: 'dataSources',
  initialState,
  reducers: {
    // Select a data source for editing/viewing
    setSelectedDataSource: (state, action) => {
      state.selectedDataSource = action.payload;
    },

    clearSelectedDataSource: (state) => {
      state.selectedDataSource = null;
    },

    // Clear errors
    clearError: (state) => {
      state.dataSourcesError = null;
    },

    clearCredentialsError: (state) => {
      state.credentialsError = null;
    },

    clearOAuthError: (state) => {
      state.oauthError = null;
    },

    clearConnectionTestError: (state) => {
      state.connectionTest.error = null;
      state.connectionTest.status = 'idle';
    },

    clearUrlProbeError: (state) => {
      state.urlProbe.error = null;
      state.urlProbe.status = 'idle';
    },

    clearScrapingError: (state) => {
      state.scraping.error = null;
      state.scraping.status = 'idle';
    },

    // Reset OAuth state
    resetOAuthState: (state) => {
      state.oauthState = null;
      state.oauthProvider = null;
      state.oauthPending = false;
      state.oauthError = null;
    },

    // Reset URL probe
    resetUrlProbe: (state) => {
      state.urlProbe = {
        status: 'idle',
        url: null,
        result: null,
        error: null,
      };
    },

    // Reset scraping state
    resetScraping: (state) => {
      state.scraping = {
        status: 'idle',
        url: null,
        result: null,
        error: null,
      };
    },

    // Update sync job status (for real-time updates via WebSocket)
    updateSyncJobStatus: (state, action) => {
      const { dataSourceId, status } = action.payload;
      state.syncJobs[dataSourceId] = status;
    },

    // Clear sync job
    clearSyncJob: (state, action) => {
      const dataSourceId = action.payload;
      delete state.syncJobs[dataSourceId];
    },
  },

  extraReducers: (builder) => {
    builder
      // ======== Fetch Data Sources ========
      .addCase(fetchDataSources.pending, (state) => {
        state.dataSourcesLoading = true;
        state.dataSourcesError = null;
      })
      .addCase(fetchDataSources.fulfilled, (state, action) => {
        state.dataSourcesLoading = false;
        const dataSources = action.payload.dataSources || action.payload || [];
        state.dataSources = Array.isArray(dataSources) ? dataSources : [];
        state.metadata = {
          total: action.payload.total || state.dataSources.length,
          limit: action.payload.limit || 20,
          offset: action.payload.offset || 0,
          hasMore: action.payload.has_more || false,
        };
      })
      .addCase(fetchDataSources.rejected, (state, action) => {
        state.dataSourcesLoading = false;
        state.dataSourcesError = action.payload || 'Failed to fetch data sources';
      })

      // ======== Create Data Source ========
      .addCase(createDataSource.pending, (state) => {
        state.dataSourcesLoading = true;
        state.dataSourcesError = null;
      })
      .addCase(createDataSource.fulfilled, (state, action) => {
        state.dataSourcesLoading = false;
        state.dataSources.push(action.payload);
        state.metadata.total += 1;
      })
      .addCase(createDataSource.rejected, (state, action) => {
        state.dataSourcesLoading = false;
        state.dataSourcesError = action.payload || 'Failed to create data source';
      })

      // ======== Update Data Source ========
      .addCase(updateDataSource.pending, (state) => {
        state.dataSourcesError = null;
      })
      .addCase(updateDataSource.fulfilled, (state, action) => {
        const index = state.dataSources.findIndex(ds => ds.id === action.payload.id);
        if (index !== -1) {
          state.dataSources[index] = { ...state.dataSources[index], ...action.payload };
        }
        if (state.selectedDataSource?.id === action.payload.id) {
          state.selectedDataSource = { ...state.selectedDataSource, ...action.payload };
        }
      })
      .addCase(updateDataSource.rejected, (state, action) => {
        state.dataSourcesError = action.payload || 'Failed to update data source';
      })

      // ======== Delete Data Source ========
      .addCase(deleteDataSource.pending, (state) => {
        state.dataSourcesError = null;
      })
      .addCase(deleteDataSource.fulfilled, (state, action) => {
        state.dataSources = state.dataSources.filter(ds => ds.id !== action.payload);
        state.metadata.total = Math.max(0, state.metadata.total - 1);
        if (state.selectedDataSource?.id === action.payload) {
          state.selectedDataSource = null;
        }
        // Clear any sync job for this data source
        delete state.syncJobs[action.payload];
      })
      .addCase(deleteDataSource.rejected, (state, action) => {
        state.dataSourcesError = action.payload || 'Failed to delete data source';
      })

      // ======== Test Connection ========
      .addCase(testDataSourceConnection.pending, (state, action) => {
        state.connectionTest = {
          status: 'testing',
          dataSourceId: action.meta.arg,
          result: null,
          error: null,
        };
      })
      .addCase(testDataSourceConnection.fulfilled, (state, action) => {
        state.connectionTest = {
          status: 'success',
          dataSourceId: action.payload.id,
          result: action.payload.result,
          error: null,
        };
      })
      .addCase(testDataSourceConnection.rejected, (state, action) => {
        state.connectionTest = {
          status: 'failed',
          dataSourceId: state.connectionTest.dataSourceId,
          result: null,
          error: action.payload || 'Connection test failed',
        };
      })

      // ======== Trigger Sync ========
      .addCase(triggerDataSourceSync.pending, (state, action) => {
        const { id } = action.meta.arg;
        state.syncJobs[id] = {
          status: 'starting',
          progress: 0,
          startedAt: new Date().toISOString(),
        };
        state.syncJobsLoading = true;
        state.syncJobsError = null;
      })
      .addCase(triggerDataSourceSync.fulfilled, (state, action) => {
        const { id, syncJob } = action.payload;
        state.syncJobs[id] = syncJob;
        state.syncJobsLoading = false;
      })
      .addCase(triggerDataSourceSync.rejected, (state, action) => {
        state.syncJobsLoading = false;
        state.syncJobsError = action.payload || 'Failed to trigger sync';
      })

      // ======== Fetch Sync Status ========
      .addCase(fetchSyncStatus.pending, (state) => {
        state.syncJobsLoading = true;
      })
      .addCase(fetchSyncStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        state.syncJobs[id] = status;
        state.syncJobsLoading = false;
      })
      .addCase(fetchSyncStatus.rejected, (state, action) => {
        state.syncJobsLoading = false;
        state.syncJobsError = action.payload || 'Failed to fetch sync status';
      })

      // ======== URL Probing ========
      .addCase(probeUrl.pending, (state, action) => {
        state.urlProbe = {
          status: 'probing',
          url: action.meta.arg,
          result: null,
          error: null,
        };
      })
      .addCase(probeUrl.fulfilled, (state, action) => {
        state.urlProbe = {
          status: 'complete',
          url: state.urlProbe.url,
          result: action.payload,
          error: null,
        };
      })
      .addCase(probeUrl.rejected, (state, action) => {
        state.urlProbe = {
          status: 'failed',
          url: state.urlProbe.url,
          result: null,
          error: action.payload || 'URL probe failed',
        };
      })

      // ======== Web Scraping ========
      .addCase(scrapeUrl.pending, (state, action) => {
        state.scraping = {
          status: 'scraping',
          url: action.meta.arg.url,
          result: null,
          error: null,
        };
      })
      .addCase(scrapeUrl.fulfilled, (state, action) => {
        state.scraping = {
          status: 'complete',
          url: state.scraping.url,
          result: action.payload,
          error: null,
        };
      })
      .addCase(scrapeUrl.rejected, (state, action) => {
        state.scraping = {
          status: 'failed',
          url: state.scraping.url,
          result: null,
          error: action.payload || 'Scraping failed',
        };
      })

      // ======== Credentials ========
      .addCase(fetchCredentials.pending, (state) => {
        state.credentialsLoading = true;
        state.credentialsError = null;
      })
      .addCase(fetchCredentials.fulfilled, (state, action) => {
        state.credentialsLoading = false;
        state.credentials = action.payload || [];
      })
      .addCase(fetchCredentials.rejected, (state, action) => {
        state.credentialsLoading = false;
        state.credentialsError = action.payload || 'Failed to fetch credentials';
      })

      .addCase(createCredential.pending, (state) => {
        state.credentialsLoading = true;
        state.credentialsError = null;
      })
      .addCase(createCredential.fulfilled, (state, action) => {
        state.credentialsLoading = false;
        state.credentials.push(action.payload);
      })
      .addCase(createCredential.rejected, (state, action) => {
        state.credentialsLoading = false;
        state.credentialsError = action.payload || 'Failed to create credential';
      })

      .addCase(deleteCredential.fulfilled, (state, action) => {
        state.credentials = state.credentials.filter(c => c.id !== action.payload);
      })
      .addCase(deleteCredential.rejected, (state, action) => {
        state.credentialsError = action.payload || 'Failed to delete credential';
      })

      .addCase(testCredential.pending, (state) => {
        state.credentialsLoading = true;
      })
      .addCase(testCredential.fulfilled, (state, action) => {
        state.credentialsLoading = false;
        const { id, result } = action.payload;
        const credential = state.credentials.find(c => c.id === id);
        if (credential) {
          credential.lastTestResult = result;
          credential.lastTestedAt = new Date().toISOString();
        }
      })
      .addCase(testCredential.rejected, (state, action) => {
        state.credentialsLoading = false;
        state.credentialsError = action.payload || 'Credential test failed';
      })

      // ======== OAuth ========
      .addCase(initiateOAuthFlow.pending, (state, action) => {
        state.oauthPending = true;
        state.oauthProvider = action.meta.arg;
        state.oauthError = null;
      })
      .addCase(initiateOAuthFlow.fulfilled, (state, action) => {
        state.oauthPending = false;
        state.oauthState = action.payload.state;
        // Note: The actual redirect to OAuth provider is handled by the component
      })
      .addCase(initiateOAuthFlow.rejected, (state, action) => {
        state.oauthPending = false;
        state.oauthError = action.payload || 'Failed to initiate OAuth';
      })

      .addCase(handleOAuthCallback.pending, (state) => {
        state.oauthPending = true;
        state.oauthError = null;
      })
      .addCase(handleOAuthCallback.fulfilled, (state, action) => {
        state.oauthPending = false;
        state.oauthState = null;
        state.oauthProvider = null;
        // Add the new credential to the list
        if (action.payload.credential) {
          state.credentials.push(action.payload.credential);
        }
      })
      .addCase(handleOAuthCallback.rejected, (state, action) => {
        state.oauthPending = false;
        state.oauthError = action.payload || 'OAuth callback failed';
      });
  },
});

// ============================================================================
// Actions Export
// ============================================================================

export const {
  setSelectedDataSource,
  clearSelectedDataSource,
  clearError,
  clearCredentialsError,
  clearOAuthError,
  clearConnectionTestError,
  clearUrlProbeError,
  clearScrapingError,
  resetOAuthState,
  resetUrlProbe,
  resetScraping,
  updateSyncJobStatus,
  clearSyncJob,
} = dataSourcesSlice.actions;

// ============================================================================
// Selectors
// ============================================================================

// Data sources selectors
export const selectDataSources = (state) => state.dataSources.dataSources;
export const selectDataSourcesLoading = (state) => state.dataSources.dataSourcesLoading;
export const selectDataSourcesError = (state) => state.dataSources.dataSourcesError;
export const selectSelectedDataSource = (state) => state.dataSources.selectedDataSource;

// Filter data sources by type
export const selectDataSourcesByType = createSelector(
  [selectDataSources, (state, type) => type],
  (dataSources, type) => dataSources.filter(ds => ds.type === type)
);

// Credentials selectors
export const selectCredentials = (state) => state.dataSources.credentials;
export const selectCredentialsLoading = (state) => state.dataSources.credentialsLoading;
export const selectCredentialsError = (state) => state.dataSources.credentialsError;

// Filter credentials by provider
export const selectCredentialsByProvider = createSelector(
  [selectCredentials, (state, provider) => provider],
  (credentials, provider) => credentials.filter(c => c.provider === provider)
);

// OAuth selectors
export const selectOAuthState = (state) => state.dataSources.oauthState;
export const selectOAuthProvider = (state) => state.dataSources.oauthProvider;
export const selectOAuthPending = (state) => state.dataSources.oauthPending;
export const selectOAuthError = (state) => state.dataSources.oauthError;

// Connection test selectors
export const selectConnectionTest = (state) => state.dataSources.connectionTest;
export const selectConnectionTestStatus = (state) => state.dataSources.connectionTest.status;

// Sync job selectors
export const selectSyncJobs = (state) => state.dataSources.syncJobs;
export const selectSyncJobForDataSource = createSelector(
  [selectSyncJobs, (state, dataSourceId) => dataSourceId],
  (syncJobs, dataSourceId) => syncJobs[dataSourceId] || null
);

// URL probe selectors
export const selectUrlProbe = (state) => state.dataSources.urlProbe;
export const selectUrlProbeStatus = (state) => state.dataSources.urlProbe.status;
export const selectUrlProbeResult = (state) => state.dataSources.urlProbe.result;

// Scraping selectors
export const selectScraping = (state) => state.dataSources.scraping;
export const selectScrapingStatus = (state) => state.dataSources.scraping.status;
export const selectScrapingResult = (state) => state.dataSources.scraping.result;

// Metadata selectors
export const selectDataSourcesMetadata = (state) => state.dataSources.metadata;

export default dataSourcesSlice.reducer;
