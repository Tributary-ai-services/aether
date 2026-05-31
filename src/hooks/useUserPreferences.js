import { useCallback, useEffect, useState } from 'react';
import { tokenStorage } from '../services/tokenStorage.js';

const API_BASE = import.meta.env.VITE_AETHER_API_URL;

/**
 * Wraps GET/PUT /users/me/preferences.
 *
 * The backend stores preferences as `UserPreferences` (see
 * aether-be/internal/models/user.go:206). `Settings` is a free-form
 * `map[string]interface{}`, so feature-specific blocks (here: `llm`) live
 * under that map without any schema change.
 *
 * Returns:
 *   prefs                — the full preferences object, or null while loading.
 *   loading, error       — fetch state.
 *   llm                  — convenience accessor for prefs.settings?.llm.
 *   updateLLMPrefs(patch) — merge-update the llm block; persists the entire
 *                          preferences object so other fields aren't lost.
 *   refresh              — re-fetch from the server.
 */
export function useUserPreferences() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/users/me/preferences`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch preferences (${response.status})`);
      }
      const data = await response.json();
      setPrefs(data?.data ?? data ?? {});
    } catch (err) {
      setError(err.message || 'Failed to fetch preferences');
      setPrefs({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const updateLLMPrefs = useCallback(async (patch) => {
    const current = prefs ?? {};
    const currentSettings = current.settings ?? {};
    const currentLLM = currentSettings.llm ?? {};
    const next = {
      ...current,
      settings: {
        ...currentSettings,
        llm: { ...currentLLM, ...patch },
      },
    };
    setPrefs(next);

    const response = await fetch(`${API_BASE}/users/me/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(next),
    });
    if (!response.ok) {
      throw new Error(`Failed to update preferences (${response.status})`);
    }
    const data = await response.json();
    setPrefs(data?.data ?? data ?? next);
    return data;
  }, [prefs]);

  return {
    prefs,
    loading,
    error,
    llm: prefs?.settings?.llm ?? null,
    updateLLMPrefs,
    refresh: fetchPrefs,
  };
}
