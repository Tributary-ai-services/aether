# TODO: Aether Frontend

## 🔑 Token Refresh Implementation

### High Priority (Core Functionality)
- [ ] **Implement automatic token refresh logic in aetherApi.js using refresh tokens**
  - File: `src/services/aetherApi.js`
  - Action: Add refresh token logic to handle expired tokens automatically
  - Current issue: Tokens expire every 5 minutes and require manual updates

- [ ] **Add token expiration detection and handling in API request interceptor**
  - File: `src/services/aetherApi.js`
  - Action: Detect 401 responses and trigger token refresh
  - Implementation: Add response interceptor to catch authentication failures

- [ ] **Create token storage service for refresh tokens**
  - File: `src/services/tokenStorage.js` (new)
  - Action: Implement secure localStorage/sessionStorage for token management
  - Security: Consider XSS protection and secure storage practices

- [ ] **Add retry logic for API calls when token refresh succeeds**
  - File: `src/services/aetherApi.js`
  - Action: Retry original request after successful token refresh
  - UX: Seamless experience without user intervention

- [ ] **Implement token refresh endpoint wrapper for Keycloak**
  - File: `src/services/aetherApi.js`
  - Action: Add method to refresh tokens via Keycloak API
  - Endpoint: `POST /realms/aether/protocol/openid-connect/token` with refresh_token

### Medium Priority (User Experience)
- [ ] **Create React context/hook for authentication state management**
  - Files: `src/contexts/AuthContext.jsx`, `src/hooks/useAuth.js` (new)
  - Action: Global auth state management across components
  - Features: Login status, user info, token management

- [ ] **Implement proper error handling for expired refresh tokens**
  - File: `src/services/aetherApi.js`
  - Action: Redirect to login when refresh tokens are expired
  - UX: Clear error messages and seamless login redirect

- [ ] **Implement token preemptive refresh (refresh before expiration)**
  - File: `src/services/aetherApi.js`
  - Action: Refresh tokens at 80% of their lifetime
  - Benefit: Avoid expired token scenarios entirely

- [ ] **Add proper logout functionality that clears all tokens**
  - Files: `src/services/aetherApi.js`, `src/components/`
  - Action: Clear all stored tokens and auth state
  - Security: Revoke tokens on server if possible

- [ ] **Add security considerations - secure token storage and XSS protection**
  - File: `src/services/tokenStorage.js`
  - Action: Implement secure token storage practices
  - Security: HttpOnly considerations, XSS protection

### Low Priority (Developer Experience)
- [ ] **Add loading states for token refresh operations**
  - Files: Component files using auth
  - Action: Show loading indicators during token operations
  - UX: Better feedback during auth operations

- [ ] **Create development-only token refresh helper for easier testing**
  - File: `src/utils/devTokenHelper.js` (new)
  - Action: Easy token refresh for development workflow
  - Environment: Development mode only

## Current Issues
- ❌ **Manual token updates required every 5 minutes**
- ❌ **401 errors when tokens expire**
- ❌ **No automatic retry of failed requests**
- ❌ **Poor developer experience with token management**

## Implementation Files
- `src/services/aetherApi.js` - Main API service (needs token refresh logic)
- `src/services/tokenStorage.js` - New token storage service
- `src/contexts/AuthContext.jsx` - New authentication context
- `src/hooks/useAuth.js` - New authentication hook

## Current Token Details
- **Client**: `aether-backend` 
- **Secret**: `e78dEfml7xy6YKyHyiQWMMmw7fDs6Kz8`
- **Realm**: `aether`
- **Keycloak URL**: `http://localhost:8081` (from host) / `http://tas-keycloak-shared:8080` (from backend)
- **Token Lifetime**: 5 minutes
- **Refresh Token Lifetime**: 30 minutes

## Success Criteria
✅ Users never see 401 authentication errors
✅ Tokens refresh automatically without user intervention  
✅ Failed API calls are automatically retried after token refresh
✅ Seamless user experience with no authentication interruptions