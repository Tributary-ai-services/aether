# LLM Router Settings Tab — Implementation Plan

Status: planned (not yet implemented)
Owner: TBD
Last updated: 2026-05-20

## Goal

Add an **AI / LLM** tab to the existing tabbed Settings modal (opened from the
profile dropdown). The tab lets users set personal defaults that feed into agent
creation and the AI Playground, and exposes a read-only view of the LLM router's
health for transparency. An admin-only subsection is scaffolded for future
provider/key/rate-limit administration but ships empty.

## Why here, not on the Agent Builder page

The Agent Builder page previously had a dead "Settings" button in its header.
Investigation showed there is no good page-scoped setting for that surface:

- Per-agent configuration (provider, model, system prompt, temperature) already
  lives in `AgentCreateModal` via `llm_config`.
- Router infrastructure config (providers, API keys, rate limits, fallback
  chains) is an operator concern, not a per-user concern.
- User-level defaults that should prefill new agents naturally belong in the
  user's profile, which is where every other personal preference already lives.

The button was removed in this branch. This document covers the replacement.

## Decisions (locked)

| Question | Decision |
|---|---|
| Scope of user defaults | **User-global**, not space-scoped |
| Admin subsection | **Scaffolded now**, gated by Keycloak realm role `admin`, with placeholder body |
| Billing/quota fields | **Out of scope** for this iteration |

## Where it lives

Add a new tab to `src/components/ui/Settings.jsx`, inserted between
`notifications` and `security`:

```js
{ id: 'ai', label: 'AI / LLM', icon: Cpu }
```

The tab body renders three subsections, top to bottom:

1. **My defaults** — writable form
2. **Router status** — read-only cards
3. **Administration** — gated by `useIsAdmin()`, placeholder card

## Subsection 1 — My defaults (writable)

Stored in the existing `UserPreferences.Settings` JSON map at
`aether-be/internal/models/user.go:213` (`map[string]interface{}`) under a
`llm` key. No backend schema change required.

Persisted via the existing endpoint:

- `GET  /api/v1/users/me/preferences`
- `PUT  /api/v1/users/me/preferences`

Shape stored:

```json
{
  "llm": {
    "default_provider": "openai",
    "default_model": "gpt-4o-mini",
    "default_temperature": 0.7,
    "default_max_tokens": 2000,
    "default_system_prompt": "",
    "stream_by_default": true
  }
}
```

Fields:

| Field | Control | Source of options |
|---|---|---|
| `default_provider` | dropdown | `GET /api/v1/router/providers` |
| `default_model` | dropdown (depends on provider) | `GET /api/v1/router/providers/:name` |
| `default_temperature` | slider 0.0–2.0 step 0.1 | — |
| `default_max_tokens` | number input | — |
| `default_system_prompt` | textarea (optional) | — |
| `stream_by_default` | toggle | — |

When the user changes `default_provider`, the `default_model` dropdown
re-fetches and resets.

## Subsection 2 — Router status (read-only)

Three small cards backed by existing public router endpoints (no auth needed):

- `GET /api/v1/router/health` — overall router health
- `GET /api/v1/router/providers` — list of connected providers
- `GET /api/v1/router/capabilities` — capabilities summary; per-provider model
  list shown in a collapsible

This section is purely informational. Nothing here is editable.

## Subsection 3 — Administration (scaffolded, empty)

Rendered only when `useIsAdmin()` returns true. Single info card with text:

> Admin configuration of providers, API keys, rate limits, and fallback chains
> will live here. Currently these are managed via the tas-llm-router ConfigMap
> and require operator access.

The slot exists so future admin UI has a home; no admin endpoints are wired up
in this iteration.

## How user defaults are consumed

`AgentCreateModal` currently hardcodes provider/model/temperature defaults when
creating a new agent. After this change, it reads from `prefs.llm` first and
falls back to the existing hardcoded values when a preference key is missing.

The AI Playground may optionally consume the same defaults; not required for
this iteration.

## File changes

### Frontend (`aether`)

| File | Change |
|---|---|
| `src/components/ui/Settings.jsx` | Add `ai` tab entry; render `<LLMSettingsPanel/>` body |
| `src/components/settings/LLMSettingsPanel.jsx` *(new)* | Three subsections as described above |
| `src/hooks/useUserPreferences.js` *(new)* | Wrap `GET/PUT /users/me/preferences`; expose `prefs.llm`, `updateLLMPrefs()` |
| `src/hooks/useIsAdmin.js` *(new)* | Read decoded token from `AuthContext`, return `realm_access.roles?.includes('admin')` |
| `src/services/api.js` | Add `agentRouter.getHealth()` and `agentRouter.getCapabilities()` |
| `src/components/modals/AgentCreateModal.jsx` | Prefill `llm_config` from `prefs.llm` on the new-agent path |

### Backend (`aether-be`)

No changes. All endpoints used already exist:

- `GET /api/v1/users/me/preferences`
- `PUT /api/v1/users/me/preferences`
- `GET /api/v1/router/providers`
- `GET /api/v1/router/providers/:name`
- `GET /api/v1/router/health`
- `GET /api/v1/router/capabilities`

### Backend (`tas-llm-router`)

No changes.

### Data model

No Neo4j schema change. `UserPreferences.Settings` is already
`map[string]interface{}` (`aether-be/internal/models/user.go:213`).

## Permission model

- **User defaults** (subsection 1): any authenticated user, writes to their own
  `/users/me/preferences`.
- **Router status** (subsection 2): public router endpoints, no special role.
- **Administration** (subsection 3): rendered only when JWT
  `realm_access.roles` includes `admin`. Matches the backend's existing
  `RequireRole("admin")` gate at `aether-be/internal/handlers/routes.go:883`.

## What the user notices

1. Profile → Settings now has an "AI / LLM" tab.
2. Setting defaults there changes what `AgentCreateModal` prefills. No other
   behavior changes.
3. Users with the `admin` realm role additionally see an empty
   "Administration" card at the bottom of the tab.

## Out of scope for this iteration

- Provider API key management
- Rate limit / fallback chain configuration
- Per-space defaults
- Billing, quota, or usage display
- Migration of existing `localStorage` agent defaults (none today)

## Open follow-ups

- Once an admin endpoint surface exists on tas-llm-router, fill in the
  Administration subsection.
- Consider whether AI Playground should also consume `prefs.llm` defaults
  (low priority).
