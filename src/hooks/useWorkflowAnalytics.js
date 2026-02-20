import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import {
  fetchWorkflowAnalytics,
  selectWorkflowAnalytics,
  selectWorkflowAnalyticsLoading,
} from '../store/slices/workflowsSlice.js';

/**
 * Hook for workflow analytics data
 * Fetches analytics on mount and provides computed stats
 */
export const useWorkflowAnalytics = ({ period = 'monthly', autoFetch = true } = {}) => {
  const dispatch = useAppDispatch();
  const analytics = useAppSelector(selectWorkflowAnalytics);
  const loading = useAppSelector(selectWorkflowAnalyticsLoading);

  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchWorkflowAnalytics(period));
    }
  }, [dispatch, period, autoFetch]);

  const refresh = useCallback(
    (newPeriod) => dispatch(fetchWorkflowAnalytics(newPeriod || period)),
    [dispatch, period]
  );

  // Compute summary stats from the analytics data
  const summary = useMemo(() => {
    if (!analytics) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
        avgDurationMs: 0,
        totalProcessingTimeMs: 0,
        totalWorkflows: 0,
        activeWorkflows: 0,
        topTriggerTypes: [],
        topPerformers: [],
      };
    }

    const totalExec = analytics.total_executions || 0;
    const successExec = analytics.successful_executions || 0;
    const failedExec = analytics.failed_executions || 0;
    const successRate = totalExec > 0 ? (successExec / totalExec) * 100 : 0;

    // Sort trigger types by count
    const triggerTypes = analytics.popular_trigger_types || {};
    const topTriggerTypes = Object.entries(triggerTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Sort workflows by performance (success rate)
    const performance = analytics.workflow_performance || {};
    const topPerformers = Object.entries(performance)
      .map(([id, rate]) => ({ id, successRate: rate }))
      .sort((a, b) => b.successRate - a.successRate);

    return {
      totalExecutions: totalExec,
      successfulExecutions: successExec,
      failedExecutions: failedExec,
      successRate,
      avgDurationMs: analytics.average_runtime || 0,
      totalProcessingTimeMs: analytics.total_processing_time || 0,
      totalWorkflows: analytics.total_workflows || 0,
      activeWorkflows: analytics.active_workflows || 0,
      topTriggerTypes,
      topPerformers,
    };
  }, [analytics]);

  return {
    analytics,
    loading,
    summary,
    refresh,
  };
};
