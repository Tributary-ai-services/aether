import React from 'react';
import { Handle, Position } from 'reactflow';
import { Code } from 'lucide-react';

const languageLabels = {
  python: 'Python',
  bash: 'Bash',
  node: 'Node.js',
};

const ScriptNode = ({ data, selected, isConnectable }) => {
  const lang = languageLabels[data.language] || data.language || 'Python';
  const hasSource = data.source?.trim().length > 0;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-indigo-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
          <Code size={15} className="text-indigo-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-indigo-700 uppercase tracking-wider">Script</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">
            {lang}{hasSource ? '' : ' — no code yet'}
          </div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#4f46e5', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#4f46e5', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default ScriptNode;
