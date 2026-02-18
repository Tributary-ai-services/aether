import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import { Play, X, Plus, Upload, Loader2 } from 'lucide-react';
import { aetherApi } from '../../services/aetherApi.js';

// Extracted to its own component to avoid useState inside switch/renderField
const ArrayTagInput = ({ items, onChange, borderClass }) => {
  const [tagInput, setTagInput] = useState('');
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
          >
            {item}
            <button
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              className="text-blue-400 hover:text-blue-700"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tagInput.trim()) {
              e.preventDefault();
              onChange([...items, tagInput.trim()]);
              setTagInput('');
            }
          }}
          placeholder="Type and press Enter"
          className={`flex-1 px-2 py-1.5 border ${borderClass} rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
        />
        <button
          onClick={() => {
            if (tagInput.trim()) {
              onChange([...items, tagInput.trim()]);
              setTagInput('');
            }
          }}
          className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

const ManualRunDialog = ({ isOpen, onClose, onSubmit, parameters = [] }) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [referenceOptions, setReferenceOptions] = useState({});
  const [loadingRefs, setLoadingRefs] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Initialize with defaults
      const defaults = {};
      parameters.forEach((p) => {
        if (p.default !== undefined) {
          defaults[p.name] = p.default;
        } else if (p.type === 'boolean') {
          defaults[p.name] = false;
        } else if (p.type === 'array') {
          defaults[p.name] = [];
        }
      });
      setValues(defaults);
      setErrors({});

      // Load reference options
      parameters
        .filter((p) => p.type === 'reference' && p.lookupSource?.endpoint)
        .forEach((p) => loadReferenceOptions(p));
    }
  }, [isOpen, parameters]);

  const loadReferenceOptions = async (param) => {
    setLoadingRefs((prev) => ({ ...prev, [param.name]: true }));
    try {
      const response = await aetherApi.request(param.lookupSource.endpoint);
      const items = response.data?.items || response.data || [];
      const labelField = param.lookupSource.labelField || 'name';
      const valueField = param.lookupSource.valueField || 'id';
      setReferenceOptions((prev) => ({
        ...prev,
        [param.name]: items.map((item) => ({
          label: item[labelField] || item.name || item.id,
          value: item[valueField] || item.id,
        })),
      }));
    } catch {
      setReferenceOptions((prev) => ({ ...prev, [param.name]: [] }));
    } finally {
      setLoadingRefs((prev) => ({ ...prev, [param.name]: false }));
    }
  };

  const updateValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};
    parameters.forEach((p) => {
      const val = values[p.name];
      if (p.required) {
        if (val === undefined || val === null || val === '') {
          errs[p.name] = `${p.label || p.name} is required`;
        }
        if (p.type === 'array' && (!Array.isArray(val) || val.length === 0)) {
          errs[p.name] = `${p.label || p.name} requires at least one item`;
        }
      }
      if (p.type === 'number' && val !== undefined && val !== '') {
        const num = Number(val);
        if (isNaN(num)) errs[p.name] = 'Must be a number';
        if (p.min !== undefined && num < p.min)
          errs[p.name] = `Must be at least ${p.min}`;
        if (p.max !== undefined && num > p.max)
          errs[p.name] = `Must be at most ${p.max}`;
      }
      if (p.type === 'json' && val) {
        try {
          JSON.parse(val);
        } catch {
          errs[p.name] = 'Invalid JSON';
        }
      }
      if (p.type === 'string' && p.pattern && val) {
        try {
          if (!new RegExp(p.pattern).test(val)) {
            errs[p.name] = `Must match pattern: ${p.pattern}`;
          }
        } catch {
          // Invalid regex pattern in config
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(values);
      onClose();
    }
  };

  const renderField = (param) => {
    const value = values[param.name];
    const error = errors[param.name];
    const fieldId = `run-param-${param.name}`;

    const wrapper = (children) => (
      <div key={param.name} className="space-y-1">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {param.label || param.name}
          {param.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {param.description && (
          <p className="text-xs text-gray-500">{param.description}</p>
        )}
        {children}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );

    const inputClass =
      'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    const borderClass = error ? 'border-red-300' : 'border-gray-300';

    switch (param.type) {
      case 'string':
        return wrapper(
          param.multiline ? (
            <textarea
              id={fieldId}
              value={value || ''}
              onChange={(e) => updateValue(param.name, e.target.value)}
              rows={3}
              className={`${inputClass} ${borderClass} resize-none`}
              placeholder={param.default || ''}
            />
          ) : (
            <input
              id={fieldId}
              type="text"
              value={value || ''}
              onChange={(e) => updateValue(param.name, e.target.value)}
              className={`${inputClass} ${borderClass}`}
              placeholder={param.default || ''}
            />
          )
        );

      case 'number':
        return wrapper(
          <input
            id={fieldId}
            type="number"
            value={value ?? ''}
            onChange={(e) => updateValue(param.name, e.target.value)}
            min={param.min}
            max={param.max}
            step={param.step || (param.integer ? 1 : 'any')}
            className={`${inputClass} ${borderClass}`}
            placeholder={param.default?.toString() || ''}
          />
        );

      case 'boolean':
        return wrapper(
          <button
            id={fieldId}
            type="button"
            onClick={() => updateValue(param.name, !value)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              value ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                value ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        );

      case 'enum':
        return wrapper(
          <select
            id={fieldId}
            value={value || ''}
            onChange={(e) => updateValue(param.name, e.target.value)}
            className={`${inputClass} ${borderClass}`}
          >
            <option value="">Select...</option>
            {(param.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'json':
        return wrapper(
          <textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => updateValue(param.name, e.target.value)}
            rows={4}
            className={`${inputClass} ${borderClass} font-mono text-xs resize-none`}
            placeholder='{"key": "value"}'
          />
        );

      case 'array': {
        const items = Array.isArray(value) ? value : [];
        return wrapper(
          <ArrayTagInput
            items={items}
            onChange={(newItems) => updateValue(param.name, newItems)}
            borderClass={borderClass}
          />
        );
      }

      case 'file':
        return wrapper(
          <div className="flex items-center gap-2">
            <label className={`flex items-center gap-2 px-3 py-2 border ${borderClass} rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-600`}>
              <Upload size={14} />
              {value?.name || 'Choose file...'}
              <input
                type="file"
                accept={param.acceptedTypes?.map((t) => `.${t}`).join(',')}
                onChange={(e) => updateValue(param.name, e.target.files[0] || null)}
                className="hidden"
              />
            </label>
            {value && (
              <button
                onClick={() => updateValue(param.name, null)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            )}
          </div>
        );

      case 'datetime':
        return wrapper(
          <input
            id={fieldId}
            type="datetime-local"
            value={value || ''}
            onChange={(e) => updateValue(param.name, e.target.value)}
            min={param.min}
            max={param.max}
            className={`${inputClass} ${borderClass}`}
          />
        );

      case 'secret':
        return wrapper(
          <input
            id={fieldId}
            type="text"
            value={value || ''}
            onChange={(e) => updateValue(param.name, e.target.value)}
            placeholder="K8s Secret name"
            className={`${inputClass} ${borderClass}`}
          />
        );

      case 'reference':
        return wrapper(
          loadingRefs[param.name] ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <Loader2 size={14} className="animate-spin" /> Loading options...
            </div>
          ) : (
            <select
              id={fieldId}
              value={value || ''}
              onChange={(e) => updateValue(param.name, e.target.value)}
              className={`${inputClass} ${borderClass}`}
            >
              <option value="">Select...</option>
              {(referenceOptions[param.name] || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )
        );

      default:
        return wrapper(
          <input
            id={fieldId}
            type="text"
            value={value || ''}
            onChange={(e) => updateValue(param.name, e.target.value)}
            className={`${inputClass} ${borderClass}`}
          />
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Run Workflow" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Configure the input parameters for this workflow run.
        </p>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {parameters.map((p) => renderField(p))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play size={14} />
            Run
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ManualRunDialog;
