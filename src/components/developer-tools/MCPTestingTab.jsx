import React, { useState, useEffect } from 'react';
import {
  Server,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Wrench,
  FileText,
  Code,
  Copy,
  Clock,
  Zap,
  Settings,
  Link,
  Unlink,
  Image,
  HelpCircle
} from 'lucide-react';
import { aetherApi } from '../../services/aetherApi';

const MCPTestingTab = () => {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [tools, setTools] = useState([]);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [isInvoking, setIsInvoking] = useState(false);
  const [toolParams, setToolParams] = useState({});
  const [invokeResult, setInvokeResult] = useState(null);
  const [invokeHistory, setInvokeHistory] = useState([]);
  const [expandedServers, setExpandedServers] = useState({});

  // Load MCP servers on mount
  useEffect(() => {
    loadServers();
  }, []);

  // Load tools when server is selected
  useEffect(() => {
    if (selectedServer) {
      loadTools(selectedServer.id);
    }
  }, [selectedServer]);

  const loadServers = async () => {
    setIsLoadingServers(true);
    try {
      const response = await aetherApi.mcp.listServers();
      setServers(response.data?.servers || []);
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
      // Mock servers for demo
      setServers([
        {
          id: 'mcp-postgres',
          name: 'PostgreSQL MCP',
          description: 'PostgreSQL database tools',
          status: 'connected',
          type: 'database',
          version: '1.0.0'
        },
        {
          id: 'mcp-filesystem',
          name: 'Filesystem MCP',
          description: 'File system operations',
          status: 'connected',
          type: 'filesystem',
          version: '1.0.0'
        },
        {
          id: 'mcp-memory',
          name: 'Memory MCP',
          description: 'Knowledge graph storage',
          status: 'connected',
          type: 'memory',
          version: '1.0.0'
        },
        {
          id: 'mcp-napkin',
          name: 'Napkin AI MCP',
          description: 'Visual generation from text using Napkin AI with MinIO storage',
          status: 'connected',
          type: 'visual-generation',
          version: '1.0.0'
        }
      ]);
    } finally {
      setIsLoadingServers(false);
    }
  };

  const loadTools = async (serverId) => {
    setIsLoadingTools(true);
    setTools([]);
    setSelectedTool(null);
    try {
      const response = await aetherApi.mcp.listTools(serverId);
      setTools(response.data?.tools || []);
    } catch (error) {
      console.error('Failed to load tools:', error);
      // Mock tools for demo
      if (serverId === 'mcp-postgres') {
        setTools([
          {
            name: 'query',
            description: 'Execute a SQL query on the database',
            inputSchema: {
              type: 'object',
              properties: {
                sql: { type: 'string', description: 'SQL query to execute' }
              },
              required: ['sql']
            }
          },
          {
            name: 'list_tables',
            description: 'List all tables in the database',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]);
      } else if (serverId === 'mcp-filesystem') {
        setTools([
          {
            name: 'read_file',
            description: 'Read contents of a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Path to the file' }
              },
              required: ['path']
            }
          },
          {
            name: 'list_directory',
            description: 'List contents of a directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Directory path' }
              },
              required: ['path']
            }
          }
        ]);
      } else if (serverId === 'mcp-memory') {
        setTools([
          {
            name: 'create_entities',
            description: 'Create entities in the knowledge graph',
            inputSchema: {
              type: 'object',
              properties: {
                entities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      entityType: { type: 'string' },
                      observations: { type: 'array', items: { type: 'string' } }
                    }
                  }
                }
              },
              required: ['entities']
            }
          },
          {
            name: 'search_nodes',
            description: 'Search for nodes in the knowledge graph',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' }
              },
              required: ['query']
            }
          }
        ]);
      } else if (serverId === 'mcp-napkin') {
        setTools([
          {
            name: 'generate_visual',
            description: 'Generate a visual from text using Napkin AI. Submits text content, waits for processing, downloads the result, and stores it in MinIO.',
            inputSchema: {
              type: 'object',
              properties: {
                content: { type: 'string', description: 'Text content to visualize (1-10000 characters)' },
                format: { type: 'string', enum: ['svg', 'png'], description: 'Output format (default: svg)' },
                style_id: { type: 'string', description: 'Napkin AI style identifier' },
                language: { type: 'string', description: 'Language code BCP 47 (default: en-US)' },
                number_of_visuals: { type: 'number', description: 'Number of visuals to generate 1-4 (default: 1)' },
                context_before: { type: 'string', description: 'Context text before the main content (max 5000 chars)' },
                context_after: { type: 'string', description: 'Context text after the main content (max 5000 chars)' },
                transparent_background: { type: 'boolean', description: 'Use transparent background (default: false)' },
                inverted_color: { type: 'boolean', description: 'Use inverted/dark color mode (default: false)' }
              },
              required: ['content']
            }
          },
          {
            name: 'check_visual_status',
            description: 'Check the status of a pending Napkin AI visual generation request',
            inputSchema: {
              type: 'object',
              properties: {
                request_id: { type: 'string', description: 'Napkin AI request ID returned by generate_visual' }
              },
              required: ['request_id']
            }
          },
          {
            name: 'list_styles',
            description: 'List available Napkin AI visual styles',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'list_visuals',
            description: 'List generated visuals stored in MinIO',
            inputSchema: {
              type: 'object',
              properties: {
                prefix: { type: 'string', description: 'Object key prefix to filter by' },
                bucket: { type: 'string', description: 'MinIO bucket name (default: napkin-visuals)' },
                limit: { type: 'number', description: 'Maximum results 1-100 (default: 20)' }
              }
            }
          },
          {
            name: 'download_visual',
            description: 'Download a generated visual from MinIO storage',
            inputSchema: {
              type: 'object',
              properties: {
                minio_key: { type: 'string', description: 'MinIO object key for the visual' },
                bucket: { type: 'string', description: 'MinIO bucket name (default: napkin-visuals)' }
              },
              required: ['minio_key']
            }
          },
          {
            name: 'create_napkin_visual_cr',
            description: 'Create a NapkinVisual Kubernetes custom resource for operator-managed generation',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'CR name (lowercase, alphanumeric, hyphens)' },
                content: { type: 'string', description: 'Text content to visualize' },
                format: { type: 'string', enum: ['svg', 'png'], description: 'Output format (default: svg)' },
                namespace: { type: 'string', description: 'K8s namespace (default: tas-mcp-servers)' },
                inverted_color: { type: 'boolean', description: 'Use inverted/dark color mode (default: false)' }
              },
              required: ['name', 'content']
            }
          }
        ]);
      }
    } finally {
      setIsLoadingTools(false);
    }
  };

  const handleSelectTool = (tool) => {
    setSelectedTool(tool);
    setToolParams({});
    setInvokeResult(null);
  };

  const handleInvokeTool = async () => {
    if (!selectedServer || !selectedTool) return;

    setIsInvoking(true);
    const startTime = Date.now();
    try {
      const response = await aetherApi.mcp.invokeTool(selectedServer.id, selectedTool.name, toolParams);
      const duration = Date.now() - startTime;
      const result = {
        success: true,
        data: response.data,
        duration,
        timestamp: new Date().toISOString()
      };
      setInvokeResult(result);
      setInvokeHistory(prev => [
        { server: selectedServer.name, tool: selectedTool.name, params: { ...toolParams }, ...result },
        ...prev.slice(0, 19)
      ]);
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        success: false,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
      setInvokeResult(result);
      setInvokeHistory(prev => [
        { server: selectedServer.name, tool: selectedTool.name, params: { ...toolParams }, ...result },
        ...prev.slice(0, 19)
      ]);
    } finally {
      setIsInvoking(false);
    }
  };

  const renderTooltip = (description) => {
    if (!description) return null;
    return (
      <div className="group relative inline-flex ml-1">
        <HelpCircle size={14} className="text-gray-400 hover:text-gray-600 cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal max-w-xs z-50">
          {description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    );
  };

  const renderParamInput = (name, schema) => {
    const value = toolParams[name] || '';

    // Enum dropdown for string fields with enum values
    if (schema.enum && Array.isArray(schema.enum)) {
      return (
        <select
          value={value || schema.default || ''}
          onChange={(e) => setToolParams(p => ({ ...p, [name]: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
        >
          <option value="">-- Select {name.replace(/_/g, ' ')} --</option>
          {schema.enum.map(opt => (
            <option key={opt} value={opt}>
              {opt}{schema.default === opt ? ' (default)' : ''}
            </option>
          ))}
        </select>
      );
    }

    if (schema.type === 'string') {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => setToolParams(p => ({ ...p, [name]: e.target.value }))}
          placeholder={schema.description || name}
          title={schema.description || name}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
        />
      );
    }

    if (schema.type === 'number' || schema.type === 'integer') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => setToolParams(p => ({ ...p, [name]: parseFloat(e.target.value) || 0 }))}
          placeholder={schema.description || name}
          title={schema.description || name}
          min={schema.minimum}
          max={schema.maximum}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
        />
      );
    }

    if (schema.type === 'boolean') {
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => setToolParams(p => ({ ...p, [name]: e.target.checked }))}
            className="rounded border-gray-300 text-(--color-primary-600)"
          />
          <span className="text-sm text-gray-600">{schema.description || name}</span>
        </label>
      );
    }

    if (schema.type === 'array' || schema.type === 'object') {
      return (
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setToolParams(p => ({ ...p, [name]: parsed }));
            } catch {
              setToolParams(p => ({ ...p, [name]: e.target.value }));
            }
          }}
          placeholder={`JSON ${schema.type}`}
          title={schema.description || `Enter JSON ${schema.type}`}
          rows={4}
          className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => setToolParams(p => ({ ...p, [name]: e.target.value }))}
        placeholder={schema.description || name}
        title={schema.description || name}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
      />
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-red-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <Link size={14} className="text-green-500" />;
      case 'disconnected': return <Unlink size={14} className="text-red-500" />;
      case 'error': return <AlertCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left Panel - Servers & Tools */}
      <div className="w-80 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">MCP Servers</h3>
            <button
              onClick={loadServers}
              disabled={isLoadingServers}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Refresh Servers"
            >
              <RefreshCw size={16} className={isLoadingServers ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {isLoadingServers ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={24} className="animate-spin text-gray-400" />
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No MCP servers found
            </div>
          ) : (
            <div className="space-y-2">
              {servers.map(server => (
                <div key={server.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setSelectedServer(server);
                      setExpandedServers(prev => ({ ...prev, [server.id]: !prev[server.id] }));
                    }}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                      selectedServer?.id === server.id
                        ? 'bg-(--color-primary-50)'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedServer?.id === server.id ? 'bg-(--color-primary-100)' : 'bg-gray-100'
                    }`}>
                      <Server size={16} className={selectedServer?.id === server.id ? 'text-(--color-primary-600)' : 'text-gray-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 truncate">{server.name}</span>
                        {getStatusIcon(server.status)}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{server.description}</div>
                    </div>
                    {expandedServers[server.id] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  </button>

                  {/* Tools List */}
                  {expandedServers[server.id] && selectedServer?.id === server.id && (
                    <div className="border-t border-gray-100 bg-gray-50 p-2">
                      {isLoadingTools ? (
                        <div className="flex items-center justify-center py-4">
                          <RefreshCw size={16} className="animate-spin text-gray-400" />
                        </div>
                      ) : tools.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-xs">No tools available</div>
                      ) : (
                        <div className="space-y-1">
                          {tools.map(tool => (
                            <button
                              key={tool.name}
                              onClick={() => handleSelectTool(tool)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded transition-colors ${
                                selectedTool?.name === tool.name
                                  ? 'bg-(--color-primary-100) text-(--color-primary-700)'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <Wrench size={14} className={selectedTool?.name === tool.name ? 'text-(--color-primary-600)' : 'text-gray-400'} />
                              <span className="text-sm truncate">{tool.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Panel - Tool Configuration */}
      <div className="w-96 bg-white rounded-lg border border-gray-200 flex flex-col">
        {selectedTool ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={18} className="text-(--color-primary-600)" />
                <h3 className="font-semibold text-gray-900">{selectedTool.name}</h3>
              </div>
              <p className="text-sm text-gray-600">{selectedTool.description}</p>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Parameters</h4>
              {selectedTool.inputSchema?.properties &&
               Object.keys(selectedTool.inputSchema.properties).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(selectedTool.inputSchema.properties).map(([name, schema]) => (
                    <div key={name}>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        {name.replace(/_/g, ' ')}
                        {selectedTool.inputSchema.required?.includes(name) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                        {schema.description && !schema.enum && schema.type !== 'boolean' && renderTooltip(schema.description)}
                      </label>
                      {renderParamInput(name, schema)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No parameters required</p>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleInvokeTool}
                disabled={isInvoking}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-(--color-primary-600) text-white rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50"
              >
                {isInvoking ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} />
                )}
                {isInvoking ? 'Invoking...' : 'Invoke Tool'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Wrench size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Select a Tool</p>
            <p className="text-sm text-center max-w-xs">
              Choose an MCP server and select a tool to configure and invoke.
            </p>
          </div>
        )}
      </div>

      {/* Right Panel - Results */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Results</h3>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {invokeResult ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {invokeResult.success ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <X size={18} className="text-red-500" />
                  )}
                  <span className={`font-medium ${invokeResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {invokeResult.success ? 'Success' : 'Error'}
                  </span>
                  <span className="text-sm text-gray-500">({invokeResult.duration}ms)</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(invokeResult.data || invokeResult.error, null, 2))}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Copy Result"
                >
                  <Copy size={14} />
                </button>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(invokeResult.data || { error: invokeResult.error }, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Code size={48} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Results Yet</p>
              <p className="text-sm text-center max-w-md">
                Configure a tool with parameters and click "Invoke Tool" to see the results here.
              </p>
            </div>
          )}

          {/* History */}
          {invokeHistory.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Invocations</h4>
              <div className="space-y-2">
                {invokeHistory.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {item.success ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <X size={14} className="text-red-500" />
                        )}
                        <span className="font-medium text-gray-700">{item.server} / {item.tool}</span>
                      </div>
                      <span className="text-gray-500">{item.duration}ms</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCPTestingTab;
