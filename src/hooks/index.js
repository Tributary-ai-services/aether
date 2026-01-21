// Custom hooks for the Aether AI platform

// Space management hooks (Redux-based replacement for SpaceContext)
export { useSpaces, useSpace } from './useSpaces.js';

// Permission and access control hooks
export { usePermission } from './usePermission.js';
export { useSpaceRole } from './useSpaceRole.js';
export { useResourceAccess, useNotebookAccess, useDocumentAccess } from './useResourceAccess.js';

// Feature hooks
export { useNotebooks, useNotebook, useNotebookTree, useNotebookStats } from './useNotebooks.js';
export { useNotebookOperations } from './useNotebookOperations.js';
export {
  useAgentBuilder,
  useAgent,
  useAgentExecution,
  useAgentStats,
  useAgentProviders
} from './useAgentBuilder.js';
export { useWorkflows } from './useWorkflows.js';
export { useAnalytics, useMLModels, useExperiments } from './useAnalytics.js';
export { useCommunity } from './useCommunity.js';
export { useStreaming } from './useStreaming.js';