import React, { useState, useCallback } from 'react';
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

import TriggerNode from './nodes/TriggerNode.jsx';
import ActionNode from './nodes/ActionNode.jsx';
import ConditionNode from './nodes/ConditionNode.jsx';
import OutputNode from './nodes/OutputNode.jsx';
import Modal from '../ui/Modal.jsx';
import { 
  Play, 
  Save, 
  Download, 
  Upload,
  Zap,
  Settings,
  GitBranch,
  Target,
  Plus
} from 'lucide-react';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  output: OutputNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 25 },
    data: { 
      label: 'Document Upload',
      triggerType: 'file_upload',
      config: { acceptedTypes: ['pdf', 'docx', 'jpg'] }
    },
  },
];

const initialEdges = [];

const WorkflowBuilder = ({ isOpen, onClose, workflow = null }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'New Workflow');
  const [isRunning, setIsRunning] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type) => {
    const newNode = {
      id: `${nodes.length + 1}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: getDefaultNodeData(type),
    };
    setNodes((nodes) => [...nodes, newNode]);
  };

  const getDefaultNodeData = (type) => {
    switch (type) {
      case 'trigger':
        return { 
          label: 'New Trigger',
          triggerType: 'manual',
          config: {}
        };
      case 'action':
        return { 
          label: 'New Action',
          actionType: 'extract_text',
          config: {}
        };
      case 'condition':
        return { 
          label: 'New Condition',
          conditionType: 'contains',
          config: { value: '' }
        };
      case 'output':
        return { 
          label: 'New Output',
          outputType: 'webhook',
          config: { url: '' }
        };
      default:
        return { label: 'New Node' };
    }
  };

  const handleSave = () => {
    const workflowData = {
      name: workflowName,
      nodes,
      edges,
      updatedAt: new Date().toISOString()
    };
    console.log('Saving workflow:', workflowData);
    // TODO: Implement save functionality
  };

  const handleRun = () => {
    setIsRunning(true);
    console.log('Running workflow:', { nodes, edges });
    // Simulate workflow execution
    setTimeout(() => {
      setIsRunning(false);
    }, 3000);
  };

  const handleExport = () => {
    const workflowData = {
      name: workflowName,
      nodes,
      edges,
      version: '1.0',
      exportedAt: new Date().toISOString()
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
          setNodes(importedData.nodes || []);
          setEdges(importedData.edges || []);
        } catch (error) {
          alert('Failed to import workflow. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xlarge"
      showCloseButton={false}
    >
      <div className="h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:bg-white focus:border focus:border-(--color-primary-500) rounded px-2 py-1"
            />
            <span className="text-sm text-gray-500">• Workflow Builder</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Play size={16} />
              {isRunning ? 'Running...' : 'Test Run'}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              title="Export Workflow"
            >
              <Download size={16} />
            </button>
            <label className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 cursor-pointer" title="Import Workflow">
              <Upload size={16} />
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Node Palette */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Add Components</h3>
            <div className="space-y-2">
              <button
                onClick={() => addNode('trigger')}
                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-(--color-primary-50) hover:border-(--color-primary-300) transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap size={16} className="text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Trigger</div>
                  <div className="text-xs text-gray-500">Start workflow</div>
                </div>
              </button>

              <button
                onClick={() => addNode('action')}
                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-(--color-primary-50) hover:border-(--color-primary-300) transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings size={16} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Action</div>
                  <div className="text-xs text-gray-500">Process data</div>
                </div>
              </button>

              <button
                onClick={() => addNode('condition')}
                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-(--color-primary-50) hover:border-(--color-primary-300) transition-colors"
              >
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <GitBranch size={16} className="text-yellow-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Condition</div>
                  <div className="text-xs text-gray-500">Branch logic</div>
                </div>
              </button>

              <button
                onClick={() => addNode('output')}
                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-(--color-primary-50) hover:border-(--color-primary-300) transition-colors"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target size={16} className="text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Output</div>
                  <div className="text-xs text-gray-500">Send results</div>
                </div>
              </button>
            </div>

            {/* Workflow Stats */}
            <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Workflow Stats</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Nodes:</span>
                  <span>{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Connections:</span>
                  <span>{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-green-600">Valid</span>
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
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Controls />
              <MiniMap 
                nodeStrokeColor="#374151"
                nodeColor="#f3f4f6"
                nodeBorderRadius={8}
                maskColor="rgba(0, 0, 0, 0.1)"
              />
              <Background variant="dots" gap={12} size={1} />
            </ReactFlow>

            {/* Running Indicator */}
            {isRunning && (
              <div className="absolute top-4 right-4 bg-green-100 border border-green-300 rounded-lg p-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-800">Workflow executing...</span>
              </div>
            )}
          </div>
        </div>
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