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
  Save,
  Table,
  RefreshCw,
  Layers,
  GitBranch,
  Zap,
  FileText,
  Search,
  HardDrive,
  CloudLightning,
  Snowflake,
  Play,
  ExternalLink,
  Terminal,
  FolderTree
} from 'lucide-react';
import {
  fetchDatabaseConnections,
  fetchDatabaseSchema,
  executeQuery,
  selectConnections,
  selectConnectionsLoading,
  selectConnectionsError,
  selectSchemaForConnection,
  selectSchemaLoading,
  selectQueryExecution,
  resetQueryExecution,
  clearConnectionsError
} from '../../../store/slices/databaseConnectionsSlice.js';
import {
  DATABASE_TYPES,
  DATABASE_CATEGORIES,
  getDatabaseTypeById
} from '../../../config/databaseTypes.js';
import { aetherApi } from '../../../services/aetherApi.js';
import ConnectionFormModal from '../../database/ConnectionFormModal.jsx';

// Icon mapping for database types
const ICON_MAP = {
  Database,
  GitBranch,
  Layers,
  Zap,
  FileText,
  Search,
  HardDrive,
  CloudLightning,
  Snowflake,
};

// Category display info
const CATEGORY_INFO = {
  [DATABASE_CATEGORIES.RELATIONAL]: { name: 'Relational', icon: Database },
  [DATABASE_CATEGORIES.GRAPH]: { name: 'Graph', icon: GitBranch },
  [DATABASE_CATEGORIES.VECTOR]: { name: 'Vector', icon: Layers },
  [DATABASE_CATEGORIES.DOCUMENT]: { name: 'Document', icon: FileText },
  [DATABASE_CATEGORIES.KEY_VALUE]: { name: 'Key-Value', icon: Zap },
  [DATABASE_CATEGORIES.WAREHOUSE]: { name: 'Data Warehouse', icon: CloudLightning },
  [DATABASE_CATEGORIES.SEARCH]: { name: 'Search', icon: Search },
  [DATABASE_CATEGORIES.EMBEDDED]: { name: 'Embedded', icon: HardDrive },
};

const DatabaseSource = ({
  notebook,
  onBack,
  onSuccess,
  onClose
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const existingConnections = useSelector(selectConnections);
  const connectionsLoading = useSelector(selectConnectionsLoading);
  const connectionsError = useSelector(selectConnectionsError);
  const schemaLoading = useSelector(selectSchemaLoading);
  const queryExecution = useSelector(selectQueryExecution);

  // Local state
  const [step, setStep] = useState('select'); // 'select' | 'query'
  const [selectedDbType, setSelectedDbType] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [queryText, setQueryText] = useState('');
  const [saving, setSaving] = useState(false);

  // Connection modal state
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  // Get schema for selected connection
  const schema = useSelector(state =>
    selectedConnection ? selectSchemaForConnection(state, selectedConnection.id) : null
  );

  // Fetch existing connections on mount
  useEffect(() => {
    dispatch(fetchDatabaseConnections());
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetQueryExecution());
      dispatch(clearConnectionsError());
    };
  }, [dispatch]);

  // Group database types by category
  const groupedDbTypes = useMemo(() => {
    const groups = {};
    DATABASE_TYPES.forEach(db => {
      if (!groups[db.category]) {
        groups[db.category] = [];
      }
      groups[db.category].push(db);
    });
    return groups;
  }, []);

  // Handle database type selection - opens ConnectionFormModal
  const handleSelectDbType = (dbTypeId) => {
    setSelectedDbType(dbTypeId);
    setSelectedConnection(null);
    setShowConnectionModal(true);
  };

  // Handle connection created from modal
  const handleConnectionCreated = (connection) => {
    setSelectedConnection(connection);
    setSelectedDbType(connection.databaseType || connection.type);
    setShowConnectionModal(false);
    setStep('query');
    // Fetch schema for the new connection
    dispatch(fetchDatabaseSchema(connection.id));
  };

  // Handle existing connection selection
  const handleSelectConnection = (connection) => {
    setSelectedConnection(connection);
    setSelectedDbType(connection.databaseType);
    setStep('query');
    // Fetch schema for this connection
    dispatch(fetchDatabaseSchema(connection.id));
  };

  // Handle query execution
  const handleExecuteQuery = async () => {
    if (!selectedConnection || !queryText.trim()) return;

    dispatch(executeQuery({
      connectionId: selectedConnection.id,
      query: queryText,
    }));
  };

  // Handle save query results to notebook
  const handleSaveToNotebook = async () => {
    if (!queryExecution.result) return;

    setSaving(true);
    try {
      const dbType = getDatabaseTypeById(selectedDbType);

      // Format query results as markdown table
      const results = queryExecution.result;
      let content = `# Query Results\n\n`;
      content += `**Database:** ${selectedConnection.name} (${dbType?.name})\n`;
      content += `**Query:** \`${queryText}\`\n`;
      content += `**Executed:** ${new Date().toISOString()}\n\n`;

      if (results.rows && results.columns) {
        // Create markdown table
        content += `| ${results.columns.join(' | ')} |\n`;
        content += `| ${results.columns.map(() => '---').join(' | ')} |\n`;
        results.rows.forEach(row => {
          const rowValues = results.columns.map(col =>
            String(row[col] ?? '').replace(/\|/g, '\\|')
          );
          content += `| ${rowValues.join(' | ')} |\n`;
        });
        content += `\n*${results.rows.length} rows returned*\n`;
      } else {
        content += `\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\`\n`;
      }

      const documentData = {
        title: `Query: ${queryText.substring(0, 50)}${queryText.length > 50 ? '...' : ''}`,
        content,
        content_type: 'text/markdown',
        notebook_id: notebook?.id,
        source_type: 'database',
        metadata: {
          connection_id: selectedConnection.id,
          connection_name: selectedConnection.name,
          database_type: selectedDbType,
          query: queryText,
          executed_at: new Date().toISOString(),
        }
      };

      const response = await aetherApi.documents.create(documentData);

      if (response.success) {
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

  // Render database type icon
  const renderDbIcon = (iconName, className = '') => {
    const IconComponent = ICON_MAP[iconName] || Database;
    return <IconComponent className={className} />;
  };

  // Render database type selection
  const renderTypeSelection = () => (
    <div className="space-y-6">
      {/* Database Tools Quick Access */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-800">Database Tools</h4>
            <p className="text-xs text-gray-600 mt-0.5">Explore schemas and run queries across all connections</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                navigate('/schema-browser');
              }}
              className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <FolderTree className="w-4 h-4" />
              <span>Schema Browser</span>
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/query-console');
              }}
              className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-(--color-primary-700) bg-white border border-(--color-primary-300) rounded-lg hover:bg-(--color-primary-50) transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span>Query Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Existing Connections */}
      {existingConnections.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Existing Connections</h4>
          <div className="grid grid-cols-1 gap-2">
            {existingConnections.map(conn => {
              const dbType = getDatabaseTypeById(conn.databaseType);
              return (
                <button
                  key={conn.id}
                  onClick={() => handleSelectConnection(conn)}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${dbType?.color}15` }}
                    >
                      {renderDbIcon(dbType?.icon, `w-5 h-5`)}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{conn.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({dbType?.name})</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Database Types by Category */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {existingConnections.length > 0 ? 'Or Create New Connection' : 'Select Database Type'}
        </h4>
        {Object.entries(groupedDbTypes).map(([category, databases]) => {
          const categoryInfo = CATEGORY_INFO[category];
          return (
            <div key={category} className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                {categoryInfo && React.createElement(categoryInfo.icon, { className: 'w-4 h-4 text-gray-400' })}
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {categoryInfo?.name || category}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {databases.map(db => (
                  <button
                    key={db.id}
                    onClick={() => handleSelectDbType(db.id)}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                  >
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${db.color}15` }}
                    >
                      {renderDbIcon(db.icon, `w-5 h-5`)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 text-sm">{db.name}</span>
                      {db.mcpServer && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          MCP
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render query interface
  const renderQueryInterface = () => {
    const dbType = getDatabaseTypeById(selectedDbType);

    return (
      <div className="space-y-4">
        {/* Connection Info */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${dbType?.color}15` }}
            >
              {renderDbIcon(dbType?.icon, 'w-5 h-5')}
            </div>
            <div>
              <span className="font-medium text-gray-900">{selectedConnection?.name}</span>
              <span className="text-sm text-gray-500 ml-2">({dbType?.name})</span>
            </div>
          </div>
          <button
            onClick={() => dispatch(fetchDatabaseSchema(selectedConnection.id))}
            disabled={schemaLoading}
            className="text-sm text-(--color-primary-600) hover:text-(--color-primary-700) flex items-center space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${schemaLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Schema</span>
          </button>
        </div>

        {/* Quick Actions - Schema Browser and Query Console */}
        <div className="flex items-center space-x-2 p-3 bg-(--color-primary-50) border border-(--color-primary-200) rounded-lg">
          <span className="text-sm text-(--color-primary-700) font-medium">Advanced Tools:</span>
          <button
            onClick={() => {
              onClose();
              navigate(`/schema-browser/${selectedConnection.id}`);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-(--color-primary-700) bg-white border border-(--color-primary-300) rounded-md hover:bg-(--color-primary-50) transition-colors"
          >
            <FolderTree className="w-4 h-4" />
            <span>Schema Browser</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              onClose();
              navigate(`/query-console/${selectedConnection.id}`);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-(--color-primary-700) bg-white border border-(--color-primary-300) rounded-md hover:bg-(--color-primary-50) transition-colors"
          >
            <Terminal className="w-4 h-4" />
            <span>Query Console</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Schema Browser */}
        {schema && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-sm text-gray-700 flex items-center space-x-2">
                <Table className="w-4 h-4" />
                <span>Tables ({schema.tables?.length || 0})</span>
              </h4>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {schema.tables?.map(table => (
                <button
                  key={table.name}
                  onClick={() => setQueryText(`SELECT * FROM ${table.name} LIMIT 100`)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 border-b border-gray-100 last:border-b-0"
                >
                  <Table className="w-4 h-4 text-gray-400" />
                  <span>{table.name}</span>
                  {table.rowCount !== undefined && (
                    <span className="text-xs text-gray-400 ml-auto">{table.rowCount} rows</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Query Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SQL Query
          </label>
          <textarea
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="SELECT * FROM table_name LIMIT 100"
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) font-mono text-sm resize-none"
          />
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecuteQuery}
          disabled={!queryText.trim() || queryExecution.status === 'executing'}
          className={`w-full px-4 py-3 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 ${
            !queryText.trim() || queryExecution.status === 'executing'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-(--color-primary-600) text-(--color-primary-contrast) hover:bg-(--color-primary-700)'
          }`}
        >
          {queryExecution.status === 'executing' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Executing...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Execute Query</span>
            </>
          )}
        </button>

        {/* Query Error */}
        {queryExecution.status === 'failed' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <span className="text-red-700 font-medium">Query Error</span>
              <p className="text-red-600 text-sm mt-1">{queryExecution.error}</p>
            </div>
          </div>
        )}

        {/* Query Results */}
        {queryExecution.status === 'complete' && queryExecution.result && (
          <div className="border border-green-200 bg-green-50 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-green-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Query Successful</span>
                <span className="text-sm text-green-600">
                  ({queryExecution.result.rows?.length || 0} rows)
                </span>
              </div>
            </div>

            {/* Results Table */}
            {queryExecution.result.rows && queryExecution.result.columns && (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-green-100 sticky top-0">
                    <tr>
                      {queryExecution.result.columns.map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-green-800 border-b border-green-200">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {queryExecution.result.rows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        {queryExecution.result.columns.map(col => (
                          <td key={col} className="px-3 py-2 text-gray-700">
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Save to Notebook Button */}
            <div className="px-4 py-3 border-t border-green-200 bg-green-50">
              <button
                onClick={handleSaveToNotebook}
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

  // Determine what content to render
  const renderContent = () => {
    switch (step) {
      case 'select':
        return renderTypeSelection();
      case 'query':
        return renderQueryInterface();
      default:
        return null;
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (step) {
      case 'select':
        return 'Select Database';
      case 'query':
        return 'Query Data';
      default:
        return 'Database';
    }
  };

  // Handle back navigation
  const handleBackClick = () => {
    if (step === 'query') {
      setStep('select');
      setSelectedConnection(null);
      dispatch(resetQueryExecution());
    } else {
      onBack();
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
              <h2 className="text-xl font-semibold text-gray-900">{getStepTitle()}</h2>
              <p className="text-sm text-gray-500">
                Connect to databases for "{notebook?.name || 'this notebook'}"
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
        {connectionsLoading && step === 'select' ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-(--color-primary-600) animate-spin" />
          </div>
        ) : (
          renderContent()
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleBackClick}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {step === 'select' ? 'Cancel' : 'Back'}
        </button>
      </div>

      {/* Connection Form Modal */}
      {showConnectionModal && (
        <ConnectionFormModal
          initialType={selectedDbType}
          onClose={() => {
            setShowConnectionModal(false);
            setSelectedDbType(null);
          }}
          onSuccess={handleConnectionCreated}
        />
      )}
    </div>
  );
};

export default DatabaseSource;
