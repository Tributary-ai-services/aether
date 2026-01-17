import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, FileText, Clock, Webhook, Database } from 'lucide-react';

const TriggerNode = ({ data, isConnectable }) => {
  const getTriggerIcon = (type) => {
    switch (type) {
      case 'file_upload': return <FileText size={16} />;
      case 'schedule': return <Clock size={16} />;
      case 'webhook': return <Webhook size={16} />;
      case 'database': return <Database size={16} />;
      default: return <Zap size={16} />;
    }
  };

  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-green-500 min-w-[150px]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
          {getTriggerIcon(data.triggerType)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.triggerType?.replace('_', ' ')}</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#22c55e' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default TriggerNode;