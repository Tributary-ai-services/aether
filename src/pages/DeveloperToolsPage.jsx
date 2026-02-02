import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpace } from '../hooks/useSpaces.js';
import {
  Database,
  Search,
  Server,
  Sparkles,
  Code2,
  HardDrive
} from 'lucide-react';
import SQLQueriesTab from '../components/developer-tools/SQLQueriesTab.jsx';
import VectorTestingTab from '../components/developer-tools/VectorTestingTab.jsx';
import MCPTestingTab from '../components/developer-tools/MCPTestingTab.jsx';
import AIPlaygroundTab from '../components/developer-tools/AIPlaygroundTab.jsx';
import DataSourcesTab from '../components/developer-tools/DataSourcesTab.jsx';

const DeveloperToolsPage = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { currentSpace, loadAvailableSpaces, initialized } = useSpace();

  // Default to 'queries' tab if not specified
  const activeTab = tab || 'queries';

  // Initialize spaces
  useEffect(() => {
    if (!initialized) {
      loadAvailableSpaces();
    }
  }, [initialized, loadAvailableSpaces]);

  const tabs = [
    {
      id: 'queries',
      label: 'SQL Queries',
      icon: Database
    },
    {
      id: 'vectors',
      label: 'Vector Testing',
      icon: Search
    },
    {
      id: 'mcp',
      label: 'MCP Testing',
      icon: Server
    },
    {
      id: 'ai',
      label: 'AI Playground',
      icon: Sparkles
    },
    {
      id: 'data-sources',
      label: 'Data Sources',
      icon: HardDrive
    }
  ];

  const handleTabChange = (tabId) => {
    navigate(`/developer-tools/${tabId}`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'queries':
        return <SQLQueriesTab />;
      case 'vectors':
        return <VectorTestingTab />;
      case 'mcp':
        return <MCPTestingTab />;
      case 'ai':
        return <AIPlaygroundTab />;
      case 'data-sources':
        return <DataSourcesTab />;
      default:
        return <SQLQueriesTab />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] -mx-6 -mt-8">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Code2 size={20} className="text-(--color-primary-600)" />
          <h2 className="text-lg font-semibold text-gray-900">Developer Tools</h2>
        </div>
        <nav className="flex gap-2 overflow-x-auto">
          {tabs.map((tabItem) => {
            const Icon = tabItem.icon;
            const isActive = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                onClick={() => handleTabChange(tabItem.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-(--color-primary-100) text-(--color-primary-700) border border-(--color-primary-200)'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-(--color-primary-600)' : 'text-gray-500'} />
                {tabItem.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content area - full width */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="h-full p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default DeveloperToolsPage;
