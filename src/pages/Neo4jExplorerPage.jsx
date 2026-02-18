import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Database, ArrowLeft } from 'lucide-react';
import Neo4jExplorer from '../components/database/Neo4jExplorer.jsx';
import { loadQueryHistory } from '../store/slices/databaseConnectionsSlice.js';

const Neo4jExplorerPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { connectionId: paramConnectionId } = useParams();
  const [searchParams] = useSearchParams();
  const queryConnectionId = searchParams.get('connectionId');
  const connectionId = paramConnectionId || queryConnectionId || null;

  // Load query history on mount
  useEffect(() => {
    dispatch(loadQueryHistory());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Neo4j Explorer</h1>
                  <p className="text-xs text-gray-500">Browse graph schema and execute Cypher queries</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Neo4jExplorer
            initialConnectionId={connectionId}
            embedded={false}
          />
        </div>

        {/* Help section */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Quick Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-blue-100 rounded">
                <span className="text-blue-600 font-mono text-xs">Ctrl+Enter</span>
              </div>
              <div>
                <p className="font-medium text-gray-700">Execute Query</p>
                <p className="text-gray-500">Run the current Cypher query</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-green-100 rounded">
                <span className="text-green-600 font-mono text-xs">Click Label</span>
              </div>
              <div>
                <p className="font-medium text-gray-700">Quick Match</p>
                <p className="text-gray-500">Click a node label to generate MATCH query</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-purple-100 rounded">
                <span className="text-purple-600 font-mono text-xs">AI Assist</span>
              </div>
              <div>
                <p className="font-medium text-gray-700">AI Query Assistant</p>
                <p className="text-gray-500">Get help writing Cypher queries</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Neo4jExplorerPage;
