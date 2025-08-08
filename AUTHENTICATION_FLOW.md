# Aether Authentication Flow Documentation

## Overview

This document describes the complete authentication flow for the Aether AI platform, including frontend containerization, backend integration, and Keycloak authentication.

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

## Authentication Flow

### 1. Frontend Configuration

The frontend is containerized using Docker with the following environment variables:

```yaml
# docker-compose.yml
environment:
  - VITE_AETHER_API_BASE=http://localhost:8080
  - VITE_AETHER_API_URL=http://localhost:8080/api/v1
  - VITE_KEYCLOAK_URL=http://localhost:8081
  - VITE_DEV_MODE=true
```

### 2. Keycloak Configuration

**Realm**: `aether`
**Test Credentials**: 
- Username: `test`
- Password: `test`

**Token Endpoint**: 
```
POST http://localhost:8081/realms/aether/protocol/openid-connect/token
```

### 3. Authentication Process

#### Step 1: Token Acquisition
```javascript
// Using admin-cli client (works without CORS issues)
const response = await fetch('/realms/aether/protocol/openid-connect/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: 'test',
    password: 'test',
  }),
});
```

#### Step 2: Token Storage
```javascript
// Tokens stored in sessionStorage
sessionStorage.setItem('aether_access_token', data.access_token);
sessionStorage.setItem('aether_token_expiry', (Date.now() + data.expires_in * 1000).toString());
```

#### Step 3: API Requests
```javascript
// All API requests include Bearer token
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

## Development Helpers

### Browser Console Commands

The following helper functions are available in development mode:

```javascript
// Get a fresh token
window.getDevToken()

// Quick authentication with test credentials
window.quickAuth()

// Alternative authentication using admin-cli
window.quickAuthWithAdminCli()

// Fix Keycloak CORS settings (if needed)
window.fixKeycloakCors()

// Debug authentication state
window.debugAuth.getState()
window.debugAuth.logStatus()
```

## File Structure

```
/home/jscharber/eng/TAS/aether/
├── docker-compose.yml          # Container configuration
├── Dockerfile                  # Multi-stage build (Node 20 + nginx)
├── nginx.conf                  # Static file serving + routing
├── src/
│   ├── services/
│   │   ├── aetherApi.js       # Main API service with auth handling
│   │   └── tokenStorage.js    # Token management utilities
│   ├── utils/
│   │   ├── quickAuth.js       # Development authentication helpers
│   │   ├── fixKeycloakCors.js # CORS configuration utilities
│   │   └── authUtils.js       # Authentication utilities and debug tools
│   └── vite-env.d.ts          # TypeScript environment definitions
└── AUTHENTICATION_FLOW.md     # This documentation
```

## Build and Deployment

### Docker Commands

```bash
# Build the frontend container
docker-compose build aether-frontend

# Start the frontend service
docker-compose up -d aether-frontend

# View logs
docker logs aether_aether-frontend_1

# Stop and rebuild
docker-compose down && docker-compose build aether-frontend && docker-compose up -d aether-frontend
```

### Environment Variables

**Build-time variables** (passed during Docker build):
```dockerfile
ARG VITE_AETHER_API_BASE
ARG VITE_AETHER_API_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_DEV_MODE
```

**Runtime variables** (available in container):
```yaml
environment:
  - NODE_ENV=production
  - VITE_DEV_MODE=true
```

## Testing Authentication

### 1. Manual Testing

```bash
# Get token via curl
curl -X POST http://localhost:8081/realms/aether/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=test" \
  -d "password=test" \
  -d "grant_type=password"

# Test backend API
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/v1/notebooks
```

### 2. Browser Testing

1. Open: http://localhost:3001
2. Open browser console
3. Run: `window.quickAuth()` or `window.getDevToken()`
4. Verify token is stored and API calls work

## Troubleshooting

### Common Issues

1. **net::ERR_NAME_NOT_RESOLVED**
   - **Cause**: Frontend trying to use Docker internal names (e.g., `aether-backend:8080`)
   - **Solution**: Use `localhost:8080` for browser-accessible URLs

2. **CORS Issues**
   - **Cause**: Keycloak client not configured for frontend origins
   - **Solution**: Use `admin-cli` client or run `window.fixKeycloakCors()`

3. **Token Expiry**
   - **Cause**: JWT tokens have short lifespans
   - **Solution**: Automatic refresh or re-authenticate with `window.quickAuth()`

4. **nginx Configuration Errors**
   - **Cause**: Invalid directives in `nginx.conf`
   - **Solution**: Check `gzip_proxied` and other directives for valid values

### Debug Commands

```javascript
// Check current auth status
console.table(window.debugAuth.getState().authStatus);

// Test full authentication flow
await window.debugAuth.testFlow();

// Force token refresh
await window.debugAuth.forceRefresh();
```

## Security Considerations

### Development vs Production

**Development Mode** (`VITE_DEV_MODE=true`):
- Hardcoded dev tokens for testing
- Console logging enabled
- Debug helpers available
- CORS workarounds active

**Production Mode**:
- Real token management
- Secure token storage
- Minimal logging
- Proper CORS configuration

### Token Management

- Access tokens stored in `sessionStorage` (not persistent across browser sessions)
- Tokens include expiry timestamps for proactive refresh
- Automatic token refresh before expiration
- Secure header transmission (`Authorization: Bearer`)

## Integration Points

### Backend Integration
- Health check: `GET /health`
- Notebooks API: `GET /api/v1/notebooks`
- Authentication via JWT Bearer tokens
- Automatic token refresh on 401 responses

### Keycloak Integration
- Token endpoint: `/realms/aether/protocol/openid-connect/token`
- Admin API: `/admin/realms/aether/*` (for configuration)
- Client credentials and password grants supported
- JWT token validation and refresh

## Status

✅ **Completed Tasks:**
- Frontend containerization with Docker
- Shared network integration (tas-shared-network)
- Keycloak authentication with test credentials
- Browser-compatible URL configuration
- Development helpers and debugging tools
- nginx configuration and static serving
- Automatic token management and refresh

🔄 **Ready for Testing:**
- Open http://localhost:3001
- Use browser console helpers for authentication
- Verify API connectivity with backend services