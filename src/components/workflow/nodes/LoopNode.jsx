import React from 'react';
import { Handle, Position } from 'reactflow';
import { Repeat } from 'lucide-react';

const LoopNode = ({ data, selected, isConnectable }) => {
  const batchSize = data.batchSize;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-lime-600 ring-2 ring-lime-200' : 'border-lime-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-lime-100 rounded-lg flex items-center justify-center shrink-0">
          <Repeat size={15} className="text-lime-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-lime-700 uppercase tracking-wider">Loop</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">
            {batchSize ? `Batch size: ${batchSize}` : 'Iterate items'}
          </div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#65a30d', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#65a30d', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default LoopNode;
