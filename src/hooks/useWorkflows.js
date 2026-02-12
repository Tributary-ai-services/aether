import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import {
  fetchWorkflows,
  fetchWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  updateWorkflowStatus,
  fetchWorkflowExecutions,
  fetchWorkflowAnalytics,
  clearError,
  clearSelectedWorkflow,
  clearExecutions,
  clearExecutionState,
  setSelectedWorkflow,
  selectAllWorkflows,
  selectWorkflowsLoading,
  selectWorkflowsError,
  selectWorkflowsPagination,
  selectSelectedWorkflow,
  selectSelectedWorkflowLoading,
  selectWorkflowExecutions,
  selectWorkflowExecutionsLoading,
  selectWorkflowExecutionsPagination,
  selectExecutionState,
  selectWorkflowAnalytics,
  selectWorkflowAnalyticsLoading,
  selectActiveWorkflows,
} from '../store/slices/workflowsSlice.js';

/**
 * Hook for workflow operations using Redux store
 */
export const useWorkflows = ({ autoFetch = true } = {}) => {
  const dispatch = useAppDispatch();

  const workflows = useAppSelector(selectAllWorkflows);
  const loading = useAppSelector(selectWorkflowsLoading);
  const error = useAppSelector(selectWorkflowsError);
  const pagination = useAppSelector(selectWorkflowsPagination);
  const selectedWorkflow = useAppSelector(selectSelectedWorkflow);
  const selectedLoading = useAppSelector(selectSelectedWorkflowLoading);
  const executions = useAppSelector(selectWorkflowExecutions);
  const executionsLoading = useAppSelector(selectWorkflowExecutionsLoading);
  const executionsPagination = useAppSelector(selectWorkflowExecutionsPagination);
  const executionState = useAppSelector(selectExecutionState);
  const analytics = useAppSelector(selectWorkflowAnalytics);
  const analyticsLoading = useAppSelector(selectWorkflowAnalyticsLoading);
  const activeWorkflows = useAppSelector(selectActiveWorkflows);

  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchWorkflows());
    }
  }, [dispatch, autoFetch]);

  const refetch = useCallback(
    (options) => dispatch(fetchWorkflows(options)),
    [dispatch]
  );

  const getById = useCallback(
    (id) => dispatch(fetchWorkflowById(id)),
    [dispatch]
  );

  const create = useCallback(
    (data) => dispatch(createWorkflow(data)).unwrap(),
    [dispatch]
  );

  const update = useCallback(
    (workflowId, data) => dispatch(updateWorkflow({ workflowId, data })).unwrap(),
    [dispatch]
  );

  const remove = useCallback(
    (workflowId) => dispatch(deleteWorkflow(workflowId)).unwrap(),
    [dispatch]
  );

  const execute = useCallback(
    (workflowId, data) => dispatch(executeWorkflow({ workflowId, data })).unwrap(),
    [dispatch]
  );

  const toggleStatus = useCallback(
    (workflowId, currentStatus) => {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      return dispatch(updateWorkflowStatus({ workflowId, status: newStatus })).unwrap();
    },
    [dispatch]
  );

  const getExecutions = useCallback(
    (workflowId, options) => dispatch(fetchWorkflowExecutions({ workflowId, ...options })),
    [dispatch]
  );

  const getAnalytics = useCallback(
    (period) => dispatch(fetchWorkflowAnalytics(period)),
    [dispatch]
  );

  return {
    // Data
    workflows,
    loading,
    error,
    pagination,
    selectedWorkflow,
    selectedLoading,
    executions,
    executionsLoading,
    executionsPagination,
    executionState,
    analytics,
    analyticsLoading,
    activeWorkflows,

    // Actions
    refetch,
    getById,
    create,
    update,
    remove,
    execute,
    toggleStatus,
    getExecutions,
    getAnalytics,
    setSelected: (workflow) => dispatch(setSelectedWorkflow(workflow)),
    clearSelected: () => dispatch(clearSelectedWorkflow()),
    clearError: () => dispatch(clearError()),
    clearExecutions: () => dispatch(clearExecutions()),
    clearExecutionState: () => dispatch(clearExecutionState()),
  };
};
