import React from 'react';
import { Handle, Position } from 'reactflow';
import { ShieldAlert } from 'lucide-react';

const actionLabels = {
  log: 'Log',
  notify: 'Notify',
  retry: 'Retry',
};

const ErrorHandlerNode = ({ data, selected, isConnectable }) => {
  const action = actionLabels[data.actionType] || 'Log';

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-red-600 ring-2 ring-red-200' : 'border-red-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
          <ShieldAlert size={15} className="text-red-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-red-700 uppercase tracking-wider">Error Handler</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">Action: {action}</div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#dc2626', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#dc2626', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default ErrorHandlerNode;
