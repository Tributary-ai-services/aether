import React from 'react';
import { Handle, Position } from 'reactflow';
import { Globe } from 'lucide-react';

const HttpNode = ({ data, selected, isConnectable }) => {
  const method = data.method || 'GET';
  const urlShort = data.url ? new URL(data.url, 'http://placeholder').pathname.slice(0, 30) : '';

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-cyan-600 ring-2 ring-cyan-200' : 'border-cyan-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-cyan-100 rounded-lg flex items-center justify-center shrink-0">
          <Globe size={15} className="text-cyan-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-cyan-700 uppercase tracking-wider">HTTP</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          {data.url && (
            <div className="text-xs text-gray-500 truncate">
              <span className="font-mono font-medium">{method}</span> {urlShort}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#0891b2', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#0891b2', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default HttpNode;
