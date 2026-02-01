import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, Terminal } from 'lucide-react';
import { ConnectionList, McpServerStatus } from '../database';

const DataSourcesTab = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Database Connections Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ConnectionList />
      </div>

      {/* MCP Servers Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <McpServerStatus />
      </div>

      {/* Database Tools Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-3">Database Tools</h4>
        <p className="text-sm text-gray-500 mb-4">
          Quick access to database exploration and query tools
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/schema-browser')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-left"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <FolderTree size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Schema Browser</div>
              <div className="text-sm text-gray-500">Explore database tables and columns</div>
            </div>
          </button>
          <button
            onClick={() => navigate('/query-console')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-(--color-primary-50) hover:border-(--color-primary-300) transition-colors text-left"
          >
            <div className="p-2 bg-(--color-primary-100) rounded-lg">
              <Terminal size={20} className="text-(--color-primary-600)" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Query Console</div>
              <div className="text-sm text-gray-500">Execute SQL queries and view results</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesTab;
