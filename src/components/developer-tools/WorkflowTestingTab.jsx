import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Zap,
  Activity,
} from 'lucide-react';
import { useWorkflows } from '../../hooks/useWorkflows.js';
import ArtifactBrowser from '../workflow/ArtifactBrowser.jsx';

const statusColors = {
  success: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
  failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
  running: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Loader2 },
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
  queued: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: Clock },
};

const getStatusStyle = (status) => statusColors[status] || statusColors.pending;

const WorkflowTestingTab = () => {
  const {
    workflows,
    loading,
    executions,
    executionsLoading,
    executionState,
    refetch,
    execute,
    getExecutions,
    clearExecutionState,
  } = useWorkflows({ autoFetch: true });

  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [inputJson, setInputJson] = useState('{\n  \n}');
  const [jsonError, setJsonError] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState(null);
  const [executeError, setExecuteError] = useState(null);
  const [expandedExecutions, setExpandedExecutions] = useState({});
  const [expandedSteps, setExpandedSteps] = useState({});

  // Load executions when a workflow is selected
  useEffect(() => {
    if (selectedWorkflow) {
      getExecutions(selectedWorkflow.id);
    }
  }, [selectedWorkflow, getExecutions]);

  const validateJson = (text) => {
    try {
      JSON.parse(text);
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError(e.message);
      return false;
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputJson(val);
    if (val.trim()) {
      validateJson(val);
    } else {
      setJsonError(null);
    }
  };

  const handleExecute = async () => {
    if (!selectedWorkflow) return;

    let parsedInput = {};
    if (inputJson.trim()) {
      if (!validateJson(inputJson)) return;
      parsedInput = JSON.parse(inputJson);
    }

    setIsExecuting(true);
    setExecuteResult(null);
    setExecuteError(null);

    try {
      const result = await execute(selectedWorkflow.id, { input: parsedInput });
      setExecuteResult(result);
      // Refresh executions list
      getExecutions(selectedWorkflow.id);
    } catch (err) {
      setExecuteError(err.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSelectWorkflow = (wf) => {
    setSelectedWorkflow(wf);
    setExecuteResult(null);
    setExecuteError(null);
    clearExecutionState();
    // Pre-populate input template from workflow configuration
    if (wf.configuration?.input_schema) {
      setInputJson(JSON.stringify(wf.configuration.input_schema, null, 2));
    } else {
      setInputJson('{\n  \n}');
    }
  };

  const toggleExecution = (id) => {
    setExpandedExecutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStep = (execId, stepIdx) => {
    const key = `${execId}-${stepIdx}`;
    setExpandedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left: Workflow List */}
      <div className="w-72 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">Workflows</h3>
            <button
              onClick={() => refetch()}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-500">Select a workflow to test</p>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={20} className="animate-spin text-gray-400" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Workflow size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No workflows found</p>
              <p className="text-xs mt-1">Create a workflow first</p>
            </div>
          ) : (
            <div className="space-y-1">
              {workflows.map((wf) => {
                const isSelected = selectedWorkflow?.id === wf.id;
                const style = getStatusStyle(wf.status);
                return (
                  <button
                    key={wf.id}
                    onClick={() => handleSelectWorkflow(wf)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-(--color-primary-50) border border-(--color-primary-200)'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Workflow size={14} className={isSelected ? 'text-(--color-primary-600)' : 'text-gray-500'} />
                      <span className="text-sm font-medium text-gray-900 truncate">{wf.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                        {wf.status || 'draft'}
                      </span>
                      {wf.type && (
                        <span className="text-xs text-gray-400">{wf.type}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Test Configuration */}
      <div className="w-96 bg-white rounded-lg border border-gray-200 flex flex-col">
        {selectedWorkflow ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{selectedWorkflow.name}</h3>
              {selectedWorkflow.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{selectedWorkflow.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                {selectedWorkflow.steps?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Activity size={12} />
                    {selectedWorkflow.steps.length} step{selectedWorkflow.steps.length !== 1 ? 's' : ''}
                  </span>
                )}
                {selectedWorkflow.triggers?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Zap size={12} />
                    {selectedWorkflow.triggers.map((t) => t.type || t.trigger_type).join(', ')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {/* Input JSON */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Input (JSON)
                </label>
                <textarea
                  value={inputJson}
                  onChange={handleInputChange}
                  rows={8}
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent resize-none ${
                    jsonError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder='{ "key": "value" }'
                  spellCheck={false}
                />
                {jsonError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {jsonError}
                  </p>
                )}
              </div>

              {/* Workflow Steps Preview */}
              {selectedWorkflow.steps?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Steps</h4>
                  <div className="space-y-1">
                    {selectedWorkflow.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs text-gray-600"
                      >
                        <span className="w-5 h-5 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                          {idx + 1}
                        </span>
                        <span className="font-medium">{step.name || step.type}</span>
                        {step.type && step.name && (
                          <span className="text-gray-400">({step.type})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Execute Button */}
            <div className="p-4 border-t border-gray-200">
              {executeError && (
                <div className="flex items-start gap-2 p-2 mb-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{executeError}</p>
                </div>
              )}
              {executeResult && (
                <div className="flex items-start gap-2 p-2 mb-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-green-700">
                    <p className="font-medium">Execution started</p>
                    {executeResult.id && (
                      <p className="text-green-600 mt-0.5">ID: {executeResult.id}</p>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={handleExecute}
                disabled={isExecuting || !!jsonError}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-(--color-primary-600) text-white rounded-lg text-sm font-medium hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Execute Workflow
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Workflow size={48} className="mb-4 text-gray-300" />
            <p className="text-sm font-medium">Select a Workflow</p>
            <p className="text-xs text-center max-w-xs mt-1">
              Choose a workflow from the list to configure test input and execute it
            </p>
          </div>
        )}
      </div>

      {/* Right: Execution Results */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col min-w-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Execution History</h3>
            {selectedWorkflow && (
              <button
                onClick={() => getExecutions(selectedWorkflow.id)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!selectedWorkflow ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Activity size={48} className="mb-4 text-gray-300" />
              <p className="text-sm font-medium">No Workflow Selected</p>
              <p className="text-xs text-center mt-1">Select a workflow to view execution history</p>
            </div>
          ) : executionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={20} className="animate-spin text-gray-400" />
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FileText size={48} className="mb-4 text-gray-300" />
              <p className="text-sm font-medium">No Executions Yet</p>
              <p className="text-xs text-center mt-1">Execute the workflow to see results here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map((exec) => {
                const style = getStatusStyle(exec.status);
                const StatusIcon = style.icon;
                const isExpanded = expandedExecutions[exec.id];

                return (
                  <div key={exec.id} className={`border ${style.border} rounded-lg overflow-hidden`}>
                    <button
                      onClick={() => toggleExecution(exec.id)}
                      className={`w-full flex items-center gap-3 p-3 text-left ${style.bg} hover:opacity-90 transition-opacity`}
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-gray-500 shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-gray-500 shrink-0" />
                      )}
                      <StatusIcon
                        size={16}
                        className={`${style.text} shrink-0 ${exec.status === 'running' ? 'animate-spin' : ''}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            Execution
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                            {exec.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          {exec.started_at && (
                            <span>{new Date(exec.started_at).toLocaleString()}</span>
                          )}
                          {exec.duration_ms > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {formatDuration(exec.duration_ms)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-mono shrink-0">
                        {exec.id?.substring(0, 8)}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 p-3 space-y-3">
                        {/* Step Results */}
                        {exec.step_results?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-700 mb-2">Step Results</h4>
                            <div className="space-y-1">
                              {exec.step_results.map((step, idx) => {
                                const stepStyle = getStatusStyle(step.status);
                                const StepIcon = stepStyle.icon;
                                const stepKey = `${exec.id}-${idx}`;
                                const stepExpanded = expandedSteps[stepKey];

                                return (
                                  <div key={idx} className="border border-gray-100 rounded">
                                    <button
                                      onClick={() => toggleStep(exec.id, idx)}
                                      className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50"
                                    >
                                      {stepExpanded ? (
                                        <ChevronDown size={12} className="text-gray-400" />
                                      ) : (
                                        <ChevronRight size={12} className="text-gray-400" />
                                      )}
                                      <StepIcon
                                        size={12}
                                        className={`${stepStyle.text} ${step.status === 'running' ? 'animate-spin' : ''}`}
                                      />
                                      <span className="text-xs font-medium text-gray-700 flex-1">
                                        {step.step_name || `Step ${idx + 1}`}
                                      </span>
                                      <span className={`text-xs ${stepStyle.text}`}>{step.status}</span>
                                      {step.duration_ms > 0 && (
                                        <span className="text-xs text-gray-400">
                                          {formatDuration(step.duration_ms)}
                                        </span>
                                      )}
                                    </button>

                                    {stepExpanded && (
                                      <div className="border-t border-gray-100 p-2 bg-gray-50">
                                        {step.output && (
                                          <div className="bg-gray-900 rounded p-2 overflow-auto max-h-40">
                                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                                              {typeof step.output === 'string'
                                                ? step.output
                                                : JSON.stringify(step.output, null, 2)}
                                            </pre>
                                          </div>
                                        )}
                                        {step.error && (
                                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                            {step.error}
                                          </div>
                                        )}
                                        {!step.output && !step.error && (
                                          <p className="text-xs text-gray-400">No output available</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Artifacts */}
                        {exec.artifacts?.length > 0 && (
                          <ArtifactBrowser
                            artifacts={exec.artifacts}
                            title="Execution Artifacts"
                          />
                        )}

                        {/* Raw Output */}
                        {exec.output && !exec.step_results?.length && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-700 mb-2">Output</h4>
                            <div className="bg-gray-900 rounded-lg p-3 overflow-auto max-h-60">
                              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                                {typeof exec.output === 'string'
                                  ? exec.output
                                  : JSON.stringify(exec.output, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Error */}
                        {exec.error && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs font-medium text-red-700 mb-1">Error</p>
                            <p className="text-xs text-red-600">{exec.error}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowTestingTab;
