import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  Save,
  Table,
  RefreshCw,
  Play,
  ExternalLink,
  Search,
  Clock,
  Folder,
  FolderOpen,
  FileText,
  Settings,
  Hash,
  Calendar,
  Type,
  ToggleLeft,
  Columns,
  BarChart3,
  List,
  Sparkles
} from 'lucide-react';
import {
  fetchDatabaseConnections,
  fetchDatabaseSchema,
  fetchDatabaseTables,
  fetchTableColumns,
  executeQuery,
  selectConnections,
  selectConnectionsLoading,
  selectSchemaForConnection,
  selectSchemaLoading,
  selectQueryExecution,
  resetQueryExecution,
  clearConnectionsError,
  selectTablesForConnection,
  selectTablesLoading,
  selectColumnsForTable,
  selectTableColumnsLoading
} from '../../../store/slices/databaseConnectionsSlice.js';
import {
  fetchSavedQueries,
  executeSavedQuery,
  addToRecentQueries,
  selectQueries,
  selectQueriesLoading,
  selectFolders,
  selectRecentQueries,
  selectExecution as selectSavedQueryExecution,
  resetExecution as resetSavedQueryExecution
} from '../../../store/slices/savedQueriesSlice.js';
import { getDatabaseTypeById } from '../../../config/databaseTypes.js';
import { aetherApi } from '../../../services/aetherApi.js';
import {
  detectParameters,
  substituteParameters,
  findQueriesForTable,
  generateQuickActionQuery
} from '../../../utils/queryParser.js';

// ============================================================================
// Helper function to ensure query has proper SQL keyword
// ============================================================================
const ensureQueryComplete = (queryText) => {
  if (!queryText || typeof queryText !== 'string') {
    return queryText;
  }

  const trimmed = queryText.trim();
  const upper = trimmed.toUpperCase();

  // Check if query starts with a valid SQL keyword
  const validKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'WITH', 'TRUNCATE', 'EXPLAIN'];
  const startsWithKeyword = validKeywords.some(kw => upper.startsWith(kw));

  if (startsWithKeyword) {
    return queryText;
  }

  // Query is missing a SQL keyword - likely SELECT was dropped
  // Check if it looks like a SELECT query without the SELECT keyword
  if (upper.startsWith('*') || upper.startsWith('DISTINCT') || upper.match(/^[A-Z_]/)) {
    return 'SELECT ' + queryText;
  }

  return queryText;
};

// ============================================================================
// View Types for the Component
// ============================================================================
const VIEW_TYPES = {
  BROWSER: 'browser',      // Main list view
  QUERY_DETAIL: 'query',   // Saved query detail
  TABLE_DETAIL: 'table',   // Table detail with quick actions
};

// ============================================================================
// Parameter Input Component
// ============================================================================
const ParameterInput = ({ param, value, onChange }) => {
  const inputType = param.type === 'date' ? 'date' :
                    param.type === 'number' ? 'number' :
                    param.type === 'boolean' ? 'checkbox' : 'text';

  const icon = param.type === 'date' ? Calendar :
               param.type === 'number' ? Hash :
               param.type === 'boolean' ? ToggleLeft : Type;
  const Icon = icon;

  if (param.type === 'boolean') {
    return (
      <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-(--color-primary-600) border-gray-300 rounded focus:ring-(--color-primary-500)"
        />
        <div className="flex items-center space-x-2 flex-1">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{param.name}</span>
        </div>
      </label>
    );
  }

  return (
    <div className="space-y-1">
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <Icon className="w-4 h-4 text-gray-400" />
        <span>{param.name}</span>
      </label>
      <input
        type={inputType}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${param.name}...`}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) text-sm"
      />
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================
const DatabaseSource = ({
  notebook,
  onBack,
  onSuccess,
  onClose
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state - Connections
  const connections = useSelector(selectConnections);
  const connectionsLoading = useSelector(selectConnectionsLoading);
  const schemaLoading = useSelector(selectSchemaLoading);
  const queryExecution = useSelector(selectQueryExecution);
  const tablesLoading = useSelector(selectTablesLoading);

  // Redux state - Saved Queries
  const savedQueries = useSelector(selectQueries);
  const savedQueriesLoading = useSelector(selectQueriesLoading);
  const folders = useSelector(selectFolders);
  const recentQueries = useSelector(selectRecentQueries);
  const savedQueryExecution = useSelector(selectSavedQueryExecution);

  // Local state
  const [currentView, setCurrentView] = useState(VIEW_TYPES.BROWSER);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [expandedConnections, setExpandedConnections] = useState({});

  // Selected items for detail views
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);

  // Parameter values for query execution
  const [parameterValues, setParameterValues] = useState({});

  // Preview/execution state
  const [previewResults, setPreviewResults] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [outputFormat, setOutputFormat] = useState('json'); // 'json' | 'markdown' | 'csv'

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchDatabaseConnections());
    dispatch(fetchSavedQueries());
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetQueryExecution());
      dispatch(resetSavedQueryExecution());
      dispatch(clearConnectionsError());
    };
  }, [dispatch]);

  // Get tables for connections (fetch when expanded)
  const handleExpandConnection = (connection) => {
    const newExpanded = { ...expandedConnections };
    if (newExpanded[connection.id]) {
      delete newExpanded[connection.id];
    } else {
      newExpanded[connection.id] = true;
      // Fetch tables for this connection
      dispatch(fetchDatabaseTables(connection.id));
    }
    setExpandedConnections(newExpanded);
  };

  // Toggle folder expansion
  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  // Filter queries based on search term
  const filteredQueries = useMemo(() => {
    if (!searchTerm) return savedQueries;
    const term = searchTerm.toLowerCase();
    return savedQueries.filter(q =>
      q.name?.toLowerCase().includes(term) ||
      q.description?.toLowerCase().includes(term) ||
      q.query?.toLowerCase().includes(term)
    );
  }, [savedQueries, searchTerm]);

  // Group queries by folder
  const queriesByFolder = useMemo(() => {
    const grouped = { '': [] }; // Empty string for unfiled queries
    filteredQueries.forEach(query => {
      const folder = query.folder || '';
      if (!grouped[folder]) {
        grouped[folder] = [];
      }
      grouped[folder].push(query);
    });
    return grouped;
  }, [filteredQueries]);

  // Filter connections based on search term
  const filteredConnections = useMemo(() => {
    if (!searchTerm) return connections;
    const term = searchTerm.toLowerCase();
    return connections.filter(c =>
      c.name?.toLowerCase().includes(term)
    );
  }, [connections, searchTerm]);

  // Filter recent queries
  const filteredRecentQueries = useMemo(() => {
    if (!searchTerm) return recentQueries.slice(0, 5);
    const term = searchTerm.toLowerCase();
    return recentQueries
      .filter(q =>
        q.name?.toLowerCase().includes(term) ||
        q.description?.toLowerCase().includes(term)
      )
      .slice(0, 5);
  }, [recentQueries, searchTerm]);

  // Handle selecting a saved query
  const handleSelectQuery = (query) => {
    // Ensure query text is complete (fix missing SELECT if needed)
    const fixedQuery = {
      ...query,
      query: ensureQueryComplete(query.query || query.sql || '')
    };

    setSelectedQuery(fixedQuery);
    setSelectedConnection(connections.find(c => c.id === query.database_id));
    setCurrentView(VIEW_TYPES.QUERY_DETAIL);
    setPreviewResults(null);
    setPreviewError(null);

    // Detect parameters and initialize values
    const params = detectParameters(fixedQuery.query);
    const initialValues = {};
    params.forEach(p => {
      initialValues[p.name] = '';
    });
    setParameterValues(initialValues);
  };

  // Handle selecting a table
  const handleSelectTable = (table, connection) => {
    setSelectedTable(table);
    setSelectedConnection(connection);
    setCurrentView(VIEW_TYPES.TABLE_DETAIL);
    setPreviewResults(null);
    setPreviewError(null);

    // Fetch columns for the table
    dispatch(fetchTableColumns({
      connectionId: connection.id,
      tableName: table.name,
      schema: table.schema
    }));
  };

  // Parse query results into a normalized format
  // API may return rows as array of arrays or array of objects
  const parseQueryResults = (result) => {
    if (!result) return { columns: [], rows: [] };

    let columns = [];
    let rows = [];

    // Extract columns
    if (result.columns) {
      columns = result.columns;
    } else if (result.rows && result.rows.length > 0) {
      // Extract columns from first row if object
      const firstRow = result.rows[0];
      if (Array.isArray(firstRow)) {
        columns = firstRow.map((_, i) => `column_${i + 1}`);
      } else if (typeof firstRow === 'object' && firstRow !== null) {
        columns = Object.keys(firstRow);
      }
    }

    // Parse rows - convert to object format for consistent access
    if (result.rows) {
      rows = result.rows.map(row => {
        if (Array.isArray(row)) {
          // Convert array row to object
          const obj = {};
          columns.forEach((col, i) => {
            obj[col] = row[i];
          });
          return obj;
        }
        return row;
      });
    }

    return {
      columns,
      rows,
      rowCount: result.row_count || result.rowCount || rows.length,
      executionTime: result.execution_time || result.executionTime || 0
    };
  };

  // Execute query and show preview
  const handlePreviewQuery = async () => {
    if (!selectedQuery || !selectedConnection) return;

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewResults(null);

    try {
      // Get query text and ensure it's complete (fix missing SELECT if needed)
      let queryText = ensureQueryComplete(selectedQuery.query || selectedQuery.sql || '');

      const params = detectParameters(queryText);

      // Substitute parameters if any
      if (params.length > 0) {
        queryText = substituteParameters(queryText, parameterValues);
      }

      // Execute query
      const response = await aetherApi.databases.query(
        selectedConnection.id,
        queryText,
        {}
      );

      if (response.success) {
        const parsedResults = parseQueryResults(response.data);
        setPreviewResults(parsedResults);
      } else {
        setPreviewError(response.error || 'Query execution failed');
      }
    } catch (err) {
      setPreviewError(err.message || 'Query execution failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Execute quick action on a table
  const handleQuickAction = async (action) => {
    if (!selectedTable || !selectedConnection) return;

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewResults(null);

    try {
      // Get columns for stats query if needed
      const columns = action === 'stats' ?
        (selectColumnsForTable({ databaseConnections: { tableColumns: {} } }, selectedConnection.id, selectedTable.name) || []) :
        [];

      // Generate query and ensure it's complete
      let queryText = generateQuickActionQuery(selectedTable.name, action, columns);
      queryText = ensureQueryComplete(queryText);

      const response = await aetherApi.databases.query(
        selectedConnection.id,
        queryText,
        {}
      );

      if (response.success) {
        const parsedResults = parseQueryResults(response.data);
        setPreviewResults(parsedResults);
      } else {
        setPreviewError(response.error || 'Query execution failed');
      }
    } catch (err) {
      setPreviewError(err.message || 'Query execution failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  // ============================================================================
  // Format Generation Functions
  // ============================================================================

  // JSON format (default - best for LLM context)
  const generateJsonContent = (results, metadata, docName) => {
    let content = `# ${docName}\n\n`;
    content += `**Source:** ${metadata.sourceType}\n`;
    content += `**Database:** ${metadata.database}\n`;
    content += `**Executed:** ${metadata.timestamp}\n\n`;

    // Convert results to array of objects
    const dataArray = results.rows.slice(0, 100).map(row => {
      const obj = {};
      results.columns.forEach(col => {
        obj[col] = row[col];
      });
      return obj;
    });

    content += '```json\n';
    content += JSON.stringify(dataArray, null, 2);
    content += '\n```\n';

    const rowCount = results.rows.length;
    if (rowCount > 100) {
      content += `\n*Showing first 100 of ${rowCount} rows*\n`;
    } else {
      content += `\n*${rowCount} rows returned*\n`;
    }

    return content;
  };

  // Markdown table format (for human display)
  const generateMarkdownContent = (results, metadata, docName) => {
    let content = `# ${docName}\n\n`;
    content += `**Source:** ${metadata.sourceType}\n`;
    content += `**Database:** ${metadata.database}\n`;
    content += `**Executed:** ${metadata.timestamp}\n\n`;

    // Create markdown table
    content += `| ${results.columns.join(' | ')} |\n`;
    content += `| ${results.columns.map(() => '---').join(' | ')} |\n`;
    results.rows.slice(0, 100).forEach(row => {
      const rowValues = results.columns.map(col =>
        String(row[col] ?? '').replace(/\|/g, '\\|').substring(0, 50)
      );
      content += `| ${rowValues.join(' | ')} |\n`;
    });

    const rowCount = results.rows.length;
    if (rowCount > 100) {
      content += `\n*Showing first 100 of ${rowCount} rows*\n`;
    } else {
      content += `\n*${rowCount} rows returned*\n`;
    }

    return content;
  };

  // CSV format (for data export)
  const generateCsvContent = (results, metadata, docName) => {
    let content = `# ${docName}\n\n`;
    content += `**Source:** ${metadata.sourceType}\n`;
    content += `**Database:** ${metadata.database}\n`;
    content += `**Executed:** ${metadata.timestamp}\n\n`;

    // Generate CSV header
    const header = results.columns.map(col => {
      const str = String(col);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',');

    // Generate CSV rows
    const csvRows = results.rows.slice(0, 100).map(row =>
      results.columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ).join('\n');

    content += '```csv\n' + header + '\n' + csvRows + '\n```\n';

    const rowCount = results.rows.length;
    if (rowCount > 100) {
      content += `\n*Showing first 100 of ${rowCount} rows*\n`;
    } else {
      content += `\n*${rowCount} rows returned*\n`;
    }

    return content;
  };

  // Generate content based on selected format
  const generateFormattedContent = (results, metadata, docName, format) => {
    switch (format) {
      case 'json':
        return generateJsonContent(results, metadata, docName);
      case 'csv':
        return generateCsvContent(results, metadata, docName);
      case 'markdown':
      default:
        return generateMarkdownContent(results, metadata, docName);
    }
  };

  // Generate default document name with date
  const generateDefaultDocumentName = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    if (selectedQuery) {
      return `${selectedQuery.name} - ${dateStr} ${timeStr}`;
    } else if (selectedTable) {
      return `${selectedTable.name} Data - ${dateStr} ${timeStr}`;
    }
    return `Query Results - ${dateStr} ${timeStr}`;
  };

  // Open save dialog with default name
  const handleOpenSaveDialog = () => {
    if (!previewResults) return;
    setDocumentName(generateDefaultDocumentName());
    setShowSaveDialog(true);
  };

  // Save results to notebook
  const handleSaveToNotebook = async () => {
    if (!previewResults || !documentName.trim()) return;

    setSaving(true);
    setShowSaveDialog(false);

    try {
      const results = previewResults;

      // Build metadata for content generation
      const metadata = {
        sourceType: selectedQuery ? `Query: ${selectedQuery.name}` : `Table: ${selectedTable?.name}`,
        database: selectedConnection?.name || 'Unknown',
        timestamp: new Date().toISOString(),
      };

      // Generate content based on selected format
      let content;
      if (results.rows && results.columns) {
        content = generateFormattedContent(results, metadata, documentName.trim(), outputFormat);
      } else {
        // Fallback for non-tabular results
        content = `# ${documentName}\n\n`;
        content += `**Source:** ${metadata.sourceType}\n`;
        content += `**Database:** ${metadata.database}\n`;
        content += `**Executed:** ${metadata.timestamp}\n\n`;
        content += `\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\`\n`;
      }

      const documentData = {
        title: documentName.trim(),
        content,
        content_type: 'text/markdown',
        notebook_id: notebook?.id,
        source_type: 'database',
        metadata: {
          connection_id: selectedConnection?.id,
          connection_name: selectedConnection?.name,
          query_id: selectedQuery?.id,
          table_name: selectedTable?.name,
          executed_at: new Date().toISOString(),
          output_format: outputFormat,
        }
      };

      const response = await aetherApi.documents.create(documentData);

      if (response.success) {
        // Track this query in recent queries
        if (selectedQuery) {
          dispatch(addToRecentQueries(selectedQuery));
        }

        if (onSuccess) {
          onSuccess(response.data);
        }
        setTimeout(() => onClose(), 500);
      }
    } catch (err) {
      console.error('Failed to save to notebook:', err);
    } finally {
      setSaving(false);
    }
  };

  // Navigate to Developer Tools
  const navigateToDataSources = () => {
    onClose();
    navigate('/developer-tools/data-sources');
  };

  const navigateToSQLWorkbench = (queryToLoad = null) => {
    onClose();
    // Store query to load in localStorage so SQLQueriesTab can pick it up
    if (queryToLoad) {
      localStorage.setItem('devtools-load-query', JSON.stringify({
        query: queryToLoad,
        connectionId: queryToLoad.database_id,
        timestamp: Date.now()
      }));
    }
    navigate('/developer-tools/queries');
  };

  // Handle back navigation
  const handleBackClick = () => {
    if (currentView === VIEW_TYPES.BROWSER) {
      onBack();
    } else {
      setCurrentView(VIEW_TYPES.BROWSER);
      setSelectedQuery(null);
      setSelectedTable(null);
      setPreviewResults(null);
      setPreviewError(null);
    }
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  // Render the main browser view
  const renderBrowserView = () => (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tables and queries..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Recently Used Section */}
      {filteredRecentQueries.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Recently Used</h4>
          </div>
          <div className="space-y-2">
            {filteredRecentQueries.map(query => {
              const connection = connections.find(c => c.id === query.database_id);
              const dbType = getDatabaseTypeById(connection?.databaseType);
              return (
                <button
                  key={query.id}
                  onClick={() => handleSelectQuery(query)}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{query.name}</span>
                      {connection && (
                        <span className="text-sm text-gray-500 ml-2">({connection.name})</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Saved Queries Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Saved Queries</h4>
          </div>
          <button
            onClick={() => navigateToSQLWorkbench()}
            className="text-sm text-(--color-primary-600) hover:text-(--color-primary-700) flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {savedQueriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-(--color-primary-600) animate-spin" />
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No saved queries found</p>
            <button
              onClick={() => navigateToSQLWorkbench()}
              className="mt-2 text-sm text-(--color-primary-600) hover:text-(--color-primary-700)"
            >
              Create your first query
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Unfiled queries */}
            {queriesByFolder['']?.map(query => {
              const connection = connections.find(c => c.id === query.database_id);
              return (
                <button
                  key={query.id}
                  onClick={() => handleSelectQuery(query)}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900 truncate block">{query.name}</span>
                      {connection && (
                        <span className="text-xs text-gray-500">{connection.name}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </button>
              );
            })}

            {/* Folders with queries */}
            {folders.map(folder => {
              const folderQueries = queriesByFolder[folder] || [];
              if (folderQueries.length === 0) return null;

              const isExpanded = expandedFolders[folder];

              return (
                <div key={folder} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="font-medium text-gray-700">{folder}</span>
                      <span className="text-xs text-gray-400">({folderQueries.length})</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {folderQueries.map(query => {
                        const connection = connections.find(c => c.id === query.database_id);
                        return (
                          <button
                            key={query.id}
                            onClick={() => handleSelectQuery(query)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0 pl-6">
                              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="font-medium text-gray-900 truncate block">{query.name}</span>
                                {connection && (
                                  <span className="text-xs text-gray-500">{connection.name}</span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tables Section */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Table className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Tables</h4>
        </div>

        {connectionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-(--color-primary-600) animate-spin" />
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No database connections found</p>
            <button
              onClick={navigateToDataSources}
              className="mt-2 text-sm text-(--color-primary-600) hover:text-(--color-primary-700)"
            >
              Add a connection
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConnections.map(connection => {
              const dbType = getDatabaseTypeById(connection.databaseType);
              const isExpanded = expandedConnections[connection.id];
              const tables = selectTablesForConnection({ databaseConnections: { tables: {} } }, connection.id) || [];

              return (
                <div key={connection.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleExpandConnection(connection)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${dbType?.color || '#6B7280'}15` }}
                      >
                        <Database className="w-4 h-4" style={{ color: dbType?.color || '#6B7280' }} />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{connection.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({dbType?.name || 'Database'})</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <TablesListForConnection
                      connection={connection}
                      onSelectTable={handleSelectTable}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Links */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500 mb-3">Need a new connection or query?</p>
        <div className="flex items-center space-x-3">
          <button
            onClick={navigateToDataSources}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Open Data Sources</span>
          </button>
          <button
            onClick={() => navigateToSQLWorkbench()}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-(--color-primary-700) bg-white border border-(--color-primary-300) rounded-lg hover:bg-(--color-primary-50) transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open SQL Workbench</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Render query detail view
  const renderQueryDetailView = () => {
    if (!selectedQuery) return null;

    const queryText = selectedQuery.query || selectedQuery.sql || '';
    const params = detectParameters(queryText);
    const dbType = getDatabaseTypeById(selectedConnection?.databaseType);

    return (
      <div className="space-y-4">
        {/* Query Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900">{selectedQuery.name}</h3>
          {selectedQuery.description && (
            <p className="text-sm text-gray-600 mt-1">{selectedQuery.description}</p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <Database className="w-4 h-4" />
              <span>{selectedConnection?.name || 'Unknown connection'}</span>
            </span>
            {selectedQuery.last_executed_at && (
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Last run: {new Date(selectedQuery.last_executed_at).toLocaleDateString()}</span>
              </span>
            )}
          </div>
        </div>

        {/* SQL Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SQL Query</label>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">{queryText}</pre>
          </div>
        </div>

        {/* Parameter Inputs */}
        {params.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parameters ({params.length})
            </label>
            <div className="grid grid-cols-2 gap-3">
              {params.map(param => (
                <ParameterInput
                  key={param.name}
                  param={param}
                  value={parameterValues[param.name]}
                  onChange={(value) => setParameterValues(prev => ({
                    ...prev,
                    [param.name]: value
                  }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Execute and Preview */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePreviewQuery}
            disabled={previewLoading}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 font-medium rounded-lg transition-colors ${
              previewLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-(--color-primary-600) text-(--color-primary-contrast) hover:bg-(--color-primary-700)'
            }`}
          >
            {previewLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Run & Preview</span>
              </>
            )}
          </button>
          <button
            onClick={() => navigateToSQLWorkbench(selectedQuery)}
            className="flex items-center space-x-2 px-4 py-3 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            <span>Edit in Workbench</span>
          </button>
        </div>

        {/* Error Display */}
        {previewError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-red-700 font-medium">Query Error</span>
              <p className="text-red-600 text-sm mt-1">{previewError}</p>
            </div>
          </div>
        )}

        {/* Results Preview */}
        {previewResults && (
          <div className="border border-green-200 bg-green-50 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-green-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Query Successful</span>
                <span className="text-sm text-green-600">
                  ({previewResults.rows?.length || 0} rows)
                </span>
              </div>
            </div>

            {/* Preview Table (first 5 rows) */}
            {previewResults.rows && previewResults.columns && (
              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-sm">
                  <thead className="bg-green-100 sticky top-0">
                    <tr>
                      {previewResults.columns.map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-green-800 border-b border-green-200 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {previewResults.rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        {previewResults.columns.map(col => (
                          <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                            {String(row[col] ?? '').substring(0, 50)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewResults.rows.length > 5 && (
                  <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                    Showing first 5 of {previewResults.rows.length} rows
                  </div>
                )}
              </div>
            )}

            {/* Add to Notebook Button */}
            <div className="px-4 py-3 border-t border-green-200 bg-green-50">
              <button
                onClick={handleOpenSaveDialog}
                disabled={saving}
                className={`w-full px-4 py-2 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Add Results to Notebook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render table detail view
  const renderTableDetailView = () => {
    if (!selectedTable || !selectedConnection) return null;

    const dbType = getDatabaseTypeById(selectedConnection.databaseType);

    // Get related queries for this table
    const relatedQueries = findQueriesForTable(savedQueries, selectedTable.name);

    // Get columns for this table
    const cacheKey = selectedTable.schema
      ? `${selectedConnection.id}:${selectedTable.schema}.${selectedTable.name}`
      : `${selectedConnection.id}:${selectedTable.name}`;

    return (
      <div className="space-y-4">
        {/* Table Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${dbType?.color || '#6B7280'}15` }}
            >
              <Table className="w-5 h-5" style={{ color: dbType?.color || '#6B7280' }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{selectedTable.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{selectedConnection.name}</span>
                {selectedTable.rowCount !== undefined && (
                  <>
                    <span>•</span>
                    <span>{selectedTable.rowCount.toLocaleString()} rows</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Saved Queries */}
        {relatedQueries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Saved Queries for this Table
              </label>
              <button
                onClick={() => navigateToSQLWorkbench()}
                className="text-sm text-(--color-primary-600) hover:text-(--color-primary-700) flex items-center space-x-1"
              >
                <span>New Query</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {relatedQueries.slice(0, 5).map(query => (
                <button
                  key={query.id}
                  onClick={() => handleSelectQuery(query)}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{query.name}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleQuickAction('sample')}
              disabled={previewLoading}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <List className="w-5 h-5 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Sample Rows</span>
              <span className="text-xs text-gray-500">First 100 rows</span>
            </button>
            <button
              onClick={() => handleQuickAction('stats')}
              disabled={previewLoading}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Statistics</span>
              <span className="text-xs text-gray-500">Column stats</span>
            </button>
            <button
              onClick={() => handleQuickAction('count')}
              disabled={previewLoading}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Hash className="w-5 h-5 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Row Count</span>
              <span className="text-xs text-gray-500">Total rows</span>
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {previewLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-(--color-primary-600) animate-spin" />
          </div>
        )}

        {/* Error Display */}
        {previewError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-red-700 font-medium">Query Error</span>
              <p className="text-red-600 text-sm mt-1">{previewError}</p>
            </div>
          </div>
        )}

        {/* Results Preview */}
        {previewResults && (
          <div className="border border-green-200 bg-green-50 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-green-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Results</span>
                <span className="text-sm text-green-600">
                  ({previewResults.rows?.length || 0} rows)
                </span>
              </div>
            </div>

            {/* Results Table */}
            {previewResults.rows && previewResults.columns && (
              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-sm">
                  <thead className="bg-green-100 sticky top-0">
                    <tr>
                      {previewResults.columns.map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-green-800 border-b border-green-200 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {previewResults.rows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        {previewResults.columns.map(col => (
                          <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                            {String(row[col] ?? '').substring(0, 50)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add to Notebook Button */}
            <div className="px-4 py-3 border-t border-green-200 bg-green-50">
              <button
                onClick={handleOpenSaveDialog}
                disabled={saving}
                className={`w-full px-4 py-2 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Add Results to Notebook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Table Schema */}
        <TableSchemaDisplay
          connectionId={selectedConnection.id}
          tableName={selectedTable.name}
          schema={selectedTable.schema}
        />
      </div>
    );
  };

  // Get view title
  const getViewTitle = () => {
    switch (currentView) {
      case VIEW_TYPES.BROWSER:
        return 'Add Database Data';
      case VIEW_TYPES.QUERY_DETAIL:
        return selectedQuery?.name || 'Query Details';
      case VIEW_TYPES.TABLE_DETAIL:
        return selectedTable?.name || 'Table Details';
      default:
        return 'Database';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Database className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{getViewTitle()}</h2>
              <p className="text-sm text-gray-500">
                {currentView === VIEW_TYPES.BROWSER
                  ? `Add data to "${notebook?.name || 'this notebook'}"`
                  : currentView === VIEW_TYPES.QUERY_DETAIL
                  ? `Connection: ${selectedConnection?.name || 'Unknown'}`
                  : `Database: ${selectedConnection?.name || 'Unknown'}`
                }
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {currentView === VIEW_TYPES.BROWSER && renderBrowserView()}
        {currentView === VIEW_TYPES.QUERY_DETAIL && renderQueryDetailView()}
        {currentView === VIEW_TYPES.TABLE_DETAIL && renderTableDetailView()}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleBackClick}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {currentView === VIEW_TYPES.BROWSER ? 'Cancel' : 'Back'}
        </button>
      </div>

      {/* Save to Notebook Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Save className="w-5 h-5 text-green-600" />
                <span>Add to Notebook</span>
              </h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Name
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter document name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">
                  This name will appear in your notebook
                </p>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* JSON Format Button */}
                  <button
                    type="button"
                    onClick={() => setOutputFormat('json')}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      outputFormat === 'json'
                        ? 'border-(--color-primary-500) bg-(--color-primary-50)'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      outputFormat === 'json' ? 'text-(--color-primary-700)' : 'text-gray-900'
                    }`}>
                      JSON
                    </span>
                    <span className={`text-xs mt-0.5 ${
                      outputFormat === 'json' ? 'text-(--color-primary-600)' : 'text-gray-500'
                    }`}>
                      Best for AI/LLM
                    </span>
                  </button>

                  {/* Markdown Table Button */}
                  <button
                    type="button"
                    onClick={() => setOutputFormat('markdown')}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      outputFormat === 'markdown'
                        ? 'border-(--color-primary-500) bg-(--color-primary-50)'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      outputFormat === 'markdown' ? 'text-(--color-primary-700)' : 'text-gray-900'
                    }`}>
                      Table
                    </span>
                    <span className={`text-xs mt-0.5 ${
                      outputFormat === 'markdown' ? 'text-(--color-primary-600)' : 'text-gray-500'
                    }`}>
                      Best for display
                    </span>
                  </button>

                  {/* CSV Format Button */}
                  <button
                    type="button"
                    onClick={() => setOutputFormat('csv')}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      outputFormat === 'csv'
                        ? 'border-(--color-primary-500) bg-(--color-primary-50)'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      outputFormat === 'csv' ? 'text-(--color-primary-700)' : 'text-gray-900'
                    }`}>
                      CSV
                    </span>
                    <span className={`text-xs mt-0.5 ${
                      outputFormat === 'csv' ? 'text-(--color-primary-600)' : 'text-gray-500'
                    }`}>
                      For data export
                    </span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Rows:</span> {previewResults?.rows?.length || 0}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Columns:</span> {previewResults?.columns?.length || 0}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Database:</span> {selectedConnection?.name || 'Unknown'}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToNotebook}
                disabled={!documentName.trim() || saving}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Add to Notebook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

// Tables list for a connection (fetches on render)
const TablesListForConnection = ({ connection, onSelectTable }) => {
  const dispatch = useDispatch();
  const tablesData = useSelector(state => state.databaseConnections.tables[connection.id]);
  const loading = useSelector(selectTablesLoading);

  useEffect(() => {
    if (!tablesData) {
      dispatch(fetchDatabaseTables(connection.id));
    }
  }, [dispatch, connection.id, tablesData]);

  const tables = tablesData?.tables || [];

  if (loading && !tablesData) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-(--color-primary-600) animate-spin" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-gray-500">
        No tables found
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {tables.slice(0, 20).map(table => (
        <button
          key={table.name}
          onClick={() => onSelectTable(table, connection)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3 pl-6">
            <Table className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">{table.name}</span>
            {table.rowCount !== undefined && (
              <span className="text-xs text-gray-400">({table.rowCount.toLocaleString()} rows)</span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      ))}
      {tables.length > 20 && (
        <div className="px-4 py-2 text-sm text-gray-500 text-center">
          +{tables.length - 20} more tables
        </div>
      )}
    </div>
  );
};

// Table schema display component
const TableSchemaDisplay = ({ connectionId, tableName, schema }) => {
  const dispatch = useDispatch();
  const cacheKey = schema ? `${connectionId}:${schema}.${tableName}` : `${connectionId}:${tableName}`;
  const columnsData = useSelector(state => state.databaseConnections.tableColumns[cacheKey]);
  const loading = useSelector(selectTableColumnsLoading);

  useEffect(() => {
    if (!columnsData) {
      dispatch(fetchTableColumns({ connectionId, tableName, schema }));
    }
  }, [dispatch, connectionId, tableName, schema, columnsData]);

  const columns = columnsData?.columns || [];

  if (loading && !columnsData) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Table Schema</label>
        <div className="flex items-center justify-center py-4 border border-gray-200 rounded-lg">
          <Loader2 className="w-5 h-5 text-(--color-primary-600) animate-spin" />
        </div>
      </div>
    );
  }

  if (columns.length === 0) {
    return null;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Table Schema ({columns.length} columns)
      </label>
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {columns.map((col, idx) => (
            <div key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <Columns className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{col.name}</span>
                {col.isPrimaryKey && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">PK</span>
                )}
              </div>
              <span className="text-xs text-gray-500">{col.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatabaseSource;
