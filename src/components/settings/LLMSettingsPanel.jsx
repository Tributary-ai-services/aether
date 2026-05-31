import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, CheckCircle, Loader, Shield } from 'lucide-react';

import { api } from '../../services/api.js';
import { useIsAdmin } from '../../hooks/useIsAdmin.js';
import { useUserPreferences } from '../../hooks/useUserPreferences.js';

const TEMPERATURE_MIN = 0;
const TEMPERATURE_MAX = 2;
const TEMPERATURE_STEP = 0.1;

/**
 * AI / LLM tab body for the Settings modal.
 *
 * Three subsections:
 *   1. My defaults — writable form; persisted to UserPreferences.Settings.llm
 *      and consumed by AgentCreateModal when the user creates a new agent.
 *   2. Router status — read-only health/providers/capabilities cards.
 *   3. Administration — placeholder, gated by Keycloak realm role `admin`.
 *
 * See docs/LLM_SETTINGS_TAB_PLAN.md.
 */
export default function LLMSettingsPanel() {
  const { llm, loading: prefsLoading, error: prefsError, updateLLMPrefs } = useUserPreferences();
  const isAdmin = useIsAdmin();

  // Local form state seeded from server preferences. Kept separate so users
  // can tweak without firing a PUT on every keystroke.
  const [form, setForm] = useState({
    default_provider: '',
    default_model: '',
    default_temperature: 0.7,
    default_max_tokens: 2000,
    default_system_prompt: '',
    stream_by_default: true,
  });
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState(null);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [saveError, setSaveError] = useState(null);

  // Router status section state
  const [health, setHealth] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(null);

  // Seed form when prefs first arrive.
  useEffect(() => {
    if (llm) {
      setForm((prev) => ({ ...prev, ...llm }));
    }
  }, [llm]);

  // Load provider list.
  useEffect(() => {
    let cancelled = false;
    setProvidersLoading(true);
    api.agentRouter.getProviders()
      .then((resp) => {
        if (cancelled) return;
        const list = Array.isArray(resp?.providers) ? resp.providers : [];
        // Normalize: server returns plain strings; some consumers wrap as objects.
        setProviders(list.map((p) => (typeof p === 'string' ? { name: p, display_name: p } : p)));
      })
      .catch((err) => { if (!cancelled) setProvidersError(err.message || 'Failed to load providers'); })
      .finally(() => { if (!cancelled) setProvidersLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Load models for the selected provider.
  useEffect(() => {
    if (!form.default_provider) {
      setModels([]);
      return;
    }
    let cancelled = false;
    setModelsLoading(true);
    api.agentRouter.getModels(form.default_provider)
      .then((resp) => {
        if (cancelled) return;
        // Provider-details response shape: { capabilities: { supported_models: [...] }, ... }
        const list = resp?.capabilities?.supported_models
          || resp?.data?.capabilities?.supported_models
          || resp?.models
          || [];
        setModels(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled) setModels([]); })
      .finally(() => { if (!cancelled) setModelsLoading(false); });
    return () => { cancelled = true; };
  }, [form.default_provider]);

  // Load router status (informational section).
  useEffect(() => {
    let cancelled = false;
    setStatusLoading(true);
    Promise.allSettled([
      api.agentRouter.getHealth(),
      api.agentRouter.getCapabilities(),
    ])
      .then(([healthRes, capRes]) => {
        if (cancelled) return;
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
        if (capRes.status === 'fulfilled') setCapabilities(capRes.value);
        if (healthRes.status === 'rejected' && capRes.status === 'rejected') {
          setStatusError('Router status unavailable');
        }
      })
      .finally(() => { if (!cancelled) setStatusLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear any prior save status the moment the user edits again.
    if (saveStatus) setSaveStatus(null);
  };

  // When provider changes, clear the model so the user picks a valid one for the new provider.
  const onProviderChange = (value) => {
    setForm((prev) => ({ ...prev, default_provider: value, default_model: '' }));
    if (saveStatus) setSaveStatus(null);
  };

  const onSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    setSaveError(null);
    try {
      await updateLLMPrefs(form);
      setSaveStatus('success');
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">AI / LLM</h3>

      {/* --- 1. My defaults --- */}
      <section className="space-y-6 mb-10">
        <div>
          <h4 className="font-medium text-gray-900 mb-1">My defaults</h4>
          <p className="text-sm text-gray-500">
            Prefilled when you create a new agent. Existing agents keep their own configuration.
          </p>
        </div>

        {prefsError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>Could not load saved preferences: {prefsError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default provider</label>
            <select
              value={form.default_provider}
              onChange={(e) => onProviderChange(e.target.value)}
              disabled={prefsLoading || providersLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">— None —</option>
              {providers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.display_name || p.name}
                </option>
              ))}
            </select>
            {providersError && (
              <p className="mt-1 text-xs text-red-600">{providersError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default model</label>
            <select
              value={form.default_model}
              onChange={(e) => setField('default_model', e.target.value)}
              disabled={!form.default_provider || modelsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">{form.default_provider ? '— Select a model —' : 'Select a provider first'}</option>
              {models.map((m) => {
                const id = typeof m === 'string' ? m : (m.id || m.name);
                const label = typeof m === 'string' ? m : (m.display_name || m.name || m.id);
                return <option key={id} value={id}>{label}</option>;
              })}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Default temperature</label>
            <span className="text-sm tabular-nums text-gray-600">{form.default_temperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={TEMPERATURE_MIN}
            max={TEMPERATURE_MAX}
            step={TEMPERATURE_STEP}
            value={form.default_temperature}
            onChange={(e) => setField('default_temperature', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.0 — focused</span>
            <span>2.0 — creative</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Default max tokens</label>
          <input
            type="number"
            min={1}
            value={form.default_max_tokens}
            onChange={(e) => setField('default_max_tokens', parseInt(e.target.value, 10) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Default system prompt (optional)</label>
          <textarea
            rows={3}
            value={form.default_system_prompt}
            onChange={(e) => setField('default_system_prompt', e.target.value)}
            placeholder="Leave blank to start each new agent with no system prompt."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.stream_by_default}
              onChange={(e) => setField('stream_by_default', e.target.checked)}
              className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)"
            />
            <span className="ml-2 text-sm text-gray-700">Stream responses by default</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || prefsLoading}
            className="px-4 py-2 rounded-lg bg-(--color-primary-600) text-(--color-primary-contrast) hover:bg-(--color-primary-700) disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader size={14} className="animate-spin" />}
            Save defaults
          </button>
          {saveStatus === 'success' && (
            <span className="flex items-center gap-1 text-sm text-green-700">
              <Check size={14} /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-sm text-red-700">
              <AlertCircle size={14} /> {saveError || 'Save failed'}
            </span>
          )}
        </div>
      </section>

      {/* --- 2. Router status (read-only) --- */}
      <section className="space-y-3 mb-10">
        <div>
          <h4 className="font-medium text-gray-900 mb-1">Router status</h4>
          <p className="text-sm text-gray-500">
            Live view of the TAS LLM router. Configuration is managed by operators.
          </p>
        </div>

        {statusLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader size={14} className="animate-spin" /> Loading router status…
          </div>
        )}

        {!statusLoading && statusError && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{statusError}</span>
          </div>
        )}

        {!statusLoading && !statusError && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {health?.status === 'healthy' || health?.status === 'ok' ? (
                  <CheckCircle size={18} className="text-green-500" />
                ) : (
                  <AlertCircle size={18} className="text-yellow-500" />
                )}
                <span className="font-medium text-gray-900">Health</span>
              </div>
              <p className="text-sm text-gray-600">{health?.status || 'unknown'}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="font-medium text-gray-900 mb-2">Providers</div>
              {providers.length === 0 ? (
                <p className="text-sm text-gray-500">None connected.</p>
              ) : (
                <ul className="text-sm text-gray-700 space-y-1">
                  {providers.map((p) => <li key={p.name}>{p.display_name || p.name}</li>)}
                </ul>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="font-medium text-gray-900 mb-2">Capabilities</div>
              {capabilities ? (
                <div className="text-xs text-gray-600 space-y-1">
                  {Object.entries(capabilities).slice(0, 6).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-mono truncate" title={typeof v === 'object' ? JSON.stringify(v) : String(v)}>
                        {typeof v === 'object' ? JSON.stringify(v).slice(0, 20) + '…' : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not reported.</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* --- 3. Administration (scaffolded, gated) --- */}
      {isAdmin && (
        <section>
          <div className="mb-1 flex items-center gap-2">
            <Shield size={16} className="text-gray-500" />
            <h4 className="font-medium text-gray-900">Administration</h4>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Visible because your account has the <code className="px-1 bg-gray-100 rounded">admin</code> realm role.
          </p>
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-600">
            Admin configuration of providers, API keys, rate limits, and fallback chains will live here.
            These are currently managed via the <code className="px-1 bg-gray-100 rounded">tas-llm-router</code> ConfigMap
            and require operator access.
          </div>
        </section>
      )}
    </div>
  );
}
