import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Play,
  Loader2,
  AlertCircle,
  Database,
  History,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Table,
  RefreshCw,
  Clock,
  Trash2,
  Code,
  Settings,
  Maximize2,
  Minimize2,
  FolderOpen,
  Save,
  BookmarkPlus,
  X,
  Sparkles,
  Tag,
  ArrowRight,
  Circle
} from 'lucide-react';
import {
  executeQuery,
  fetchDatabaseConnections,
  fetchDatabaseSchema,
  selectConnections,
  selectConnectionsLoading,
  selectQueryExecution,
  selectSchemaForConnection,
  selectSchemaLoading,
  resetQueryExecution,
  addQueryToHistory,
  selectQueryHistory,
  clearQueryHistory
} from '../../store/slices/databaseConnectionsSlice.js';
import {
  fetchSavedQueries,
  selectFilteredQueries,
  selectQueriesLoading
} from '../../store/slices/savedQueriesSlice.js';
import { getDatabaseTypeById, DATABASE_CATEGORIES } from '../../config/databaseTypes.js';
import QueryResults from './QueryResults.jsx';
import QueryHistory from './QueryHistory.jsx';
import QueryAssistDialog from '../developer-tools/QueryAssistDialog.jsx';

const QueryConsole = ({
  initialConnectionId = null,
  onClose = null,
  embedded = false
}) => {
  const dispatch = useDispatch();

  // Redux state
  const connections = useSelector(selectConnections);
  const connectionsLoading = useSelector(selectConnectionsLoading);
  const queryExecution = useSelector(selectQueryExecution);
  const schemaLoading = useSelector(selectSchemaLoading);
  const queryHistory = useSelector(selectQueryHistory);
  const savedQueries = useSelector(selectFilteredQueries);
  const savedQueriesLoading = useSelector(selectQueriesLoading);

  // Local state
  const [selectedConnectionId, setSelectedConnectionId] = useState(initialConnectionId);
  const [queryText, setQueryText] = useState('');
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSchema, setShowSchema] = useState(true);
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [queryStartTime, setQueryStartTime] = useState(null);
  const [expandedSection, setExpandedSection] = useState('nodes');
  const [showAssistDialog, setShowAssistDialog] = useState(false);

  // Refs
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const savedQueriesRef = useRef(null);

  // Get selected connection
  const selectedConnection = connections.find(c => c.id === selectedConnectionId);

  // Derive database type info
  const selectedDbType = getDatabaseTypeById(selectedConnection?.databaseType || selectedConnection?.type);
  const isNeo4j = selectedDbType?.category === DATABASE_CATEGORIES.GRAPH;
  const queryLanguage = isNeo4j ? 'Cypher' : 'SQL';

  // Get schema for selected connection
  const schema = useSelector(state =>
    selectedConnectionId ? selectSchemaForConnection(state, selectedConnectionId) : null
  );

  // Fetch connections on mount
  useEffect(() => {
    if (connections.length === 0) {
      dispatch(fetchDatabaseConnections());
    }
  }, [dispatch, connections.length]);

  // Fetch saved queries on mount
  useEffect(() => {
    dispatch(fetchSavedQueries());
  }, [dispatch]);

  // Auto-select first connection if none selected
  useEffect(() => {
    if (!selectedConnectionId && connections.length > 0) {
      setSelectedConnectionId(connections[0].id);
    }
  }, [connections, selectedConnectionId]);

  // Fetch schema when connection changes
  useEffect(() => {
    if (selectedConnectionId && !schema) {
      dispatch(fetchDatabaseSchema(selectedConnectionId));
    }
  }, [dispatch, selectedConnectionId, schema]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowConnectionDropdown(false);
      }
      if (savedQueriesRef.current && !savedQueriesRef.current.contains(event.target)) {
        setShowSavedQueries(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + Enter to execute query
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleExecuteQuery();
      }
      // Escape to close fullscreen
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [queryText, selectedConnectionId, isFullscreen]);

  // Handle connection selection
  const handleSelectConnection = (connectionId) => {
    setSelectedConnectionId(connectionId);
    setShowConnectionDropdown(false);
    dispatch(resetQueryExecution());

    // Fetch schema for new connection
    dispatch(fetchDatabaseSchema(connectionId));
  };

  // Handle query execution
  const handleExecuteQuery = useCallback(async () => {
    if (!selectedConnectionId || !queryText.trim()) return;

    setQueryStartTime(Date.now());

    try {
      const result = await dispatch(executeQuery({
        connectionId: selectedConnectionId,
        query: queryText.trim(),
      })).unwrap();

      // Add to history on success
      dispatch(addQueryToHistory({
        connectionId: selectedConnectionId,
        connectionName: selectedConnection?.name,
        query: queryText.trim(),
        executedAt: new Date().toISOString(),
        rowCount: result?.rows?.length || 0,
        success: true,
      }));
    } catch (error) {
      // Add failed query to history too
      dispatch(addQueryToHistory({
        connectionId: selectedConnectionId,
        connectionName: selectedConnection?.name,
        query: queryText.trim(),
        executedAt: new Date().toISOString(),
        rowCount: 0,
        success: false,
        error: error.message || 'Query failed',
      }));
    }
  }, [dispatch, selectedConnectionId, queryText, selectedConnection]);

  // Handle table/label click in schema browser
  const handleTableClick = (tableName) => {
    const newQuery = isNeo4j
      ? `MATCH (n:\`${tableName}\`) RETURN n LIMIT 25`
      : `SELECT * FROM ${tableName} LIMIT 100`;
    setQueryText(newQuery);
    textareaRef.current?.focus();
  };

  // Handle relationship click in Neo4j schema browser
  const handleRelationshipClick = (relType) => {
    const newQuery = `MATCH ()-[r:\`${relType}\`]->() RETURN r LIMIT 25`;
    setQueryText(newQuery);
    textareaRef.current?.focus();
  };

  // Handle history item click
  const handleHistoryClick = (historyItem) => {
    setQueryText(historyItem.query);
    if (historyItem.connectionId !== selectedConnectionId) {
      setSelectedConnectionId(historyItem.connectionId);
    }
    setShowHistory(false);
    textareaRef.current?.focus();
  };

  // Handle loading a saved query
  const handleLoadSavedQuery = (savedQuery) => {
    setQueryText(savedQuery.query);
    // If the saved query has a database connection, switch to it
    if (savedQuery.database_id) {
      const matchingConnection = connections.find(c => c.id === savedQuery.database_id);
      if (matchingConnection) {
        setSelectedConnectionId(savedQuery.database_id);
      }
    }
    setShowSavedQueries(false);
    textareaRef.current?.focus();
  };

  // Copy query to clipboard
  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(queryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get database type info
  const getDbTypeInfo = (connection) => {
    const dbType = getDatabaseTypeById(connection?.databaseType || connection?.type);
    return dbType || { name: 'Unknown', color: '#6B7280' };
  };

  // Render connection selector
  const renderConnectionSelector = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowConnectionDropdown(!showConnectionDropdown)}
        disabled={connectionsLoading}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        {connectionsLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <Database className="w-4 h-4 text-gray-500" />
        )}
        <span className="flex-1 text-left truncate text-sm">
          {selectedConnection?.name || 'Select connection...'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {showConnectionDropdown && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {connections.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No connections available
            </div>
          ) : (
            connections.map(conn => {
              const dbType = getDbTypeInfo(conn);
              return (
                <button
                  key={conn.id}
                  onClick={() => handleSelectConnection(conn.id)}
                  className={`w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 ${
                    conn.id === selectedConnectionId ? 'bg-(--color-primary-50)' : ''
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: dbType.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {conn.name}
                    </div>
                    <div className="text-xs text-gray-500">{dbType.name}</div>
                  </div>
                  {conn.status === 'Connected' && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );

  // Derive Neo4j schema sections
  const nodeLabels = isNeo4j
    ? (schema?.tables || []).filter(t => t.schema === 'nodes')
    : [];
  const relationshipTypes = isNeo4j
    ? (schema?.tables || []).filter(t => t.schema === 'relationships')
    : [];

  // Render schema browser sidebar
  const renderSchemaBrowser = () => (
    <div className={`${showSchema ? 'w-64' : 'w-0'} border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-200 overflow-hidden`}>
      {showSchema && (
        <>
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium text-sm text-gray-700 flex items-center space-x-2">
              {isNeo4j ? <Database className="w-4 h-4" /> : <Table className="w-4 h-4" />}
              <span>{isNeo4j ? 'Graph Schema' : 'Schema'}</span>
            </h3>
            <button
              onClick={() => dispatch(fetchDatabaseSchema(selectedConnectionId))}
              disabled={schemaLoading || !selectedConnectionId}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Refresh schema"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${schemaLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {schemaLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : !selectedConnectionId ? (
              <div className="text-sm text-gray-500 text-center py-4">
                Select a connection
              </div>
            ) : isNeo4j ? (
              /* Neo4j Graph Schema Browser */
              <div className="space-y-1">
                {/* Node Labels Section */}
                <button
                  onClick={() => setExpandedSection(expandedSection === 'nodes' ? '' : 'nodes')}
                  className="w-full flex items-center space-x-2 px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors"
                >
                  {expandedSection === 'nodes' ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <Circle className="w-3.5 h-3.5 text-blue-500" />
                  <span>Node Labels</span>
                  <span className="ml-auto text-xs text-gray-400">{nodeLabels.length}</span>
                </button>

                {expandedSection === 'nodes' && (
                  <div className="ml-4 space-y-0.5">
                    {nodeLabels.length > 0 ? (
                      nodeLabels.map(label => (
                        <button
                          key={label.name}
                          onClick={() => handleTableClick(label.name)}
                          className="w-full px-2 py-1.5 text-left text-sm hover:bg-blue-50 hover:text-blue-700 rounded flex items-center space-x-2 group transition-colors"
                          title={`MATCH (n:${label.name}) RETURN n LIMIT 25`}
                        >
                          <Tag className="w-3 h-3 text-blue-400 group-hover:text-blue-600" />
                          <span className="flex-1 truncate">{label.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-xs text-gray-400">No labels found</div>
                    )}
                  </div>
                )}

                {/* Relationship Types Section */}
                <button
                  onClick={() => setExpandedSection(expandedSection === 'relationships' ? '' : 'relationships')}
                  className="w-full flex items-center space-x-2 px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors"
                >
                  {expandedSection === 'relationships' ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-green-500" />
                  <span>Relationships</span>
                  <span className="ml-auto text-xs text-gray-400">{relationshipTypes.length}</span>
                </button>

                {expandedSection === 'relationships' && (
                  <div className="ml-4 space-y-0.5">
                    {relationshipTypes.length > 0 ? (
                      relationshipTypes.map(rel => (
                        <button
                          key={rel.name}
                          onClick={() => handleRelationshipClick(rel.name)}
                          className="w-full px-2 py-1.5 text-left text-sm hover:bg-green-50 hover:text-green-700 rounded flex items-center space-x-2 group transition-colors"
                          title={`MATCH ()-[r:${rel.name}]->() RETURN r LIMIT 25`}
                        >
                          <ArrowRight className="w-3 h-3 text-green-400 group-hover:text-green-600" />
                          <span className="flex-1 truncate">{rel.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-xs text-gray-400">No relationship types found</div>
                    )}
                  </div>
                )}
              </div>
            ) : schema?.tables?.length > 0 ? (
              /* SQL Table Schema Browser */
              <div className="space-y-1">
                {schema.tables.map(table => (
                  <button
                    key={table.name}
                    onClick={() => handleTableClick(table.name)}
                    className="w-full px-2 py-1.5 text-left text-sm hover:bg-gray-200 rounded flex items-center space-x-2 group"
                  >
                    <Table className="w-3.5 h-3.5 text-gray-400" />
                    <span className="flex-1 truncate">{table.name}</span>
                    {table.row_count !== undefined && (
                      <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">
                        {table.row_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No tables found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-white'
    : embedded
      ? 'h-full'
      : 'h-[calc(100vh-200px)] min-h-[500px]';

  return (
    <div className={`flex flex-col ${containerClass} border border-gray-200 rounded-lg overflow-hidden bg-white`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          {renderConnectionSelector()}

          <button
            onClick={handleExecuteQuery}
            disabled={!selectedConnectionId || !queryText.trim() || queryExecution.status === 'executing'}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              !selectedConnectionId || !queryText.trim() || queryExecution.status === 'executing'
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-(--color-primary-600) text-(--color-primary-contrast) hover:bg-(--color-primary-700)'
            }`}
          >
            {queryExecution.status === 'executing' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Query</span>
              </>
            )}
          </button>

          <span className="text-xs text-gray-400">Ctrl+Enter</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Load from Saved Query */}
          <div className="relative" ref={savedQueriesRef}>
            <button
              onClick={() => setShowSavedQueries(!showSavedQueries)}
              className={`p-2 rounded-lg transition-colors ${
                showSavedQueries ? 'bg-(--color-primary-100) text-(--color-primary-600)' : 'hover:bg-gray-200 text-gray-500'
              }`}
              title="Load from saved query"
            >
              <FolderOpen className="w-4 h-4" />
            </button>

            {/* Saved Queries Dropdown */}
            {showSavedQueries && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                  <h4 className="font-medium text-sm text-gray-700">Saved Queries</h4>
                  <button
                    onClick={() => setShowSavedQueries(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-72">
                  {savedQueriesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : savedQueries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <BookmarkPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No saved queries yet</p>
                      <p className="text-xs mt-1">Save queries from Developer Tools</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {savedQueries.map(query => (
                        <button
                          key={query.id}
                          onClick={() => handleLoadSavedQuery(query)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {query.name}
                              </div>
                              {query.description && (
                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                  {query.description}
                                </div>
                              )}
                              <div className="text-xs text-gray-400 mt-1 font-mono truncate">
                                {query.query.substring(0, 50)}...
                              </div>
                            </div>
                            {query.database_name && (
                              <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded flex-shrink-0">
                                {query.database_name}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAssistDialog(true)}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-500"
            title="AI Query Assistant"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors ${
              showHistory ? 'bg-(--color-primary-100) text-(--color-primary-600)' : 'hover:bg-gray-200 text-gray-500'
            }`}
            title="Query history"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSchema(!showSchema)}
            className={`p-2 rounded-lg transition-colors ${
              showSchema ? 'bg-(--color-primary-100) text-(--color-primary-600)' : 'hover:bg-gray-200 text-gray-500'
            }`}
            title="Toggle schema browser"
          >
            <Table className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopyQuery}
            disabled={!queryText}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
            title="Copy query"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
              title="Close"
            >
              <span className="sr-only">Close</span>
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Schema browser */}
        {renderSchemaBrowser()}

        {/* Query area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Query editor */}
          <div className="relative border-b border-gray-200">
            <div className="absolute top-2 left-3 flex items-center space-x-2 text-xs text-gray-400">
              <Code className="w-3 h-3" />
              <span>{queryLanguage}</span>
            </div>
            <textarea
              ref={textareaRef}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={isNeo4j
                ? "Enter your Cypher query here...\n\nExample: MATCH (n) RETURN n LIMIT 25"
                : "Enter your SQL query here...\n\nExample: SELECT * FROM users LIMIT 10"
              }
              className="w-full h-40 px-4 pt-8 pb-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:ring-inset"
              spellCheck={false}
            />
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-hidden">
            {queryExecution.status === 'executing' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-(--color-primary-600) mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Executing query...</p>
                  {queryStartTime && (
                    <p className="text-xs text-gray-400 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Running for {Math.floor((Date.now() - queryStartTime) / 1000)}s
                    </p>
                  )}
                </div>
              </div>
            )}

            {queryExecution.status === 'failed' && (
              <div className="p-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Query Error</h4>
                    <p className="text-sm text-red-700 mt-1 font-mono">
                      {queryExecution.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {queryExecution.status === 'complete' && queryExecution.result && (
              <QueryResults
                result={queryExecution.result}
                query={queryText}
                connectionName={selectedConnection?.name}
              />
            )}

            {queryExecution.status === 'idle' && !queryText && (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Enter a query and click "Run Query" or press Ctrl+Enter</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History panel */}
        {showHistory && (
          <QueryHistory
            history={queryHistory}
            onSelectQuery={handleHistoryClick}
            onClearHistory={() => dispatch(clearQueryHistory())}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>

      {/* AI Query Assist Dialog */}
      <QueryAssistDialog
        isOpen={showAssistDialog}
        onClose={() => setShowAssistDialog(false)}
        onApply={(generatedQuery) => {
          setQueryText(generatedQuery);
          setShowAssistDialog(false);
          textareaRef.current?.focus();
        }}
        databaseType={selectedDbType?.id || 'postgresql'}
        currentQuery={queryText}
        tables={schema?.tables || []}
        schemaInfo={schema}
        connectionName={selectedConnection?.name || ''}
      />
    </div>
  );
};

export default QueryConsole;
