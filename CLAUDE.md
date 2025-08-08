# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aether** is an AI portal project in early conceptual stage. The main content is a comprehensive UI mockup (`docs/mock.tsx`) for the Aether AI platform - an enterprise multimodal AI platform that demonstrates sophisticated AI capabilities including document processing, AI agents, workflow automation, ML analytics, and real-time data streaming.

## Current Project State

This project is in the **conceptual/design phase** with no development infrastructure yet established. The repository contains:

- Basic README with minimal description
- Detailed React/TypeScript UI mockup in `docs/mock.tsx`
- Standard Apache 2.0 license
- Node.js-focused `.gitignore`

**No development environment exists yet** - missing package.json, build tools, dependencies, or testing infrastructure.

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