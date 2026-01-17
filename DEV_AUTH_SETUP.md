# Development Authentication Setup

This guide explains how to configure secure authentication for development environments and provides a complete overview of the authentication flow.

## Overview

The Aether frontend requires proper JWT tokens from Keycloak for authentication. In development mode, you can configure credentials through environment variables instead of using hardcoded values.

## Architecture

### Services Configuration

| Service | Port | URL | Network | Description |
|---------|------|-----|---------|-------------|
| **Aether Frontend** | 3001 | http://localhost:3001 | tas-shared-network | React app in nginx container |
| **Aether Backend** | 8080 | http://localhost:8080 | tas-shared-network | Go backend API service |
| **Keycloak** | 8081 | http://localhost:8081 | tas-shared-network | Authentication server |

### Network Architecture

```
Browser (localhost)
│
├── http://localhost:3001 → Aether Frontend (nginx container)
├── http://localhost:8080 → Aether Backend (direct API calls)
└── http://localhost:8081 → Keycloak (authentication)

Docker Network: tas-shared-network
├── aether-frontend:80 (internal)
├── aether-backend:8080 (internal)
└── tas-keycloak-shared:8080 (internal)
```

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the root of the aether directory with the following variables:

```bash
# Development Mode
VITE_DEV_MODE=true

# Keycloak Configuration
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=aether-frontend

# Development Credentials (DO NOT commit these)
VITE_DEV_USERNAME=your-dev-username
VITE_DEV_PASSWORD=your-dev-password
VITE_DEV_EMAIL=your-dev-email@example.com
```

### Keycloak User Setup

1. Access Keycloak admin console at `http://localhost:8081`
2. Create a development user with appropriate roles
3. Use these credentials in your `.env.local` file

**Default Realm**: `master` (configured in environment)
**Client ID**: `aether-frontend` (public client for frontend)

**Note**: The code consistently uses the `master` realm and `aether-frontend` client ID as configured in the environment variables.

## Security Best Practices

### For Development

- ✅ Use environment variables for credentials
- ✅ Never commit `.env.local` files
- ✅ Use separate dev Keycloak realm if possible
- ✅ Rotate dev credentials regularly

### What NOT to do

- ❌ Don't hardcode credentials in source code
- ❌ Don't commit credentials to version control
- ❌ Don't use production credentials in development
- ❌ Don't disable authentication entirely

## Production Configuration

In production, ensure:

- `VITE_DEV_MODE` is not set or set to `false`
- All dev-specific utilities are tree-shaken out
- Use proper OAuth2/OIDC flows
- Implement proper session management

## Authentication Flow

### 1. Token Acquisition

```javascript
// Frontend requests token from Keycloak
const response = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'password',
    client_id: CLIENT_ID,
    username: devUsername,  // From env vars
    password: devPassword,  // From env vars
    scope: 'openid profile email',
  }),
});
```

### 2. Token Storage

```javascript
// Tokens stored securely in sessionStorage
tokenStorage.setAccessToken(tokenData.id_token || tokenData.access_token, expires_in);
tokenStorage.setRefreshToken(tokenData.refresh_token, refresh_expires_in);
```

### 3. API Requests

```javascript
// All API requests include Bearer token
headers: {
  'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
  'Content-Type': 'application/json'
}
```

### 4. Backend Validation

The backend validates JWT tokens with Keycloak and passes them through to downstream services like the router service and agent-builder.

## Automatic Token Rotation

The authentication system includes automatic token rotation:

- Tokens are proactively refreshed 5 minutes before expiry
- Checked every minute via `setInterval`
- Refresh tokens are rotated on each refresh (when supported by Keycloak)
- Failed rotations trigger automatic logout
- Rotation starts on login, stops on logout

## Development Helpers

### Browser Console Commands

In development mode (`VITE_DEV_MODE=true`), the following helpers are available:

```javascript
// Get a fresh development token
window.getDevToken()

// Debug authentication state
window.debugAuth.getState()
window.debugAuth.logStatus()

// Force token refresh
await window.debugAuth.forceRefresh()

// Test full authentication flow
await window.debugAuth.testFlow()

// Dev token helper utilities (development only)
window.devTokenHelper.logTokenStatus()
window.devTokenHelper.testTokenRefresh()
```

## Testing Authentication

### Manual Testing with curl

```bash
# Get token via curl
curl -X POST http://localhost:8081/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=aether-frontend" \
  -d "username=your-dev-username" \
  -d "password=your-dev-password" \
  -d "grant_type=password"

# Test backend API with token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/v1/notebooks
```

### Browser Testing

1. Open http://localhost:3001
2. Open browser console (F12)
3. Run: `window.getDevToken()` (requires env vars configured)
4. Verify token is stored and API calls work

## Troubleshooting

### Common Issues

1. **"Development credentials not configured"**
   - Ensure `VITE_DEV_USERNAME` and `VITE_DEV_PASSWORD` are set
   - Check your `.env.local` file exists and is properly formatted

2. **"Invalid email or password"**
   - Verify credentials are correct in Keycloak
   - Check Keycloak is running and accessible at http://localhost:8081

3. **Token refresh failures**
   - Check Keycloak configuration allows refresh token rotation
   - Verify client settings in Keycloak admin console
   - Ensure refresh token hasn't expired (30 min default)

4. **CORS Issues**
   - Ensure `aether-frontend` client in Keycloak has proper Web Origins configured
   - Add `http://localhost:3001` and `http://localhost:3000` to Valid Redirect URIs
   - Or use `admin-cli` client for testing (no CORS restrictions)

5. **net::ERR_NAME_NOT_RESOLVED**
   - Frontend trying to use Docker internal names
   - Ensure using `localhost` URLs for browser-accessible endpoints

## Migration from Legacy Setup

If you're migrating from hardcoded credentials:

1. Create `.env.local` with proper variables
2. Remove any hardcoded credentials from code
3. Test authentication flow thoroughly
4. Verify dev helpers don't leak to production builds

## Docker Commands

### Build and Deployment

```bash
# Build the frontend container
docker-compose build aether-frontend

# Start all services
docker-compose up -d

# View logs
docker logs aether_aether-frontend_1
docker logs aether-be_aether-backend_1

# Restart services
docker-compose restart aether-frontend
docker-compose restart aether-backend

# Full rebuild
docker-compose down && docker-compose build && docker-compose up -d
```

## Files Modified

This secure authentication setup affects:

- `/src/utils/getDevToken.js` - Now uses environment variables
- `/src/utils/devTokenHelper.js` - Enhanced with production warnings  
- `/src/services/aetherApi.js` - Added automatic token rotation
- `/src/services/tokenStorage.js` - Secure token management
- `/internal/services/agent_execution_direct.go` - Router service authentication
- `/internal/middleware/auth.go` - JWT validation with Keycloak

## Integration Points

### Backend Integration
- Health check: `GET /health`
- Notebooks API: `GET /api/v1/notebooks`
- Authentication via JWT Bearer tokens
- Automatic token refresh on 401 responses

### Keycloak Integration
- Token endpoint: `/realms/master/protocol/openid-connect/token`
- Admin API: `/admin/realms/master/*` (for configuration)
- Client credentials and password grants supported
- JWT token validation and refresh

## Support

For issues with authentication setup, check:

1. Keycloak logs for authentication errors
2. Browser network tab for failed requests
3. Console logs for authentication events
4. Backend logs for JWT validation issues

## Related Documentation

- Backend design: `BACKEND-DESIGN.md`
- Main README: `README.md`
- Docker configuration: `docker-compose.yml`