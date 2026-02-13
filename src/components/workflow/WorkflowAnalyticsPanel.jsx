import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useWorkflowAnalytics } from '../../hooks/useWorkflowAnalytics.js';

const formatDuration = (ms) => {
  if (!ms || ms === 0) return '0s';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

const ProgressBar = ({ value, max, color = 'bg-blue-500' }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const WorkflowAnalyticsPanel = ({ workflows = [] }) => {
  const [period, setPeriod] = useState('monthly');
  const [expanded, setExpanded] = useState(true);
  const { summary, loading, refresh } = useWorkflowAnalytics({ period });

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    refresh(newPeriod);
  };

  // Compute per-workflow stats from the analytics data
  const workflowStats = workflows
    .filter((w) => w.execution_count > 0 || summary.topPerformers.some((p) => p.id === w.id))
    .map((w) => {
      const perf = summary.topPerformers.find((p) => p.id === w.id);
      return {
        id: w.id,
        name: w.name,
        type: w.type,
        status: w.status,
        executionCount: w.execution_count || 0,
        successRate: perf?.successRate ?? w.success_rate ?? 0,
        lastExecuted: w.last_executed,
      };
    })
    .sort((a, b) => b.executionCount - a.executionCount);

  const maxExecutions = Math.max(...workflowStats.map((w) => w.executionCount), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-(--color-primary-600)" />
          <h3 className="text-sm font-semibold text-gray-900">Workflow Analytics</h3>
        </div>
        <div className="flex items-center gap-2">
          {!expanded && !loading && (
            <span className="text-xs text-gray-500">
              {summary.totalExecutions} executions, {summary.successRate.toFixed(0)}% success
            </span>
          )}
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200">
          {/* Period selector */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
            <div className="flex gap-1">
              {['daily', 'weekly', 'monthly'].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    period === p
                      ? 'bg-white text-(--color-primary-700) shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={() => refresh(period)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
            {[
              { icon: Activity, label: 'Executions', value: summary.totalExecutions, color: 'text-blue-600' },
              { icon: CheckCircle, label: 'Success', value: `${summary.successRate.toFixed(1)}%`, color: summary.successRate >= 90 ? 'text-green-600' : 'text-yellow-600' },
              { icon: Clock, label: 'Avg Time', value: formatDuration(summary.avgDurationMs), color: 'text-purple-600' },
              { icon: Activity, label: 'Active', value: summary.activeWorkflows, color: 'text-blue-600' },
            ].map((stat, idx) => (
              <div key={idx} className="px-4 py-3 text-center">
                {loading ? (
                  <div className="h-5 w-12 mx-auto bg-gray-200 rounded animate-pulse mb-1" />
                ) : (
                  <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                )}
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Trigger types distribution */}
          {summary.topTriggerTypes.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Trigger Distribution</h4>
              <div className="flex gap-2 flex-wrap">
                {summary.topTriggerTypes.map(({ type, count }) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full"
                  >
                    <Zap size={10} />
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Per-workflow breakdown */}
          {workflowStats.length > 0 ? (
            <div className="px-4 py-3">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Per-Workflow Performance</h4>
              <div className="space-y-3">
                {workflowStats.slice(0, 8).map((wf) => (
                  <div key={wf.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 truncate max-w-[60%]">{wf.name}</span>
                      <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                        <span>{wf.executionCount} runs</span>
                        <span className={wf.successRate >= 90 ? 'text-green-600' : wf.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                          {wf.successRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={wf.executionCount}
                      max={maxExecutions}
                      color={wf.successRate >= 90 ? 'bg-green-500' : wf.successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}
                    />
                  </div>
                ))}
              </div>
              {workflowStats.length > 8 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  +{workflowStats.length - 8} more workflows
                </p>
              )}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              No execution data available yet
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowAnalyticsPanel;
