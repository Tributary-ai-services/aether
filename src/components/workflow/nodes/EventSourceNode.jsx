import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, FileText, Clock, Webhook, Globe, MousePointer } from 'lucide-react';

const triggerIcons = {
  manual: MousePointer,
  file_upload: FileText,
  upload: FileText,
  schedule: Clock,
  webhook: Webhook,
  api: Globe,
};

const triggerLabels = {
  manual: 'Manual',
  file_upload: 'File Upload',
  upload: 'File Upload',
  schedule: 'Schedule',
  webhook: 'Webhook',
  api: 'API',
};

const EventSourceNode = ({ data, selected, isConnectable }) => {
  const Icon = triggerIcons[data.triggerType] || Zap;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-amber-600 ring-2 ring-amber-200' : 'border-amber-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
          <Icon size={15} className="text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">Trigger</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">{triggerLabels[data.triggerType] || data.triggerType}</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#d97706', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default EventSourceNode;
