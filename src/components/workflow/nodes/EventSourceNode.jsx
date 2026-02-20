import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, FileText, Clock, Webhook, Globe, MousePointer, AlertTriangle, FileSearch } from 'lucide-react';
import { validateTriggerConfig } from '../workflowSerializer.js';

const triggerIcons = {
  manual: MousePointer,
  file_upload: FileText,
  upload: FileText,
  schedule: Clock,
  webhook: Webhook,
  api: Globe,
  document_event: FileSearch,
};

const triggerLabels = {
  manual: 'Manual Trigger',
  file_upload: 'File Upload',
  upload: 'File Upload',
  schedule: 'Schedule',
  webhook: 'Webhook',
  api: 'API Trigger',
  document_event: 'Document Event',
};

/**
 * Generate a concise configuration summary for display on the node.
 * Uses Argo Events terminology where applicable.
 */
const getConfigSummary = (data) => {
  const config = data.config || {};
  const triggerType = data.triggerType || 'manual';

  switch (triggerType) {
    case 'manual': {
      const params = config.input_parameters || [];
      if (params.length === 0) return 'No parameters';
      return `${params.length} parameter${params.length !== 1 ? 's' : ''}`;
    }

    case 'schedule': {
      // Show the cron expression for clarity (matches Calendar EventSource schedule field)
      const tz = config.timezone || config.schedule?.timezone || 'UTC';
      if (config.schedule) {
        const s = config.schedule;
        const time = s.time || '09:00';
        if (s.frequency === 'daily' && (s.interval || 1) === 1) {
          return `Daily at ${time} ${tz}`;
        }
        if (s.frequency === 'weekly') {
          const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const days = (s.daysOfWeek || []).sort().map(d => dayMap[d]).join(', ');
          return `${days} at ${time}`;
        }
        if (s.frequency === 'monthly') {
          const day = s.lastDay ? 'last day' : `day ${s.dayOfMonth || 1}`;
          return `Monthly ${day} at ${time}`;
        }
        if (s.frequency === 'yearly') {
          return `Yearly at ${time}`;
        }
      }
      if (config.cron) return `${config.cron} ${tz}`;
      return 'Not configured';
    }

    case 'upload':
    case 'file_upload': {
      // Reflects MinIO EventSource filter.suffix usage
      const exts = config.accepted_extensions || [];
      if (exts.length === 0) return 'All file types';
      if (exts.length <= 3) return exts.map(e => e.toUpperCase()).join(', ');
      return `${exts.slice(0, 2).map(e => e.toUpperCase()).join(', ')} +${exts.length - 2}`;
    }

    case 'webhook': {
      // Show EventSource name and event name (Argo Events terminology)
      const source = config.argo_event_source;
      const eventName = config.argo_event_name;
      if (source && eventName) return `${source}/${eventName}`;
      if (source) return source;
      return 'Not configured';
    }

    case 'api':
      return 'REST endpoint';

    case 'document_event': {
      // Maps to Kafka EventSource topics
      const eventLabels = {
        'processing.completed': 'Kafka: processing.complete',
        'compliance.completed': 'Kafka: compliance.complete',
        'document.shared': 'Kafka: user-events',
      };
      return eventLabels[config.event_type] || config.event_type || 'Not configured';
    }

    default:
      return '';
  }
};

const EventSourceNode = ({ data, selected, isConnectable }) => {
  const Icon = triggerIcons[data.triggerType] || Zap;
  const summary = getConfigSummary(data);
  const warnings = validateTriggerConfig(data);
  const hasWarning = warnings.length > 0;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[180px] max-w-[240px] cursor-pointer transition-all ${
        hasWarning
          ? selected
            ? 'border-orange-500 ring-2 ring-orange-200'
            : 'border-orange-400'
          : selected
            ? 'border-amber-600 ring-2 ring-amber-200'
            : 'border-amber-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 ${hasWarning ? 'bg-orange-100' : 'bg-amber-100'} rounded-lg flex items-center justify-center shrink-0`}>
          <Icon size={15} className={hasWarning ? 'text-orange-700' : 'text-amber-700'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-medium ${hasWarning ? 'text-orange-700' : 'text-amber-700'} uppercase tracking-wider`}>Trigger</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">{triggerLabels[data.triggerType] || data.triggerType}</div>
        </div>
      </div>

      {/* Configuration Summary */}
      {summary && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-[10px] text-gray-500 truncate" title={summary}>
            {summary}
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {hasWarning && (
        <div className="mt-1.5 flex items-center gap-1" title={warnings.join(', ')}>
          <AlertTriangle size={10} className="text-orange-500 shrink-0" />
          <span className="text-[10px] text-orange-600 truncate">{warnings[0]}</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: hasWarning ? '#f97316' : '#d97706', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default EventSourceNode;
