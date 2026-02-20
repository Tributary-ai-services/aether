import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';

const SubWorkflowNode = ({ data, selected, isConnectable }) => {
  const workflowName = data.workflowName || data.workflowRef;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-sky-600 ring-2 ring-sky-200' : 'border-sky-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center shrink-0">
          <GitBranch size={15} className="text-sky-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-sky-700 uppercase tracking-wider">Sub-Workflow</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">
            {workflowName ? workflowName : 'No workflow selected'}
          </div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#0284c7', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#0284c7', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default SubWorkflowNode;
