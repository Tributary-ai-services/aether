import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFilters } from '../../context/FilterContext.jsx';
import { SECTION_FILTER_CONFIGS, getRouteSection } from '../../config/filterConfigs.ts';
import {
  SearchFilter,
  CheckboxFilter,
  ToggleFilter,
  SelectFilter
} from './filters/index.js';
import {
  Search,
  Calendar,
  Tag,
  Folder,
  Filter,
  Image,
  Video,
  Mic,
  FileText,
  Activity,
  Bot,
  Workflow,
  Users,
  BarChart3,
  Radio,
  X
} from 'lucide-react';

// Section icons for collapsed state
const sectionIcons = {
  'notebooks': [
    { icon: Search, title: 'Search', color: 'text-gray-600 group-hover:text-(--color-primary-600)' },
    { icon: Activity, title: 'Status', color: 'text-gray-600 group-hover:text-green-600' },
    { icon: Calendar, title: 'Date Range', color: 'text-gray-600 group-hover:text-purple-600' },
    { icon: Tag, title: 'Media Types', color: 'text-gray-600 group-hover:text-orange-600' }
  ],
  'agent-builder': [
    { icon: Search, title: 'Search', color: 'text-gray-600 group-hover:text-(--color-primary-600)' },
    { icon: Bot, title: 'System Agents', color: 'text-gray-600 group-hover:text-purple-600' },
    { icon: Activity, title: 'Status', color: 'text-gray-600 group-hover:text-green-600' },
    { icon: Tag, title: 'Type', color: 'text-gray-600 group-hover:text-blue-600' }
  ],
  'workflows': [
    { icon: Search, title: 'Search', color: 'text-gray-600 group-hover:text-(--color-primary-600)' },
    { icon: Activity, title: 'Status', color: 'text-gray-600 group-hover:text-green-600' },
    { icon: Workflow, title: 'Trigger', color: 'text-gray-600 group-hover:text-blue-600' }
  ],
  'community': [
    { icon: Search, title: 'Search', color: 'text-gray-600 group-hover:text-(--color-primary-600)' },
    { icon: Bot, title: 'System Tools', color: 'text-gray-600 group-hover:text-purple-600' },
    { icon: Folder, title: 'Item Type', color: 'text-gray-600 group-hover:text-orange-600' },
    { icon: Activity, title: 'Rating', color: 'text-gray-600 group-hover:text-yellow-600' }
  ],
  'analytics': [
    { icon: Search, title: 'Search', color: 'text-gray-600 group-hover:text-(--color-primary-600)' },
    { icon: BarChart3, title: 'Model Status', color: 'text-gray-600 group-hover:text-blue-600' },
    { icon: Activity, title: 'Experiments', color: 'text-gray-600 group-hover:text-green-600' }
  ],
  'streaming': [
    { icon: Search, title: 'Search', color: 'text-gray-600 group-hover:text-(--color-primary-600)' },
    { icon: Radio, title: 'Status', color: 'text-gray-600 group-hover:text-red-600' },
    { icon: Tag, title: 'Source', color: 'text-gray-600 group-hover:text-blue-600' }
  ]
};

// Section display names
const sectionNames = {
  'notebooks': 'Notebooks',
  'agent-builder': 'Agent Builder',
  'workflows': 'Workflows',
  'community': 'Community',
  'analytics': 'Analytics',
  'streaming': 'Streaming',
  'developer-tools': 'Developer Tools'
};

const LeftNavigation = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const {
    sectionFilters,
    setCurrentSection,
    clearSectionFilters,
    hasActiveFilters
  } = useFilters();

  // Get current section from route
  const currentSection = getRouteSection(location.pathname);
  const filterConfig = SECTION_FILTER_CONFIGS[currentSection];
  const icons = sectionIcons[currentSection] || sectionIcons['notebooks'];

  // Update context when section changes
  useEffect(() => {
    setCurrentSection(currentSection);
  }, [currentSection, setCurrentSection]);

  // Render a filter based on its type
  const renderFilter = (filter) => {
    const key = `${currentSection}-${filter.id}`;

    switch (filter.type) {
      case 'search':
        return <SearchFilter key={key} config={filter} sectionId={currentSection} />;
      case 'checkbox':
        return <CheckboxFilter key={key} config={filter} sectionId={currentSection} />;
      case 'toggle':
        return <ToggleFilter key={key} config={filter} sectionId={currentSection} />;
      case 'select':
        return <SelectFilter key={key} config={filter} sectionId={currentSection} />;
      default:
        return null;
    }
  };

  // Get active filter count for badge
  const getActiveFilterCount = () => {
    const filters = sectionFilters[currentSection] || {};
    let count = 0;

    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) count++;
      else if (typeof value === 'string' && value !== '' && key === 'search') count++;
      else if (typeof value === 'boolean' && value === true) count++;
    });

    return count;
  };

  const activeCount = getActiveFilterCount();
  const hasFilters = hasActiveFilters(currentSection);

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} relative flex flex-col`}>
      {/* Toggle Button - Filter Icon */}
      <div className="absolute top-4 right-3 z-10">
        <button
          onClick={onToggleCollapse}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-400 hover:text-(--color-primary-600) hover:bg-(--color-primary-50) transition-all relative"
          title={isCollapsed ? 'Expand Filters' : 'Collapse Filters'}
        >
          <Filter size={16} />
          {activeCount > 0 && isCollapsed && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-(--color-primary-600) text-white text-xs rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className={`p-4 ${isCollapsed ? 'pt-16' : 'pt-4'} flex-1 overflow-y-auto`}>
        {/* Header */}
        <div className="mb-6">
          {isCollapsed ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-px bg-gray-200"></div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 bg-(--color-primary-100) text-(--color-primary-700) text-xs font-medium rounded-full">
                    {activeCount} active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {sectionNames[currentSection] || 'Filters'}
              </p>
            </div>
          )}
        </div>

        {isCollapsed ? (
          /* Collapsed State - Show only icons */
          <div className="flex flex-col items-center space-y-4">
            {icons.map(({ icon: Icon, title, color }, index) => (
              <button
                key={index}
                className="p-3 rounded-lg hover:bg-gray-100 transition-colors group"
                title={title}
                onClick={onToggleCollapse}
              >
                <Icon size={18} className={color} />
              </button>
            ))}
          </div>
        ) : (
          /* Expanded State - Show dynamic filters based on section */
          <div className="space-y-6">
            {/* Developer Tools has no filters */}
            {currentSection === 'developer-tools' ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Filter size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  No filters available for this section
                </p>
              </div>
            ) : (
              <>
                {/* Render dynamic filters */}
                {filterConfig?.filters.map(filter => renderFilter(filter))}

                {/* Clear Filters Button */}
                {hasFilters && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => clearSectionFilters(currentSection)}
                      className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <X size={14} />
                      Clear All Filters
                    </button>
                  </div>
                )}

                {/* Active Filters Summary */}
                {hasFilters && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      {Object.entries(sectionFilters[currentSection] || {}).map(([key, value]) => {
                        // Skip empty values
                        if (Array.isArray(value) && value.length === 0) return null;
                        if (typeof value === 'string' && value === '') return null;
                        if (typeof value === 'boolean' && !value) return null;
                        // Skip default select values
                        const filter = filterConfig?.filters.find(f => f.id === key);
                        if (filter?.type === 'select' && value === filter.defaultValue) return null;

                        // Format display
                        let displayValue = value;
                        if (Array.isArray(value)) {
                          displayValue = value.join(', ');
                        } else if (typeof value === 'boolean') {
                          displayValue = 'Enabled';
                        }

                        return (
                          <div key={key} className="flex items-center gap-1">
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="truncate">{displayValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default LeftNavigation;
