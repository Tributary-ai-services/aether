import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  GripVertical,
} from 'lucide-react';

const PARAM_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'enum', label: 'Enum (Dropdown)' },
  { value: 'json', label: 'JSON' },
  { value: 'array', label: 'Array (Tags)' },
  { value: 'file', label: 'File' },
  { value: 'datetime', label: 'Date/Time' },
  { value: 'secret', label: 'Secret' },
  { value: 'reference', label: 'Reference (Lookup)' },
];

const inputClass =
  'w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const selectClass = inputClass;
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

const ParameterEditor = ({ param, onChange, onRemove }) => {
  const [expanded, setExpanded] = useState(true);

  const update = (field, value) => {
    onChange({ ...param, [field]: value });
  };

  const renderTypeSpecificFields = () => {
    switch (param.type) {
      case 'string':
        return (
          <>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`${param.name}-multiline`}
                checked={param.multiline || false}
                onChange={(e) => update('multiline', e.target.checked)}
                className="rounded border-gray-300 text-blue-500"
              />
              <label htmlFor={`${param.name}-multiline`} className="text-xs text-gray-600">
                Multiline
              </label>
            </div>
            <div>
              <label className={labelClass}>Pattern (regex)</label>
              <input
                type="text"
                value={param.pattern || ''}
                onChange={(e) => update('pattern', e.target.value)}
                placeholder="^[a-z]+$"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Min Length</label>
                <input
                  type="number"
                  value={param.minLength ?? ''}
                  onChange={(e) => update('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  min={0}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Max Length</label>
                <input
                  type="number"
                  value={param.maxLength ?? ''}
                  onChange={(e) => update('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  min={0}
                  className={inputClass}
                />
              </div>
            </div>
          </>
        );

      case 'number':
        return (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>Min</label>
                <input
                  type="number"
                  value={param.min ?? ''}
                  onChange={(e) => update('min', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Max</label>
                <input
                  type="number"
                  value={param.max ?? ''}
                  onChange={(e) => update('max', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Step</label>
                <input
                  type="number"
                  value={param.step ?? ''}
                  onChange={(e) => update('step', e.target.value ? parseFloat(e.target.value) : undefined)}
                  min={0}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`${param.name}-integer`}
                checked={param.integer || false}
                onChange={(e) => update('integer', e.target.checked)}
                className="rounded border-gray-300 text-blue-500"
              />
              <label htmlFor={`${param.name}-integer`} className="text-xs text-gray-600">
                Integer only
              </label>
            </div>
          </>
        );

      case 'enum':
        return (
          <div>
            <label className={labelClass}>Options</label>
            <div className="space-y-1.5">
              {(param.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={opt.label || ''}
                    onChange={(e) => {
                      const opts = [...(param.options || [])];
                      opts[idx] = { ...opts[idx], label: e.target.value };
                      update('options', opts);
                    }}
                    placeholder="Label"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={opt.value || ''}
                    onChange={(e) => {
                      const opts = [...(param.options || [])];
                      opts[idx] = { ...opts[idx], value: e.target.value };
                      update('options', opts);
                    }}
                    placeholder="Value"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      const opts = (param.options || []).filter((_, i) => i !== idx);
                      update('options', opts);
                    }}
                    className="p-0.5 text-gray-400 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const opts = [...(param.options || []), { label: '', value: '' }];
                  update('options', opts);
                }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Plus size={12} /> Add option
              </button>
            </div>
          </div>
        );

      case 'array':
        return (
          <>
            <div>
              <label className={labelClass}>Item Type</label>
              <select
                value={param.itemType || 'string'}
                onChange={(e) => update('itemType', e.target.value)}
                className={selectClass}
              >
                <option value="string">String</option>
                <option value="number">Number</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Min Items</label>
                <input
                  type="number"
                  value={param.minItems ?? ''}
                  onChange={(e) => update('minItems', e.target.value ? parseInt(e.target.value) : undefined)}
                  min={0}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Max Items</label>
                <input
                  type="number"
                  value={param.maxItems ?? ''}
                  onChange={(e) => update('maxItems', e.target.value ? parseInt(e.target.value) : undefined)}
                  min={0}
                  className={inputClass}
                />
              </div>
            </div>
          </>
        );

      case 'file':
        return (
          <>
            <div>
              <label className={labelClass}>Accepted Types</label>
              <input
                type="text"
                value={(param.acceptedTypes || []).join(', ')}
                onChange={(e) =>
                  update(
                    'acceptedTypes',
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="pdf, docx, png"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max Size (bytes)</label>
              <input
                type="number"
                value={param.maxSize ?? ''}
                onChange={(e) => update('maxSize', e.target.value ? parseInt(e.target.value) : undefined)}
                min={0}
                placeholder="52428800"
                className={inputClass}
              />
              <p className="text-[10px] text-gray-400 mt-0.5">
                {param.maxSize ? `${(param.maxSize / 1048576).toFixed(1)} MB` : 'No limit'}
              </p>
            </div>
          </>
        );

      case 'datetime':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Min Date</label>
              <input
                type="datetime-local"
                value={param.min || ''}
                onChange={(e) => update('min', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max Date</label>
              <input
                type="datetime-local"
                value={param.max || ''}
                onChange={(e) => update('max', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        );

      case 'secret':
        return (
          <div>
            <label className={labelClass}>Credential Type</label>
            <select
              value={param.credentialType || 'api_key'}
              onChange={(e) => update('credentialType', e.target.value)}
              className={selectClass}
            >
              <option value="api_key">API Key</option>
              <option value="password">Password</option>
              <option value="token">Token</option>
              <option value="certificate">Certificate</option>
            </select>
          </div>
        );

      case 'reference':
        return (
          <>
            <div>
              <label className={labelClass}>Lookup Endpoint</label>
              <input
                type="text"
                value={param.lookupSource?.endpoint || ''}
                onChange={(e) =>
                  update('lookupSource', {
                    ...(param.lookupSource || {}),
                    endpoint: e.target.value,
                  })
                }
                placeholder="/api/v1/agents"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Label Field</label>
                <input
                  type="text"
                  value={param.lookupSource?.labelField || ''}
                  onChange={(e) =>
                    update('lookupSource', {
                      ...(param.lookupSource || {}),
                      labelField: e.target.value,
                    })
                  }
                  placeholder="name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Value Field</label>
                <input
                  type="text"
                  value={param.lookupSource?.valueField || ''}
                  onChange={(e) =>
                    update('lookupSource', {
                      ...(param.lookupSource || {}),
                      valueField: e.target.value,
                    })
                  }
                  placeholder="id"
                  className={inputClass}
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="text-sm font-medium text-gray-800 flex-1">
          {param.name || 'unnamed'}{' '}
          <span className="text-gray-400 font-normal">({param.type || 'string'})</span>
        </span>
        <span className="text-[10px] text-gray-500">
          {param.label || ''} {param.required ? '* Required' : ''}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 text-gray-400 hover:text-red-500"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-3 space-y-3 border-t border-gray-200">
          {/* Name + Label */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Name (identifier)</label>
              <input
                type="text"
                value={param.name || ''}
                onChange={(e) =>
                  update('name', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
                }
                placeholder="param_name"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass}>Label (display)</label>
              <input
                type="text"
                value={param.label || ''}
                onChange={(e) => update('label', e.target.value)}
                placeholder="Parameter Label"
                className={inputClass}
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className={labelClass}>Type</label>
            <select
              value={param.type || 'string'}
              onChange={(e) => update('type', e.target.value)}
              className={selectClass}
            >
              {PARAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Required */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`${param.name}-required`}
              checked={param.required || false}
              onChange={(e) => update('required', e.target.checked)}
              className="rounded border-gray-300 text-blue-500"
            />
            <label htmlFor={`${param.name}-required`} className="text-xs text-gray-600">
              Required
            </label>
          </div>

          {/* Default value */}
          {param.type !== 'file' && param.type !== 'secret' && (
            <div>
              <label className={labelClass}>Default Value</label>
              {param.type === 'boolean' ? (
                <select
                  value={param.default === true ? 'true' : param.default === false ? 'false' : ''}
                  onChange={(e) =>
                    update('default', e.target.value === '' ? undefined : e.target.value === 'true')
                  }
                  className={selectClass}
                >
                  <option value="">No default</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              ) : param.type === 'enum' ? (
                <select
                  value={param.default || ''}
                  onChange={(e) => update('default', e.target.value || undefined)}
                  className={selectClass}
                >
                  <option value="">No default</option>
                  {(param.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={param.type === 'number' ? 'number' : 'text'}
                  value={param.default ?? ''}
                  onChange={(e) => update('default', e.target.value || undefined)}
                  placeholder="Default value"
                  className={inputClass}
                />
              )}
            </div>
          )}

          {/* Type-specific fields */}
          {renderTypeSpecificFields()}

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={param.description || ''}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Help text for this parameter..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ParameterEditor;
