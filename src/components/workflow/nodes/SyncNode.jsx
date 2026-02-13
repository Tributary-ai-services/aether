import React from 'react';
import { Handle, Position } from 'reactflow';
import { Merge, Timer } from 'lucide-react';

const SyncNode = ({ data, selected, isConnectable }) => {
  const mode = data.syncMode || 'all';

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-emerald-600 ring-2 ring-emerald-200' : 'border-emerald-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
          <Merge size={15} className="text-emerald-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Sync</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            {mode === 'all' ? 'Wait for all' : 'Wait for any'}
            {data.timeout && (
              <span className="inline-flex items-center gap-0.5">
                <Timer size={10} /> {data.timeout}s
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Multiple target handles for merging paths */}
      <Handle
        type="target"
        position={Position.Left}
        id="input-1"
        style={{ background: '#059669', width: 10, height: 10, top: '30%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-2"
        style={{ background: '#059669', width: 10, height: 10, top: '70%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#059669', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default SyncNode;
