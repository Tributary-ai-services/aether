import { useMemo } from 'react';
import { tokenStorage } from '../services/tokenStorage.js';

/**
 * Returns true when the current Keycloak access token carries the platform
 * `admin` realm role. Mirrors the backend gate at
 * aether-be/internal/handlers/routes.go:883 (RequireRole("admin")), so any
 * UI hidden behind this hook stays aligned with what the API will accept.
 *
 * Returns false when there's no token, the token can't be decoded, or the
 * decoded payload has no `realm_access.roles` array.
 */
export function useIsAdmin() {
  return useMemo(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles = payload?.realm_access?.roles;
      return Array.isArray(roles) && roles.includes('admin');
    } catch {
      return false;
    }
  }, []);
}
