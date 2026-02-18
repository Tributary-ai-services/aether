import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  FolderTree,
  Terminal,
  Pencil,
  RefreshCw,
  Trash2,
  Check,
  X,
  AlertCircle,
  Clock,
  Server,
  Loader2
} from 'lucide-react';
import {
  testDatabaseConnection,
  deleteDatabaseConnection,
  selectConnectionTest
} from '../../store/slices/databaseConnectionsSlice.js';
import { getDatabaseTypeById } from '../../config/databaseTypes.js';

const ConnectionCard = ({
  connection,
  onEdit,
  onCloseSettings
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const connectionTest = useSelector(selectConnectionTest);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get database type info
  const dbType = getDatabaseTypeById(connection.databaseType || connection.type);
  const hasMcp = dbType?.mcpServer !== null;

  // Check if this connection is currently being tested
  const isTesting = connectionTest.status === 'testing' && connectionTest.connectionId === connection.id;

  // Determine connection status
  const getConnectionStatus = () => {
    if (isTesting) {
      return { icon: Loader2, color: 'text-(--color-primary-500)', label: 'Testing...', spin: true };
    }

    if (connection.lastTestStatus === 'success') {
      const testedAt = connection.lastTestedAt ? new Date(connection.lastTestedAt) : null;
      const timeAgo = testedAt ? getTimeAgo(testedAt) : '';
      return { icon: Check, color: 'text-green-500', label: `Connected ${timeAgo}`, spin: false };
    }

    if (connection.lastTestStatus === 'failed') {
      return { icon: X, color: 'text-red-500', label: 'Connection failed', spin: false };
    }

    return { icon: AlertCircle, color: 'text-yellow-500', label: 'Not tested', spin: false };
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  // Check if this is a Neo4j connection
  const isNeo4j = (connection.databaseType || connection.type || '').toLowerCase() === 'neo4j';

  // Handle navigation to schema browser (or Neo4j Explorer for neo4j)
  const handleSchemaClick = () => {
    if (onCloseSettings) onCloseSettings();
    if (isNeo4j) {
      navigate(`/neo4j-explorer?connectionId=${connection.id}`);
    } else {
      navigate(`/schema-browser?connectionId=${connection.id}`);
    }
  };

  // Handle navigation to query console (or Neo4j Explorer for neo4j)
  const handleQueryClick = () => {
    if (onCloseSettings) onCloseSettings();
    if (isNeo4j) {
      navigate(`/neo4j-explorer?connectionId=${connection.id}`);
    } else {
      navigate(`/query-console?connectionId=${connection.id}`);
    }
  };

  // Handle test connection
  const handleTestConnection = () => {
    dispatch(testDatabaseConnection({ id: connection.id }));
  };

  // Handle delete connection
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteDatabaseConnection(connection.id)).unwrap();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete connection:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Build display string for connection
  const getConnectionDisplay = () => {
    if (connection.host && connection.port) {
      const db = connection.database ? `/${connection.database}` : '';
      return `${connection.host}:${connection.port}${db}`;
    }
    if (connection.connectionString) {
      // Mask password in connection string for display
      return connection.connectionString.replace(/:([^:@]+)@/, ':***@');
    }
    return 'Connection details hidden';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        {/* Left side - Icon and Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Database type icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: dbType?.color ? `${dbType.color}20` : '#E5E7EB' }}
          >
            <Database
              size={20}
              style={{ color: dbType?.color || '#6B7280' }}
            />
          </div>

          {/* Connection info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 truncate">{connection.name}</h4>
              {hasMcp && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-(--color-primary-100) text-(--color-primary-700) rounded">
                  MCP
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{getConnectionDisplay()}</p>
            <div className="flex items-center gap-1 mt-1">
              <StatusIcon
                size={14}
                className={`${status.color} ${status.spin ? 'animate-spin' : ''}`}
              />
              <span className={`text-xs ${status.color}`}>{status.label}</span>
            </div>
          </div>
        </div>

        {/* Right side - Database type badge */}
        <div className="flex-shrink-0 ml-2">
          <span
            className="px-2 py-1 text-xs font-medium rounded"
            style={{
              backgroundColor: dbType?.color ? `${dbType.color}15` : '#F3F4F6',
              color: dbType?.color || '#6B7280'
            }}
          >
            {dbType?.name || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={handleSchemaClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
          title="Browse schema"
        >
          <FolderTree size={14} />
          <span>Schema</span>
        </button>

        <button
          onClick={handleQueryClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-(--color-primary-700) bg-(--color-primary-50) hover:bg-(--color-primary-100) rounded transition-colors"
          title="Open query console"
        >
          <Terminal size={14} />
          <span>Query</span>
        </button>

        <button
          onClick={() => onEdit(connection)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
          title="Edit connection"
        >
          <Pencil size={14} />
          <span>Edit</span>
        </button>

        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
          title="Test connection"
        >
          <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
          <span>Test</span>
        </button>

        <div className="flex-1" />

        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Delete?</span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
              title="Confirm delete"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Cancel"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete connection"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionCard;
