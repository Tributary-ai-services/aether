/**
 * Agent visibility (Plan #22 W0.3, AB-13).
 *
 * Replaces the old `is_public` boolean, which meant "every signed-in user of
 * every organization", with three levels:
 *   private       only the owner, in the space it was made in
 *   organization  anyone working in a space of the same Organization
 *   public        everyone; setting it needs the realm `admin` role
 *
 * Agents saved before the change carry only `is_public`, so read through
 * agentVisibility() rather than the field directly.
 */

export const VISIBILITY = Object.freeze({
  PRIVATE: 'private',
  ORGANIZATION: 'organization',
  PUBLIC: 'public',
});

export const VISIBILITY_OPTIONS = [
  { value: VISIBILITY.PRIVATE, label: 'Only me' },
  { value: VISIBILITY.ORGANIZATION, label: 'My organization' },
  { value: VISIBILITY.PUBLIC, label: 'Public' },
];

const LABELS = Object.fromEntries(VISIBILITY_OPTIONS.map((o) => [o.value, o.label]));

export function agentVisibility(agent) {
  if (!agent) return VISIBILITY.PRIVATE;
  if (Object.values(VISIBILITY).includes(agent.visibility)) return agent.visibility;
  return agent.is_public ? VISIBILITY.PUBLIC : VISIBILITY.PRIVATE;
}

export function visibilityLabel(value) {
  return LABELS[value] || LABELS[VISIBILITY.PRIVATE];
}

/** The default for a new agent: share with the organization when there is one. */
export function defaultVisibility(organizationId) {
  return organizationId ? VISIBILITY.ORGANIZATION : VISIBILITY.PRIVATE;
}

const ERROR_MESSAGES = {
  visibility_public_requires_admin:
    'Only administrators can make an agent public. Choose "My organization" or "Only me".',
  visibility_organization_requires_org_space:
    'This space does not belong to an organization, so the agent cannot be shared with one. Choose "Only me", or create it in an organization space.',
};

/**
 * A readable message for the two visibility errors the backend returns, or
 * null if the error is something else. aetherApi puts a 403's code on
 * err.response.code; a 400 only survives in the message text, so check both.
 */
export function visibilityErrorMessage(err) {
  if (!err) return null;
  const code = err.response?.code;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  const text = `${err.message || ''}`;
  for (const [k, msg] of Object.entries(ERROR_MESSAGES)) {
    if (text.includes(k)) return msg;
  }
  return null;
}
