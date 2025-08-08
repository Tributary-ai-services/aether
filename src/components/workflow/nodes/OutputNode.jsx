import React from 'react';
import { Handle, Position } from 'reactflow';
import { Target, Send, Database, FileDown, Mail, Webhook } from 'lucide-react';

const OutputNode = ({ data, isConnectable }) => {
  const getOutputIcon = (type) => {
    switch (type) {
      case 'webhook': return <Webhook size={16} />;
      case 'email': return <Mail size={16} />;
      case 'database': return <Database size={16} />;
      case 'file_export': return <FileDown size={16} />;
      case 'api_call': return <Send size={16} />;
      default: return <Target size={16} />;
    }
  };

  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-purple-500 min-w-[150px]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
          {getOutputIcon(data.outputType)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.outputType?.replace('_', ' ')}</div>
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#8b5cf6' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default OutputNode;