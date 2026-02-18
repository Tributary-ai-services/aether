import React from 'react';
import { Handle, Position } from 'reactflow';
import { Brain, Bot, Shield, FileText } from 'lucide-react';

const taskIcons = {
  llm: Brain,
  agent: Bot,
  compliance: Shield,
  document: FileText,
};

const taskLabels = {
  llm: 'LLM',
  agent: 'Agent',
  compliance: 'Compliance',
  document: 'Document',
};

const AITaskNode = ({ data, selected, isConnectable }) => {
  const aiType = data.aiTaskType || 'llm';
  const Icon = taskIcons[aiType] || Brain;
  const typeLabel = taskLabels[aiType] || 'LLM';

  const summary = [];
  if (aiType === 'llm' && data.model) summary.push(data.model);
  if (aiType === 'agent' && data.agentName) summary.push(data.agentName);
  if (data.prompt) summary.push(data.prompt.slice(0, 40) + (data.prompt.length > 40 ? '...' : ''));

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
          <div className="text-xs font-medium text-purple-700 uppercase tracking-wider">AI Task — {typeLabel}</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          {summary.length > 0 && (
            <div className="text-xs text-gray-500 truncate">{summary.join(' | ')}</div>
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

export default AITaskNode;
