import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { aetherApi } from '../../services/aetherApi.js';

const inputClass =
  'w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

const ArgoEventSourcePicker = ({ config, onConfigChange }) => {
  const [eventSources, setEventSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadEventSources();
  }, []);

  const loadEventSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aetherApi.request('/argo/event-sources');
      const sources = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];
      setEventSources(sources);
    } catch (err) {
      console.warn('Failed to load Argo event sources:', err.message);
      setError('Argo Events not available. Enter event source details manually.');
      setEventSources([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedSource = Array.isArray(eventSources)
    ? eventSources.find((es) => es.name === config?.argo_event_source)
    : null;

  // Generate webhook URL based on selection and persist to config
  const getWebhookUrl = () => {
    const eventName = config?.argo_event_name || 'my-event';
    const sourceName = config?.argo_event_source || 'webhook';
    return `http://${sourceName}-eventsource-svc.argo-events:12000/${eventName}`;
  };

  // Persist the generated webhook_url whenever source or event name changes
  const updateAndPersistUrl = (field, value) => {
    onConfigChange(field, value);
    // Compute the new URL after the field change
    const newSource = field === 'argo_event_source' ? value : (config?.argo_event_source || 'webhook');
    const newEvent = field === 'argo_event_name' ? value : (config?.argo_event_name || 'my-event');
    const url = `http://${newSource}-eventsource-svc.argo-events:12000/${newEvent}`;
    onConfigChange('webhook_url', url);
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-3">
      {/* Event Source */}
      <div>
        <label className={labelClass}>Event Source</label>
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
            <Loader2 size={12} className="animate-spin" /> Loading event sources...
          </div>
        ) : eventSources.length > 0 ? (
          <select
            value={config?.argo_event_source || ''}
            onChange={(e) => updateAndPersistUrl('argo_event_source', e.target.value)}
            className={inputClass}
          >
            <option value="">Select event source...</option>
            {eventSources.map((es) => (
              <option key={es.name} value={es.name}>
                {es.name} ({es.type || 'webhook'})
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={config?.argo_event_source || ''}
            onChange={(e) => updateAndPersistUrl('argo_event_source', e.target.value)}
            placeholder="webhook"
            className={inputClass}
          />
        )}
        {error && (
          <div className="flex items-start gap-1.5 mt-1.5">
            <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-600">{error}</p>
          </div>
        )}
      </div>

      {/* Event Name */}
      <div>
        <label className={labelClass}>Event Name</label>
        <input
          type="text"
          value={config?.argo_event_name || ''}
          onChange={(e) => updateAndPersistUrl('argo_event_name', e.target.value)}
          placeholder="workflow-trigger"
          className={inputClass}
        />
        <p className="text-[10px] text-gray-400 mt-0.5">
          The specific event within the source (e.g., workflow-trigger, github-events)
        </p>
      </div>

      {/* HTTP Method */}
      <div>
        <label className={labelClass}>HTTP Method</label>
        <select
          value={config?.http_method || 'POST'}
          onChange={(e) => onConfigChange('http_method', e.target.value)}
          className={inputClass}
        >
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="GET">GET</option>
        </select>
      </div>

      {/* Generated Webhook URL */}
      {(config?.argo_event_source || config?.argo_event_name) && (
        <div>
          <label className={labelClass}>Webhook URL</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={getWebhookUrl()}
              readOnly
              className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-600 font-mono"
            />
            <button
              onClick={() => handleCopy(getWebhookUrl())}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title={copied ? 'Copied!' : 'Copy URL'}
            >
              <Copy size={14} />
            </button>
          </div>
          {copied && (
            <p className="text-[10px] text-green-600 mt-0.5">Copied to clipboard</p>
          )}
        </div>
      )}

      {/* Source details */}
      {selectedSource && (
        <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Source Details</h4>
          <div className="space-y-0.5 text-[10px] text-gray-500">
            <div>Type: {selectedSource.type || 'webhook'}</div>
            <div>Namespace: {selectedSource.namespace || 'argo-events'}</div>
            {selectedSource.port && <div>Port: {selectedSource.port}</div>}
            {selectedSource.endpoints && (
              <div>Endpoints: {Array.isArray(selectedSource.endpoints) ? selectedSource.endpoints.join(', ') : selectedSource.endpoints}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArgoEventSourcePicker;
