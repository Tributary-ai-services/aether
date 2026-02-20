import React from 'react';
import { Handle, Position } from 'reactflow';
import { Layers } from 'lucide-react';

const modeLabels = {
  concat: 'Concatenate',
  merge: 'JSON Merge',
  ai_summarize: 'AI Summarize',
};

const AssemblerNode = ({ data, selected, isConnectable }) => {
  const mode = modeLabels[data.assemblyMode] || 'Concatenate';
  const format = data.outputFormat || 'text';

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-teal-600 ring-2 ring-teal-200' : 'border-teal-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
          <Layers size={15} className="text-teal-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-teal-700 uppercase tracking-wider">Assembler</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">
            {mode} &rarr; {format}
          </div>
        </div>
      </div>

      {/* Multiple inputs */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#0d9488', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-2"
        style={{ background: '#0d9488', width: 10, height: 10, top: '70%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#0d9488', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default AssemblerNode;
