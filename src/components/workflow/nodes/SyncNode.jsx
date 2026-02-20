import React from 'react';
import { Handle, Position } from 'reactflow';
import { Send } from 'lucide-react';

const SyncNode = ({ data, selected, isConnectable }) => {
  const targets = data.targets || [];
  const targetTypes = targets.map(t => t.type || 'in_app').join(', ') || 'in_app';
  const isOnExit = data.onExit || false;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-violet-600 ring-2 ring-violet-200' : 'border-violet-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
          <Send size={15} className="text-violet-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-violet-700 uppercase tracking-wider">
            Sync{isOnExit ? ' (onExit)' : ''}
          </div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">{targetTypes}</div>
        </div>
      </div>

      {/* Single target handle (input), no source (terminal node) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#7c3aed', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default SyncNode;
