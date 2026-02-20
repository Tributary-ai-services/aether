import React from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Brain, Search, FileText, Shield } from 'lucide-react';

const agentIcons = {
  general: Bot,
  analysis: Brain,
  search: Search,
  document: FileText,
  compliance: Shield,
};

const AgentNode = ({ data, selected, isConnectable }) => {
  const Icon = agentIcons[data.agentType] || Bot;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-purple-600 ring-2 ring-purple-200' : 'border-purple-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
          <Icon size={15} className="text-purple-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-purple-700 uppercase tracking-wider">Agent</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          {data.agentName && (
            <div className="text-xs text-gray-500 truncate">{data.agentName}</div>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#7c3aed', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#7c3aed', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default AgentNode;
