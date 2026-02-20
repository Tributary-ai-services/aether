import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, CheckSquare, ChevronRight, ChevronLeft, FileSearch } from 'lucide-react';

const conditionIcons = {
  equals: CheckSquare,
  greater_than: ChevronRight,
  less_than: ChevronLeft,
  contains: FileSearch,
};

const ConditionNode = ({ data, selected, isConnectable }) => {
  const Icon = conditionIcons[data.conditionType] || GitBranch;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-yellow-600 ring-2 ring-yellow-200' : 'border-yellow-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
          <Icon size={15} className="text-yellow-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-yellow-700 uppercase tracking-wider">Condition</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.conditionType?.replace('_', ' ') || 'Branch'}</div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#ca8a04', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ background: '#22c55e', width: 10, height: 10, top: '30%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ background: '#ef4444', width: 10, height: 10, top: '70%' }}
        isConnectable={isConnectable}
      />

      {/* Labels for true/false outputs */}
      <div className="absolute -right-8 top-1 text-[10px] text-green-600 font-semibold">T</div>
      <div className="absolute -right-8 bottom-1 text-[10px] text-red-600 font-semibold">F</div>
    </div>
  );
};

export default ConditionNode;
