import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Radio,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Maximize2,
  Minimize2,
  Search,
  Users,
  MessageSquare,
  Settings,
  Layers,
  Play,
  Server,
  Eye,
  X
} from 'lucide-react';
import {
  fetchDatabaseConnections,
  selectConnections,
  selectConnectionsLoading
} from '../../store/slices/databaseConnectionsSlice.js';
import { getDatabaseTypeById } from '../../config/databaseTypes.js';
import { aetherApi } from '../../services/aetherApi';

const KafkaExplorer = ({ initialConnectionId = null }) => {
  const dispatch = useDispatch();
  const connections = useSelector(selectConnections);
  const connectionsLoading = useSelector(selectConnectionsLoading);

  // Connection state
  const [selectedConnectionId, setSelectedConnectionId] = useState(initialConnectionId);
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Data state
  const [topics, setTopics] = useState([]);
  const [clusterOverview, setClusterOverview] = useState(null);
  const [consumerGroups, setConsumerGroups] = useState([]);

  // Selection state
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicDetail, setTopicDetail] = useState(null);
  const [topicConfig, setTopicConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedConsumerGroup, setSelectedConsumerGroup] = useState(null);
  const [consumerGroupDetail, setConsumerGroupDetail] = useState(null);

  // UI state
  const [topicFilter, setTopicFilter] = useState('');
  const [messageCount, setMessageCount] = useState(25);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('partitions'); // partitions | config | messages
  const [sidebarSection, setSidebarSection] = useState('topics'); // topics | consumerGroups

  // Loading/error state
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const dropdownRef = useRef(null);

  // Filter to kafka connections
  const kafkaConnections = connections.filter(c => {
    const type = (c.databaseType || c.type || '').toLowerCase();
    return type === 'kafka';
  });

  const selectedConnection = connections.find(c => c.id === selectedConnectionId);

  // Fetch connections on mount
  useEffect(() => {
    if (connections.length === 0) {
      dispatch(fetchDatabaseConnections());
    }
  }, [dispatch, connections.length]);

  // Auto-select first kafka connection
  useEffect(() => {
    if (!selectedConnectionId && kafkaConnections.length > 0) {
      setSelectedConnectionId(kafkaConnections[0].id);
    }
  }, [kafkaConnections, selectedConnectionId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowConnectionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load data when connection changes
  useEffect(() => {
    if (selectedConnectionId) {
      loadInitialData();
    }
  }, [selectedConnectionId]);

  // Extract data from MCP response format: {content: [{type: "text", text: "<JSON>"}]}
  const parseMcpResponse = (raw) => {
    const data = raw?.data || raw;
    if (data?.content && Array.isArray(data.content)) {
      const textEntry = data.content.find(c => c.type === 'text');
      if (textEntry?.text) {
        try {
          return JSON.parse(textEntry.text);
        } catch {
          return textEntry.text;
        }
      }
    }
    return data?.result || data;
  };

  // MCP tool invocation helper
  const invokeTool = useCallback(async (toolName, params = {}, loadingKey) => {
    if (!selectedConnectionId) return null;
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    setErrors(prev => ({ ...prev, [loadingKey]: null }));
    try {
      const raw = await aetherApi.mcp.invokeTool('mcp-kafka', toolName, params, selectedConnectionId);
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
      return parseMcpResponse(raw);
    } catch (err) {
      const rawMsg = err?.message || err?.response?.data?.error || 'Tool invocation failed';
      const isTimeout = rawMsg.includes('deadline exceeded') || rawMsg.includes('timeout') || rawMsg.includes('502');
      const errorMsg = isTimeout && toolName === 'consume_messages'
        ? 'Timed out waiting for messages. The topic may be empty or have no recent data.'
        : isTimeout
        ? 'Request timed out. The Kafka cluster may be slow to respond.'
        : rawMsg;
      setErrors(prev => ({ ...prev, [loadingKey]: errorMsg }));
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
      return null;
    }
  }, [selectedConnectionId]);

  // Load initial data (topics, overview, consumer groups)
  const loadInitialData = useCallback(async () => {
    setSelectedTopic(null);
    setTopicDetail(null);
    setTopicConfig(null);
    setMessages([]);
    setSelectedConsumerGroup(null);
    setConsumerGroupDetail(null);

    const [topicsResult, overviewResult, groupsResult] = await Promise.all([
      invokeTool('list_topics', {}, 'topics'),
      invokeTool('cluster_overview', {}, 'overview'),
      invokeTool('list_consumer_groups', {}, 'consumerGroups')
    ]);

    if (topicsResult) {
      const topicList = Array.isArray(topicsResult) ? topicsResult :
        topicsResult?.topics || [];
      setTopics(topicList);
    }
    if (overviewResult) {
      setClusterOverview(overviewResult);
    }
    if (groupsResult) {
      const groupList = Array.isArray(groupsResult) ? groupsResult :
        groupsResult?.groups || [];
      setConsumerGroups(groupList);
    }
  }, [invokeTool]);

  // Load topic detail
  const handleSelectTopic = useCallback(async (topicName) => {
    setSelectedTopic(topicName);
    setSelectedConsumerGroup(null);
    setConsumerGroupDetail(null);
    setActiveTab('partitions');
    setMessages([]);
    setExpandedMessage(null);

    const [detailResult, configResult] = await Promise.all([
      invokeTool('describe_topic', { topic_name: topicName }, 'topicDetail'),
      invokeTool('describe_configs', { resource_type: 'topic', resource_name: topicName }, 'topicConfig')
    ]);

    if (detailResult) {
      setTopicDetail(detailResult);
    }
    if (configResult) {
      setTopicConfig(configResult);
    }
  }, [invokeTool]);

  // Cancel consume
  const handleCancelConsume = useCallback(() => {
    setLoading(prev => ({ ...prev, messages: false }));
    setErrors(prev => ({ ...prev, messages: 'Consume cancelled. The topic may be empty.' }));
  }, []);

  // Consume messages
  const handleConsumeMessages = useCallback(async () => {
    if (!selectedTopic) return;
    setExpandedMessage(null);
    setErrors(prev => ({ ...prev, messages: null }));
    const result = await invokeTool('consume_messages', {
      topics: [selectedTopic],
      max_messages: messageCount
    }, 'messages');
    if (result) {
      const msgList = Array.isArray(result) ? result :
        result?.messages || [];
      setMessages(msgList);
    }
  }, [selectedTopic, messageCount, invokeTool]);

  // Load consumer group detail
  const handleSelectConsumerGroup = useCallback(async (groupId) => {
    setSelectedConsumerGroup(groupId);
    setSelectedTopic(null);
    setTopicDetail(null);
    setTopicConfig(null);
    setMessages([]);

    const result = await invokeTool('describe_consumer_group', {
      group_id: groupId,
      include_offsets: true
    }, 'consumerGroupDetail');

    if (result) {
      setConsumerGroupDetail(result);
    }
  }, [invokeTool]);

  // Handle connection selection
  const handleSelectConnection = (connectionId) => {
    setSelectedConnectionId(connectionId);
    setShowConnectionDropdown(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    if (selectedConnectionId) {
      loadInitialData();
    }
  };

  // Format JSON value for display
  const formatValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  };

  // Try to detect if a value is JSON
  const isJsonString = (value) => {
    if (typeof value !== 'string') return typeof value === 'object';
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  // Lag color helper
  const getLagColor = (lag) => {
    const n = Number(lag);
    if (isNaN(n) || n < 100) return 'text-green-600 bg-green-50';
    if (n < 1000) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Filter topics
  const filteredTopics = topics.filter(t => {
    const name = typeof t === 'string' ? t : (t.name || t.topic || '');
    return name.toLowerCase().includes(topicFilter.toLowerCase());
  });

  const getTopicName = (t) => typeof t === 'string' ? t : (t.name || t.topic || '');
  const getTopicPartitions = (t) => typeof t === 'object' ? (t.partitions || t.partition_count || t.num_partitions || '?') : '?';

  const getDbTypeInfo = (connection) => {
    const dbType = getDatabaseTypeById(connection?.databaseType || connection?.type);
    return dbType || { name: 'Unknown', color: '#6B7280' };
  };

  // ===== RENDER FUNCTIONS =====

  const renderConnectionSelector = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowConnectionDropdown(!showConnectionDropdown)}
        disabled={connectionsLoading}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        {connectionsLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <Radio className="w-4 h-4 text-orange-500" />
        )}
        <span className="flex-1 text-left truncate text-sm">
          {selectedConnection?.name || 'Select Kafka connection...'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {showConnectionDropdown && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {kafkaConnections.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No Kafka connections available
            </div>
          ) : (
            kafkaConnections.map(conn => {
              const dbType = getDbTypeInfo(conn);
              return (
                <button
                  key={conn.id}
                  onClick={() => handleSelectConnection(conn.id)}
                  className={`w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 ${
                    conn.id === selectedConnectionId ? 'bg-orange-50' : ''
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: dbType.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{conn.name}</div>
                    <div className="text-xs text-gray-500">{dbType.name}</div>
                  </div>
                  {conn.status === 'Connected' && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );

  const renderOverviewBar = () => {
    if (!clusterOverview && !loading.overview) return null;

    const brokers = clusterOverview?.brokers?.length || clusterOverview?.broker_count || 0;
    const topicCount = topics.length;
    const totalPartitions = clusterOverview?.total_partitions || clusterOverview?.partition_count || '—';

    return (
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center space-x-6 text-sm">
        {loading.overview ? (
          <div className="flex items-center space-x-2 text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Loading cluster info...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-1.5 text-gray-600">
              <Server className="w-3.5 h-3.5" />
              <span className="font-medium">{brokers}</span>
              <span className="text-gray-400">brokers</span>
            </div>
            <div className="flex items-center space-x-1.5 text-gray-600">
              <Radio className="w-3.5 h-3.5" />
              <span className="font-medium">{topicCount}</span>
              <span className="text-gray-400">topics</span>
            </div>
            <div className="flex items-center space-x-1.5 text-gray-600">
              <Layers className="w-3.5 h-3.5" />
              <span className="font-medium">{totalPartitions}</span>
              <span className="text-gray-400">partitions</span>
            </div>
            <div className="flex items-center space-x-1.5 text-gray-600">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium">{consumerGroups.length}</span>
              <span className="text-gray-400">consumer groups</span>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderSidebar = () => (
    <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
      {/* Topics section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <button
          onClick={() => setSidebarSection(sidebarSection === 'topics' ? '' : 'topics')}
          className="p-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <h3 className="font-medium text-sm text-gray-700 flex items-center space-x-2">
            {sidebarSection === 'topics' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <Radio className="w-4 h-4 text-orange-500" />
            <span>Topics</span>
            <span className="text-xs text-gray-400">({topics.length})</span>
          </h3>
        </button>

        {sidebarSection === 'topics' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  placeholder="Filter topics..."
                  className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
                />
              </div>
            </div>

            {/* Topic list */}
            <div className="flex-1 overflow-y-auto p-1">
              {loading.topics ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : errors.topics ? (
                <div className="p-2 text-xs text-red-600">{errors.topics}</div>
              ) : filteredTopics.length === 0 ? (
                <div className="px-2 py-4 text-sm text-gray-400 text-center">
                  {topicFilter ? 'No matching topics' : 'No topics found'}
                </div>
              ) : (
                filteredTopics.map(t => {
                  const name = getTopicName(t);
                  const partitions = getTopicPartitions(t);
                  return (
                    <button
                      key={name}
                      onClick={() => handleSelectTopic(name)}
                      className={`w-full px-2 py-1.5 text-left text-sm rounded flex items-center space-x-2 group transition-colors ${
                        selectedTopic === name
                          ? 'bg-orange-100 text-orange-800'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Radio className="w-3 h-3 text-orange-400 flex-shrink-0" />
                      <span className="flex-1 truncate">{name}</span>
                      {partitions !== '?' && (
                        <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                          {partitions}p
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Consumer Groups section */}
      <div className="border-t border-gray-200">
        <button
          onClick={() => setSidebarSection(sidebarSection === 'consumerGroups' ? '' : 'consumerGroups')}
          className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <h3 className="font-medium text-sm text-gray-700 flex items-center space-x-2">
            {sidebarSection === 'consumerGroups' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <Users className="w-4 h-4 text-blue-500" />
            <span>Consumer Groups</span>
            <span className="text-xs text-gray-400">({consumerGroups.length})</span>
          </h3>
        </button>

        {sidebarSection === 'consumerGroups' && (
          <div className="max-h-64 overflow-y-auto p-1">
            {loading.consumerGroups ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : errors.consumerGroups ? (
              <div className="p-2 text-xs text-red-600">{errors.consumerGroups}</div>
            ) : consumerGroups.length === 0 ? (
              <div className="px-2 py-4 text-sm text-gray-400 text-center">No consumer groups</div>
            ) : (
              consumerGroups.map(g => {
                const groupId = typeof g === 'string' ? g : (g.group_id || g.id || g.name || '');
                const state = typeof g === 'object' ? (g.state || '') : '';
                return (
                  <button
                    key={groupId}
                    onClick={() => handleSelectConsumerGroup(groupId)}
                    className={`w-full px-2 py-1.5 text-left text-sm rounded flex items-center space-x-2 transition-colors ${
                      selectedConsumerGroup === groupId
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Users className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <span className="flex-1 truncate">{groupId}</span>
                    {state && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        state.toLowerCase() === 'stable' ? 'bg-green-100 text-green-700' :
                        state.toLowerCase() === 'empty' ? 'bg-gray-200 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {state}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderTopicDetail = () => {
    if (!selectedTopic) return null;

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topic header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-gray-900">{selectedTopic}</h2>
          </div>
          <button
            onClick={() => { setSelectedTopic(null); setTopicDetail(null); setTopicConfig(null); setMessages([]); }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'partitions', label: 'Partitions', icon: Layers },
            { key: 'config', label: 'Configuration', icon: Settings },
            { key: 'messages', label: 'Messages', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'partitions' && renderPartitionsTab()}
          {activeTab === 'config' && renderConfigTab()}
          {activeTab === 'messages' && renderMessagesTab()}
        </div>
      </div>
    );
  };

  const renderPartitionsTab = () => {
    if (loading.topicDetail) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      );
    }
    if (errors.topicDetail) {
      return <div className="p-4 bg-red-50 text-red-700 rounded text-sm">{errors.topicDetail}</div>;
    }
    if (!topicDetail) return null;

    const partitions = topicDetail.partitions || [];

    return (
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="pb-2 font-medium text-gray-500">Partition</th>
              <th className="pb-2 font-medium text-gray-500">Leader</th>
              <th className="pb-2 font-medium text-gray-500">Replicas</th>
              <th className="pb-2 font-medium text-gray-500">ISR</th>
            </tr>
          </thead>
          <tbody>
            {partitions.length > 0 ? partitions.map((p, idx) => (
              <tr key={p.partition_id ?? p.id ?? idx} className="border-b border-gray-100">
                <td className="py-2 font-mono">{p.partition_id ?? p.id ?? p.partition ?? idx}</td>
                <td className="py-2">{p.leader ?? '—'}</td>
                <td className="py-2">{Array.isArray(p.replicas) ? p.replicas.join(', ') : (p.replicas ?? '—')}</td>
                <td className="py-2">{Array.isArray(p.isr) ? p.isr.join(', ') : (p.isr ?? '—')}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400">No partition details available</td>
              </tr>
            )}
          </tbody>
        </table>
        {partitions.length === 0 && topicDetail && (
          <div className="mt-4">
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(topicDetail, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const renderConfigTab = () => {
    if (loading.topicConfig) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      );
    }
    if (errors.topicConfig) {
      return <div className="p-4 bg-red-50 text-red-700 rounded text-sm">{errors.topicConfig}</div>;
    }
    if (!topicConfig) return null;

    const entries = Array.isArray(topicConfig) ? topicConfig :
      topicConfig.configs ? (Array.isArray(topicConfig.configs) ? topicConfig.configs : Object.entries(topicConfig.configs).map(([k, v]) => ({ name: k, value: v }))) :
      Object.entries(topicConfig).map(([k, v]) => ({ name: k, value: typeof v === 'object' ? JSON.stringify(v) : String(v) }));

    return (
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="pb-2 font-medium text-gray-500">Key</th>
              <th className="pb-2 font-medium text-gray-500">Value</th>
              <th className="pb-2 font-medium text-gray-500">Source</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const key = entry.name || entry.key || '';
              const val = entry.value ?? '';
              const source = entry.source || entry.config_source || '';
              return (
                <tr key={key || idx} className="border-b border-gray-100">
                  <td className="py-2 font-mono text-xs">{key}</td>
                  <td className="py-2 font-mono text-xs text-gray-700 max-w-xs truncate">{String(val)}</td>
                  <td className="py-2 text-xs text-gray-400">{source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMessagesTab = () => (
    <div>
      {/* Controls */}
      <div className="flex items-center space-x-3 mb-4">
        <label className="text-sm text-gray-600">Messages:</label>
        <select
          value={messageCount}
          onChange={(e) => setMessageCount(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
        >
          {[10, 25, 50, 100].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {loading.messages ? (
          <button
            onClick={handleCancelConsume}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        ) : (
          <button
            onClick={handleConsumeMessages}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Consume</span>
          </button>
        )}
        {loading.messages && (
          <span className="text-xs text-gray-400 ml-2">Waiting for messages... this may take a while if the topic is empty</span>
        )}
      </div>

      {errors.messages && (
        <div className={`mb-4 p-3 rounded text-sm flex items-start space-x-2 ${
          errors.messages.includes('empty') || errors.messages.includes('cancelled')
            ? 'bg-yellow-50 text-yellow-700'
            : 'bg-red-50 text-red-700'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errors.messages}</span>
        </div>
      )}

      {/* Messages table */}
      {messages.length > 0 ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-medium text-gray-500 w-8"></th>
                <th className="px-3 py-2 font-medium text-gray-500">Offset</th>
                <th className="px-3 py-2 font-medium text-gray-500">Partition</th>
                <th className="px-3 py-2 font-medium text-gray-500">Key</th>
                <th className="px-3 py-2 font-medium text-gray-500">Value</th>
                <th className="px-3 py-2 font-medium text-gray-500">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg, idx) => {
                const offset = msg.offset ?? idx;
                const partition = msg.partition ?? '—';
                const key = msg.key ?? '';
                const value = msg.value ?? '';
                const timestamp = msg.timestamp || msg.ts || '';
                const isExpanded = expandedMessage === idx;

                return (
                  <React.Fragment key={idx}>
                    <tr className={`border-t border-gray-100 ${isExpanded ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setExpandedMessage(isExpanded ? null : idx)}
                          className="p-0.5 hover:bg-gray-200 rounded"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{offset}</td>
                      <td className="px-3 py-2">
                        <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">{partition}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-600 max-w-[120px] truncate">{key || '(null)'}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-700 max-w-[300px] truncate">
                        {typeof value === 'string' ? value.substring(0, 80) : JSON.stringify(value).substring(0, 80)}
                        {(typeof value === 'string' ? value.length : JSON.stringify(value).length) > 80 && '...'}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {timestamp ? new Date(typeof timestamp === 'number' ? timestamp : timestamp).toLocaleString() : '—'}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="px-3 py-3 bg-gray-50 border-t border-gray-100">
                          <div className="space-y-2">
                            {key && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">Key:</span>
                                <pre className="mt-1 text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-32">
                                  {formatValue(key)}
                                </pre>
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-medium text-gray-500">Value:</span>
                              <pre className="mt-1 text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-64">
                                {formatValue(value)}
                              </pre>
                            </div>
                            {msg.headers && Object.keys(msg.headers).length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">Headers:</span>
                                <pre className="mt-1 text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-32">
                                  {JSON.stringify(msg.headers, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : !loading.messages ? (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Click "Consume" to fetch recent messages</p>
        </div>
      ) : null}
    </div>
  );

  const renderConsumerGroupDetail = () => {
    if (!selectedConsumerGroup) return null;

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-900">{selectedConsumerGroup}</h2>
            {consumerGroupDetail?.state && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                consumerGroupDetail.state.toLowerCase() === 'stable' ? 'bg-green-100 text-green-700' :
                consumerGroupDetail.state.toLowerCase() === 'empty' ? 'bg-gray-200 text-gray-600' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {consumerGroupDetail.state}
              </span>
            )}
          </div>
          <button
            onClick={() => { setSelectedConsumerGroup(null); setConsumerGroupDetail(null); }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Detail content */}
        <div className="flex-1 overflow-auto p-4">
          {loading.consumerGroupDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : errors.consumerGroupDetail ? (
            <div className="p-4 bg-red-50 text-red-700 rounded text-sm">{errors.consumerGroupDetail}</div>
          ) : consumerGroupDetail ? (
            <div className="space-y-6">
              {/* Members table */}
              {consumerGroupDetail.members && consumerGroupDetail.members.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Members</h3>
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-3 py-2 font-medium text-gray-500">Member ID</th>
                        <th className="px-3 py-2 font-medium text-gray-500">Client ID</th>
                        <th className="px-3 py-2 font-medium text-gray-500">Host</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumerGroupDetail.members.map((member, idx) => (
                        <tr key={member.member_id || idx} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-mono text-xs max-w-[200px] truncate">{member.member_id || '—'}</td>
                          <td className="px-3 py-2 text-xs">{member.client_id || '—'}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{member.host || member.client_host || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Offsets / Lag table */}
              {consumerGroupDetail.offsets && consumerGroupDetail.offsets.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Partition Offsets & Lag</h3>
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-3 py-2 font-medium text-gray-500">Topic</th>
                        <th className="px-3 py-2 font-medium text-gray-500">Partition</th>
                        <th className="px-3 py-2 font-medium text-gray-500">Current Offset</th>
                        <th className="px-3 py-2 font-medium text-gray-500">Log End Offset</th>
                        <th className="px-3 py-2 font-medium text-gray-500">Lag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumerGroupDetail.offsets.map((off, idx) => (
                        <tr key={`${off.topic}-${off.partition}-${idx}`} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-xs font-mono">{off.topic || '—'}</td>
                          <td className="px-3 py-2 text-xs">{off.partition ?? '—'}</td>
                          <td className="px-3 py-2 text-xs font-mono">{off.current_offset ?? off.offset ?? '—'}</td>
                          <td className="px-3 py-2 text-xs font-mono">{off.log_end_offset ?? off.end_offset ?? '—'}</td>
                          <td className="px-3 py-2">
                            {off.lag != null ? (
                              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${getLagColor(off.lag)}`}>
                                {off.lag}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Raw fallback */}
              {!consumerGroupDetail.members && !consumerGroupDetail.offsets && (
                <div>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">
                    {JSON.stringify(consumerGroupDetail, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Select a topic or consumer group to view details</p>
      </div>
    </div>
  );

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-white'
    : 'h-[calc(100vh-200px)] min-h-[500px]';

  return (
    <div className={`flex flex-col ${containerClass} border border-gray-200 rounded-lg overflow-hidden bg-white`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          {renderConnectionSelector()}

          <button
            onClick={handleRefresh}
            disabled={!selectedConnectionId || loading.topics}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading.topics ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Overview bar */}
      {renderOverviewBar()}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {renderSidebar()}

        {selectedTopic ? renderTopicDetail() :
         selectedConsumerGroup ? renderConsumerGroupDetail() :
         renderEmptyState()}
      </div>
    </div>
  );
};

export default KafkaExplorer;
