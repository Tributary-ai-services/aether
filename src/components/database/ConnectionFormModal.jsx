import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Database,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Server
} from 'lucide-react';
import {
  createDatabaseConnection,
  updateDatabaseConnection,
  testDatabaseConnection,
  selectConnectionTest,
  resetConnectionTest
} from '../../store/slices/databaseConnectionsSlice.js';
import {
  DATABASE_TYPES,
  DATABASE_CATEGORIES,
  FIELD_TYPES,
  getDatabaseTypeById,
  validateConnectionParams
} from '../../config/databaseTypes.js';

const ConnectionFormModal = ({ connection, onClose, onSuccess, initialType }) => {
  const dispatch = useDispatch();
  const connectionTest = useSelector(selectConnectionTest);

  // Form state
  const [name, setName] = useState(connection?.name || '');
  const [databaseType, setDatabaseType] = useState(initialType || connection?.databaseType || connection?.type || 'postgresql');
  const [params, setParams] = useState({});
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});

  // Get database type configuration
  const dbTypeConfig = getDatabaseTypeById(databaseType);

  // Initialize form params when connection or database type changes
  useEffect(() => {
    if (connection && (connection.databaseType === databaseType || connection.type === databaseType)) {
      // Editing existing connection - populate with existing values
      const existingParams = { ...connection };
      delete existingParams.id;
      delete existingParams.name;
      delete existingParams.databaseType;
      delete existingParams.type;
      delete existingParams.lastTestedAt;
      delete existingParams.lastTestStatus;
      delete existingParams.createdAt;
      delete existingParams.updatedAt;
      setParams(existingParams);
    } else if (dbTypeConfig) {
      // New connection or changed type - use defaults
      const defaultParams = {};
      dbTypeConfig.fields.forEach(field => {
        if (field.default !== undefined) {
          defaultParams[field.name] = field.default;
        } else {
          defaultParams[field.name] = '';
        }
      });
      setParams(defaultParams);
    }
  }, [connection, databaseType, dbTypeConfig]);

  // Reset connection test when modal opens
  useEffect(() => {
    dispatch(resetConnectionTest());
    return () => dispatch(resetConnectionTest());
  }, [dispatch]);

  // Group database types by category
  const groupedTypes = DATABASE_TYPES.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {});

  // Handle param change
  const handleParamChange = (fieldName, value) => {
    setParams(prev => ({ ...prev, [fieldName]: value }));
    // Clear field error when user types
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Connection name is required';
    }

    const validation = validateConnectionParams(databaseType, params);
    if (!validation.valid) {
      validation.errors.forEach(error => {
        // Extract field name from error message
        const field = dbTypeConfig?.fields.find(f => error.includes(f.label));
        if (field) {
          newErrors[field.name] = error;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle test connection
  const handleTestConnection = async () => {
    if (!validateForm()) return;

    dispatch(testDatabaseConnection({
      connectionParams: {
        databaseType,
        ...params
      }
    }));
  };

  // Map frontend database type to backend type value
  const mapDatabaseType = (frontendType) => {
    const typeMapping = {
      'postgresql': 'postgres',
      'mysql': 'mysql',
      'mariadb': 'mariadb',
      'mssql': 'sqlserver',
      'sqlite': 'sqlite',
      // Add more mappings as needed
    };
    return typeMapping[frontendType] || frontendType;
  };

  // Convert camelCase params to snake_case for backend
  const convertParamsForBackend = (params) => {
    const result = {};
    for (const [key, value] of Object.entries(params)) {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = value;
    }
    return result;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Convert params for backend (camelCase to snake_case)
      const backendParams = convertParamsForBackend(params);

      const connectionData = {
        name: name.trim(),
        type: mapDatabaseType(databaseType),
        ...backendParams
      };

      let result;
      if (connection?.id) {
        // Update existing
        result = await dispatch(updateDatabaseConnection({
          id: connection.id,
          updates: connectionData
        })).unwrap();
      } else {
        // Create new
        result = await dispatch(createDatabaseConnection(connectionData)).unwrap();
      }

      // Pass the created/updated connection to onSuccess callback
      onSuccess(result);
    } catch (error) {
      setSaveError(error.message || 'Failed to save connection');
    } finally {
      setIsSaving(false);
    }
  };

  // Render form field based on type
  const renderField = (field) => {
    const value = params[field.name] ?? '';
    const hasError = errors[field.name];

    const baseInputClass = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) ${
      hasError ? 'border-red-300' : 'border-gray-300'
    }`;

    switch (field.type) {
      case FIELD_TYPES.PASSWORD:
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPasswords[field.name] ? 'text' : 'password'}
                value={value}
                onChange={(e) => handleParamChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className={`${baseInputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility(field.name)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPasswords[field.name] ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {hasError && <p className="text-sm text-red-600">{errors[field.name]}</p>}
          </div>
        );

      case FIELD_TYPES.NUMBER:
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleParamChange(field.name, parseInt(e.target.value, 10) || '')}
              placeholder={field.placeholder}
              className={baseInputClass}
            />
            {hasError && <p className="text-sm text-red-600">{errors[field.name]}</p>}
          </div>
        );

      case FIELD_TYPES.SELECT:
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleParamChange(field.name, e.target.value)}
              className={baseInputClass}
            >
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {hasError && <p className="text-sm text-red-600">{errors[field.name]}</p>}
          </div>
        );

      case FIELD_TYPES.TOGGLE:
        return (
          <div key={field.name} className="flex items-center justify-between py-2">
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <button
              type="button"
              onClick={() => handleParamChange(field.name, !value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-(--color-primary-600)' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        );

      case FIELD_TYPES.TEXTAREA:
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleParamChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={baseInputClass}
            />
            {hasError && <p className="text-sm text-red-600">{errors[field.name]}</p>}
          </div>
        );

      case FIELD_TYPES.FILE:
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="file"
              accept={field.accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    handleParamChange(field.name, event.target.result);
                  };
                  reader.readAsText(file);
                }
              }}
              className={baseInputClass}
            />
            {hasError && <p className="text-sm text-red-600">{errors[field.name]}</p>}
          </div>
        );

      default: // TEXT
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleParamChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={baseInputClass}
            />
            {hasError && <p className="text-sm text-red-600">{errors[field.name]}</p>}
          </div>
        );
    }
  };

  // Get category display name
  const getCategoryName = (category) => {
    const names = {
      [DATABASE_CATEGORIES.RELATIONAL]: 'Relational',
      [DATABASE_CATEGORIES.GRAPH]: 'Graph',
      [DATABASE_CATEGORIES.VECTOR]: 'Vector',
      [DATABASE_CATEGORIES.DOCUMENT]: 'Document',
      [DATABASE_CATEGORIES.KEY_VALUE]: 'Key-Value',
      [DATABASE_CATEGORIES.WAREHOUSE]: 'Data Warehouse',
      [DATABASE_CATEGORIES.SEARCH]: 'Search',
      [DATABASE_CATEGORIES.EMBEDDED]: 'Embedded',
    };
    return names[category] || category;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Database size={20} />
            {connection ? 'Edit Connection' : 'Add New Connection'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="space-y-6">
            {/* Connection Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Connection Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.name;
                      return newErrors;
                    });
                  }
                }}
                placeholder="My Database Connection"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Database Type */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Database Type
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={databaseType}
                onChange={(e) => setDatabaseType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              >
                {Object.entries(groupedTypes).map(([category, types]) => (
                  <optgroup key={category} label={getCategoryName(category)}>
                    {types.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                        {type.mcpServer ? ' (MCP)' : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {dbTypeConfig?.mcpServer && (
                <p className="text-xs text-(--color-primary-600) flex items-center gap-1 mt-1">
                  <Server size={12} />
                  This database type has MCP server support for enhanced integration
                </p>
              )}
            </div>

            {/* Dynamic Fields */}
            {dbTypeConfig && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900">Connection Details</h4>
                {dbTypeConfig.fields.map(field => renderField(field))}
              </div>
            )}

            {/* Test Connection Result */}
            {connectionTest.status === 'success' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Connection Successful</h4>
                  <p className="text-sm text-green-700 mt-1">
                    The database connection was verified successfully.
                  </p>
                </div>
              </div>
            )}

            {connectionTest.status === 'failed' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Connection Failed</h4>
                  <p className="text-sm text-red-700 mt-1">{connectionTest.error}</p>
                </div>
              </div>
            )}

            {/* Save Error */}
            {saveError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Failed to Save</h4>
                  <p className="text-sm text-red-700 mt-1">{saveError}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          {connection?.id ? (
            <button
              onClick={handleTestConnection}
              disabled={connectionTest.status === 'testing'}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {connectionTest.status === 'testing' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Test Connection
                </>
              )}
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Save the connection first, then test it from the connection list.
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  {connection ? 'Save Changes' : 'Create Connection'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionFormModal;
