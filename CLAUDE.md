# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aether** is an AI portal project in early conceptual stage. The main content is a comprehensive UI mockup (`docs/mock.tsx`) for the Aether AI platform - an enterprise multimodal AI platform that demonstrates sophisticated AI capabilities including document processing, AI agents, workflow automation, ML analytics, and real-time data streaming.

## Current Project State

This project is in **active development** as the frontend for the Aether AI Platform. The repository contains:

- React 19 + TypeScript + Vite application
- Tailwind CSS styling with Lucide icons
- Keycloak authentication integration
- Backend API integration (aether-be)
- Kubernetes deployment configuration

**Production Deployment**: The application is deployed on K3s with NGINX ingress at https://aether.tas.scharber.com

## Data Models & Schema Reference

### Service-Specific Data Models
This service's data models are comprehensively documented in the centralized data models repository:

**Location**: `../aether-shared/data-models/aether/`

#### Key Frontend Models:
- **Redux Store Structure** (`redux-store.md`) - Complete Redux state management with 7 slices (auth, notebooks, documents, agents, workflows, analytics, settings)
- **API Response Types** (`api-responses.md`) - TypeScript interfaces for all backend API responses
- **LocalStorage Schema** (`local-storage.md`) - Browser storage structure for user preferences and cached data

#### Cross-Service Integration:
- **User Onboarding Flow** (`../aether-shared/data-models/cross-service/flows/user-onboarding.md`) - Frontend components for registration and authentication
- **Document Upload Flow** (`../aether-shared/data-models/cross-service/flows/document-upload.md`) - Frontend upload UI and progress tracking
- **Platform ERD** (`../aether-shared/data-models/cross-service/diagrams/platform-erd.md`) - Understanding data relationships

#### When to Reference Data Models:
1. Before adding new Redux slices or modifying existing state structure
2. When implementing new API integrations or updating TypeScript interfaces
3. When debugging state management issues or data flow problems
4. When onboarding new frontend developers to understand data architecture
5. Before making changes to localStorage schema or cached data structure

**Main Documentation Hub**: `../aether-shared/data-models/README.md` - Complete navigation for all 38 data model files

## Planned Technology Stack

Based on the mockup implementation:

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS (extensive use of utility classes)
- **Icons**: Lucide React icon library
- **State Management**: React hooks (useState, useEffect)

## Architecture Concepts (from Mockup)

The UI mockup reveals a comprehensive enterprise AI platform architecture:

### Core Features
- **Document Notebooks**: Multimodal document processing with collaboration features
- **AI Agents**: Media-aware agents supporting documents/images/audio/video/signatures/handwriting
- **Automation Workflows**: Event-driven processing pipelines  
- **ML/Analytics Dashboard**: Model management, experiments, performance monitoring
- **Community Marketplace**: Shared templates and components
- **Live Data Streams**: Real-time event processing with audit trails

### Key Capabilities Demonstrated
- **Multimodal AI**: Processing across text, images, audio, video, handwritten content
- **Real-time Processing**: Live event streams with sentiment analysis
- **Enterprise Features**: HIPAA compliance, PII detection, audit scoring
- **ML Operations**: Model deployment, experiment tracking, performance analytics
- **Collaboration**: Public/private notebooks, community sharing, user ratings

## Development Setup (When Ready)

Since no development environment exists, initial setup would require:

1. **Initialize Node.js project**: `npm init`
2. **Install core dependencies**:
   - React + TypeScript
   - Build tool (Vite recommended based on .gitignore)
   - Tailwind CSS
   - Lucide React icons
3. **Configure TypeScript**: Create `tsconfig.json`
4. **Set up build system**: Configure Vite or similar
5. **Install development tools**: ESLint, Prettier
6. **Create proper project structure**

## File Structure

```
/
├── docs/
│   └── mock.tsx          # Comprehensive UI mockup (1,252 lines)
├── .gitignore           # Node.js/build tool focused
├── LICENSE              # Apache 2.0
├── README.md            # Minimal project description
└── CLAUDE.md           # This file
```

## Key Implementation Notes

The mockup (`docs/mock.tsx`) contains:
- Sophisticated state management for multi-tab interface
- Real-time metrics simulation
- Complex data structures for notebooks, agents, workflows, ML models
- Comprehensive media type handling (documents, images, video, audio, scans, handwriting, signatures)
- Enterprise-grade features (audit trails, compliance scoring, PII detection)
- Responsive grid layouts and interactive components

## Next Development Steps

1. Establish basic React + TypeScript development environment
2. Extract reusable components from the mockup
3. Implement proper state management (Context API or Redux)
4. Add routing for multi-tab navigation
5. Create API layer for data management
6. Implement authentication and authorization
7. Add testing infrastructure
8. Set up deployment pipeline

## Important Considerations

- The mockup represents an ambitious enterprise AI platform
- Real implementation would require significant backend infrastructure
- Compliance features (HIPAA, PII detection) need careful security implementation
- Multimodal AI processing requires substantial ML/AI infrastructure
- Real-time streaming features need robust event processing systems

## Deployment Workflow

**CRITICAL**: The Kubernetes deployment pulls images from `registry-api.tas.scharber.com` with `imagePullPolicy: Always`.
Any changes to the frontend MUST be pushed to the registry to take effect.

### Standard Deployment Process

1. **Build the Docker image with proper environment variables**:
   ```bash
   cd /home/jscharber/eng/TAS/aether

   docker build -t aether:latest \
     --build-arg VITE_AETHER_API_BASE= \
     --build-arg VITE_AETHER_API_URL=/api/v1 \
     --build-arg VITE_KEYCLOAK_URL= \
     --build-arg VITE_KEYCLOAK_REALM=aether \
     --build-arg VITE_KEYCLOAK_CLIENT_ID=aether-frontend \
     -f Dockerfile .
   ```

2. **Tag the image for the registry**:
   ```bash
   docker tag aether:latest registry-api.tas.scharber.com/aether-frontend:latest
   ```

3. **Push to the registry** (REQUIRED - local imports will be ignored):
   ```bash
   docker push registry-api.tas.scharber.com/aether-frontend:latest
   ```

4. **Restart the pods to pull the new image**:
   ```bash
   kubectl delete pods -n aether-be -l app=aether-frontend
   ```

5. **Verify the deployment**:
   ```bash
   # Wait for pod to be ready
   sleep 20
   kubectl get pods -n aether-be -l app=aether-frontend

   # Check which bundle is being served (should be the new hash)
   kubectl exec -n aether-be deployment/aether-frontend -- \
     cat /usr/share/nginx/html/index.html | grep -o 'index-[^"]*\.js'

   # Verify via ingress
   curl -sk https://aether.tas.scharber.com/ | grep -o 'index-[^"]*\.js'
   ```

### Environment Variables

**IMPORTANT**: Vite bakes `VITE_*` environment variables into the JavaScript bundle at build time, not runtime.

- `VITE_AETHER_API_BASE`: Should be empty (uses `window.location.origin`)
- `VITE_AETHER_API_URL`: Should be `/api/v1` (relative URL for ingress routing)
- `VITE_KEYCLOAK_URL`: Should be empty (uses `window.location.origin`)
- `VITE_KEYCLOAK_REALM`: `aether`
- `VITE_KEYCLOAK_CLIENT_ID`: `aether-frontend`

Setting API URLs to relative paths ensures the frontend works through NGINX ingress routing.

### Troubleshooting

**Problem**: Frontend shows `localhost:8080` connection errors
**Cause**: Build args were not specified, resulting in hardcoded localhost URLs in the bundle
**Fix**: Rebuild with proper build args and push to registry

**Problem**: New code changes not appearing after rebuilding
**Cause**: Deployment is pulling from registry, not using local image
**Fix**: Always push to registry after building

**Problem**: `imagePullPolicy: Always` ignored
**Cause**: This is expected behavior - the policy forces registry pulls
**Fix**: Push images to registry, don't rely on local imports

## Frontend Logging Implementation

### Browser-to-Backend Logging Pattern
The Aether frontend uses a centralized logging service that batches logs and sends them to the backend API for collection by Loki/Alloy.

**Logging Service**: `src/services/logging.ts`

```typescript
import { logger } from './services/logging.ts'

// Log user actions
logger.info('User navigated to notebook', {
  event_type: 'navigation',
  notebook_id: notebookId,
  target_url: window.location.href,
})

// Log errors with stack traces
logger.error('Failed to save document', {
  error_message: error.message,
  stack_trace: error.stack,
  component: 'DocumentEditor',
  document_id: documentId,
})

// Log API calls
logger.logApiCall('/api/v1/notebooks', 'POST', 201)
logger.logApiCall('/api/v1/documents', 'GET', undefined, error)

// Log component lifecycle (dev/debug only)
logger.logComponentLifecycle('NotebookEditor', 'mount', { notebook_id: id })
```

### Logging Service Features
- **Auto-capture**: Automatically captures JavaScript errors and unhandled promise rejections
- **Buffering**: Buffers logs and flushes every 5 seconds or when buffer reaches 20 entries
- **Immediate flush**: Error-level logs are sent immediately for rapid incident detection
- **Reliable delivery**: Uses `navigator.sendBeacon` for guaranteed log delivery on page unload
- **Context enrichment**: Automatically adds URL, user agent, and session ID to all logs

### Log Levels
- `error` - Critical errors (failed API calls, JavaScript exceptions, unhandled rejections)
- `warn` - Warning conditions (deprecated features, slow operations)
- `info` - General informational messages (user actions, navigation, component lifecycle)
- `debug` - Detailed debugging information (state changes, API request/response data)

### Backend Integration
Frontend logs are sent to `POST /api/v1/logs` on the Aether backend, which enriches them with user context (user_id, tenant_id, space_id from JWT) and logs to stdout with `source="frontend"` for Loki collection.

**Request Format**:
```typescript
{
  logs: [
    {
      level: "error",
      message: "Failed to load notebook",
      timestamp: new Date(),
      url: window.location.href,
      user_agent: navigator.userAgent,
      session_id: "1234567890-abc123",
      stack_trace: error.stack,
      extra: {
        notebook_id: "123",
        error_code: "NETWORK_ERROR"
      }
    }
  ]
}
```

### Initialization
The logging service is initialized in `src/main.tsx` before the React app renders:

```typescript
import { logger } from './services/logging.ts'

logger.info('Application started', {
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.MODE,
  user_agent: navigator.userAgent,
})
```

### Viewing Frontend Logs

**Grafana Dashboard**: "TAS Applications Logs" → "Frontend Errors & Warnings" panel

**LogQL Queries**:
```logql
# All frontend logs
{namespace="aether-be", source="frontend"}

# Frontend errors only
{namespace="aether-be", source="frontend"} | json | level="error"

# Logs for specific session
{namespace="aether-be", source="frontend"} | json | session_id="1234567890-abc123"

# Logs from specific component
{namespace="aether-be", source="frontend"} | json | extra_component="NotebookEditor"
```

### Development Mode
In development (`import.meta.env.DEV`), the logger is exposed on `window.logger` for debugging:

```javascript
// Open browser console
window.logger.info('Debug message', { custom_field: 'value' })
window.logger.flush() // Manually flush buffer
window.logger.disable() // Temporarily disable logging
window.logger.enable() // Re-enable logging
```