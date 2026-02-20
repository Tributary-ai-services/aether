import React from 'react';
import { Handle, Position } from 'reactflow';
import { Wand2 } from 'lucide-react';

const transformLabels = {
  expression: 'Expression',
  jsonpath: 'JSONPath',
  lua: 'Lua',
  sprig: 'Sprig',
};

const TransformNode = ({ data, selected, isConnectable }) => {
  const tType = transformLabels[data.transformType] || 'Expression';
  const hasExpr = data.expression?.trim() || data.jsonpathQuery?.trim() || data.luaScript?.trim();

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-emerald-600 ring-2 ring-emerald-200' : 'border-emerald-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
          <Wand2 size={15} className="text-emerald-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Transform</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">
            {tType}{hasExpr ? '' : ' — not configured'}
          </div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#059669', width: 10, height: 10 }}
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

export default TransformNode;
