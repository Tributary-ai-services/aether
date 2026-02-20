import React from 'react';
import { Handle, Position } from 'reactflow';
import { Box } from 'lucide-react';

const ContainerNode = ({ data, selected, isConnectable }) => {
  const summary = [];
  if (data.image) summary.push(data.image.split('/').pop());
  if (data.command?.length) summary.push(data.command.join(' '));

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-blue-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
          <Box size={15} className="text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">Container</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          {summary.length > 0 && (
            <div className="text-xs text-gray-500 truncate">{summary.join(' | ')}</div>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#2563eb', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#2563eb', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default ContainerNode;
