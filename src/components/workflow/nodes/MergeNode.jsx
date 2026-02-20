import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitMerge } from 'lucide-react';

const modeLabels = {
  append: 'Append',
  'combine-by-position': 'By Position',
  'combine-by-field': 'By Field',
  'choose-branch': 'Choose Branch',
};

const MergeNode = ({ data, selected, isConnectable }) => {
  const mode = modeLabels[data.mergeMode] || 'Append';

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-rose-600 ring-2 ring-rose-200' : 'border-rose-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
          <GitMerge size={15} className="text-rose-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-rose-700 uppercase tracking-wider">Merge</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">{mode}</div>
        </div>
      </div>

      {/* Multiple input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input-0"
        style={{ background: '#e11d48', width: 10, height: 10, top: '25%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-1"
        style={{ background: '#e11d48', width: 10, height: 10, top: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-2"
        style={{ background: '#e11d48', width: 10, height: 10, top: '75%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#e11d48', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default MergeNode;
