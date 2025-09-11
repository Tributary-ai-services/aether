import React, { useState, useEffect } from 'react';
import { useAgents } from '../hooks/index.js';
import { useFilters } from '../context/FilterContext.jsx';
import { useSpace } from '../contexts/SpaceContext.jsx';
import AgentCard from '../components/cards/AgentCard.jsx';
import AgentDetailModal from '../components/modals/AgentDetailModal.jsx';
import { LoadingWrapper, AgentCardSkeleton } from '../components/skeletons/index.js';

const AgentsPage = () => {
  const { agents, loading, error, createAgent } = useAgents();
  const { filterAgents } = useFilters();
  const { currentSpace, loadAvailableSpaces, initialized } = useSpace();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Initialize spaces
  useEffect(() => {
    if (!initialized) {
      loadAvailableSpaces();
    }
  }, [initialized, loadAvailableSpaces]);

  // Apply filters to agents
  const filteredAgents = filterAgents(agents);

  const handleCreateAgent = async () => {
    setIsCreating(true);
    try {
      await createAgent({
        name: `New Agent ${agents.length + 1}`,
        mediaSupport: ['document'],
        recentAnalysis: 'Agent created and ready for training'
      });
    } catch (err) {
      console.error('Failed to create agent:', err);
    } finally {
      setIsCreating(false);
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">AI Agents</h2>
        <button 
          onClick={handleCreateAgent}
          disabled={isCreating}
          className="text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--color-secondary-600)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-secondary-700)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)'}
        >
          {isCreating ? 'Creating...' : 'Create Agent'}
        </button>
      </div>
      
      <LoadingWrapper
        loading={loading}
        error={error}
        SkeletonComponent={AgentCardSkeleton}
        skeletonCount={6}
        loadingText="Loading agents..."
        errorTitle="Error loading agents"
      >
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No agents found</div>
            <div className="text-gray-500 text-sm">Try adjusting your filters or create a new agent</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                onOpenDetail={() => {
                  setSelectedAgent(agent);
                  setDetailModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </LoadingWrapper>
      
      {/* Detail Modal */}
      <AgentDetailModal 
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
      />
    </div>
  );
};

export default AgentsPage;