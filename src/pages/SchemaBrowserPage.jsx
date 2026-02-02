import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Database, ArrowLeft, Terminal, Copy, Check, Info } from 'lucide-react';
import SchemaBrowser from '../components/database/SchemaBrowser.jsx';
import { fetchDatabaseConnections } from '../store/slices/databaseConnectionsSlice.js';

const SchemaBrowserPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { connectionId } = useParams();
  const [lastGeneratedQuery, setLastGeneratedQuery] = useState(null);
  const [queryNotification, setQueryNotification] = useState(false);

  // Load connections on mount
  useEffect(() => {
    dispatch(fetchDatabaseConnections());
  }, [dispatch]);

  // Handle query generation from SchemaBrowser
  const handleQueryGenerated = (query) => {
    setLastGeneratedQuery(query);
    setQueryNotification(true);
    setTimeout(() => setQueryNotification(false), 3000);
  };

  // Open Query Console with the generated query
  const openQueryConsole = () => {
    if (lastGeneratedQuery) {
      // Store query in sessionStorage for the Query Console to pick up
      sessionStorage.setItem('pendingQuery', lastGeneratedQuery);
      if (connectionId) {
        navigate(`/query-console/${connectionId}`);
      } else {
        navigate('/query-console');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Database className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Schema Browser</h1>
                  <p className="text-xs text-gray-500">Explore database structure and generate queries</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Query notification */}
              {queryNotification && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">Query copied!</span>
                </div>
              )}

              {/* Open in Query Console button */}
              {lastGeneratedQuery && (
                <button
                  onClick={openQueryConsole}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-(--color-primary-600) rounded-lg hover:bg-(--color-primary-700) transition-colors"
                >
                  <Terminal className="w-4 h-4" />
                  <span>Open in Query Console</span>
                </button>
              )}

              <button
                onClick={() => navigate('/query-console')}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Terminal className="w-4 h-4" />
                <span>Query Console</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <SchemaBrowser
            initialConnectionId={connectionId || null}
            embedded={false}
            onQueryGenerated={handleQueryGenerated}
          />
        </div>

        {/* Help section */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="w-4 h-4 text-blue-600" />
            <h3 className="font-medium text-gray-900">Quick Guide</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-purple-100 rounded">
                <Database className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Browse Tables</p>
                <p className="text-gray-500">Click a table in the sidebar to view its structure</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-blue-100 rounded">
                <Copy className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Generate Queries</p>
                <p className="text-gray-500">Use SELECT/INSERT buttons to generate SQL templates</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-green-100 rounded">
                <Terminal className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Execute Queries</p>
                <p className="text-gray-500">Open generated queries in the Query Console to run them</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SchemaBrowserPage;
