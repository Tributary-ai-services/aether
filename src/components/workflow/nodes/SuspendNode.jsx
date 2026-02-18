import React from 'react';
import { Handle, Position } from 'reactflow';
import { UserCheck } from 'lucide-react';

const SuspendNode = ({ data, selected, isConnectable }) => {
  const summary = [];
  if (data.duration) summary.push(`Wait: ${data.duration}`);
  if (data.approverRole) summary.push(`Approver: ${data.approverRole}`);

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-orange-600 ring-2 ring-orange-200' : 'border-orange-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
          <UserCheck size={15} className="text-orange-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-orange-700 uppercase tracking-wider">Approval</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          {summary.length > 0 && (
            <div className="text-xs text-gray-500 truncate">{summary.join(' | ')}</div>
          )}
          {!data.duration && !data.message && (
            <div className="text-xs text-gray-400">Pauses until approved</div>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#ea580c', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#ea580c', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default SuspendNode;
