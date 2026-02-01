import React, { useState, useEffect, useMemo } from 'react';
import { communityItems } from '../data/mockData.js';
import CommunityCard from '../components/cards/CommunityCard.jsx';
import { api } from '../services/api.js';
import { useFilters } from '../context/FilterContext.jsx';
import { Sparkles, Wrench } from 'lucide-react';

const CommunityPage = () => {
  const [internalAgents, setInternalAgents] = useState([]);
  const [loadingInternal, setLoadingInternal] = useState(true);
  const { sectionFilters, filterCommunityItems } = useFilters();

  // Get current filter state for community section
  const communityFilters = sectionFilters['community'] || {};
  const showSystemTools = communityFilters.showInternal ?? false;

  // Fetch internal (system) agents on mount
  useEffect(() => {
    const fetchInternalAgents = async () => {
      try {
        setLoadingInternal(true);
        console.log('[Community] Fetching internal agents...');
        const response = await api.internalAgents.getAll();
        console.log('[Community] Internal agents response:', response);
        const agents = response.agents || [];
        console.log('[Community] Setting internal agents:', agents.length, 'agents');
        setInternalAgents(agents);
      } catch (error) {
        console.error('[Community] Failed to fetch internal agents:', error);
        setInternalAgents([]);
      } finally {
        setLoadingInternal(false);
      }
    };

    fetchInternalAgents();
  }, []);

  // Convert internal agents to community card format
  // System tools are agents, so set type to 'agent' for filtering with "Agents" item type
  const systemTools = useMemo(() => internalAgents.map(agent => ({
    id: agent.id,
    title: agent.name,
    name: agent.name,
    description: agent.description,
    type: 'agent', // System tools are agents - ensures they filter with "Agents" item type
    author: 'Aether System',
    downloads: 0,
    rating: 5.0,
    tags: agent.tags || ['system', 'tool'],
    isInternal: true,
    isPublic: true,
    isSystemTool: true // Separate flag for visual styling and toggle behavior
  })), [internalAgents]);

  // Combine all items and apply filters
  const allItems = useMemo(() => {
    // Add isInternal: false to community items if not set
    const regularItems = communityItems.map(item => ({
      ...item,
      isInternal: item.isInternal ?? false
    }));

    // When toggle is on, include system tools in the filterable list
    if (showSystemTools) {
      return [...regularItems, ...systemTools];
    }

    return regularItems;
  }, [systemTools, showSystemTools]);

  // Apply filters to all items
  const filteredItems = filterCommunityItems(allItems);

  // Separate filtered items into system tools and regular items for display
  const filteredSystemTools = filteredItems.filter(item => item.isSystemTool);
  const filteredCommunityItems = filteredItems.filter(item => !item.isSystemTool);

  // Determine if we should show system tools section
  const shouldShowSystemTools = showSystemTools && filteredSystemTools.length > 0;
  const shouldShowLoading = showSystemTools && loadingInternal;

  // Debug logging
  console.log('[Community] Filter state:', {
    showSystemTools,
    internalAgentsCount: internalAgents.length,
    systemToolsCount: systemTools.length,
    allItemsCount: allItems.length,
    filteredItemsCount: filteredItems.length,
    filteredSystemToolsCount: filteredSystemTools.length,
    loadingInternal,
    shouldShowSystemTools,
    shouldShowLoading
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Community Marketplace</h2>
        <div className="text-sm text-gray-500">
          {filteredItems.length} items
          {showSystemTools && filteredSystemTools.length > 0 && (
            <span className="text-purple-600 ml-1">
              ({filteredSystemTools.length} system)
            </span>
          )}
        </div>
      </div>

      {/* System Tools Section - Only shown when toggle is enabled and items pass filters */}
      {shouldShowSystemTools && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wrench size={18} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">System Tools</h3>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              Built-in
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            AI-powered tools available to all users for enhanced productivity
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSystemTools.map((tool) => (
              <CommunityCard key={tool.id} item={tool} isSystemTool={true} />
            ))}
          </div>
        </div>
      )}

      {/* Loading state for system tools when toggle is enabled */}
      {shouldShowLoading && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg animate-pulse">
              <Wrench size={18} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">System Tools</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Items Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-medium text-gray-900">Community Contributions</h3>
          {communityFilters.search && (
            <span className="text-sm text-gray-500">
              ({filteredCommunityItems.length} results)
            </span>
          )}
        </div>

        {filteredCommunityItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunityItems.map((item, index) => (
              <CommunityCard key={item.id || index} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
