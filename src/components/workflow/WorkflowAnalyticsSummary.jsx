import React from 'react';
import {
  Activity,
  CheckCircle,
  Clock,
  TrendingUp,
  Workflow,
  Zap,
} from 'lucide-react';
import { useWorkflowAnalytics } from '../../hooks/useWorkflowAnalytics.js';

const formatDuration = (ms) => {
  if (!ms || ms === 0) return '0s';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

const StatCard = ({ icon: Icon, label, value, subValue, color, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {loading ? (
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mt-0.5" />
        ) : (
          <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        )}
        {subValue && !loading && (
          <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>
        )}
      </div>
    </div>
  </div>
);

const WorkflowAnalyticsSummary = ({ period = 'monthly', compact = false }) => {
  const { summary, loading } = useWorkflowAnalytics({ period });

  const stats = [
    {
      icon: Activity,
      label: 'Total Executions',
      value: summary.totalExecutions.toLocaleString(),
      subValue: `${summary.activeWorkflows} active workflow${summary.activeWorkflows !== 1 ? 's' : ''}`,
      color: 'bg-blue-500',
    },
    {
      icon: CheckCircle,
      label: 'Success Rate',
      value: `${summary.successRate.toFixed(1)}%`,
      subValue: `${summary.successfulExecutions} of ${summary.totalExecutions}`,
      color: summary.successRate >= 90 ? 'bg-green-500' : summary.successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500',
    },
    {
      icon: Clock,
      label: 'Avg Duration',
      value: formatDuration(summary.avgDurationMs),
      subValue: `${formatDuration(summary.totalProcessingTimeMs)} total`,
      color: 'bg-purple-500',
    },
    {
      icon: Zap,
      label: 'Top Trigger',
      value: summary.topTriggerTypes[0]?.type || 'None',
      subValue: summary.topTriggerTypes[0] ? `${summary.topTriggerTypes[0].count} events` : null,
      color: 'bg-amber-500',
    },
  ];

  if (compact) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-1">
        {stats.slice(0, 3).map((stat, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm whitespace-nowrap">
            <stat.icon size={14} className="text-gray-400" />
            <span className="text-gray-500">{stat.label}:</span>
            {loading ? (
              <span className="inline-block h-4 w-10 bg-gray-200 rounded animate-pulse" />
            ) : (
              <span className="font-medium text-gray-900">{stat.value}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} loading={loading} />
      ))}
    </div>
  );
};

export default WorkflowAnalyticsSummary;
