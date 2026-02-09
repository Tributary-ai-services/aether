import React from 'react';
import { Wrench, Server, Code, Users } from 'lucide-react';

const tabs = [
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'mcp-servers', label: 'MCP Servers', icon: Server },
  { id: 'functions', label: 'Functions', icon: Code },
  { id: 'community', label: 'Community', icon: Users },
];

const CommunityTabs = ({ activeTab, onTabChange, counts = {} }) => {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              isActive
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
            {count !== undefined && count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CommunityTabs;
