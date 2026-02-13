import React from 'react';
import {
  X,
  Trash2,
  Zap,
  Settings,
  GitBranch,
  Bot,
  Merge,
} from 'lucide-react';

const triggerTypes = [
  { value: 'manual', label: 'Manual' },
  { value: 'upload', label: 'File Upload' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'api', label: 'API' },
];

const actionTypes = [
  { value: 'process_document', label: 'Process Document' },
  { value: 'ai_analysis', label: 'AI Analysis' },
  { value: 'compliance_check', label: 'Compliance Check' },
  { value: 'approval', label: 'Approval' },
  { value: 'notification', label: 'Notification' },
  { value: 'custom', label: 'Custom' },
];

const conditionTypes = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
];

const syncModes = [
  { value: 'all', label: 'Wait for all inputs' },
  { value: 'any', label: 'Wait for any input' },
];

const nodeTypeInfo = {
  eventSource: { label: 'Trigger', icon: Zap, color: 'amber' },
  action: { label: 'Action', icon: Settings, color: 'blue' },
  condition: { label: 'Condition', icon: GitBranch, color: 'yellow' },
  agent: { label: 'Agent', icon: Bot, color: 'purple' },
  sync: { label: 'Sync', icon: Merge, color: 'emerald' },
};

const NodeConfigPanel = ({ node, onUpdate, onDelete, onClose }) => {
  if (!node) return null;

  const info = nodeTypeInfo[node.type] || { label: 'Node', icon: Settings, color: 'gray' };
  const Icon = info.icon;

  const updateData = (field, value) => {
    onUpdate(node.id, {
      ...node.data,
      [field]: value,
    });
  };

  const updateConfig = (field, value) => {
    onUpdate(node.id, {
      ...node.data,
      config: {
        ...(node.data.config || {}),
        [field]: value,
      },
    });
  };

  const renderEventSourceConfig = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Trigger Type</label>
        <select
          value={node.data.triggerType || 'manual'}
          onChange={(e) => updateData('triggerType', e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          {triggerTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {node.data.triggerType === 'schedule' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Cron Expression</label>
          <input
            type="text"
            value={node.data.config?.cron || ''}
            onChange={(e) => updateConfig('cron', e.target.value)}
            placeholder="0 * * * *"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">min hour day month weekday</p>
        </div>
      )}

      {(node.data.triggerType === 'upload' || node.data.triggerType === 'file_upload') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Accepted File Types</label>
          <input
            type="text"
            value={node.data.config?.accepted_types?.join(', ') || ''}
            onChange={(e) => updateConfig('accepted_types', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="pdf, docx, png"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      )}

      {node.data.triggerType === 'webhook' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">HTTP Method</label>
          <select
            value={node.data.config?.method || 'POST'}
            onChange={(e) => updateConfig('method', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
          </select>
        </div>
      )}
    </div>
  );

  const renderActionConfig = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Action Type</label>
        <select
          value={node.data.actionType || 'custom'}
          onChange={(e) => updateData('actionType', e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {actionTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {node.data.actionType === 'ai_analysis' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
            <select
              value={node.data.config?.model || 'gpt-4o-mini'}
              onChange={(e) => updateConfig('model', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Task</label>
            <input
              type="text"
              value={node.data.config?.task || ''}
              onChange={(e) => updateConfig('task', e.target.value)}
              placeholder="e.g., summarize, extract_text"
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </>
      )}

      {node.data.actionType === 'notification' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Channels</label>
          <input
            type="text"
            value={node.data.config?.channels?.join(', ') || ''}
            onChange={(e) => updateConfig('channels', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="email, in_app"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Timeout (seconds)</label>
        <input
          type="number"
          value={node.data.timeout || 300}
          onChange={(e) => updateData('timeout', parseInt(e.target.value) || 300)}
          min={1}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Retry Count</label>
        <input
          type="number"
          value={node.data.retryCount || 0}
          onChange={(e) => updateData('retryCount', Math.min(5, Math.max(0, parseInt(e.target.value) || 0)))}
          min={0}
          max={5}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderConditionConfig = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Condition Type</label>
        <select
          value={node.data.conditionType || 'contains'}
          onChange={(e) => updateData('conditionType', e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        >
          {conditionTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Field</label>
        <input
          type="text"
          value={node.data.config?.field || ''}
          onChange={(e) => updateConfig('field', e.target.value)}
          placeholder="e.g., status, score, result"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
        <input
          type="text"
          value={node.data.config?.value || ''}
          onChange={(e) => updateConfig('value', e.target.value)}
          placeholder="Value to compare against"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderAgentConfig = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Agent Type</label>
        <select
          value={node.data.agentType || 'general'}
          onChange={(e) => updateData('agentType', e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="general">General</option>
          <option value="analysis">Analysis</option>
          <option value="search">Search</option>
          <option value="document">Document</option>
          <option value="compliance">Compliance</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Agent Name</label>
        <input
          type="text"
          value={node.data.agentName || ''}
          onChange={(e) => updateData('agentName', e.target.value)}
          placeholder="Name or ID of the agent"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
        <textarea
          value={node.data.config?.instructions || ''}
          onChange={(e) => updateConfig('instructions', e.target.value)}
          placeholder="Instructions for the agent..."
          rows={3}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Timeout (seconds)</label>
        <input
          type="number"
          value={node.data.timeout || 300}
          onChange={(e) => updateData('timeout', parseInt(e.target.value) || 300)}
          min={1}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderSyncConfig = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Sync Mode</label>
        <select
          value={node.data.syncMode || 'all'}
          onChange={(e) => updateData('syncMode', e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          {syncModes.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Timeout (seconds)</label>
        <input
          type="number"
          value={node.data.timeout || 300}
          onChange={(e) => updateData('timeout', parseInt(e.target.value) || 300)}
          min={1}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderConfig = () => {
    switch (node.type) {
      case 'eventSource': return renderEventSourceConfig();
      case 'action': return renderActionConfig();
      case 'condition': return renderConditionConfig();
      case 'agent': return renderAgentConfig();
      case 'sync': return renderSyncConfig();
      default: return <p className="text-sm text-gray-500">No configuration available.</p>;
    }
  };

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-${info.color}-50`}>
        <div className="flex items-center gap-2">
          <Icon size={16} className={`text-${info.color}-700`} />
          <span className="text-sm font-semibold text-gray-900">{info.label} Config</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Label */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
          <input
            type="text"
            value={node.data.label || ''}
            onChange={(e) => updateData('label', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent"
          />
        </div>

        <div className="border-t border-gray-100 pt-3">
          {renderConfig()}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => onDelete(node.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={14} />
          Delete Node
        </button>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
