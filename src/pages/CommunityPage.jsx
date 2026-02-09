import React, { useState, useEffect, useMemo } from 'react';
import { communityItems, mockSkills } from '../data/mockData.js';
import CommunityCard from '../components/cards/CommunityCard.jsx';
import CommunityTabs from '../components/community/CommunityTabs.jsx';
import SkillCard from '../components/community/SkillCard.jsx';
import { useAgentBuilder } from '../hooks/useAgentBuilder.js';
import { api } from '../services/api.js';
import { useFilters } from '../context/FilterContext.jsx';
import { Sparkles, Wrench, Server, Code } from 'lucide-react';

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState('skills');
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [mcpServers, setMcpServers] = useState([]);
  const [loadingMcpServers, setLoadingMcpServers] = useState(true);
  const { sectionFilters, filterCommunityItems } = useFilters();

  const communityFilters = sectionFilters['community'] || {};
  const showSystemTools = communityFilters.showInternal ?? false;
  const searchText = communityFilters.search || '';

  // Unified fetch: always include internal agents for the community page
  const { agents: allFetchedAgents, loading: loadingAgents } = useAgentBuilder({}, { includeInternal: true });

  // Fetch skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoadingSkills(true);
        const response = await api.skills.list();
        const skillList = response.skills || response || [];
        setSkills(Array.isArray(skillList) ? skillList : []);
      } catch (error) {
        console.error('[Community] Failed to fetch skills, using mocks:', error);
        setSkills(mockSkills);
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchSkills();
  }, []);

  // Fetch MCP servers
  useEffect(() => {
    const fetchMcpServers = async () => {
      try {
        setLoadingMcpServers(true);
        const response = await api.mcp.listServers();
        setMcpServers(Array.isArray(response) ? response : response.servers || []);
      } catch (error) {
        console.error('[Community] Failed to fetch MCP servers:', error);
        setMcpServers([]);
      } finally {
        setLoadingMcpServers(false);
      }
    };
    fetchMcpServers();
  }, []);

  // Extract internal agents and convert to community card format
  const systemTools = useMemo(() => {
    const internalAgents = (allFetchedAgents || []).filter(a => a.is_internal);
    return internalAgents.map(agent => ({
      id: agent.id,
      title: agent.name,
      name: agent.name,
      description: agent.description,
      type: 'agent',
      author: 'Aether System',
      downloads: 0,
      rating: 5.0,
      tags: agent.tags || ['system', 'tool'],
      is_internal: true,
      isPublic: true,
      isSystemTool: true,
    }));
  }, [allFetchedAgents]);

  // Filter skills by sidebar search
  const filteredSkills = useMemo(() => {
    if (!searchText) return skills;
    const term = searchText.toLowerCase();
    return skills.filter(s =>
      (s.display_name || '').toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term) ||
      (s.name || '').toLowerCase().includes(term)
    );
  }, [skills, searchText]);

  // Filter MCP servers by sidebar search
  const filteredMcpServers = useMemo(() => {
    if (!searchText) return mcpServers;
    const term = searchText.toLowerCase();
    return mcpServers.filter(s =>
      (s.name || '').toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term)
    );
  }, [mcpServers, searchText]);

  // Community items with filters
  const allCommunityItems = useMemo(() => {
    const regularItems = communityItems.map(item => ({
      ...item,
      is_internal: item.is_internal ?? false,
    }));
    if (showSystemTools) {
      return [...regularItems, ...systemTools];
    }
    return regularItems;
  }, [systemTools, showSystemTools]);

  const filteredCommunityItems = filterCommunityItems(allCommunityItems);
  const filteredSystemTools = filteredCommunityItems.filter(item => item.isSystemTool);
  const filteredRegularItems = filteredCommunityItems.filter(item => !item.isSystemTool);

  // Tab counts
  const tabCounts = {
    skills: skills.length,
    'mcp-servers': mcpServers.length,
    functions: 0,
    community: communityItems.length + (showSystemTools ? systemTools.length : 0),
  };

  const renderSkillsTab = () => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-medium text-gray-900">Available Skills</h3>
        <span className="text-sm text-gray-500">{filteredSkills.length} skills</span>
      </div>
      {loadingSkills ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      ) : filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map(skill => (
            <SkillCard key={skill.id || skill.name} skill={skill} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Wrench size={32} className="text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No skills found</p>
          {searchText && (
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search in the filter panel</p>
          )}
        </div>
      )}
    </div>
  );

  const renderMcpServersTab = () => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-medium text-gray-900">MCP Servers</h3>
        <span className="text-sm text-gray-500">{filteredMcpServers.length} servers</span>
      </div>
      {loadingMcpServers ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            </div>
          ))}
        </div>
      ) : filteredMcpServers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMcpServers.map(server => (
            <div
              key={server.id}
              className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-50">
                  <Server size={20} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{server.name}</h4>
                  <span className={`text-xs ${
                    server.status === 'connected' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {server.status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">{server.description}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span>{server.type}</span>
                <span>v{server.version}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Server size={32} className="text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No MCP servers found</p>
        </div>
      )}
    </div>
  );

  const renderFunctionsTab = () => (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Code size={28} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Functions</h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto">
        Custom function support is coming soon. You'll be able to create and share
        reusable functions that agents can invoke during execution.
      </p>
    </div>
  );

  const renderCommunityTab = () => (
    <div>
      {/* System Tools Section */}
      {showSystemTools && filteredSystemTools.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Wrench size={18} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">System Tools</h3>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              Built-in
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSystemTools.map(tool => (
              <CommunityCard key={tool.id} item={tool} isSystemTool={true} />
            ))}
          </div>
        </div>
      )}

      {showSystemTools && loadingAgents && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Contributions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-medium text-gray-900">Community Contributions</h3>
        </div>
        {filteredRegularItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRegularItems.map((item, index) => (
              <CommunityCard key={item.id || index} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Sparkles className="text-gray-400 mx-auto mb-3" size={32} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your filters in the left panel</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Community Marketplace</h2>
        <p className="text-sm text-gray-500 mt-1">Use the filters on the left to search and refine results</p>
      </div>

      <div className="mb-6">
        <CommunityTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={tabCounts}
        />
      </div>

      {activeTab === 'skills' && renderSkillsTab()}
      {activeTab === 'mcp-servers' && renderMcpServersTab()}
      {activeTab === 'functions' && renderFunctionsTab()}
      {activeTab === 'community' && renderCommunityTab()}
    </div>
  );
};

export default CommunityPage;
