import React from 'react';
import {
  Server,
  Check,
  AlertCircle,
  Database,
  GitBranch,
  Layers,
  Zap
} from 'lucide-react';
import { getDatabaseTypesWithMcp } from '../../config/databaseTypes.js';

// Icon mapping for database types
const DB_ICONS = {
  'mcp__postgres': Database,
  'mcp__neo4j': GitBranch,
  'mcp__deeplake': Layers,
  'mcp__redis': Zap,
};

const McpServerStatus = () => {
  // Get database types with MCP support from static configuration
  // Note: MCP server status API not yet implemented in backend
  const mcpDatabaseTypes = getDatabaseTypesWithMcp();

  // Build display list from configured database types
  const servers = mcpDatabaseTypes.map(dbType => ({
    id: dbType.mcpServer.name,
    name: dbType.name,
    server: dbType.mcpServer.name,
    status: 'configured', // Static status - API not available yet
    description: dbType.description,
    color: dbType.color
  }));

  // Get icon for server
  const getServerIcon = (server) => {
    const IconComponent = DB_ICONS[server.server] || DB_ICONS[server.id] || Server;
    return IconComponent;
  };

  // Get status indicator
  const getStatusIndicator = (server) => {
    switch (server.status) {
      case 'active':
      case 'connected':
        return { icon: Check, color: 'text-green-500', label: 'Active', spin: false };
      case 'configured':
        return { icon: Check, color: 'text-(--color-primary-500)', label: 'Configured', spin: false };
      case 'inactive':
      case 'disconnected':
        return { icon: AlertCircle, color: 'text-gray-400', label: 'Inactive', spin: false };
      default:
        return { icon: AlertCircle, color: 'text-gray-400', label: 'Unknown', spin: false };
    }
  };

  // Get server color
  const getServerColor = (server) => {
    return server.color || '#6B7280';
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">MCP Database Servers</h4>
          <p className="text-sm text-gray-500">
            Model Context Protocol servers available for database operations
          </p>
        </div>
      </div>

      {/* Server list */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg divide-y divide-gray-200">
        {servers.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No MCP database servers configured
          </div>
        ) : (
          servers.map((server, index) => {
            const ServerIcon = getServerIcon(server);
            const status = getStatusIndicator(server);
            const StatusIcon = status.icon;
            const color = getServerColor(server);

            return (
              <div
                key={server.id || server.server || index}
                className="flex items-center justify-between p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <ServerIcon size={16} style={{ color }} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {server.name || server.server}
                    </div>
                    <div className="text-xs text-gray-500">
                      {server.description || server.server || server.id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon
                    size={16}
                    className={`${status.color} ${status.spin ? 'animate-spin' : ''}`}
                  />
                  <span className={`text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Info box */}
      <div className="p-3 bg-(--color-primary-50) border border-(--color-primary-200) rounded-lg text-sm text-(--color-primary-700)">
        <div className="flex items-start gap-2">
          <Server size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">About MCP Servers</p>
            <p className="text-(--color-primary-600) mt-1">
              MCP (Model Context Protocol) servers provide enhanced database integration,
              allowing AI models to directly query and interact with your databases.
              Connections with MCP support are marked with a "MCP" badge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default McpServerStatus;
