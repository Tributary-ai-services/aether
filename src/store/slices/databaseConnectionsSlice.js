import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';
import { DATABASE_TYPES } from '../../config/databaseTypes.js';

// ============================================================================
// Async Thunks for Database Operations
// ============================================================================

// Fetch all database connections
export const fetchDatabaseConnections = createAsyncThunk(
  'databaseConnections/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.databases.getAll();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch database connections');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch database connections');
    }
  }
);

// Create a new database connection
export const createDatabaseConnection = createAsyncThunk(
  'databaseConnections/create',
  async (connectionData, { rejectWithValue }) => {
    try {
      const response = await aetherApi.databases.create(connectionData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to create database connection');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create database connection');
    }
  }
);

// Update an existing database connection
export const updateDatabaseConnection = createAsyncThunk(
  'databaseConnections/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.databases.update(id, updates);
      if (response.success) {
        return { id, ...response.data };
      } else {
        return rejectWithValue(response.error || 'Failed to update database connection');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update database connection');
    }
  }
);

// Delete a database connection
export const deleteDatabaseConnection = createAsyncThunk(
  'databaseConnections/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.databases.delete(id);
      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.error || 'Failed to delete database connection');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete database connection');
    }
  }
);

// Test a database connection
export const testDatabaseConnection = createAsyncThunk(
  'databaseConnections/test',
  async ({ id, connectionParams }, { rejectWithValue }) => {
    try {
      // If id is provided, test existing connection
      // If connectionParams is provided, test new connection before saving
      const response = id
        ? await aetherApi.databases.testConnection(id)
        : await aetherApi.databases.testNewConnection(connectionParams);

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

// Fetch database schema (tables, views, etc.)
export const fetchDatabaseSchema = createAsyncThunk(
  'databaseConnections/fetchSchema',
  async (connectionId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.databases.getSchema(connectionId);
      if (response.success) {
        return { connectionId, schema: response.data };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch schema');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch schema');
    }
  }
);

// Execute a query on a database connection
export const executeQuery = createAsyncThunk(
  'databaseConnections/executeQuery',
  async ({ connectionId, query, params = {} }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.databases.query(connectionId, query, params);
      if (response.success) {
        return { connectionId, result: response.data };
      } else {
        return rejectWithValue(response.error || 'Query execution failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Query execution failed');
    }
  }
);

// Fetch available MCP database servers
export const fetchMcpDatabaseServers = createAsyncThunk(
  'databaseConnections/fetchMcpServers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.mcp.listDatabaseServers();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch MCP servers');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch MCP servers');
    }
  }
);

// Fetch tables for a database connection
export const fetchDatabaseTables = createAsyncThunk(
  'databaseConnections/fetchTables',
  async (connectionId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.databases.getTables(connectionId);
      if (response.success) {
        return { connectionId, tables: response.data?.tables || response.data || [] };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch tables');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch tables');
    }
  }
);

// Fetch columns for a specific table
export const fetchTableColumns = createAsyncThunk(
  'databaseConnections/fetchTableColumns',
  async ({ connectionId, tableName, schema }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.databases.getTableColumns(connectionId, tableName, schema);
      if (response.success) {
        return {
          connectionId,
          tableName,
          schema,
          columns: response.data?.columns || response.data || []
        };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch table columns');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch table columns');
    }
  }
);

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  // Database connections list
  connections: [],
  connectionsLoading: false,
  connectionsError: null,

  // Selected connection for editing
  selectedConnection: null,

  // Available database types (static config)
  databaseTypes: DATABASE_TYPES,

  // MCP database servers discovered
  mcpServers: [],
  mcpServersLoading: false,
  mcpServersError: null,

  // Schema cache by connection ID
  schemas: {}, // { connectionId: { tables: [], views: [], lastFetched: timestamp } }
  schemaLoading: false,
  schemaError: null,

  // Tables cache by connection ID
  tables: {}, // { connectionId: { tables: [], lastFetched: timestamp } }
  tablesLoading: false,
  tablesError: null,

  // Table columns cache by connectionId:tableName
  tableColumns: {}, // { 'connectionId:tableName': { columns: [], lastFetched: timestamp } }
  tableColumnsLoading: false,
  tableColumnsError: null,

  // Connection testing
  connectionTest: {
    status: 'idle', // 'idle' | 'testing' | 'success' | 'failed'
    connectionId: null,
    result: null,
    error: null,
  },

  // Query execution
  queryExecution: {
    status: 'idle', // 'idle' | 'executing' | 'complete' | 'failed'
    connectionId: null,
    result: null,
    error: null,
  },

  // Query history (persisted in localStorage)
  queryHistory: [],

  // Environment detection
  environment: {
    type: null,        // 'docker' | 'kubernetes' | 'external' | null
    detected: false,
  },
};

// ============================================================================
// Slice
// ============================================================================

const databaseConnectionsSlice = createSlice({
  name: 'databaseConnections',
  initialState,
  reducers: {
    // Select a connection for editing/viewing
    setSelectedConnection: (state, action) => {
      state.selectedConnection = action.payload;
    },

    clearSelectedConnection: (state) => {
      state.selectedConnection = null;
    },

    // Clear errors
    clearConnectionsError: (state) => {
      state.connectionsError = null;
    },

    clearSchemaError: (state) => {
      state.schemaError = null;
    },

    clearConnectionTestError: (state) => {
      state.connectionTest.error = null;
      state.connectionTest.status = 'idle';
    },

    clearQueryError: (state) => {
      state.queryExecution.error = null;
      state.queryExecution.status = 'idle';
    },

    // Reset connection test state
    resetConnectionTest: (state) => {
      state.connectionTest = {
        status: 'idle',
        connectionId: null,
        result: null,
        error: null,
      };
    },

    // Reset query execution state
    resetQueryExecution: (state) => {
      state.queryExecution = {
        status: 'idle',
        connectionId: null,
        result: null,
        error: null,
      };
    },

    // Set environment type
    setEnvironment: (state, action) => {
      state.environment = {
        type: action.payload,
        detected: true,
      };
    },

    // Clear schema cache for a connection
    clearSchemaCache: (state, action) => {
      const connectionId = action.payload;
      if (connectionId) {
        delete state.schemas[connectionId];
      } else {
        state.schemas = {};
      }
    },

    // Add query to history
    addQueryToHistory: (state, action) => {
      const historyItem = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...action.payload,
      };
      // Add to beginning of array (most recent first)
      state.queryHistory.unshift(historyItem);
      // Keep only last 100 queries
      if (state.queryHistory.length > 100) {
        state.queryHistory = state.queryHistory.slice(0, 100);
      }
      // Persist to localStorage
      try {
        localStorage.setItem('databaseQueryHistory', JSON.stringify(state.queryHistory));
      } catch (e) {
        console.warn('Failed to persist query history:', e);
      }
    },

    // Clear query history
    clearQueryHistory: (state) => {
      state.queryHistory = [];
      try {
        localStorage.removeItem('databaseQueryHistory');
      } catch (e) {
        console.warn('Failed to clear query history from localStorage:', e);
      }
    },

    // Load query history from localStorage
    loadQueryHistory: (state) => {
      try {
        const saved = localStorage.getItem('databaseQueryHistory');
        if (saved) {
          state.queryHistory = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Failed to load query history:', e);
        state.queryHistory = [];
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // ======== Fetch Database Connections ========
      .addCase(fetchDatabaseConnections.pending, (state) => {
        state.connectionsLoading = true;
        state.connectionsError = null;
      })
      .addCase(fetchDatabaseConnections.fulfilled, (state, action) => {
        state.connectionsLoading = false;
        // Backend returns { databases: [...], total, page, page_size }
        state.connections = action.payload.databases || action.payload.connections || [];
      })
      .addCase(fetchDatabaseConnections.rejected, (state, action) => {
        state.connectionsLoading = false;
        state.connectionsError = action.payload || 'Failed to fetch connections';
      })

      // ======== Create Database Connection ========
      .addCase(createDatabaseConnection.pending, (state) => {
        state.connectionsLoading = true;
        state.connectionsError = null;
      })
      .addCase(createDatabaseConnection.fulfilled, (state, action) => {
        state.connectionsLoading = false;
        state.connections.push(action.payload);
      })
      .addCase(createDatabaseConnection.rejected, (state, action) => {
        state.connectionsLoading = false;
        state.connectionsError = action.payload || 'Failed to create connection';
      })

      // ======== Update Database Connection ========
      .addCase(updateDatabaseConnection.pending, (state) => {
        state.connectionsError = null;
      })
      .addCase(updateDatabaseConnection.fulfilled, (state, action) => {
        const index = state.connections.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.connections[index] = { ...state.connections[index], ...action.payload };
        }
        if (state.selectedConnection?.id === action.payload.id) {
          state.selectedConnection = { ...state.selectedConnection, ...action.payload };
        }
        // Clear cached schema as connection details may have changed
        delete state.schemas[action.payload.id];
      })
      .addCase(updateDatabaseConnection.rejected, (state, action) => {
        state.connectionsError = action.payload || 'Failed to update connection';
      })

      // ======== Delete Database Connection ========
      .addCase(deleteDatabaseConnection.pending, (state) => {
        state.connectionsError = null;
      })
      .addCase(deleteDatabaseConnection.fulfilled, (state, action) => {
        state.connections = state.connections.filter(c => c.id !== action.payload);
        if (state.selectedConnection?.id === action.payload) {
          state.selectedConnection = null;
        }
        // Clear cached schema
        delete state.schemas[action.payload];
      })
      .addCase(deleteDatabaseConnection.rejected, (state, action) => {
        state.connectionsError = action.payload || 'Failed to delete connection';
      })

      // ======== Test Database Connection ========
      .addCase(testDatabaseConnection.pending, (state, action) => {
        state.connectionTest = {
          status: 'testing',
          connectionId: action.meta.arg.id || null,
          result: null,
          error: null,
        };
      })
      .addCase(testDatabaseConnection.fulfilled, (state, action) => {
        state.connectionTest = {
          status: 'success',
          connectionId: action.payload.id,
          result: action.payload.result,
          error: null,
        };
        // Update connection status if it exists
        if (action.payload.id) {
          const connection = state.connections.find(c => c.id === action.payload.id);
          if (connection) {
            connection.lastTestedAt = new Date().toISOString();
            connection.lastTestStatus = 'success';
          }
        }
      })
      .addCase(testDatabaseConnection.rejected, (state, action) => {
        state.connectionTest = {
          status: 'failed',
          connectionId: state.connectionTest.connectionId,
          result: null,
          error: action.payload || 'Connection test failed',
        };
        // Update connection status if it exists
        if (state.connectionTest.connectionId) {
          const connection = state.connections.find(c => c.id === state.connectionTest.connectionId);
          if (connection) {
            connection.lastTestedAt = new Date().toISOString();
            connection.lastTestStatus = 'failed';
          }
        }
      })

      // ======== Fetch Database Schema ========
      .addCase(fetchDatabaseSchema.pending, (state) => {
        state.schemaLoading = true;
        state.schemaError = null;
      })
      .addCase(fetchDatabaseSchema.fulfilled, (state, action) => {
        state.schemaLoading = false;
        const { connectionId, schema } = action.payload;
        state.schemas[connectionId] = {
          ...schema,
          lastFetched: new Date().toISOString(),
        };
      })
      .addCase(fetchDatabaseSchema.rejected, (state, action) => {
        state.schemaLoading = false;
        state.schemaError = action.payload || 'Failed to fetch schema';
      })

      // ======== Execute Query ========
      .addCase(executeQuery.pending, (state, action) => {
        state.queryExecution = {
          status: 'executing',
          connectionId: action.meta.arg.connectionId,
          result: null,
          error: null,
        };
      })
      .addCase(executeQuery.fulfilled, (state, action) => {
        state.queryExecution = {
          status: 'complete',
          connectionId: action.payload.connectionId,
          result: action.payload.result,
          error: null,
        };
      })
      .addCase(executeQuery.rejected, (state, action) => {
        state.queryExecution = {
          status: 'failed',
          connectionId: state.queryExecution.connectionId,
          result: null,
          error: action.payload || 'Query execution failed',
        };
      })

      // ======== Fetch MCP Database Servers ========
      .addCase(fetchMcpDatabaseServers.pending, (state) => {
        state.mcpServersLoading = true;
        state.mcpServersError = null;
      })
      .addCase(fetchMcpDatabaseServers.fulfilled, (state, action) => {
        state.mcpServersLoading = false;
        state.mcpServers = action.payload || [];
      })
      .addCase(fetchMcpDatabaseServers.rejected, (state, action) => {
        state.mcpServersLoading = false;
        state.mcpServersError = action.payload || 'Failed to fetch MCP servers';
      })

      // ======== Fetch Database Tables ========
      .addCase(fetchDatabaseTables.pending, (state) => {
        state.tablesLoading = true;
        state.tablesError = null;
      })
      .addCase(fetchDatabaseTables.fulfilled, (state, action) => {
        state.tablesLoading = false;
        const { connectionId, tables } = action.payload;
        state.tables[connectionId] = {
          tables: tables,
          lastFetched: new Date().toISOString(),
        };
      })
      .addCase(fetchDatabaseTables.rejected, (state, action) => {
        state.tablesLoading = false;
        state.tablesError = action.payload || 'Failed to fetch tables';
      })

      // ======== Fetch Table Columns ========
      .addCase(fetchTableColumns.pending, (state) => {
        state.tableColumnsLoading = true;
        state.tableColumnsError = null;
      })
      .addCase(fetchTableColumns.fulfilled, (state, action) => {
        state.tableColumnsLoading = false;
        const { connectionId, tableName, schema, columns } = action.payload;
        // Include schema in cache key to differentiate tables with same name in different schemas
        const cacheKey = schema ? `${connectionId}:${schema}.${tableName}` : `${connectionId}:${tableName}`;
        state.tableColumns[cacheKey] = {
          columns: columns,
          lastFetched: new Date().toISOString(),
        };
      })
      .addCase(fetchTableColumns.rejected, (state, action) => {
        state.tableColumnsLoading = false;
        state.tableColumnsError = action.payload || 'Failed to fetch table columns';
      });
  },
});

// ============================================================================
// Actions Export
// ============================================================================

export const {
  setSelectedConnection,
  clearSelectedConnection,
  clearConnectionsError,
  clearSchemaError,
  clearConnectionTestError,
  clearQueryError,
  resetConnectionTest,
  resetQueryExecution,
  setEnvironment,
  clearSchemaCache,
  addQueryToHistory,
  clearQueryHistory,
  loadQueryHistory,
} = databaseConnectionsSlice.actions;

// ============================================================================
// Selectors
// ============================================================================

// Connections selectors
export const selectConnections = (state) => state.databaseConnections.connections;
export const selectConnectionsLoading = (state) => state.databaseConnections.connectionsLoading;
export const selectConnectionsError = (state) => state.databaseConnections.connectionsError;
export const selectSelectedConnection = (state) => state.databaseConnections.selectedConnection;

// Filter connections by database type
export const selectConnectionsByType = createSelector(
  [selectConnections, (state, dbType) => dbType],
  (connections, dbType) => connections.filter(c => c.databaseType === dbType)
);

// Get connection by ID
export const selectConnectionById = createSelector(
  [selectConnections, (state, connectionId) => connectionId],
  (connections, connectionId) => connections.find(c => c.id === connectionId) || null
);

// Database types selector
export const selectDatabaseTypes = (state) => state.databaseConnections.databaseTypes;

// Get database type config by ID
export const selectDatabaseTypeById = createSelector(
  [selectDatabaseTypes, (state, typeId) => typeId],
  (databaseTypes, typeId) => databaseTypes.find(t => t.id === typeId)
);

// MCP servers selectors
export const selectMcpServers = (state) => state.databaseConnections.mcpServers;
export const selectMcpServersLoading = (state) => state.databaseConnections.mcpServersLoading;
export const selectMcpServersError = (state) => state.databaseConnections.mcpServersError;

// Schema selectors
export const selectSchemas = (state) => state.databaseConnections.schemas;
export const selectSchemaLoading = (state) => state.databaseConnections.schemaLoading;
export const selectSchemaError = (state) => state.databaseConnections.schemaError;

export const selectSchemaForConnection = createSelector(
  [selectSchemas, (state, connectionId) => connectionId],
  (schemas, connectionId) => schemas[connectionId] || null
);

// Connection test selectors
export const selectConnectionTest = (state) => state.databaseConnections.connectionTest;
export const selectConnectionTestStatus = (state) => state.databaseConnections.connectionTest.status;

// Query execution selectors
export const selectQueryExecution = (state) => state.databaseConnections.queryExecution;
export const selectQueryExecutionStatus = (state) => state.databaseConnections.queryExecution.status;

// Environment selectors
export const selectEnvironment = (state) => state.databaseConnections.environment;
export const selectEnvironmentType = (state) => state.databaseConnections.environment.type;

// Query history selectors
export const selectQueryHistory = (state) => state.databaseConnections.queryHistory;

// Tables selectors
export const selectTables = (state) => state.databaseConnections.tables;
export const selectTablesLoading = (state) => state.databaseConnections.tablesLoading;
export const selectTablesError = (state) => state.databaseConnections.tablesError;

export const selectTablesForConnection = createSelector(
  [selectTables, (state, connectionId) => connectionId],
  (tables, connectionId) => tables[connectionId]?.tables || []
);

// Table columns selectors
export const selectTableColumns = (state) => state.databaseConnections.tableColumns;
export const selectTableColumnsLoading = (state) => state.databaseConnections.tableColumnsLoading;
export const selectTableColumnsError = (state) => state.databaseConnections.tableColumnsError;

export const selectColumnsForTable = createSelector(
  [selectTableColumns, (state, connectionId, tableName) => `${connectionId}:${tableName}`],
  (tableColumns, cacheKey) => tableColumns[cacheKey]?.columns || []
);

export default databaseConnectionsSlice.reducer;
