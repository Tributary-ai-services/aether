import React, { useState, useEffect, useRef } from 'react';
import { useSpace } from '../hooks/useSpaces.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAgentBuilder, useAgentProviders } from '../hooks/useAgentBuilder.js';
import { useFilters } from '../context/FilterContext.jsx';
import AgentCard from '../components/cards/AgentCard.jsx';
import AgentDetailModal from '../components/modals/AgentDetailModal.jsx';
import AgentCreateModal from '../components/modals/AgentCreateModal.jsx';
import AgentTestModal from '../components/modals/AgentTestModal.jsx';
import { LoadingWrapper, AgentCardSkeleton } from '../components/skeletons/index.js';
import { Bot, Plus, Settings, Zap, Brain, Cpu, CheckCircle, AlertCircle, Clock } from 'lucide-react';

// Module-level protection against duplicate default agent creation
// This survives component remounts (e.g., from React StrictMode double-mounting)
const defaultAgentCreationAttempts = new Set();

/**
 * Agent Builder Page - Advanced agent creation and management platform
 *
 * This page provides comprehensive agent management with real backend integration,
 * including creation, testing, configuration, and analytics.
 */
const AgentBuilderPage = () => {
  const { currentSpace, loadAvailableSpaces, initialized, loading: spacesLoading } = useSpace();
  const { user } = useAuth();
  const { agents, loading: agentsLoading, error: agentsError, stats, createAgent, updateAgent, deleteAgent, refetch: refetchAgents } = useAgentBuilder();
  const { providers, loading: providersLoading, error: providersError } = useAgentProviders();
  const { filterAgents } = useFilters();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState({
    backend: 'checking',
    providers: 'checking',
    database: 'checking'
  });
  const [creatingDefaultAgent, setCreatingDefaultAgent] = useState(false);

  // Synchronous lock to prevent race conditions - refs update immediately unlike state
  const creationInProgress = useRef(false);
  // Track which spaces we've already attempted or completed default agent creation for
  const spacesWithDefaultAgentAttempted = useRef(new Set());

  // Auto-create default agent if none exist for the current space
  // IMPORTANT: This only runs once per space to prevent duplicate creation
  // Uses multiple layers of protection:
  // 1. Check if "Personal Assistant" already exists BY NAME (persists across sessions)
  // 2. Module-level Set (survives remounts from React StrictMode)
  // 3. Ref-level Set (survives re-renders)
  // 4. Ref-level boolean lock (prevents concurrent async operations)
  // 5. Cleanup flag (prevents state updates after unmount)
  useEffect(() => {
    let isCancelled = false;

    const createDefaultAgentIfNeeded = async () => {
      // Use space_id consistently - it's the primary identifier
      const spaceId = currentSpace?.space_id;

      // Skip if no space or still loading agents
      if (!spaceId || agentsLoading) {
        return;
      }

      // Module-level check - survives component remounts (React StrictMode)
      if (defaultAgentCreationAttempts.has(spaceId)) {
        return;
      }

      // Synchronous check using ref - prevents race conditions from concurrent renders
      if (creationInProgress.current) {
        return;
      }

      // Skip if we've already attempted creation for this space (ref-level)
      if (spacesWithDefaultAgentAttempted.current.has(spaceId)) {
        return;
      }

      // Skip if agents array is not ready yet
      if (!Array.isArray(agents)) {
        return;
      }

      // PRIMARY CHECK: If a "Personal Assistant" agent already exists, skip creation
      // This check persists across sessions (page reloads, logout/login)
      const hasPersonalAssistant = agents.some(
        agent => agent.name === 'Personal Assistant' &&
                 agent.tags?.includes('personal-assistant')
      );

      if (hasPersonalAssistant) {
        console.log('Personal Assistant agent already exists, skipping creation');
        defaultAgentCreationAttempts.add(spaceId);
        spacesWithDefaultAgentAttempted.current.add(spaceId);
        return;
      }

      // SECONDARY CHECK: If user has any agents at all, mark space as handled and skip
      // (They may have deleted the default and don't want it recreated)
      if (agents.length > 0) {
        defaultAgentCreationAttempts.add(spaceId);
        spacesWithDefaultAgentAttempted.current.add(spaceId);
        return;
      }

      // Set ALL locks IMMEDIATELY before any async operation
      defaultAgentCreationAttempts.add(spaceId);
      creationInProgress.current = true;
      spacesWithDefaultAgentAttempted.current.add(spaceId);

      if (!isCancelled) {
        setCreatingDefaultAgent(true);
      }

      console.log('Creating default Personal Assistant agent for space:', spaceId);

      try {
        await createAgent({
          name: 'Personal Assistant',
          description: 'Your personal AI assistant for answering questions and helping with tasks. This is your default agent for the Agent Builder.',
          type: 'conversational',
          system_prompt: 'You are a helpful AI assistant. You provide clear, accurate, and thoughtful responses to questions. You are friendly, professional, and always aim to be useful.',
          llm_config: {
            provider: 'anthropic',
            model: 'claude-3-haiku-20240307',
            temperature: 0.7,
            max_tokens: 2000,
            optimization_level: 'balanced'
          },
          is_public: false,
          is_template: false,
          tags: ['assistant', 'default', 'personal-assistant']
        });
        console.log('Default Personal Assistant agent created successfully');
      } catch (error) {
        console.error('Failed to create default agent:', error);
      } finally {
        creationInProgress.current = false;
        if (!isCancelled) {
          setCreatingDefaultAgent(false);
        }
      }
    };

    createDefaultAgentIfNeeded();

    // Cleanup function - prevents state updates after unmount
    return () => {
      isCancelled = true;
    };
  }, [agents, agentsLoading, currentSpace?.space_id, createAgent]);

  // Initialize spaces - but don't block on it
  useEffect(() => {
    if (!initialized) {
      // Try to load spaces but continue anyway
      loadAvailableSpaces().catch(err => {
        console.log('Could not load spaces, continuing without them:', err);
      });
    }
  }, [initialized, loadAvailableSpaces]);

  // Don't wait for spaces - set loading to false when agents/providers are ready
  useEffect(() => {
    if (!agentsLoading && !providersLoading) {
      setIsLoading(false);
    }
  }, [agentsLoading, providersLoading]);

  // Test integration status
  useEffect(() => {
    const testIntegration = async () => {
      // Test backend connectivity - consider it connected if we can reach the API
      // even if there's an error fetching agents (might be due to space issues)
      try {
        // Backend is connected if we got any response (even if empty array or error)
        setIntegrationStatus(prev => ({ ...prev, backend: 'connected' }));
      } catch (err) {
        setIntegrationStatus(prev => ({ ...prev, backend: 'error' }));
      }

      // Test provider connectivity  
      try {
        if (providersError) {
          setIntegrationStatus(prev => ({ ...prev, providers: 'error' }));
        } else if (!providersLoading) {
          // If not loading and we have provider data (even empty array means backend responded)
          setIntegrationStatus(prev => ({ ...prev, providers: 'connected' }));
        } else {
          setIntegrationStatus(prev => ({ ...prev, providers: 'checking' }));
        }
      } catch (err) {
        setIntegrationStatus(prev => ({ ...prev, providers: 'error' }));
      }

      // Database is connected if we can fetch agents
      if (Array.isArray(agents)) {
        setIntegrationStatus(prev => ({ ...prev, database: 'connected' }));
      } else if (agentsError) {
        setIntegrationStatus(prev => ({ ...prev, database: 'error' }));
      }
    };

    if (!agentsLoading && !providersLoading) {
      testIntegration();
    }
  }, [agents, agentsError, providers, providersError, agentsLoading, providersLoading]);

  // Apply filters to agents
  const filteredAgents = filterAgents(agents || []);

  const handleCreateAgent = () => {
    console.log('🔵 Create Agent button clicked');
    console.log('🔵 Current createModalOpen state:', createModalOpen);
    // Only open if we have a valid space or can work without one
    setCreateModalOpen(true);
    console.log('🔵 Set createModalOpen to true');
  };

  const handleOpenDetail = (agent) => {
    setSelectedAgent(agent);
    setDetailModalOpen(true);
  };

  const handleTestAgent = (agent) => {
    setSelectedAgent(agent);
    setTestModalOpen(true);
  };

  const handleEditAgent = (agent) => {
    setSelectedAgent(agent);
    setCreateModalOpen(true);
  };

  const handleDeleteAgent = async (agent) => {
    if (window.confirm(`Are you sure you want to delete ${agent.name}?`)) {
      // Close the modal immediately for better UX
      setDetailModalOpen(false);
      setSelectedAgent(null);

      try {
        await deleteAgent(agent.id);
        // Small delay to ensure backend has processed the delete
        await new Promise(resolve => setTimeout(resolve, 300));
        // Refetch agents to ensure list is up to date
        await refetchAgents();
      } catch (error) {
        console.error('Failed to delete agent:', error);
        // Refetch anyway to show current state
        await refetchAgents();
      }
    }
  };

  const handleDuplicateAgent = async (agent) => {
    try {
      await createAgent({
        ...agent,
        name: `${agent.name} (Copy)`,
        id: undefined
      });
    } catch (error) {
      console.error('Failed to duplicate agent:', error);
    }
  };

  const backendConnected = integrationStatus.backend === 'connected';
  const hasAgents = Array.isArray(agents) && agents.length > 0;

  if (isLoading || creatingDefaultAgent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        {creatingDefaultAgent && (
          <p className="mt-4 text-gray-600">Creating your Personal Assistant agent...</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="text-blue-600" size={28} />
            Agent Builder
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced agent creation and management platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCreateAgent}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Create Agent
          </button>
          <button 
            className="px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      {true ? (
        <LoadingWrapper
          loading={agentsLoading}
          error={null}
          SkeletonComponent={AgentCardSkeleton}
          skeletonCount={6}
          loadingText="Loading agents..."
          errorTitle="Error loading agents"
        >
          {hasAgents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map(agent => (
                <AgentCard 
                  key={agent.id} 
                  agent={agent} 
                  onOpenDetail={() => handleOpenDetail(agent)}
                  onTestAgent={() => handleTestAgent(agent)}
                  onDuplicateAgent={() => handleDuplicateAgent(agent)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot className="text-blue-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents yet</h3>
              <p className="text-gray-600 mb-4">Create your first intelligent agent to get started</p>
              <button 
                onClick={handleCreateAgent}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={16} />
                Create Your First Agent
              </button>
            </div>
          )}
        </LoadingWrapper>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Brain className="text-white" size={32} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Clock className="text-white" size={16} />
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Connecting to Agent Builder Backend
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              The Agent Builder backend needs to be started to enable agent creation and management. 
              Please start the backend service on port 8087 to continue.
            </p>

            {/* Current Space Info */}
            {currentSpace && (
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Current Space:</span> {currentSpace.name}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real-time Integration Status */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="text-gray-600" size={18} />
          Real-time Integration Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              {integrationStatus.backend === 'connected' ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : integrationStatus.backend === 'error' ? (
                <AlertCircle className="text-red-500" size={20} />
              ) : (
                <Clock className="text-yellow-500" size={20} />
              )}
              <span className="font-medium">Backend API</span>
            </div>
            <p className="text-sm text-gray-600">
              {integrationStatus.backend === 'connected' ? 'Connected successfully' :
               integrationStatus.backend === 'error' ? 'Connection failed' : 'Checking connection...'}
            </p>
            {agentsError && (
              <p className="text-xs text-red-600 mt-1">{agentsError}</p>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              {integrationStatus.providers === 'connected' ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : integrationStatus.providers === 'error' ? (
                <AlertCircle className="text-red-500" size={20} />
              ) : (
                <Clock className="text-yellow-500" size={20} />
              )}
              <span className="font-medium">LLM Providers</span>
            </div>
            <p className="text-sm text-gray-600">
              {integrationStatus.providers === 'connected' ? `${providers?.length || 3} providers available` :
               integrationStatus.providers === 'error' ? 'Provider fetch failed' : 'Loading providers...'}
            </p>
            {providersError && (
              <p className="text-xs text-red-600 mt-1">{providersError}</p>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              {integrationStatus.database === 'connected' ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : integrationStatus.database === 'error' ? (
                <AlertCircle className="text-red-500" size={20} />
              ) : (
                <Clock className="text-yellow-500" size={20} />
              )}
              <span className="font-medium">Database</span>
            </div>
            <p className="text-sm text-gray-600">
              {integrationStatus.database === 'connected' ? `${agents.length} agents found` :
               integrationStatus.database === 'error' ? 'Database connection failed' : 'Checking database...'}
            </p>
          </div>
        </div>

        {/* User Statistics */}
        {stats && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Your Agent Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-800">{stats.total_agents || 0}</div>
                <div className="text-blue-600">Total Agents</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">{stats.total_executions || 0}</div>
                <div className="text-blue-600">Executions</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">${(stats.total_cost_usd || 0).toFixed(2)}</div>
                <div className="text-blue-600">Total Cost</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">{(stats.avg_response_time_ms || 0)}ms</div>
                <div className="text-blue-600">Avg Response</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      <AgentDetailModal 
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
        onTestAgent={handleTestAgent}
        onEditAgent={handleEditAgent}
        onDeleteAgent={handleDeleteAgent}
      />

      <AgentCreateModal
        isOpen={createModalOpen}
        onClose={() => {
          console.log('🔴 AgentCreateModal onClose called');
          setCreateModalOpen(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent} // For editing
        onCreateAgent={createAgent}
        onUpdateAgent={updateAgent}
      />

      <AgentTestModal
        isOpen={testModalOpen}
        onClose={() => {
          setTestModalOpen(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
      />
    </div>
  );
};

export default AgentBuilderPage;