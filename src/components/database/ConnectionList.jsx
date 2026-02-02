import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Database,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  fetchDatabaseConnections,
  selectConnections,
  selectConnectionsLoading,
  selectConnectionsError,
  clearConnectionsError
} from '../../store/slices/databaseConnectionsSlice.js';
import { selectCurrentSpace } from '../../store/slices/spacesSlice.js';
import ConnectionCard from './ConnectionCard.jsx';
import ConnectionFormModal from './ConnectionFormModal.jsx';

const ConnectionList = ({ onCloseSettings }) => {
  const dispatch = useDispatch();

  // Redux state
  const connections = useSelector(selectConnections);
  const loading = useSelector(selectConnectionsLoading);
  const error = useSelector(selectConnectionsError);
  const currentSpace = useSelector(selectCurrentSpace);

  // Local state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // Check if we have a valid space context
  const hasSpaceContext = currentSpace && currentSpace.space_id;

  // Fetch connections on mount (only if we have space context)
  useEffect(() => {
    if (hasSpaceContext && !hasAttemptedFetch) {
      setHasAttemptedFetch(true);
      dispatch(fetchDatabaseConnections());
    }
  }, [dispatch, hasSpaceContext, hasAttemptedFetch]);

  // Handle refresh
  const handleRefresh = () => {
    if (!hasSpaceContext) return;
    dispatch(clearConnectionsError());
    dispatch(fetchDatabaseConnections());
  };

  // Determine if error is a space context issue
  const isSpaceContextError = error && (
    error.includes('space') ||
    error.includes('validation') ||
    error.includes('400') ||
    error.includes('SPACE_CONTEXT_REQUIRED')
  );

  // Handle add new connection
  const handleAddNew = () => {
    setEditingConnection(null);
    setShowFormModal(true);
  };

  // Handle edit connection
  const handleEdit = (connection) => {
    setEditingConnection(connection);
    setShowFormModal(true);
  };

  // Handle close form modal
  const handleCloseModal = () => {
    setShowFormModal(false);
    setEditingConnection(null);
  };

  // Handle successful save
  const handleSaveSuccess = () => {
    setShowFormModal(false);
    setEditingConnection(null);
    // Refresh the list
    dispatch(fetchDatabaseConnections());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Database Connections</h4>
          <p className="text-sm text-gray-500">
            Manage your database connections for querying and schema exploration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading || !hasSpaceContext}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh connections"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleAddNew}
            disabled={!hasSpaceContext}
            className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* No space context warning */}
      {!hasSpaceContext && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800">Space Selection Required</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Please select a space from the sidebar to manage database connections.
              Database connections are stored per-space for data isolation.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isSpaceContextError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-red-800">Failed to load connections</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => dispatch(clearConnectionsError())}
            className="text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Space context error - show as info, not error */}
      {error && isSpaceContextError && hasSpaceContext && (
        <div className="p-4 bg-(--color-primary-50) border border-(--color-primary-200) rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-(--color-primary-600) flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-(--color-primary-800)">No connections in this space</h4>
            <p className="text-sm text-(--color-primary-700) mt-1">
              Add your first database connection to get started.
            </p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && connections.length === 0 && hasSpaceContext && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-(--color-primary-600)" />
        </div>
      )}

      {/* Empty state - only show when we have space context and no error */}
      {!loading && connections.length === 0 && !error && hasSpaceContext && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No Database Connections</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add a database connection to start exploring schemas and running queries.
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors"
          >
            <Plus size={16} />
            Add Your First Connection
          </button>
        </div>
      )}

      {/* Connection list */}
      {connections.length > 0 && (
        <div className="space-y-3">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onEdit={handleEdit}
              onCloseSettings={onCloseSettings}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <ConnectionFormModal
          connection={editingConnection}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
};

export default ConnectionList;
