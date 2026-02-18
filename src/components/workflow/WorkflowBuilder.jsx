import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import EventSourceNode from './nodes/EventSourceNode.jsx';
import ActionNode from './nodes/ActionNode.jsx';
import ConditionNode from './nodes/ConditionNode.jsx';
import AgentNode from './nodes/AgentNode.jsx';
import ContainerNode from './nodes/ContainerNode.jsx';
import ScriptNode from './nodes/ScriptNode.jsx';
import HttpNode from './nodes/HttpNode.jsx';
import AITaskNode from './nodes/AITaskNode.jsx';
import SuspendNode from './nodes/SuspendNode.jsx';
import TransformNode from './nodes/TransformNode.jsx';
import AssemblerNode from './nodes/AssemblerNode.jsx';
import SyncNode from './nodes/SyncNode.jsx';
import NodeConfigPanel from './NodeConfigPanel.jsx';
import ManualRunDialog from './ManualRunDialog.jsx';
import Modal from '../ui/Modal.jsx';
import { useWorkflows } from '../../hooks/useWorkflows.js';
import { aetherApi } from '../../services/aetherApi.js';
import {
  generateNodeId,
  getDefaultNodeData,
  nodesToBackendFormat,
  backendToNodes,
  initialDataToNodes,
  validateWorkflow,
} from './workflowSerializer.js';

import {
  Play,
  Pause,
  Save,
  Download,
  Upload,
  Zap,
  Settings,
  GitBranch,
  Bot,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  Box,
  Code,
  Globe,
  Brain,
  UserCheck,
  Wand2,
  Layers,
  Send,
} from 'lucide-react';

const nodeTypes = {
  // Legacy types (backward compat)
  eventSource: EventSourceNode,
  action: ActionNode,
  agent: AgentNode,
  // New Argo-aligned types
  container: ContainerNode,
  script: ScriptNode,
  http: HttpNode,
  aiTask: AITaskNode,
  condition: ConditionNode,
  suspend: SuspendNode,
  transform: TransformNode,
  assembler: AssemblerNode,
  sync: SyncNode,
};

const paletteGroups = [
  {
    label: 'Triggers',
    items: [
      { type: 'eventSource', label: 'Event Source', desc: 'Start workflow', icon: Zap, color: 'amber' },
    ],
  },
  {
    label: 'Execution',
    items: [
      { type: 'container', label: 'Container', desc: 'Run any image', icon: Box, color: 'blue' },
      { type: 'script', label: 'Script', desc: 'Inline code', icon: Code, color: 'indigo' },
      { type: 'http', label: 'HTTP Request', desc: 'Call an API', icon: Globe, color: 'cyan' },
    ],
  },
  {
    label: 'AI & Agents',
    items: [
      { type: 'aiTask', label: 'AI Task', desc: 'LLM / Agent', icon: Brain, color: 'purple' },
    ],
  },
  {
    label: 'Data',
    items: [
      { type: 'transform', label: 'Transform', desc: 'Reshape data', icon: Wand2, color: 'emerald' },
    ],
  },
  {
    label: 'Assembly',
    items: [
      { type: 'assembler', label: 'Assembler', desc: 'Combine outputs', icon: Layers, color: 'teal' },
    ],
  },
  {
    label: 'Flow Control',
    items: [
      { type: 'condition', label: 'Condition', desc: 'Branch logic', icon: GitBranch, color: 'yellow' },
      { type: 'suspend', label: 'Approval', desc: 'Wait for approval', icon: UserCheck, color: 'orange' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { type: 'sync', label: 'Sync', desc: 'Deliver results', icon: Send, color: 'violet' },
    ],
  },
];

const WorkflowBuilder = ({ isOpen, onClose, workflow = null, initialData = null }) => {
  const { create, update, execute, toggleStatus } = useWorkflows({ autoFetch: false });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [workflowType, setWorkflowType] = useState('custom');
  const [workflowId, setWorkflowId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState('paused');
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [validationErrors, setValidationErrors] = useState([]);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const fileInputRef = useRef(null);
  const pendingParamsRef = useRef(null);

  // Initialize from workflow (edit) or initialData (create from blank/template)
  useEffect(() => {
    if (!isOpen) return;

    if (workflow) {
      // Editing existing workflow
      setWorkflowName(workflow.name || 'Untitled');
      setWorkflowDesc(workflow.description || '');
      setWorkflowType(workflow.type || 'custom');
      setWorkflowId(workflow.id);
      setWorkflowStatus(workflow.status || 'paused');
      const { nodes: wfNodes, edges: wfEdges } = backendToNodes(workflow);
      setNodes(wfNodes);
      setEdges(wfEdges);
    } else if (initialData) {
      // Creating from blank canvas or template
      setWorkflowName(initialData.name || 'New Workflow');
      setWorkflowDesc(initialData.description || '');
      setWorkflowType(initialData.type || 'custom');
      setWorkflowId(null);
      setWorkflowStatus('paused');
      const { nodes: initNodes, edges: initEdges } = initialDataToNodes(initialData);
      setNodes(initNodes);
      setEdges(initEdges);
    } else {
      // Fallback: empty canvas with a manual trigger
      setWorkflowName('New Workflow');
      setWorkflowDesc('');
      setWorkflowType('custom');
      setWorkflowId(null);
      setWorkflowStatus('paused');
      setNodes([{
        id: generateNodeId(),
        type: 'eventSource',
        position: { x: 50, y: 80 },
        data: getDefaultNodeData('eventSource'),
      }]);
      setEdges([]);
    }

    setSelectedNodeId(null);
    setSaveStatus(null);
    setValidationErrors([]);
  }, [isOpen, workflow, initialData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback((type) => {
    const newNode = {
      id: generateNodeId(),
      type,
      position: {
        x: 100 + Math.random() * 300,
        y: 50 + Math.random() * 300,
      },
      data: getDefaultNodeData(type),
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNode.id);
  }, [setNodes]);

  const handleNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleNodeDataUpdate = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: newData } : n
      )
    );
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const handleSave = async () => {
    // Validate
    const { valid, errors } = validateWorkflow(nodes);
    if (!valid) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    setIsSaving(true);
    setSaveStatus(null);

    const backendData = nodesToBackendFormat(nodes, edges, {
      name: workflowName,
      description: workflowDesc,
      type: workflowType,
    });

    try {
      if (workflowId) {
        // Update existing
        await update(workflowId, backendData);
      } else {
        // Create new
        const created = await create(backendData);
        if (created?.id) {
          setWorkflowId(created.id);
        }
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Failed to save workflow:', err);
      setSaveStatus('error');
      setValidationErrors([err.message || 'Failed to save workflow']);
    } finally {
      setIsSaving(false);
    }
  };

  // Find the trigger node and its config
  const triggerNode = useMemo(
    () => nodes.find((n) => n.type === 'eventSource') || null,
    [nodes]
  );
  const triggerType = triggerNode?.data?.triggerType || 'manual';
  const triggerConfig = triggerNode?.data?.config || {};
  const inputParameters = triggerConfig.input_parameters || [];

  const isUploadTrigger = triggerType === 'upload' || triggerType === 'file_upload';

  // Ensure workflow is saved and return the ID (auto-saves if needed)
  const ensureSaved = async () => {
    if (workflowId) return workflowId;

    const { valid, errors } = validateWorkflow(nodes);
    if (!valid) {
      setValidationErrors(errors);
      return null;
    }
    setIsSaving(true);
    try {
      const backendData = nodesToBackendFormat(nodes, edges, {
        name: workflowName,
        description: workflowDesc,
        type: workflowType,
      });
      const created = await create(backendData);
      if (created?.id) {
        setWorkflowId(created.id);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
        setIsSaving(false);
        return created.id;
      }
      setValidationErrors(['Failed to save workflow — no ID returned.']);
    } catch (err) {
      setValidationErrors([err.message || 'Failed to auto-save workflow before running.']);
    }
    setIsSaving(false);
    return null;
  };

  const handleToggleStatus = async () => {
    if (!workflowId) return;
    try {
      await toggleStatus(workflowId, workflowStatus);
      setWorkflowStatus(workflowStatus === 'active' ? 'paused' : 'active');
    } catch (err) {
      console.error('Failed to toggle workflow status:', err);
      setValidationErrors([err.message || 'Failed to change workflow status']);
    }
  };

  const handleRun = async () => {
    const id = await ensureSaved();
    if (!id) return;
    setValidationErrors([]);

    // If trigger has input parameters, show params dialog first
    if (inputParameters.length > 0) {
      setShowRunDialog(true);
      return;
    }

    // Upload trigger without params: open file picker directly
    if (isUploadTrigger && fileInputRef.current) {
      fileInputRef.current.click();
      return;
    }

    // Default: execute immediately (manual no params, schedule, webhook, api, document_event)
    await executeWorkflow(id, {});
  };

  const executeWorkflow = async (id, data) => {
    setIsRunning(true);
    setValidationErrors([]);
    try {
      await execute(id || workflowId, data);
      setTimeout(() => setIsRunning(false), 2000);
    } catch (err) {
      console.error('Failed to execute workflow:', err);
      setValidationErrors([err.message || 'Execution failed']);
      setIsRunning(false);
    }
  };

  const handleManualRunSubmit = (paramValues) => {
    if (isUploadTrigger && fileInputRef.current) {
      // For upload triggers with params: store params, then open file picker
      pendingParamsRef.current = paramValues;
      fileInputRef.current.click();
    } else {
      executeWorkflow(workflowId, { parameters: paramValues });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !workflowId) return;
    event.target.value = '';

    setIsRunning(true);
    setValidationErrors([]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Include any pending parameters from the dialog
      if (pendingParamsRef.current) {
        formData.append('parameters', JSON.stringify(pendingParamsRef.current));
        pendingParamsRef.current = null;
      }
      await aetherApi.request(`/workflows/${workflowId}/upload`, {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set content-type with boundary
      });
      setTimeout(() => setIsRunning(false), 2000);
    } catch (err) {
      console.error('Failed to upload file:', err);
      setValidationErrors([err.message || 'File upload failed']);
      setIsRunning(false);
    }
  };

  const handleExport = () => {
    const workflowData = {
      name: workflowName,
      description: workflowDesc,
      type: workflowType,
      nodes,
      edges,
      version: '2.0',
      exportedAt: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(workflowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          setWorkflowName(importedData.name || 'Imported Workflow');
          setWorkflowDesc(importedData.description || '');
          setWorkflowType(importedData.type || 'custom');
          setNodes(importedData.nodes || []);
          setEdges(importedData.edges || []);
          setSelectedNodeId(null);
        } catch (error) {
          setValidationErrors(['Failed to import: invalid file format.']);
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    event.target.value = '';
  };

  // Workflow stats
  const triggerCount = nodes.filter(n => n.type === 'eventSource').length;
  const stepCount = nodes.filter(n => n.type !== 'eventSource').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xlarge"
      showCloseButton={false}
    >
      <div className="h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:bg-white focus:border focus:border-(--color-primary-500) rounded px-2 py-1 min-w-0"
            />
            <span className="text-xs text-gray-400 shrink-0">
              {workflowId ? 'Editing' : 'New'} Workflow
            </span>
            {saveStatus === 'success' && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle size={12} /> Saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleStatus}
              disabled={!workflowId}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-sm ${
                workflowStatus === 'active'
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
              title={!workflowId ? 'Save first' : workflowStatus === 'active' ? 'Pause workflow' : 'Activate workflow'}
            >
              {workflowStatus === 'active' ? <Pause size={14} /> : <Play size={14} />}
              {workflowStatus === 'active' ? 'Pause' : 'Activate'}
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
              title="Test run"
            >
              {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {isRunning ? 'Running...' : 'Run'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-(--color-primary-600) text-white rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50 text-sm"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
            <button
              onClick={handleExport}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title="Export"
            >
              <Download size={15} />
            </button>
            <label className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer" title="Import">
              <Upload size={15} />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              &#x2715;
            </button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mx-4 mt-2 flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <div className="text-xs text-red-700">
              {validationErrors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Node Palette */}
          <div className="w-56 bg-gray-50 border-r border-gray-200 p-3 overflow-y-auto">
            {paletteGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{group.label}</h4>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.type}
                        onClick={() => addNode(item.type)}
                        className="w-full flex items-center gap-2.5 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-(--color-primary-300) hover:bg-(--color-primary-50) transition-colors"
                      >
                        <div className={`w-7 h-7 bg-${item.color}-100 rounded-lg flex items-center justify-center shrink-0`}>
                          <ItemIcon size={14} className={`text-${item.color}-600`} />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-sm font-medium text-gray-900">{item.label}</div>
                          <div className="text-[10px] text-gray-500">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Stats */}
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Stats</h4>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Triggers:</span>
                  <span className={triggerCount === 0 ? 'text-red-500' : 'text-gray-700'}>{triggerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Steps:</span>
                  <span className={stepCount === 0 ? 'text-red-500' : 'text-gray-700'}>{stepCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Connections:</span>
                  <span className="text-gray-700">{edges.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Canvas */}
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
              deleteKeyCode={['Backspace', 'Delete']}
            >
              <Controls position="bottom-left" />
              <MiniMap
                nodeStrokeColor="#374151"
                nodeColor="#f3f4f6"
                nodeBorderRadius={8}
                maskColor="rgba(0, 0, 0, 0.08)"
                style={{ width: 120, height: 80 }}
              />
              <Background variant="dots" gap={16} size={1} color="#d1d5db" />
            </ReactFlow>

            {/* Running Indicator */}
            {isRunning && (
              <div className="absolute top-3 right-3 bg-green-100 border border-green-300 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span className="text-xs text-green-800 font-medium">Executing...</span>
              </div>
            )}
          </div>

          {/* Config Panel */}
          {selectedNode && (
            <NodeConfigPanel
              node={selectedNode}
              onUpdate={handleNodeDataUpdate}
              onDelete={handleDeleteNode}
              onClose={() => setSelectedNodeId(null)}
            />
          )}
        </div>

        {/* Hidden file input for upload-triggered workflows */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept={triggerConfig.accepted_extensions
            ? triggerConfig.accepted_extensions.map((e) => `.${e}`).join(',')
            : undefined}
          className="hidden"
        />

        {/* Manual run dialog with typed parameters */}
        <ManualRunDialog
          isOpen={showRunDialog}
          onClose={() => setShowRunDialog(false)}
          onSubmit={handleManualRunSubmit}
          parameters={inputParameters}
        />
      </div>
    </Modal>
  );
};

// Wrap with ReactFlowProvider
const WorkflowBuilderWrapper = (props) => (
  <ReactFlowProvider>
    <WorkflowBuilder {...props} />
  </ReactFlowProvider>
);

export default WorkflowBuilderWrapper;
