import React, { useState, useEffect } from 'react';
import { communityItems } from '../data/mockData.js';
import CommunityCard from '../components/cards/CommunityCard.jsx';
import { api } from '../services/api.js';
import { Sparkles, Wrench } from 'lucide-react';

const CommunityPage = () => {
  const [internalAgents, setInternalAgents] = useState([]);
  const [loadingInternal, setLoadingInternal] = useState(true);

  // Fetch internal (system) agents on mount
  useEffect(() => {
    const fetchInternalAgents = async () => {
      try {
        setLoadingInternal(true);
        const response = await api.internalAgents.getAll();
        setInternalAgents(response.agents || []);
      } catch (error) {
        console.error('Failed to fetch internal agents:', error);
        setInternalAgents([]);
      } finally {
        setLoadingInternal(false);
      }
    };

    fetchInternalAgents();
  }, []);

  // Convert internal agents to community card format
  const systemTools = internalAgents.map(agent => ({
    id: agent.id,
    title: agent.name,
    description: agent.description,
    type: 'system-tool',
    author: 'Aether System',
    downloads: 0,
    rating: 5.0,
    tags: agent.tags || ['system', 'tool'],
    isInternal: true,
    isPublic: true
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Community Marketplace</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Filter
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Sort
          </button>
        </div>
      </div>

      {/* System Tools Section */}
      {systemTools.length > 0 && (
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
            {systemTools.map((tool) => (
              <CommunityCard key={tool.id} item={tool} isSystemTool={true} />
            ))}
          </div>
        </div>
      )}

      {loadingInternal && (
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communityItems.map((item, index) => (
            <CommunityCard key={index} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
