import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Database,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings,
  RefreshCw,
  Copy,
  Check,
  X,
} from 'lucide-react';
import SchemaTree from './SchemaTree.jsx';
import TableDetails from './TableDetails.jsx';
import {
  fetchDatabaseConnections,
  fetchDatabaseTables,
  fetchTableColumns,
  selectConnections,
  selectConnectionsLoading,
  selectTablesForConnection,
  selectTablesLoading,
  selectTablesError,
  selectColumnsForTable,
  selectTableColumnsLoading,
  selectTableColumnsError,
  selectTableColumns,
} from '../../store/slices/databaseConnectionsSlice.js';

/**
 * SchemaBrowser - Main component for browsing database schemas
 * Combines SchemaTree navigation with TableDetails view
 */
const SchemaBrowser = ({
  initialConnectionId = null,
  embedded = false,
  onClose = null,
  onQueryGenerated = null,
}) => {
  const dispatch = useDispatch();

  // Redux state
  const connections = useSelector(selectConnections);
  const connectionsLoading = useSelector(selectConnectionsLoading);
  const tablesLoading = useSelector(selectTablesLoading);
  const tablesError = useSelector(selectTablesError);
  const tableColumnsLoading = useSelector(selectTableColumnsLoading);
  const tableColumnsError = useSelector(selectTableColumnsError);
  const allTableColumns = useSelector(selectTableColumns);

  // Local state
  const [selectedConnectionId, setSelectedConnectionId] = useState(initialConnectionId);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedTableSchema, setSelectedTableSchema] = useState(null);
  const [expandedTables, setExpandedTables] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);

  // Get tables for selected connection
  const tables = useSelector((state) =>
    selectTablesForConnection(state, selectedConnectionId)
  );

  // Get columns for all expanded tables (schema-aware)
  const getColumnsForTable = useCallback((tableName, tableSchema) => {
    // Build cache key with schema if provided
    const cacheKey = tableSchema
      ? `${selectedConnectionId}:${tableSchema}.${tableName}`
      : `${selectedConnectionId}:${tableName}`;
    return allTableColumns[cacheKey]?.columns || [];
  }, [selectedConnectionId, allTableColumns]);

  // Get columns for selected table
  const selectedTableColumns = useSelector((state) =>
    selectColumnsForTable(state, selectedConnectionId, selectedTable)
  );

  // Load connections on mount
  useEffect(() => {
    if (connections.length === 0) {
      dispatch(fetchDatabaseConnections());
    }
  }, [dispatch, connections.length]);

  // Set initial connection if provided
  useEffect(() => {
    if (initialConnectionId && !selectedConnectionId) {
      setSelectedConnectionId(initialConnectionId);
    }
  }, [initialConnectionId, selectedConnectionId]);

  // Auto-select first connection if none selected
  useEffect(() => {
    if (!selectedConnectionId && connections.length > 0) {
      setSelectedConnectionId(connections[0].id);
    }
  }, [connections, selectedConnectionId]);

  // Load tables when connection changes
  useEffect(() => {
    if (selectedConnectionId) {
      dispatch(fetchDatabaseTables(selectedConnectionId));
      setSelectedTable(null);
      setSelectedTableSchema(null);
      setExpandedTables({});
    }
  }, [dispatch, selectedConnectionId]);

  // Load columns when table is selected
  useEffect(() => {
    if (selectedConnectionId && selectedTable) {
      // Check if we already have columns cached (schema-aware)
      const cacheKey = selectedTableSchema
        ? `${selectedConnectionId}:${selectedTableSchema}.${selectedTable}`
        : `${selectedConnectionId}:${selectedTable}`;
      if (!allTableColumns[cacheKey]) {
        dispatch(fetchTableColumns({
          connectionId: selectedConnectionId,
          tableName: selectedTable,
          schema: selectedTableSchema,
        }));
      }
    }
  }, [dispatch, selectedConnectionId, selectedTable, selectedTableSchema, allTableColumns]);

  // Handle connection change
  const handleConnectionChange = (e) => {
    setSelectedConnectionId(e.target.value);
  };

  // Handle table selection (with optional schema)
  const handleTableSelect = (tableName, tableSchema = null) => {
    setSelectedTable(tableName);
    setSelectedTableSchema(tableSchema);
  };

  // Handle table toggle (expand/collapse) with optional schema
  const handleTableToggle = (tableName, tableSchema = null) => {
    // Use schema.table as key for expanded state if schema exists
    const expandKey = tableSchema ? `${tableSchema}.${tableName}` : tableName;

    setExpandedTables(prev => ({
      ...prev,
      [expandKey]: !prev[expandKey],
    }));

    // Load columns if expanding and not already loaded
    if (!expandedTables[expandKey]) {
      const cacheKey = tableSchema
        ? `${selectedConnectionId}:${tableSchema}.${tableName}`
        : `${selectedConnectionId}:${tableName}`;
      if (!allTableColumns[cacheKey]) {
        dispatch(fetchTableColumns({
          connectionId: selectedConnectionId,
          tableName: tableName,
          schema: tableSchema,
        }));
      }
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (selectedConnectionId) {
      dispatch(fetchDatabaseTables(selectedConnectionId));
      setExpandedTables({});
    }
  };

  // Handle sidebar resize
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const newWidth = Math.max(200, Math.min(500, e.clientX));
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle query generation
  const handleGenerateSelect = (query) => {
    onQueryGenerated?.(query);
    copyToClipboard(query);
  };

  const handleGenerateInsert = (query) => {
    onQueryGenerated?.(query);
    copyToClipboard(query);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get selected connection details
  const selectedConnection = connections.find(c => c.id === selectedConnectionId);

  // Build columns object for SchemaTree (schema-aware)
  const columnsForTree = {};
  Object.keys(expandedTables).forEach(expandKey => {
    if (expandedTables[expandKey]) {
      // expandKey can be "schema.table" or just "table"
      const parts = expandKey.split('.');
      if (parts.length === 2) {
        // Schema.table format
        const [schemaName, tableName] = parts;
        columnsForTree[expandKey] = getColumnsForTable(tableName, schemaName);
      } else {
        // Just table name
        columnsForTree[expandKey] = getColumnsForTable(expandKey, null);
      }
    }
  });

  return (
    <div className={`flex h-full ${embedded ? '' : 'min-h-screen'} bg-gray-100`}>
      {/* Sidebar - Schema Tree */}
      <div
        className={`
          flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-300
          ${sidebarCollapsed ? 'w-0 overflow-hidden' : ''}
        `}
        style={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
      >
        {/* Connection selector */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Database Connection
          </label>
          <select
            value={selectedConnectionId || ''}
            onChange={handleConnectionChange}
            disabled={connectionsLoading}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent bg-white"
          >
            {connections.length === 0 ? (
              <option value="">No connections available</option>
            ) : (
              connections.map(conn => (
                <option key={conn.id} value={conn.id}>
                  {conn.name || conn.host}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Schema tree */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 80px)' }}>
          <SchemaTree
            tables={tables}
            columns={columnsForTree}
            loading={tablesLoading}
            columnsLoading={tableColumnsLoading}
            selectedTable={selectedTable}
            expandedTables={expandedTables}
            onTableSelect={handleTableSelect}
            onTableToggle={handleTableToggle}
            onRefresh={handleRefresh}
            connectionName={selectedConnection?.name || ''}
          />
        </div>
      </div>

      {/* Resize handle */}
      {!sidebarCollapsed && (
        <div
          className="w-1 bg-transparent hover:bg-(--color-primary-500) cursor-col-resize transition-colors flex-shrink-0"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Main content - Table Details */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex-shrink-0 px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {selectedConnection && (
              <div className="flex items-center space-x-2 text-sm">
                <Database className="w-4 h-4 text-(--color-primary-600)" />
                <span className="font-medium text-gray-700">
                  {selectedConnection.name || selectedConnection.host}
                </span>
                {selectedTable && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600">{selectedTable}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {copiedQuery && (
              <span className="text-xs text-green-600 flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" />
                Copied to clipboard
              </span>
            )}

            <button
              onClick={handleRefresh}
              disabled={tablesLoading}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${tablesLoading ? 'animate-spin' : ''}`} />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Table details */}
        <div className="flex-1 overflow-hidden">
          <TableDetails
            tableName={selectedTable}
            columns={selectedTableColumns}
            loading={tableColumnsLoading && selectedTable && !selectedTableColumns.length}
            error={tableColumnsError}
            connectionName={selectedConnection?.name || ''}
            onGenerateSelect={handleGenerateSelect}
            onGenerateInsert={handleGenerateInsert}
          />
        </div>
      </div>
    </div>
  );
};

export default SchemaBrowser;
