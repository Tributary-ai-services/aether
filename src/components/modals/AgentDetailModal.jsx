import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import Comments from '../collaboration/Comments.jsx';
import ShareDialog from '../collaboration/ShareDialog.jsx';
import AgentTestModal from './AgentTestModal.jsx';
import { useAgentBuilder, useAgentStats } from '../../hooks/useAgentBuilder.js';
import { 
  Bot, 
  Play, 
  Settings,
  Download,
  Edit,
  Trash2,
  Zap,
  Clock,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Activity,
  Share2,
  DollarSign,
  RotateCcw,
  ArrowRight,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Crown,
  RefreshCw
} from 'lucide-react';

const AgentDetailModal = ({ isOpen, onClose, agent, onTestAgent, onEditAgent, onDeleteAgent }) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateAgent } = useAgentBuilder();
  const { stats, executions, loading: statsLoading, refreshStats } = useAgentStats(agent?.id);
  
  useEffect(() => {
    if (isOpen && agent?.id) {
      refreshStats();
    }
  }, [isOpen, agent?.id, refreshStats]);

  if (!agent) return null;

  const formatCurrency = (amount) => `$${(amount || 0).toFixed(4)}`;
  const formatDuration = (ms) => {
    if (!ms) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatLastExecuted = (lastExecutedAt) => {
    if (!lastExecutedAt) return 'Never';
    const date = new Date(lastExecutedAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'disabled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const performanceMetrics = [
    { 
      label: 'Total Executions', 
      value: (agent.total_executions || 0).toLocaleString(), 
      trend: stats?.execution_trend || '0%', 
      color: 'text-blue-600' 
    },
    { 
      label: 'Success Rate', 
      value: `${((stats?.success_rate || 0) * 100).toFixed(1)}%`, 
      trend: stats?.success_trend || '0%', 
      color: 'text-green-600' 
    },
    { 
      label: 'Avg Response Time', 
      value: formatDuration(agent.avg_response_time_ms), 
      trend: stats?.response_time_trend || '0ms', 
      color: 'text-purple-600' 
    },
    { 
      label: 'Total Cost', 
      value: formatCurrency(agent.total_cost_usd), 
      trend: stats?.cost_trend || '$0.00', 
      color: 'text-orange-600' 
    }
  ];

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const newStatus = agent.status === 'published' ? 'draft' : 'published';
      await updateAgent(agent.id, { status: newStatus });
      // Optionally trigger a refresh or update parent component
    } catch (error) {
      console.error('Failed to update agent status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={agent.name}
      size="large"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Bot className="text-purple-600" size={32} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">{agent.name}</h2>
              {agent.is_public && (
                <Eye className="text-blue-500" size={16} title="Public Agent" />
              )}
              {agent.is_template && (
                <Crown className="text-yellow-500" size={16} title="Template Agent" />
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(agent.status)}`}>
                {agent.status}
              </span>
              <span className="text-sm text-gray-500">• Last run {formatLastExecuted(agent.last_executed_at)}</span>
              {loading && <RefreshCw className="animate-spin text-gray-400" size={14} />}
            </div>
            {agent.description && (
              <p className="text-gray-600 text-sm">{agent.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setTestModalOpen(true)}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Test Agent"
            >
              <Play size={16} />
            </button>
            <button 
              onClick={handleToggleStatus}
              disabled={loading}
              className={`p-2 rounded-lg transition-colors ${
                agent.status === 'published' 
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title={agent.status === 'published' ? 'Unpublish Agent' : 'Publish Agent'}
            >
              {agent.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button 
              onClick={() => onEditAgent && onEditAgent(agent)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit Agent"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">{metric.label}</div>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <div className={`text-sm font-medium ${metric.color}`}>
                {metric.trend} vs last week
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* LLM Configuration */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">LLM Configuration</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Provider:</span>
                    <span className="ml-2 text-gray-900">{agent.llm_config?.provider || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Model:</span>
                    <span className="ml-2 text-gray-900">{agent.llm_config?.model || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Temperature:</span>
                    <span className="ml-2 text-gray-900">{agent.llm_config?.temperature || 'Default'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Max Tokens:</span>
                    <span className="ml-2 text-gray-900">{agent.llm_config?.max_tokens || 'Default'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reliability Configuration */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Reliability Features</h3>
              <div className="space-y-4">
                {/* Retry Configuration */}
                {agent.llm_config?.retry_config && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <RotateCcw className="text-blue-600" size={18} />
                      <h4 className="font-medium text-gray-900">Retry Configuration</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Max Attempts:</span>
                        <span className="ml-2 font-medium">{agent.llm_config.retry_config.max_attempts}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Backoff:</span>
                        <span className="ml-2 font-medium">{agent.llm_config.retry_config.backoff_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Base Delay:</span>
                        <span className="ml-2 font-medium">{agent.llm_config.retry_config.base_delay}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Max Delay:</span>
                        <span className="ml-2 font-medium">{agent.llm_config.retry_config.max_delay}</span>
                      </div>
                    </div>
                    {agent.llm_config.retry_config.retryable_errors?.length > 0 && (
                      <div className="mt-3">
                        <span className="text-gray-600 text-sm">Retryable Errors:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {agent.llm_config.retry_config.retryable_errors.slice(0, 3).map(error => (
                            <span key={error} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              {error}
                            </span>
                          ))}
                          {agent.llm_config.retry_config.retryable_errors.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{agent.llm_config.retry_config.retryable_errors.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback Configuration */}
                {agent.llm_config?.fallback_config?.enabled && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="text-green-600" size={18} />
                      <h4 className="font-medium text-gray-900">Fallback Configuration</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {agent.llm_config.fallback_config.preferred_chain?.length > 0 && (
                        <div>
                          <span className="text-gray-600">Provider Chain:</span>
                          <div className="flex items-center gap-1 mt-1">
                            {agent.llm_config.fallback_config.preferred_chain.map((provider, index) => (
                              <React.Fragment key={provider}>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {provider}
                                </span>
                                {index < agent.llm_config.fallback_config.preferred_chain.length - 1 && (
                                  <ArrowRight size={10} className="text-gray-400" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Max Cost Increase:</span>
                        <span className="ml-2 font-medium">
                          {agent.llm_config.fallback_config.max_cost_increase === -1 
                            ? 'No limit' 
                            : `${(agent.llm_config.fallback_config.max_cost_increase * 100).toFixed(0)}%`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Feature Requirements:</span>
                        <span className="ml-2 font-medium">
                          {agent.llm_config.fallback_config.require_same_features ? 'Strict' : 'Flexible'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Executions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Recent Executions</h3>
                <button 
                  onClick={refreshStats}
                  disabled={statsLoading}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : executions?.length > 0 ? (
                <div className="space-y-3">
                  {executions.slice(0, 5).map(execution => (
                    <div key={execution.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {execution.status === 'completed' ? (
                            <CheckCircle size={16} className="text-green-600" />
                          ) : execution.status === 'failed' ? (
                            <AlertTriangle size={16} className="text-red-600" />
                          ) : (
                            <Activity size={16} className="text-blue-600" />
                          )}
                          <span className="font-medium text-gray-900">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                            execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {execution.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatLastExecuted(execution.created_at)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-2 truncate">
                        <strong>Input:</strong> {execution.input_message || 'No input recorded'}
                      </div>
                      
                      {execution.output_message && (
                        <div className="text-sm text-gray-700 mb-2 truncate">
                          <strong>Output:</strong> {execution.output_message}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatDuration(execution.response_time_ms)}</span>
                        <span>{formatCurrency(execution.cost_usd)}</span>
                        {execution.retry_attempts > 0 && (
                          <span className="text-orange-600">{execution.retry_attempts} retries</span>
                        )}
                        {execution.fallback_used && (
                          <span className="text-blue-600">fallback used</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Activity size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No executions yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setTestModalOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play size={16} />
                  Test Agent
                </button>
                <button 
                  onClick={() => onEditAgent && onEditAgent(agent)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit size={16} />
                  Edit Configuration
                </button>
                <button 
                  onClick={handleToggleStatus}
                  disabled={loading}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                    agent.status === 'published'
                      ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                      : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  {agent.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                  {agent.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download size={16} />
                  Export Configuration
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChart3 size={16} />
                  View Analytics
                </button>
                <button 
                  onClick={() => setShareDialogOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Share2 size={16} />
                  Share Agent
                </button>
              </div>
            </div>

            {/* Agent Metadata */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Agent Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">{formatLastExecuted(agent.created_at) || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="text-gray-900">{formatLastExecuted(agent.updated_at) || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Space ID:</span>
                  <span className="text-gray-900 font-mono text-xs">{agent.space_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Agent ID:</span>
                  <span className="text-gray-900 font-mono text-xs">{agent.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visibility:</span>
                  <span className="text-gray-900">
                    {agent.is_public ? 'Public' : 'Private'}
                    {agent.is_template && ' • Template'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {agent.tags && agent.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {agent.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Summary</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Reliability Score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (stats?.success_rate || 0) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {((stats?.success_rate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Cost Efficiency</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency((agent.total_cost_usd || 0) / Math.max(1, agent.total_executions || 1))}
                    </span>
                    <span className="text-sm text-gray-500">per execution</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Comments resourceId={`agent-${agent.id || '1'}`} resourceType="agent" />
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Zap size={14} />
                {(agent.total_executions || 0).toLocaleString()} total executions
              </div>
              <div className="flex items-center gap-1">
                <DollarSign size={14} />
                {formatCurrency(agent.total_cost_usd)} total cost
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                Created {formatLastExecuted(agent.created_at)}
              </div>
            </div>
            <div className="flex gap-2">
              {onDeleteAgent && (
                <button 
                  onClick={() => onDeleteAgent(agent)}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} className="inline mr-1" />
                  Delete Agent
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        resourceId={agent.id}
        resourceType="agent"
        resourceName={agent.name}
      />

      {/* Test Modal */}
      <AgentTestModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        agent={agent}
      />
    </Modal>
  );
};

export default AgentDetailModal;