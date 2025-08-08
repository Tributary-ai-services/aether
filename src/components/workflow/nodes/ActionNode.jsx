import React from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, FileText, Eye, Brain, Filter, RefreshCw } from 'lucide-react';

const ActionNode = ({ data, isConnectable }) => {
  const getActionIcon = (type) => {
    switch (type) {
      case 'extract_text': return <FileText size={16} />;
      case 'ocr_scan': return <Eye size={16} />;
      case 'ai_analyze': return <Brain size={16} />;
      case 'filter_data': return <Filter size={16} />;
      case 'transform': return <RefreshCw size={16} />;
      default: return <Settings size={16} />;
    }
  };

  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-blue-500 min-w-[150px]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
          {getActionIcon(data.actionType)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.actionType?.replace('_', ' ')}</div>
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#3b82f6' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#3b82f6' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default ActionNode;