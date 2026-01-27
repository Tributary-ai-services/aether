import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  Database,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
  Server,
  Eye,
  EyeOff,
  TestTube,
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
  Play
} from 'lucide-react';
import {
  fetchDatabaseConnections,
  createDatabaseConnection,
  testDatabaseConnection,
  fetchDatabaseSchema,
  executeQuery,
  selectConnections,
  selectConnectionsLoading,
  selectConnectionsError,
  selectConnectionTest,
  selectSchemaForConnection,
  selectSchemaLoading,
  selectQueryExecution,
  resetConnectionTest,
  resetQueryExecution,
  clearConnectionsError
} from '../../../store/slices/databaseConnectionsSlice.js';
import {
  DATABASE_TYPES,
  DATABASE_CATEGORIES,
  FIELD_TYPES,
  getDatabaseTypeById,
  getDatabaseTypesByCategory,
  validateConnectionParams,
  detectEnvironment
} from '../../../config/databaseTypes.js';
import { aetherApi } from '../../../services/aetherApi.js';

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

  // Redux state
  const existingConnections = useSelector(selectConnections);
  const connectionsLoading = useSelector(selectConnectionsLoading);
  const connectionsError = useSelector(selectConnectionsError);
  const connectionTest = useSelector(selectConnectionTest);
  const schemaLoading = useSelector(selectSchemaLoading);
  const queryExecution = useSelector(selectQueryExecution);

  // Local state
  const [step, setStep] = useState('select'); // 'select' | 'configure' | 'query'
  const [selectedDbType, setSelectedDbType] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [connectionName, setConnectionName] = useState('');
  const [queryText, setQueryText] = useState('');
  const [saving, setSaving] = useState(false);

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
      dispatch(resetConnectionTest());
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

  // Initialize form values when database type is selected
  useEffect(() => {
    if (selectedDbType) {
      const dbType = getDatabaseTypeById(selectedDbType);
      if (dbType) {
        const initialValues = {};
        dbType.fields.forEach(field => {
          initialValues[field.name] = field.default !== undefined ? field.default : '';
        });
        setFormValues(initialValues);
        setConnectionName(`${dbType.name} Connection`);
      }
    }
  }, [selectedDbType]);

  // Handle database type selection
  const handleSelectDbType = (dbTypeId) => {
    setSelectedDbType(dbTypeId);
    setSelectedConnection(null);
    setStep('configure');
  };

  // Handle existing connection selection
  const handleSelectConnection = (connection) => {
    setSelectedConnection(connection);
    setSelectedDbType(connection.databaseType);
    setStep('query');
    // Fetch schema for this connection
    dispatch(fetchDatabaseSchema(connection.id));
  };

  // Handle form field change
  const handleFieldChange = (fieldName, value) => {
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
    // Clear error for this field
    if (formErrors[fieldName]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  // Validate form
  const validateForm = () => {
    const result = validateConnectionParams(selectedDbType, formValues);
    if (!result.valid) {
      const errors = {};
      result.errors.forEach(err => {
        // Extract field name from error message
        const match = err.match(/^(.+) is required$/);
        if (match) {
          const fieldLabel = match[1];
          const dbType = getDatabaseTypeById(selectedDbType);
          const field = dbType?.fields.find(f => f.label === fieldLabel);
          if (field) {
            errors[field.name] = err;
          }
        }
      });
      setFormErrors(errors);
      return false;
    }
    return true;
  };

  // Handle test connection
  const handleTestConnection = async () => {
    if (!validateForm()) return;

    dispatch(testDatabaseConnection({
      connectionParams: {
        databaseType: selectedDbType,
        ...formValues,
      }
    }));
  };

  // Handle save connection
  const handleSaveConnection = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const connectionData = {
        name: connectionName,
        databaseType: selectedDbType,
        ...formValues,
      };

      const result = await dispatch(createDatabaseConnection(connectionData)).unwrap();
      setSelectedConnection(result);
      setStep('query');
      // Fetch schema for the new connection
      dispatch(fetchDatabaseSchema(result.id));
    } catch (err) {
      console.error('Failed to save connection:', err);
    } finally {
      setSaving(false);
    }
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

  // Render connection form
  const renderConnectionForm = () => {
    const dbType = getDatabaseTypeById(selectedDbType);
    if (!dbType) return null;

    return (
      <div className="space-y-6">
        {/* Database Type Header */}
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${dbType.color}20` }}
          >
            {renderDbIcon(dbType.icon, 'w-6 h-6')}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{dbType.name}</h4>
            <p className="text-sm text-gray-500">{dbType.description}</p>
          </div>
        </div>

        {/* Connection Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Connection Name
          </label>
          <input
            type="text"
            value={connectionName}
            onChange={(e) => setConnectionName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="My Database Connection"
          />
        </div>

        {/* Dynamic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dbType.fields.map(field => (
            <div key={field.name} className={field.type === FIELD_TYPES.TEXTAREA ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === FIELD_TYPES.TEXT && (
                <input
                  type="text"
                  value={formValues[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              )}

              {field.type === FIELD_TYPES.PASSWORD && (
                <div className="relative">
                  <input
                    type={showPasswords[field.name] ? 'text' : 'password'}
                    value={formValues[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field.name)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords[field.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {field.type === FIELD_TYPES.NUMBER && (
                <input
                  type="number"
                  value={formValues[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value) || '')}
                  placeholder={field.placeholder}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              )}

              {field.type === FIELD_TYPES.SELECT && (
                <select
                  value={formValues[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}

              {field.type === FIELD_TYPES.TOGGLE && (
                <button
                  type="button"
                  onClick={() => handleFieldChange(field.name, !formValues[field.name])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formValues[field.name] ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formValues[field.name] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}

              {formErrors[field.name] && (
                <p className="mt-1 text-sm text-red-600">{formErrors[field.name]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Connection Test Result */}
        {connectionTest.status === 'testing' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-700">Testing connection...</span>
          </div>
        )}

        {connectionTest.status === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700">Connection successful!</span>
          </div>
        )}

        {connectionTest.status === 'failed' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{connectionTest.error}</span>
          </div>
        )}

        {/* Error display */}
        {connectionsError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{connectionsError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={connectionTest.status === 'testing'}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
          >
            <TestTube className="w-4 h-4" />
            <span>Test Connection</span>
          </button>

          <button
            type="button"
            onClick={handleSaveConnection}
            disabled={saving || connectionTest.status === 'testing'}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
              saving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
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
                <span>Save & Continue</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

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
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${schemaLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Schema</span>
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
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
          />
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecuteQuery}
          disabled={!queryText.trim() || queryExecution.status === 'executing'}
          className={`w-full px-4 py-3 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 ${
            !queryText.trim() || queryExecution.status === 'executing'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
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
      case 'configure':
        return renderConnectionForm();
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
      case 'configure':
        return 'Configure Connection';
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
    } else if (step === 'configure') {
      setStep('select');
      setSelectedDbType(null);
      dispatch(resetConnectionTest());
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
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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
    </div>
  );
};

export default DatabaseSource;
