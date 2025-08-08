import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, CheckSquare, ChevronRight, ChevronLeft, FileSearch } from 'lucide-react';

const ConditionNode = ({ data, isConnectable }) => {
  const getConditionIcon = (type) => {
    switch (type) {
      case 'equals': return <CheckSquare size={16} />;
      case 'greater_than': return <ChevronRight size={16} />;
      case 'less_than': return <ChevronLeft size={16} />;
      case 'contains': return <FileSearch size={16} />;
      default: return <GitBranch size={16} />;
    }
  };

  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-yellow-500 min-w-[150px]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-yellow-100 rounded flex items-center justify-center">
          {getConditionIcon(data.conditionType)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.conditionType?.replace('_', ' ')}</div>
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#eab308' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ background: '#22c55e', top: '30%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ background: '#ef4444', top: '70%' }}
        isConnectable={isConnectable}
      />
      
      {/* Labels for true/false outputs */}
      <div className="absolute -right-8 top-1 text-xs text-green-600 font-medium">True</div>
      <div className="absolute -right-8 bottom-1 text-xs text-red-600 font-medium">False</div>
    </div>
  );
};

export default ConditionNode;