import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  X,
  Trash2,
  Zap,
  Settings,
  GitBranch,
  Bot,
  Copy,
  FileOutput,
  Plus,
  BookOpen,
  Shield,
  Terminal,
  ChevronDown,
  Box,
  Code,
  Globe,
  Brain,
  UserCheck,
  Wand2,
  Layers,
  Send,
  GitMerge,
  Repeat,
  ShieldAlert,
  Database,
} from 'lucide-react';
import { selectNotebooks, fetchNotebooks } from '../../store/slices/notebooksSlice.js';
import { fetchDatabaseConnections, selectConnections } from '../../store/slices/databaseConnectionsSlice';
import { getDefaultTriggerConfig } from './workflowSerializer.js';
import NotebookSelectorModal from './NotebookSelectorModal.jsx';
import ParameterManagerModal from './ParameterManagerModal.jsx';
import SchedulePickerPanel from './SchedulePickerPanel.jsx';
import ArgoEventSourcePicker from './ArgoEventSourcePicker.jsx';

const triggerTypes = [
  { value: 'manual', label: 'Manual' },
  { value: 'upload', label: 'File Upload' },
  { value: 'document_event', label: 'Document Event' },
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
  { value: 'assemble_output', label: 'Assemble Output' },
  { value: 'custom', label: 'Custom' },
];

const conditionTypes = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
];

const sourceFilterOptions = [
  { value: 'any', label: 'Any Upload (Notebooks + API)' },
  { value: 'notebook', label: 'Specific Notebooks' },
  { value: 'api', label: 'API Only' },
];

const outputModeOptions = [
  { value: 'same_notebook', label: 'Same notebook' },
  { value: 'specific', label: 'Specific notebook' },
  { value: 'ask_at_runtime', label: 'Ask at runtime' },
];

const documentEventTypes = [
  { value: 'processing.completed', label: 'Processing Complete' },
  { value: 'compliance.completed', label: 'Compliance Check Complete' },
  { value: 'document.shared', label: 'Document Shared' },
];

const outputFormatOptions = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'pptx', label: 'PPTX' },
  { value: 'html', label: 'HTML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'xlsx', label: 'XLSX' },
];

const assemblyModeOptions = [
  { value: 'ai', label: 'AI-Powered' },
  { value: 'template', label: 'Template-Based' },
];

const scriptLanguages = [
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
  { value: 'node', label: 'Node.js' },
];

const httpMethods = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

const aiTaskTypes = [
  { value: 'llm', label: 'LLM Prompt' },
  { value: 'agent', label: 'Agent' },
  { value: 'compliance', label: 'Compliance Scan' },
  { value: 'document', label: 'Document Processing' },
];

const aiModels = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
  { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
];

const transformTypes = [
  { value: 'expression', label: 'Expression' },
  { value: 'jsonpath', label: 'JSONPath' },
  { value: 'lua', label: 'Lua Script' },
  { value: 'sprig', label: 'Sprig Function' },
];

const mergeModes = [
  { value: 'append', label: 'Append (Concatenate All)' },
  { value: 'combine-by-position', label: 'Combine by Position (Zip)' },
  { value: 'combine-by-field', label: 'Combine by Field (Join)' },
  { value: 'choose-branch', label: 'Choose Branch' },
];

const errorHandlerActions = [
  { value: 'log', label: 'Log Error' },
  { value: 'notify', label: 'Send Notification' },
  { value: 'retry', label: 'Retry Workflow' },
];

const retryPolicies = [
  { value: 'Always', label: 'Always' },
  { value: 'OnFailure', label: 'On Failure' },
  { value: 'OnError', label: 'On Error' },
  { value: 'OnTransientError', label: 'On Transient Error' },
];

const nodeTypeInfo = {
  eventSource: { label: 'Trigger', icon: Zap, color: 'amber' },
  action: { label: 'Action', icon: Settings, color: 'blue' },
  condition: { label: 'Condition', icon: GitBranch, color: 'yellow' },
  agent: { label: 'Agent', icon: Bot, color: 'purple' },
  container: { label: 'Container', icon: Box, color: 'blue' },
  script: { label: 'Script', icon: Code, color: 'indigo' },
  http: { label: 'HTTP', icon: Globe, color: 'cyan' },
  aiTask: { label: 'AI Task', icon: Brain, color: 'purple' },
  suspend: { label: 'Approval', icon: UserCheck, color: 'orange' },
  transform: { label: 'Transform', icon: Wand2, color: 'emerald' },
  assembler: { label: 'Assembler', icon: Layers, color: 'teal' },
  sync: { label: 'Sync', icon: Send, color: 'violet' },
  merge: { label: 'Merge', icon: GitMerge, color: 'rose' },
  loop: { label: 'Loop', icon: Repeat, color: 'lime' },
  subworkflow: { label: 'Sub-Workflow', icon: GitBranch, color: 'sky' },
  errorHandler: { label: 'Error Handler', icon: ShieldAlert, color: 'red' },
};

const inputCls = 'w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

// Safely join a value that might not be an array
const safeJoin = (val, sep = ', ') => Array.isArray(val) ? val.join(sep) : (val || '');

// Notebook chips component - shows selected notebooks as chips with names
const NotebookChips = ({ ids = [], notebooks, onRemove, onOpenSelector, label, multiSelect = true }) => {
  const notebookMap = useMemo(() => {
    const map = {};
    (notebooks || []).forEach((nb) => {
      map[nb.id] = nb.name || nb.id;
    });
    return map;
  }, [notebooks]);

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {ids.map((id) => (
          <span
            key={id}
            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
          >
            <BookOpen size={10} />
            {notebookMap[id] || id}
            <button
              onClick={() => onRemove(id)}
              className="text-blue-400 hover:text-blue-700"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <button
        onClick={onOpenSelector}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-dashed border-blue-300 rounded-lg hover:border-blue-400 w-full justify-center"
      >
        <Plus size={12} />
        {multiSelect ? 'Select Notebooks...' : 'Select Notebook...'}
      </button>
    </div>
  );
};

const NodeConfigPanel = ({ node, onUpdate, onDelete, onClose, liveNodeStatuses = {} }) => {
  const dispatch = useDispatch();
  const notebooks = useSelector(selectNotebooks);
  const allConnections = useSelector(selectConnections);

  // Notebook selector state
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState(null); // field name
  const [selectorMulti, setSelectorMulti] = useState(true);
  const [apiCurlExpanded, setApiCurlExpanded] = useState(false);
  const [paramsModalOpen, setParamsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'lastRun'

  // Fetch connections when MCP is enabled on a workflow node
  React.useEffect(() => {
    if (node?.data?.mcpEnabled && (!allConnections || allConnections.length === 0)) {
      dispatch(fetchDatabaseConnections());
    }
  }, [node?.data?.mcpEnabled, allConnections, dispatch]);

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

  const openNotebookSelector = (field, multi = true) => {
    setSelectorTarget(field);
    setSelectorMulti(multi);
    setSelectorOpen(true);
    // Ensure notebooks are loaded
    if (!notebooks || !notebooks.length) {
      dispatch(fetchNotebooks());
    }
  };

  const handleNotebookSelect = (ids) => {
    if (selectorMulti) {
      updateConfig(selectorTarget, ids);
    } else {
      updateConfig(selectorTarget, ids[0] || '');
    }
  };

  const removeNotebookId = (field, idToRemove) => {
    const current = node.data.config?.[field] || [];
    if (Array.isArray(current)) {
      updateConfig(field, current.filter((id) => id !== idToRemove));
    } else {
      updateConfig(field, '');
    }
  };

  // Input Parameters — stable reference to avoid triggering child useEffects
  const inputParams = useMemo(
    () => node.data.config?.input_parameters || [],
    [node.data.config?.input_parameters]
  );

  const handleTriggerTypeChange = (newType) => {
    const defaults = getDefaultTriggerConfig(newType);
    onUpdate(node.id, {
      ...node.data,
      triggerType: newType,
      config: defaults,
    });
  };

  const updateRetry = (field, value) => {
    onUpdate(node.id, {
      ...node.data,
      retryStrategy: {
        ...(node.data.retryStrategy || { limit: 0, duration: '2s', factor: 2, maxDuration: '1m', retryPolicy: 'Always' }),
        [field]: value,
      },
    });
  };

  const updateEnvVar = (index, field, value) => {
    const env = [...(node.data.env || [])];
    env[index] = { ...env[index], [field]: value };
    updateData('env', env);
  };

  const addEnvVar = () => {
    updateData('env', [...(node.data.env || []), { name: '', value: '' }]);
  };

  const removeEnvVar = (index) => {
    updateData('env', (node.data.env || []).filter((_, i) => i !== index));
  };

  const updateHeader = (index, field, value) => {
    const headers = [...(node.data.headers || [])];
    headers[index] = { ...headers[index], [field]: value };
    updateData('headers', headers);
  };

  const addHeader = () => {
    updateData('headers', [...(node.data.headers || []), { name: '', value: '' }]);
  };

  const removeHeader = (index) => {
    updateData('headers', (node.data.headers || []).filter((_, i) => i !== index));
  };

  /* ===== CONTAINER CONFIG ===== */
  const renderContainerConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Image *</label>
        <input
          type="text"
          value={node.data.image || ''}
          onChange={(e) => updateData('image', e.target.value)}
          placeholder="python:3.11-slim"
          className={inputCls}
        />
        <p className="text-[10px] text-gray-400 mt-0.5">Docker image to run</p>
      </div>

      <div>
        <label className={labelCls}>Command</label>
        <input
          type="text"
          value={(node.data.command || []).join(' ')}
          onChange={(e) => updateData('command', e.target.value.split(/\s+/).filter(Boolean))}
          placeholder="python /app/main.py"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Arguments</label>
        <input
          type="text"
          value={(node.data.args || []).join(' ')}
          onChange={(e) => updateData('args', e.target.value.split(/\s+/).filter(Boolean))}
          placeholder="--input /data --output /results"
          className={inputCls}
        />
      </div>

      {/* Env Vars */}
      <div>
        <label className={labelCls}>Environment Variables</label>
        {(node.data.env || []).map((env, i) => (
          <div key={i} className="flex items-center gap-1 mb-1">
            <input
              type="text"
              value={env.name || ''}
              onChange={(e) => updateEnvVar(i, 'name', e.target.value)}
              placeholder="KEY"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
            />
            <span className="text-gray-400">=</span>
            <input
              type="text"
              value={env.value || ''}
              onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
              placeholder="value"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
            />
            <button onClick={() => removeEnvVar(i)} className="text-red-400 hover:text-red-600 p-0.5">
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={addEnvVar}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
        >
          <Plus size={12} /> Add Variable
        </button>
      </div>

      {/* Resources */}
      <div className="border-t border-gray-100 pt-3">
        <label className="block text-xs font-medium text-gray-600 mb-2">Resources</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500">CPU Request</label>
            <input
              type="text"
              value={node.data.resources?.requests?.cpu || '100m'}
              onChange={(e) => updateData('resources', { ...node.data.resources, requests: { ...(node.data.resources?.requests || {}), cpu: e.target.value } })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500">CPU Limit</label>
            <input
              type="text"
              value={node.data.resources?.limits?.cpu || '500m'}
              onChange={(e) => updateData('resources', { ...node.data.resources, limits: { ...(node.data.resources?.limits || {}), cpu: e.target.value } })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Memory Request</label>
            <input
              type="text"
              value={node.data.resources?.requests?.memory || '128Mi'}
              onChange={(e) => updateData('resources', { ...node.data.resources, requests: { ...(node.data.resources?.requests || {}), memory: e.target.value } })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Memory Limit</label>
            <input
              type="text"
              value={node.data.resources?.limits?.memory || '512Mi'}
              onChange={(e) => updateData('resources', { ...node.data.resources, limits: { ...(node.data.resources?.limits || {}), memory: e.target.value } })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>
        </div>
      </div>

      {/* Timeout & Retry */}
      <div className="border-t border-gray-100 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Timeout</label>
            <input
              type="text"
              value={node.data.timeout || '5m'}
              onChange={(e) => updateData('timeout', e.target.value)}
              placeholder="5m"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Retry Limit</label>
            <input
              type="number"
              value={node.data.retryStrategy?.limit || 0}
              onChange={(e) => updateRetry('limit', parseInt(e.target.value) || 0)}
              min={0}
              max={10}
              className={inputCls}
            />
          </div>
        </div>
        {(node.data.retryStrategy?.limit || 0) > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="text-[10px] text-gray-500">Backoff Duration</label>
              <input
                type="text"
                value={node.data.retryStrategy?.duration || '2s'}
                onChange={(e) => updateRetry('duration', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500">Retry Policy</label>
              <select
                value={node.data.retryStrategy?.retryPolicy || 'Always'}
                onChange={(e) => updateRetry('retryPolicy', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              >
                {retryPolicies.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* When condition */}
      <div>
        <label className={labelCls}>When (conditional)</label>
        <input
          type="text"
          value={node.data.when || ''}
          onChange={(e) => updateData('when', e.target.value)}
          placeholder="{{tasks.prev-step.outputs.result}} != ''"
          className={inputCls}
        />
        <p className="text-[10px] text-gray-400 mt-0.5">Argo expression — skip step if false</p>
      </div>
    </div>
  );

  /* ===== SCRIPT CONFIG ===== */
  const renderScriptConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Language</label>
        <select
          value={node.data.language || 'python'}
          onChange={(e) => updateData('language', e.target.value)}
          className={inputCls}
        >
          {scriptLanguages.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Image</label>
        <input
          type="text"
          value={node.data.image || ''}
          onChange={(e) => updateData('image', e.target.value)}
          placeholder="Auto-set from language"
          className={inputCls}
        />
        <p className="text-[10px] text-gray-400 mt-0.5">
          Default: {node.data.language === 'bash' ? 'alpine:3.19' : node.data.language === 'node' ? 'node:20-slim' : 'python:3.11-slim'}
        </p>
      </div>

      <div>
        <label className={labelCls}>Source Code *</label>
        <textarea
          value={node.data.source || ''}
          onChange={(e) => updateData('source', e.target.value)}
          placeholder={node.data.language === 'python' ? 'import json\nresult = {"status": "ok"}\nprint(json.dumps(result))' : '# Your code here'}
          rows={8}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
        />
      </div>

      {/* Timeout & Retry */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Timeout</label>
          <input
            type="text"
            value={node.data.timeout || '5m'}
            onChange={(e) => updateData('timeout', e.target.value)}
            placeholder="5m"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Retry Limit</label>
          <input
            type="number"
            value={node.data.retryStrategy?.limit || 0}
            onChange={(e) => updateRetry('limit', parseInt(e.target.value) || 0)}
            min={0}
            max={10}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>When (conditional)</label>
        <input
          type="text"
          value={node.data.when || ''}
          onChange={(e) => updateData('when', e.target.value)}
          placeholder="{{tasks.prev-step.outputs.result}} != ''"
          className={inputCls}
        />
      </div>
    </div>
  );

  /* ===== HTTP CONFIG ===== */
  const renderHttpConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Method</label>
        <select
          value={node.data.method || 'GET'}
          onChange={(e) => updateData('method', e.target.value)}
          className={inputCls}
        >
          {httpMethods.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>URL *</label>
        <input
          type="text"
          value={node.data.url || ''}
          onChange={(e) => updateData('url', e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className={inputCls}
        />
      </div>

      {/* Headers */}
      <div>
        <label className={labelCls}>Headers</label>
        {(node.data.headers || []).map((h, i) => (
          <div key={i} className="flex items-center gap-1 mb-1">
            <input
              type="text"
              value={h.name || ''}
              onChange={(e) => updateHeader(i, 'name', e.target.value)}
              placeholder="Header"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
            />
            <span className="text-gray-400">:</span>
            <input
              type="text"
              value={h.value || ''}
              onChange={(e) => updateHeader(i, 'value', e.target.value)}
              placeholder="Value"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
            />
            <button onClick={() => removeHeader(i)} className="text-red-400 hover:text-red-600 p-0.5">
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={addHeader}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
        >
          <Plus size={12} /> Add Header
        </button>
      </div>

      {/* Body (for POST/PUT/PATCH) */}
      {['POST', 'PUT', 'PATCH'].includes(node.data.method) && (
        <div>
          <label className={labelCls}>Body</label>
          <textarea
            value={node.data.body || ''}
            onChange={(e) => updateData('body', e.target.value)}
            placeholder='{"key": "value"}'
            rows={4}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-y"
          />
        </div>
      )}

      <div>
        <label className={labelCls}>Success Condition</label>
        <input
          type="text"
          value={node.data.successCondition || ''}
          onChange={(e) => updateData('successCondition', e.target.value)}
          placeholder="response.statusCode == 200"
          className={inputCls}
        />
      </div>

      {/* Timeout & Retry */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Timeout</label>
          <input
            type="text"
            value={node.data.timeout || '30s'}
            onChange={(e) => updateData('timeout', e.target.value)}
            placeholder="30s"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Retry Limit</label>
          <input
            type="number"
            value={node.data.retryStrategy?.limit || 0}
            onChange={(e) => updateRetry('limit', parseInt(e.target.value) || 0)}
            min={0}
            max={10}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>When (conditional)</label>
        <input
          type="text"
          value={node.data.when || ''}
          onChange={(e) => updateData('when', e.target.value)}
          placeholder="{{tasks.prev-step.outputs.result}} != ''"
          className={inputCls}
        />
      </div>
    </div>
  );

  /* ===== AI TASK CONFIG ===== */
  const renderAITaskConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>AI Task Type</label>
        <select
          value={node.data.aiTaskType || 'llm'}
          onChange={(e) => updateData('aiTaskType', e.target.value)}
          className={inputCls}
        >
          {aiTaskTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* LLM sub-panel */}
      {(node.data.aiTaskType === 'llm' || !node.data.aiTaskType) && (
        <>
          <div>
            <label className={labelCls}>Chain Type</label>
            <select
              value={node.data.chainType || 'completion'}
              onChange={(e) => updateData('chainType', e.target.value)}
              className={inputCls}
            >
              <option value="completion">Completion (Raw)</option>
              <option value="summarization">Summarization</option>
              <option value="qa">Q&A</option>
              <option value="classification">Classification</option>
              <option value="extraction">Extraction</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Model</label>
            <select
              value={node.data.model || 'gpt-4o-mini'}
              onChange={(e) => updateData('model', e.target.value)}
              className={inputCls}
            >
              {aiModels.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>System Prompt</label>
            <textarea
              value={node.data.systemPrompt || ''}
              onChange={(e) => updateData('systemPrompt', e.target.value)}
              placeholder="You are a helpful assistant..."
              rows={2}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            />
          </div>
          <div>
            <label className={labelCls}>Prompt *</label>
            <textarea
              value={node.data.prompt || ''}
              onChange={(e) => updateData('prompt', e.target.value)}
              placeholder="Analyze the following data: {{tasks.prev.outputs.result}}"
              rows={4}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Max Tokens</label>
              <input
                type="number"
                value={node.data.maxTokens || 2000}
                onChange={(e) => updateData('maxTokens', parseInt(e.target.value) || 2000)}
                min={1}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Temperature</label>
              <input
                type="number"
                value={node.data.temperature ?? 0.7}
                onChange={(e) => updateData('temperature', parseFloat(e.target.value) || 0)}
                min={0}
                max={2}
                step={0.1}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="mcp-enabled-toggle"
              checked={!!node.data.mcpEnabled}
              onChange={(e) => updateData('mcpEnabled', e.target.checked)}
              className="rounded border-gray-300 text-purple-500 focus:ring-purple-500"
            />
            <label htmlFor="mcp-enabled-toggle" className="text-xs text-gray-600">Enable MCP Tools</label>
          </div>
          {node.data.mcpEnabled && allConnections && allConnections.length > 0 && (
            <div className="pt-1">
              <label className={labelCls}>
                <Database className="w-3 h-3 inline mr-1" />
                MCP Connection (Optional)
              </label>
              <select
                value={node.data.mcpConnectionId || ''}
                onChange={(e) => {
                  updateData('mcpConnectionId', e.target.value || null);
                  // Also store the server ID for the selected connection type
                  const conn = allConnections.find(c => c.id === e.target.value);
                  if (conn) {
                    const typeToServerId = { neo4j: 'mcp-neo4j', postgres: 'mcp-postgres', minio: 'mcp-minio', kafka: 'mcp-kafka', grafana: 'mcp-grafana' };
                    updateData('mcpServerId', typeToServerId[conn.type || conn.databaseType] || '');
                  } else {
                    updateData('mcpServerId', null);
                  }
                }}
                className={inputCls}
              >
                <option value="">Default (env var connection)</option>
                {allConnections.map(conn => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.type || conn.databaseType})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rag-enabled-toggle"
              checked={!!node.data.ragEnabled}
              onChange={(e) => updateData('ragEnabled', e.target.checked)}
              className="rounded border-gray-300 text-purple-500 focus:ring-purple-500"
            />
            <label htmlFor="rag-enabled-toggle" className="text-xs text-gray-600">Enable RAG (DeepLake)</label>
          </div>
          {node.data.ragEnabled && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className={labelCls}>Dataset</label>
                <input
                  type="text"
                  value={node.data.ragDataset || 'default'}
                  onChange={(e) => updateData('ragDataset', e.target.value)}
                  placeholder="default"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Top K</label>
                <input
                  type="number"
                  value={node.data.ragTopK ?? 5}
                  onChange={(e) => updateData('ragTopK', parseInt(e.target.value) || 5)}
                  min={1}
                  max={20}
                  className={inputCls}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Agent sub-panel */}
      {node.data.aiTaskType === 'agent' && (
        <>
          <div>
            <label className={labelCls}>Agent Type</label>
            <select
              value={node.data.agentType || 'general'}
              onChange={(e) => updateData('agentType', e.target.value)}
              className={inputCls}
            >
              <option value="general">General</option>
              <option value="analysis">Analysis</option>
              <option value="search">Search</option>
              <option value="document">Document</option>
              <option value="compliance">Compliance</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Agent Name</label>
            <input
              type="text"
              value={node.data.agentName || ''}
              onChange={(e) => updateData('agentName', e.target.value)}
              placeholder="Name or ID of the agent"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Instructions *</label>
            <textarea
              value={node.data.instructions || ''}
              onChange={(e) => updateData('instructions', e.target.value)}
              placeholder="Detailed instructions for the agent..."
              rows={4}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mcp_enabled"
              checked={node.data.mcpEnabled || false}
              onChange={(e) => updateData('mcpEnabled', e.target.checked)}
              className="rounded border-gray-300 text-purple-500 focus:ring-purple-500"
            />
            <label htmlFor="mcp_enabled" className="text-xs text-gray-600">Enable MCP Tools</label>
          </div>
        </>
      )}

      {/* Compliance sub-panel */}
      {node.data.aiTaskType === 'compliance' && (
        <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-700">
            Runs the compliance scanner container against the input data. Configure scan parameters below.
          </p>
          <div className="mt-2">
            <label className={labelCls}>Scan Profile</label>
            <select
              value={node.data.config?.scan_profile || 'standard'}
              onChange={(e) => updateConfig('scan_profile', e.target.value)}
              className={inputCls}
            >
              <option value="standard">Standard</option>
              <option value="hipaa">HIPAA</option>
              <option value="pci">PCI-DSS</option>
              <option value="sox">SOX</option>
            </select>
          </div>
        </div>
      )}

      {/* Document sub-panel */}
      {node.data.aiTaskType === 'document' && (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Processing Task</label>
            <select
              value={node.data.config?.task || 'extract'}
              onChange={(e) => updateConfig('task', e.target.value)}
              className={inputCls}
            >
              <option value="extract">Extract Text</option>
              <option value="summarize">Summarize</option>
              <option value="classify">Classify</option>
              <option value="ocr">OCR</option>
            </select>
          </div>
        </div>
      )}

      {/* Common: Timeout & Retry */}
      <div className="border-t border-gray-100 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Timeout</label>
            <input
              type="text"
              value={node.data.timeout || '10m'}
              onChange={(e) => updateData('timeout', e.target.value)}
              placeholder="10m"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Retry Limit</label>
            <input
              type="number"
              value={node.data.retryStrategy?.limit || 0}
              onChange={(e) => updateRetry('limit', parseInt(e.target.value) || 0)}
              min={0}
              max={10}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>When (conditional)</label>
        <input
          type="text"
          value={node.data.when || ''}
          onChange={(e) => updateData('when', e.target.value)}
          placeholder="{{tasks.prev-step.outputs.result}} != ''"
          className={inputCls}
        />
      </div>
    </div>
  );

  /* ===== SUSPEND / APPROVAL CONFIG ===== */
  const renderSuspendConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Duration (optional)</label>
        <input
          type="text"
          value={node.data.duration || ''}
          onChange={(e) => updateData('duration', e.target.value)}
          placeholder="e.g., 24h, 7d (empty = wait indefinitely)"
          className={inputCls}
        />
        <p className="text-[10px] text-gray-400 mt-0.5">Auto-approve after this duration. Leave empty to wait forever.</p>
      </div>

      <div>
        <label className={labelCls}>Message</label>
        <textarea
          value={node.data.message || ''}
          onChange={(e) => updateData('message', e.target.value)}
          placeholder="Please review and approve the workflow results..."
          rows={3}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y"
        />
      </div>

      <div>
        <label className={labelCls}>Approver Role</label>
        <input
          type="text"
          value={node.data.approverRole || ''}
          onChange={(e) => updateData('approverRole', e.target.value)}
          placeholder="manager, admin, compliance-officer"
          className={inputCls}
        />
      </div>
    </div>
  );

  /* ===== TRANSFORM CONFIG ===== */
  const renderTransformConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Transform Type</label>
        <select
          value={node.data.transformType || 'expression'}
          onChange={(e) => updateData('transformType', e.target.value)}
          className={inputCls}
        >
          {transformTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Expression mode */}
      {(node.data.transformType === 'expression' || !node.data.transformType) && (
        <div>
          <label className={labelCls}>Expression *</label>
          <textarea
            value={node.data.expression || ''}
            onChange={(e) => updateData('expression', e.target.value)}
            placeholder="{{=toJson(jsonpath(tasks.fetch.outputs.result, '$.items'))}}"
            rows={3}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Argo expression using {'{{=...}}'} syntax. Runs in-memory on controller.</p>
        </div>
      )}

      {/* JSONPath mode */}
      {node.data.transformType === 'jsonpath' && (
        <>
          <div>
            <label className={labelCls}>Source Step</label>
            <input
              type="text"
              value={node.data.sourceStep || ''}
              onChange={(e) => updateData('sourceStep', e.target.value)}
              placeholder="step-name"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Source Parameter</label>
            <input
              type="text"
              value={node.data.sourceParam || 'result'}
              onChange={(e) => updateData('sourceParam', e.target.value)}
              placeholder="result"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>JSONPath Query *</label>
            <input
              type="text"
              value={node.data.jsonpathQuery || ''}
              onChange={(e) => updateData('jsonpathQuery', e.target.value)}
              placeholder="$.items[*].name"
              className={inputCls}
            />
          </div>
        </>
      )}

      {/* Lua mode */}
      {node.data.transformType === 'lua' && (
        <div>
          <label className={labelCls}>Lua Script *</label>
          <textarea
            value={node.data.luaScript || ''}
            onChange={(e) => updateData('luaScript', e.target.value)}
            placeholder="return tonumber(val) * 2"
            rows={4}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Generates {'{{=lua(\'...\')}}'}. Runs in-memory.</p>
        </div>
      )}

      {/* Sprig mode */}
      {node.data.transformType === 'sprig' && (
        <div>
          <label className={labelCls}>Sprig Function</label>
          <select
            value={node.data.sprigFunction || 'trim'}
            onChange={(e) => updateData('sprigFunction', e.target.value)}
            className={inputCls}
          >
            <option value="trim">trim</option>
            <option value="upper">upper</option>
            <option value="lower">lower</option>
            <option value="b64enc">b64enc (Base64 Encode)</option>
            <option value="b64dec">b64dec (Base64 Decode)</option>
            <option value="split">split</option>
            <option value="join">join</option>
            <option value="replace">replace</option>
          </select>
        </div>
      )}

      <div>
        <label className={labelCls}>Output Parameter Name</label>
        <input
          type="text"
          value={node.data.outputParam || 'result'}
          onChange={(e) => updateData('outputParam', e.target.value)}
          placeholder="result"
          className={inputCls}
        />
      </div>
    </div>
  );

  /* ===== ASSEMBLER CONFIG ===== */
  const assemblerModes = [
    { value: 'concat', label: 'Concatenate' },
    { value: 'merge', label: 'JSON Merge' },
    { value: 'ai_summarize', label: 'AI Summarize' },
  ];

  const assemblerFormats = [
    { value: 'text', label: 'Text' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
  ];

  const renderAssemblerConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Assembly Mode</label>
        <select
          value={node.data.assemblyMode || 'concat'}
          onChange={(e) => updateData('assemblyMode', e.target.value)}
          className={inputCls}
        >
          {assemblerModes.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <p className="text-[10px] text-gray-400 mt-0.5">How to combine upstream step outputs</p>
      </div>

      <div>
        <label className={labelCls}>Output Format</label>
        <select
          value={node.data.outputFormat || 'text'}
          onChange={(e) => updateData('outputFormat', e.target.value)}
          className={inputCls}
        >
          {assemblerFormats.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {node.data.assemblyMode === 'ai_summarize' && (
        <div>
          <label className={labelCls}>Instructions</label>
          <textarea
            value={node.data.instructions || ''}
            onChange={(e) => updateData('instructions', e.target.value)}
            placeholder="Summarize the upstream results into a concise report..."
            rows={4}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Instructions for the AI summarization step</p>
        </div>
      )}

      {/* Timeout & Retry */}
      <div className="border-t border-gray-100 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Timeout</label>
            <input
              type="text"
              value={node.data.timeout || '5m'}
              onChange={(e) => updateData('timeout', e.target.value)}
              placeholder="5m"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Retry Limit</label>
            <input
              type="number"
              value={node.data.retryStrategy?.limit || 0}
              onChange={(e) => updateRetry('limit', parseInt(e.target.value) || 0)}
              min={0}
              max={10}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>When (conditional)</label>
        <input
          type="text"
          value={node.data.when || ''}
          onChange={(e) => updateData('when', e.target.value)}
          placeholder="{{tasks.prev-step.outputs.result}} != ''"
          className={inputCls}
        />
      </div>
    </div>
  );

  /* ===== SYNC CONFIG ===== */
  const syncTargetTypes = [
    { value: 'in_app', label: 'In-App Notification' },
    { value: 'webhook', label: 'Webhook' },
    { value: 'slack', label: 'Slack' },
    { value: 'email', label: 'Email' },
  ];

  const updateTarget = (index, field, value) => {
    const targets = [...(node.data.targets || [])];
    targets[index] = { ...targets[index], [field]: value };
    updateData('targets', targets);
  };

  const addTarget = () => {
    updateData('targets', [...(node.data.targets || []), { type: 'in_app', url: '', includeResult: true, messageTemplate: '' }]);
  };

  const removeTarget = (index) => {
    updateData('targets', (node.data.targets || []).filter((_, i) => i !== index));
  };

  const renderSyncConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Delivery Targets</label>
        {(node.data.targets || []).map((target, i) => (
          <div key={i} className="mb-3 p-2.5 bg-violet-50 border border-violet-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-violet-600 uppercase">Target {i + 1}</span>
              <button onClick={() => removeTarget(i)} className="text-red-400 hover:text-red-600 p-0.5">
                <X size={12} />
              </button>
            </div>
            <div>
              <label className="text-[10px] text-gray-500">Type</label>
              <select
                value={target.type || 'in_app'}
                onChange={(e) => updateTarget(i, 'type', e.target.value)}
                className={inputCls}
              >
                {syncTargetTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {(target.type === 'webhook' || target.type === 'slack' || target.type === 'email') && (
              <div>
                <label className="text-[10px] text-gray-500">URL</label>
                <input
                  type="text"
                  value={target.url || ''}
                  onChange={(e) => updateTarget(i, 'url', e.target.value)}
                  placeholder={target.type === 'slack' ? 'https://hooks.slack.com/...' : target.type === 'email' ? 'https://email-service/send' : 'https://example.com/webhook'}
                  className={inputCls}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`include_result_${i}`}
                checked={target.includeResult !== false}
                onChange={(e) => updateTarget(i, 'includeResult', e.target.checked)}
                className="rounded border-gray-300 text-violet-500 focus:ring-violet-500"
              />
              <label htmlFor={`include_result_${i}`} className="text-xs text-gray-600">Include workflow result</label>
            </div>
            <div>
              <label className="text-[10px] text-gray-500">Message Template (optional)</label>
              <textarea
                value={target.messageTemplate || ''}
                onChange={(e) => updateTarget(i, 'messageTemplate', e.target.value)}
                placeholder="Workflow '{{workflow_name}}' completed: {{result}}"
                rows={2}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y"
              />
            </div>
          </div>
        ))}
        <button
          onClick={addTarget}
          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 mt-1"
        >
          <Plus size={12} /> Add Target
        </button>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="on_exit"
            checked={node.data.onExit || false}
            onChange={(e) => updateData('onExit', e.target.checked)}
            className="rounded border-gray-300 text-violet-500 focus:ring-violet-500"
          />
          <label htmlFor="on_exit" className="text-xs text-gray-600">Use as onExit handler</label>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          When checked, this sync step runs after the workflow completes (success or failure), not as a DAG step.
        </p>
      </div>

      <div>
        <label className={labelCls}>Timeout</label>
        <input
          type="text"
          value={node.data.timeout || '30s'}
          onChange={(e) => updateData('timeout', e.target.value)}
          placeholder="30s"
          className={inputCls}
        />
      </div>
    </div>
  );

  const renderEventSourceConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Trigger Type</label>
        <select
          value={node.data.triggerType || 'manual'}
          onChange={(e) => handleTriggerTypeChange(e.target.value)}
          className={inputCls}
        >
          {triggerTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* === MANUAL TRIGGER === */}
      {(node.data.triggerType === 'manual' || !node.data.triggerType) && (
        <div className="space-y-3">
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Input Parameters</label>
              <button
                onClick={() => setParamsModalOpen(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                <Settings size={12} /> Manage Parameters
              </button>
            </div>
            {inputParams.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic">
                No input parameters defined. Users will run this workflow without any inputs.
              </p>
            ) : (
              <div className="space-y-1">
                {inputParams.map((param, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-xs font-medium text-gray-700">{param.label || param.name}</span>
                    <span className="text-[10px] text-gray-400">({param.type || 'string'})</span>
                    {param.required && <span className="text-[10px] text-red-500">*</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results Destination */}
          <div>
            <label className={labelCls}>Results Destination</label>
            <select
              value={node.data.config?.output_mode || 'none'}
              onChange={(e) => updateConfig('output_mode', e.target.value)}
              className={inputCls}
            >
              <option value="none">Display only (no save)</option>
              {outputModeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-0.5">Where to save workflow results</p>
          </div>

          {node.data.config?.output_mode === 'specific' && (
            <NotebookChips
              ids={node.data.config?.output_notebook_id ? [node.data.config.output_notebook_id] : []}
              notebooks={notebooks}
              onRemove={() => updateConfig('output_notebook_id', '')}
              onOpenSelector={() => openNotebookSelector('output_notebook_id', false)}
              label="Output Notebook"
              multiSelect={false}
            />
          )}
        </div>
      )}

      {/* === SCHEDULE TRIGGER === */}
      {node.data.triggerType === 'schedule' && (
        <SchedulePickerPanel
          config={node.data.config}
          onConfigChange={updateConfig}
        />
      )}

      {/* === FILE UPLOAD TRIGGER === */}
      {(node.data.triggerType === 'upload' || node.data.triggerType === 'file_upload') && (
        <>
          <div>
            <label className={labelCls}>Accepted File Types</label>
            <input
              type="text"
              value={safeJoin(node.data.config?.accepted_extensions) || safeJoin(node.data.config?.accepted_types)}
              onChange={(e) => updateConfig('accepted_extensions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="pdf, docx, png, jpg"
              className={inputCls}
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Leave empty to accept all file types</p>
          </div>

          <div>
            <label className={labelCls}>Trigger Source</label>
            <select
              value={node.data.config?.source_filter || 'any'}
              onChange={(e) => updateConfig('source_filter', e.target.value)}
              className={inputCls}
            >
              {sourceFilterOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {node.data.config?.source_filter === 'notebook' && (
            <NotebookChips
              ids={node.data.config?.notebook_ids || []}
              notebooks={notebooks}
              onRemove={(id) => removeNotebookId('notebook_ids', id)}
              onOpenSelector={() => openNotebookSelector('notebook_ids', true)}
              label="Watch Notebooks"
              multiSelect
            />
          )}

          <div>
            <label className={labelCls}>Tag Filters (optional)</label>
            <input
              type="text"
              value={safeJoin(node.data.config?.tag_filters)}
              onChange={(e) => updateConfig('tag_filters', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="compliance, invoice"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Max File Size (MB)</label>
            <input
              type="number"
              value={node.data.config?.max_file_size_mb || ''}
              onChange={(e) => updateConfig('max_file_size_mb', parseInt(e.target.value) || 0)}
              min={0}
              placeholder="0 = no limit"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Results Destination</label>
            <select
              value={node.data.config?.output_mode || 'same_notebook'}
              onChange={(e) => updateConfig('output_mode', e.target.value)}
              className={inputCls}
            >
              {outputModeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {node.data.config?.output_mode === 'specific' && (
            <NotebookChips
              ids={node.data.config?.output_notebook_id ? [node.data.config.output_notebook_id] : []}
              notebooks={notebooks}
              onRemove={() => updateConfig('output_notebook_id', '')}
              onOpenSelector={() => openNotebookSelector('output_notebook_id', false)}
              label="Output Notebook"
              multiSelect={false}
            />
          )}

          {/* Input Parameters for file upload workflows */}
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Input Parameters</label>
              <button
                onClick={() => setParamsModalOpen(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                <Settings size={12} /> Manage Parameters
              </button>
            </div>
            {inputParams.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic">
                No additional parameters. Users will only select a file to upload.
              </p>
            ) : (
              <div className="space-y-1">
                {inputParams.map((param, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-xs font-medium text-gray-700">{param.label || param.name}</span>
                    <span className="text-[10px] text-gray-400">({param.type || 'string'})</span>
                    {param.required && <span className="text-[10px] text-red-500">*</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {node.data.config?.upload_endpoint && (
            <div>
              <label className={labelCls}>Upload API URL</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={node.data.config.upload_endpoint}
                  readOnly
                  className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(node.data.config.upload_endpoint)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                  title="Copy URL"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* === DOCUMENT EVENT TRIGGER === */}
      {node.data.triggerType === 'document_event' && (
        <>
          <div>
            <label className={labelCls}>Event Type</label>
            <select
              value={node.data.config?.event_type || 'processing.completed'}
              onChange={(e) => updateConfig('event_type', e.target.value)}
              className={inputCls}
            >
              {documentEventTypes.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-0.5">Maps to Kafka EventSource topic</p>
          </div>

          <NotebookChips
            ids={node.data.config?.notebook_ids || []}
            notebooks={notebooks}
            onRemove={(id) => removeNotebookId('notebook_ids', id)}
            onOpenSelector={() => openNotebookSelector('notebook_ids', true)}
            label="Watch Notebooks"
            multiSelect
          />

          <div>
            <label className={labelCls}>MIME / File Type Filter</label>
            <input
              type="text"
              value={safeJoin(node.data.config?.mime_filter)}
              onChange={(e) => updateConfig('mime_filter', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="pdf, docx"
              className={inputCls}
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Filter by file type (used in Kafka event dependency filter)</p>
          </div>

          <div>
            <label className={labelCls}>Results Destination</label>
            <select
              value={node.data.config?.output_mode || 'same_notebook'}
              onChange={(e) => updateConfig('output_mode', e.target.value)}
              className={inputCls}
            >
              {outputModeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {node.data.config?.output_mode === 'specific' && (
            <NotebookChips
              ids={node.data.config?.output_notebook_id ? [node.data.config.output_notebook_id] : []}
              notebooks={notebooks}
              onRemove={() => updateConfig('output_notebook_id', '')}
              onOpenSelector={() => openNotebookSelector('output_notebook_id', false)}
              label="Output Notebook"
              multiSelect={false}
            />
          )}
        </>
      )}

      {/* === WEBHOOK TRIGGER === */}
      {node.data.triggerType === 'webhook' && (
        <ArgoEventSourcePicker
          config={node.data.config}
          onConfigChange={updateConfig}
        />
      )}

      {/* === API TRIGGER === */}
      {node.data.triggerType === 'api' && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Endpoint URL</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={node.data.config?.api_endpoint || `/api/v1/workflows/{id}/execute`}
                readOnly
                className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-600 font-mono"
              />
              <button
                onClick={() => navigator.clipboard.writeText(node.data.config?.api_endpoint || `/api/v1/workflows/{id}/execute`)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                title="Copy URL"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Shield size={12} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-700">
              Requires Bearer token (Keycloak). Include <code className="bg-amber-100 px-1 rounded">Authorization: Bearer &lt;token&gt;</code> header.
            </p>
          </div>

          <div>
            <button
              onClick={() => setApiCurlExpanded(!apiCurlExpanded)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <Terminal size={12} />
              <ChevronDown size={12} className={`transition-transform ${apiCurlExpanded ? 'rotate-0' : '-rotate-90'}`} />
              Example curl command
            </button>
            {apiCurlExpanded && (
              <div className="mt-1.5 p-2 bg-gray-900 rounded-lg overflow-x-auto">
                <pre className="text-[10px] text-green-400 whitespace-pre-wrap">
{`curl -X POST \\
  ${node.data.config?.api_endpoint || '/api/v1/workflows/{id}/execute'} \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"parameters": {}}'`}
                </pre>
              </div>
            )}
          </div>
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
            value={safeJoin(node.data.config?.channels)}
            onChange={(e) => updateConfig('channels', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="email, in_app"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {node.data.actionType === 'assemble_output' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Output Format</label>
            <select
              value={node.data.config?.output_format || 'pdf'}
              onChange={(e) => updateConfig('output_format', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {outputFormatOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assembly Mode</label>
            <select
              value={node.data.config?.assembly_mode || 'ai'}
              onChange={(e) => updateConfig('assembly_mode', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {assemblyModeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {(node.data.config?.assembly_mode || 'ai') === 'ai' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
              <textarea
                value={node.data.config?.instructions || ''}
                onChange={(e) => updateConfig('instructions', e.target.value)}
                placeholder="Describe what to produce from the workflow results..."
                rows={3}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {node.data.config?.assembly_mode === 'template' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Template ID</label>
              <input
                type="text"
                value={node.data.config?.template_id || ''}
                onChange={(e) => updateConfig('template_id', e.target.value)}
                placeholder="Template reference ID"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Document Name</label>
            <input
              type="text"
              value={node.data.config?.document_name || ''}
              onChange={(e) => updateConfig('document_name', e.target.value)}
              placeholder="{{workflow.name}} — {{date}}"
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Supports {'{{workflow.name}}'} and {'{{date}}'} placeholders</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include_all_steps"
              checked={node.data.config?.include_all_steps !== false}
              onChange={(e) => updateConfig('include_all_steps', e.target.checked)}
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="include_all_steps" className="text-xs text-gray-600">Include results from all previous steps</label>
          </div>
        </>
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
        <label className={labelCls}>Condition Type</label>
        <select
          value={node.data.conditionType || 'expression'}
          onChange={(e) => updateData('conditionType', e.target.value)}
          className={inputCls}
        >
          <option value="expression">Expression (Argo)</option>
          {conditionTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Expression mode (Argo when) */}
      {node.data.conditionType === 'expression' && (
        <div>
          <label className={labelCls}>Expression *</label>
          <textarea
            value={node.data.expression || ''}
            onChange={(e) => updateData('expression', e.target.value)}
            placeholder="{{tasks.score-step.outputs.result}} >= 80"
            rows={3}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-y"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">
            Argo `when` expression. True branch follows, false branch skipped.
          </p>
        </div>
      )}

      {/* Legacy field/value modes */}
      {node.data.conditionType !== 'expression' && (
        <>
          <div>
            <label className={labelCls}>Field</label>
            <input
              type="text"
              value={node.data.config?.field || ''}
              onChange={(e) => updateConfig('field', e.target.value)}
              placeholder="e.g., status, score, result"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Value</label>
            <input
              type="text"
              value={node.data.config?.value || ''}
              onChange={(e) => updateConfig('value', e.target.value)}
              placeholder="Value to compare against"
              className={inputCls}
            />
          </div>
        </>
      )}
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

  const renderMergeConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Merge Mode *</label>
        <select
          value={node.data.config?.merge_mode || 'append'}
          onChange={(e) => updateConfig('merge_mode', e.target.value)}
          className={inputCls}
        >
          {mergeModes.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {node.data.config?.merge_mode === 'append' && 'Concatenates all inputs into a single array.'}
          {node.data.config?.merge_mode === 'combine-by-position' && 'Zips inputs by array position.'}
          {node.data.config?.merge_mode === 'combine-by-field' && 'Joins inputs by a shared field key.'}
          {node.data.config?.merge_mode === 'choose-branch' && 'Picks the first non-empty branch.'}
        </p>
      </div>

      {node.data.config?.merge_mode === 'combine-by-field' && (
        <div>
          <label className={labelCls}>Join Field</label>
          <input
            type="text"
            value={node.data.config?.join_field || ''}
            onChange={(e) => updateConfig('join_field', e.target.value)}
            placeholder="e.g., id, document_id"
            className={inputCls}
          />
        </div>
      )}

      {node.data.config?.merge_mode === 'choose-branch' && (
        <div>
          <label className={labelCls}>Preferred Branch Index</label>
          <input
            type="number"
            value={node.data.config?.preferred_branch ?? 0}
            onChange={(e) => updateConfig('preferred_branch', parseInt(e.target.value) || 0)}
            min={0}
            className={inputCls}
          />
          <p className="text-[10px] text-gray-400 mt-0.5">0-based index of the preferred input branch</p>
        </div>
      )}

      <div>
        <label className={labelCls}>Timeout (seconds)</label>
        <input
          type="number"
          value={node.data.timeout || 300}
          onChange={(e) => updateData('timeout', parseInt(e.target.value) || 300)}
          min={1}
          className={inputCls}
        />
      </div>
    </div>
  );

  const renderLoopConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Input Array Source</label>
        <input
          type="text"
          value={node.data.config?.input_source || ''}
          onChange={(e) => updateConfig('input_source', e.target.value)}
          placeholder="{{tasks.upstream.outputs.result}}"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
        />
        <p className="text-[10px] text-gray-400 mt-0.5">
          Argo expression referencing an upstream JSON array output.
        </p>
      </div>

      <div>
        <label className={labelCls}>Batch Size</label>
        <input
          type="number"
          value={node.data.config?.batch_size || 1}
          onChange={(e) => updateConfig('batch_size', Math.max(1, parseInt(e.target.value) || 1))}
          min={1}
          className={inputCls}
        />
        <p className="text-[10px] text-gray-400 mt-0.5">Items per batch (1 = process individually)</p>
      </div>

      <div>
        <label className={labelCls}>Max Parallelism</label>
        <input
          type="number"
          value={node.data.config?.max_parallelism || 0}
          onChange={(e) => updateConfig('max_parallelism', parseInt(e.target.value) || 0)}
          min={0}
          className={inputCls}
        />
        <p className="text-[10px] text-gray-400 mt-0.5">0 = unlimited parallel iterations</p>
      </div>

      <div>
        <label className={labelCls}>Timeout (seconds)</label>
        <input
          type="number"
          value={node.data.timeout || 300}
          onChange={(e) => updateData('timeout', parseInt(e.target.value) || 300)}
          min={1}
          className={inputCls}
        />
      </div>
    </div>
  );

  const renderSubWorkflowConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Workflow Reference *</label>
        <input
          type="text"
          value={node.data.config?.workflow_ref || ''}
          onChange={(e) => updateConfig('workflow_ref', e.target.value)}
          placeholder="Workflow ID or WorkflowTemplate name"
          className={inputCls}
        />
        <p className="text-[10px] text-gray-400 mt-0.5">
          The Argo WorkflowTemplate to invoke as a sub-workflow.
        </p>
      </div>

      <div>
        <label className={labelCls}>Parameters (JSON)</label>
        <textarea
          value={node.data.config?.parameters ? JSON.stringify(node.data.config.parameters, null, 2) : '{}'}
          onChange={(e) => {
            try {
              updateConfig('parameters', JSON.parse(e.target.value));
            } catch { /* ignore parse errors while typing */ }
          }}
          placeholder='{"key": "value"}'
          rows={4}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-y"
        />
        <p className="text-[10px] text-gray-400 mt-0.5">
          Parameters passed to the sub-workflow. Use Argo template refs.
        </p>
      </div>

      <div>
        <label className={labelCls}>Timeout (seconds)</label>
        <input
          type="number"
          value={node.data.timeout || 600}
          onChange={(e) => updateData('timeout', parseInt(e.target.value) || 600)}
          min={1}
          className={inputCls}
        />
      </div>
    </div>
  );

  const renderErrorHandlerConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Error Action *</label>
        <select
          value={node.data.config?.error_action || 'log'}
          onChange={(e) => updateConfig('error_action', e.target.value)}
          className={inputCls}
        >
          {errorHandlerActions.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      {node.data.config?.error_action === 'notify' && (
        <div>
          <label className={labelCls}>Notification URL</label>
          <input
            type="text"
            value={node.data.config?.notify_url || ''}
            onChange={(e) => updateConfig('notify_url', e.target.value)}
            placeholder="https://hooks.slack.com/..."
            className={inputCls}
          />
        </div>
      )}

      {node.data.config?.error_action === 'retry' && (
        <>
          <div>
            <label className={labelCls}>Max Retries</label>
            <input
              type="number"
              value={node.data.config?.max_retries || 3}
              onChange={(e) => updateConfig('max_retries', Math.min(10, Math.max(1, parseInt(e.target.value) || 3)))}
              min={1}
              max={10}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Retry Delay (seconds)</label>
            <input
              type="number"
              value={node.data.config?.retry_delay || 60}
              onChange={(e) => updateConfig('retry_delay', parseInt(e.target.value) || 60)}
              min={1}
              className={inputCls}
            />
          </div>
        </>
      )}

      <div>
        <label className={labelCls}>Error Message Template</label>
        <textarea
          value={node.data.config?.error_message || ''}
          onChange={(e) => updateConfig('error_message', e.target.value)}
          placeholder="Workflow {{workflow.name}} failed: {{error}}"
          rows={2}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
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
      case 'container': return renderContainerConfig();
      case 'script': return renderScriptConfig();
      case 'http': return renderHttpConfig();
      case 'aiTask': return renderAITaskConfig();
      case 'suspend': return renderSuspendConfig();
      case 'transform': return renderTransformConfig();
      case 'assembler': return renderAssemblerConfig();
      case 'sync': return renderSyncConfig();
      case 'merge': return renderMergeConfig();
      case 'loop': return renderLoopConfig();
      case 'subworkflow': return renderSubWorkflowConfig();
      case 'errorHandler': return renderErrorHandlerConfig();
      default: return <p className="text-sm text-gray-500">No configuration available.</p>;
    }
  };

  // Get selected IDs for notebook selector
  const getSelectorSelectedIds = () => {
    if (!selectorTarget) return [];
    const val = node.data.config?.[selectorTarget];
    if (Array.isArray(val)) return val;
    if (val) return [val];
    return [];
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

      {/* Tabs */}
      {node.type !== 'eventSource' && (
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 text-xs font-medium py-2 border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Config
          </button>
          <button
            onClick={() => setActiveTab('lastRun')}
            className={`flex-1 text-xs font-medium py-2 border-b-2 transition-colors ${
              activeTab === 'lastRun'
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Last Run
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Last Run Tab */}
        {activeTab === 'lastRun' && node.type !== 'eventSource' && (() => {
          const taskName = (node.data.label || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 60) || 'step';
          const status = liveNodeStatuses[taskName];

          if (!status) {
            return (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No execution data available.</p>
                <p className="text-xs text-gray-400 mt-1">Run the workflow to see step results here.</p>
              </div>
            );
          }

          const phaseColors = {
            Succeeded: 'green',
            Running: 'blue',
            Failed: 'red',
            Error: 'red',
            Pending: 'gray',
            Skipped: 'gray',
          };
          const color = phaseColors[status.phase] || 'gray';

          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full bg-${color}-500`} />
                <span className={`text-sm font-medium text-${color}-700`}>{status.phase}</span>
              </div>

              {status.startedAt && (
                <div>
                  <label className={labelCls}>Started</label>
                  <p className="text-xs text-gray-600">{new Date(status.startedAt).toLocaleString()}</p>
                </div>
              )}

              {status.finishedAt && (
                <div>
                  <label className={labelCls}>Finished</label>
                  <p className="text-xs text-gray-600">{new Date(status.finishedAt).toLocaleString()}</p>
                </div>
              )}

              {status.message && (
                <div>
                  <label className={labelCls}>Message</label>
                  <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 font-mono break-all">{status.message}</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Config Tab (or always for eventSource) */}
        {(activeTab === 'config' || node.type === 'eventSource') && <>
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

        {/* Data Pinning — available for all non-trigger nodes */}
        {node.type !== 'eventSource' && (
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="pin-data-toggle"
                checked={!!node.data.pinnedData}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateData('pinnedData', node.data.pinnedData || '{"result": "pinned test data"}');
                  } else {
                    updateData('pinnedData', null);
                  }
                }}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="pin-data-toggle" className="text-xs font-medium text-gray-600">
                Pin Output Data
              </label>
              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Test</span>
            </div>
            {node.data.pinnedData && (
              <textarea
                value={typeof node.data.pinnedData === 'string' ? node.data.pinnedData : JSON.stringify(node.data.pinnedData, null, 2)}
                onChange={(e) => updateData('pinnedData', e.target.value)}
                placeholder='{"result": "test value"}'
                rows={4}
                className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y"
              />
            )}
          </div>
        )}
        </>}
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

      {/* Notebook Selector Modal */}
      <NotebookSelectorModal
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleNotebookSelect}
        selectedIds={getSelectorSelectedIds()}
        multiSelect={selectorMulti}
        title={selectorMulti ? 'Select Notebooks' : 'Select Notebook'}
      />

      {/* Parameter Manager Modal */}
      <ParameterManagerModal
        isOpen={paramsModalOpen}
        onClose={() => setParamsModalOpen(false)}
        parameters={inputParams}
        onSave={(params) => updateConfig('input_parameters', params)}
      />
    </div>
  );
};

export default NodeConfigPanel;
