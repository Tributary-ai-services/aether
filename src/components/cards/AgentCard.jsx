import React, { useState } from 'react';
import { 
  Bot, 
  Play, 
  Settings, 
  Share2, 
  DollarSign, 
  Clock, 
  Zap,
  Shield,
  Eye,
  EyeOff,
  Crown,
  Copy
} from 'lucide-react';
import { useAgentExecution } from '../../hooks/useAgentBuilder.js';
import ShareDialog from '../collaboration/ShareDialog.jsx';

const AgentCard = ({ agent, onOpenDetail, onTestAgent, onDuplicateAgent }) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { startExecution, loading: executionLoading } = useAgentExecution(agent.id);

  const handleTestAgent = async () => {
    if (onTestAgent) {
      onTestAgent(agent);
    } else {
      // Fallback to quick test
      try {
        await startExecution({ message: 'Quick test of agent functionality' });
      } catch (error) {
        console.error('Failed to test agent:', error);
      }
    }
  };

  const handleDuplicateAgent = () => {
    if (onDuplicateAgent) {
      onDuplicateAgent(agent);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-(--color-success-light) text-(--color-success-dark)';
      case 'draft':
        return 'bg-(--color-warning-light) text-(--color-warning-dark)';
      case 'disabled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-(--color-primary-100) text-(--color-primary-800)';
    }
  };

  const getOptimizationBadge = (optimizeFor) => {
    switch (optimizeFor) {
      case 'cost':
        return { icon: DollarSign, color: 'bg-(--color-primary-100) text-(--color-primary-800)', label: 'Cost' };
      case 'performance':
        return { icon: Zap, color: 'bg-purple-100 text-purple-800', label: 'Speed' };
      case 'quality':
        return { icon: Shield, color: 'bg-(--color-success-light) text-(--color-success-dark)', label: 'Quality' };
      default:
        return { icon: Shield, color: 'bg-gray-100 text-gray-800', label: 'Balanced' };
    }
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

  const optimizationBadge = getOptimizationBadge(agent.llm_config?.optimize_for);
  const OptimizationIcon = optimizationBadge.icon;

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onOpenDetail}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bot className="text-purple-600" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{agent.name}</h3>
              {agent.is_public && (
                <Eye className="text-(--color-primary-500)" size={14} title="Public Agent" />
              )}
              {agent.is_template && (
                <Crown className="text-yellow-500" size={14} title="Template Agent" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(agent.status)}`}>
                {agent.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${optimizationBadge.color}`}>
                <OptimizationIcon size={10} className="inline mr-1" />
                {optimizationBadge.label}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTestAgent();
            }}
            disabled={executionLoading}
            className="p-2 text-gray-400 hover:text-green-600 disabled:opacity-50"
            title="Test Agent"
          >
            {executionLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            ) : (
              <Play size={16} />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicateAgent();
            }}
            className="p-2 text-gray-400 hover:text-(--color-primary-600)"
            title="Duplicate Agent"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShareDialogOpen(true);
            }}
            className="p-2 text-gray-400 hover:text-(--color-primary-600)"
            title="Share Agent"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="View Details"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Description */}
      {agent.description && (
        <div className="mb-4 p-3 bg-(--color-primary-50) rounded-lg">
          <div className="text-xs text-(--color-primary-600) mb-1">Description</div>
          <div className="text-sm text-gray-700 line-clamp-2">{agent.description}</div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="mb-4 space-y-2">
        <div className="text-xs text-gray-500 mb-2">Configuration</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Provider:</span>
            <span>{agent.llm_config?.provider || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Model:</span>
            <span className="truncate">{agent.llm_config?.model || 'Unknown'}</span>
          </div>
        </div>
        
        {/* Reliability Features */}
        <div className="flex gap-2 text-xs">
          {agent.llm_config?.retry_config && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
              Retry: {agent.llm_config.retry_config.max_attempts}x
            </span>
          )}
          {agent.llm_config?.fallback_config?.enabled && (
            <span className="px-2 py-1 bg-(--color-primary-100) text-(--color-primary-700) rounded-full">
              Fallback
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      {agent.tags && agent.tags.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Tags</div>
          <div className="flex flex-wrap gap-1">
            {agent.tags.slice(0, 3).map(tag => (
              <span 
                key={tag} 
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {agent.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                +{agent.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {agent.total_executions?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-gray-600">Executions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            ${(agent.total_cost_usd || 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Cost</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="flex items-center gap-1 text-gray-600">
          <Clock size={12} />
          <span>{agent.avg_response_time_ms || 0}ms avg</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <span>Last: {formatLastExecuted(agent.last_executed_at)}</span>
        </div>
      </div>

      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        resourceId={agent.id}
        resourceType="agent"
        resourceName={agent.name}
      />
    </div>
  );
};

export default AgentCard;