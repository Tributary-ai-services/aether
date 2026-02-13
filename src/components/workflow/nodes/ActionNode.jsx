import React from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, FileText, Eye, Brain, Filter, RefreshCw, Shield, Bell, Cog } from 'lucide-react';

const actionIcons = {
  process_document: FileText,
  extract_text: FileText,
  ocr_scan: Eye,
  ai_analysis: Brain,
  compliance_check: Shield,
  approval: Filter,
  notification: Bell,
  filter_data: Filter,
  transform: RefreshCw,
  custom: Cog,
};

const actionLabels = {
  process_document: 'Process Doc',
  extract_text: 'Extract Text',
  ocr_scan: 'OCR Scan',
  ai_analysis: 'AI Analysis',
  compliance_check: 'Compliance',
  approval: 'Approval',
  notification: 'Notification',
  filter_data: 'Filter',
  transform: 'Transform',
  custom: 'Custom',
};

const ActionNode = ({ data, selected, isConnectable }) => {
  const Icon = actionIcons[data.actionType] || Settings;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[160px] cursor-pointer transition-all ${
        selected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-blue-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
          <Icon size={15} className="text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">Action</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">{actionLabels[data.actionType] || data.actionType}</div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#2563eb', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#2563eb', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default ActionNode;
