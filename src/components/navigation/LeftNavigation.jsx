import React from 'react';
import { useFilters } from '../../context/FilterContext.jsx';
import {
  Search,
  Calendar,
  Tag,
  Folder,
  ChevronLeft,
  ChevronRight,
  Filter,
  Image,
  Video,
  Mic,
  FileText,
  Activity
} from 'lucide-react';

const LeftNavigation = ({ isCollapsed, onToggleCollapse }) => {
  const {
    filters,
    setSearch,
    toggleStatus,
    setDateRange,
    toggleMediaType,
    toggleCategory,
    clearAllFilters
  } = useFilters();

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (status) => {
    toggleStatus(status);
  };

  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
  };

  const handleMediaTypeChange = (mediaType) => {
    toggleMediaType(mediaType);
  };

  const handleCategoryChange = (category) => {
    toggleCategory(category);
  };

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} relative`}>
      {/* Toggle Button - Filter Icon */}
      <div className="absolute top-4 right-3 z-10">
        <button 
          onClick={onToggleCollapse}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-400 hover:text-(--color-primary-600) hover:bg-(--color-primary-50) transition-all"
          title={isCollapsed ? 'Expand Filters' : 'Collapse Filters'}
        >
          <Filter size={16} />
        </button>
      </div>

      <div className={`p-4 ${isCollapsed ? 'pt-16' : 'pt-4'}`}>
        {/* Header */}
        <div className="mb-6">
          {isCollapsed ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-px bg-gray-200"></div>
            </div>
          ) : (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
          )}
        </div>
        
        {isCollapsed ? (
          /* Collapsed State - Show only icons */
          <div className="flex flex-col items-center space-y-4">
            <button 
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors group"
              title="Search"
              onClick={() => !isCollapsed && document.querySelector('#search-input')?.focus()}
            >
              <Search size={18} className="text-gray-600 group-hover:text-(--color-primary-600)" />
            </button>
            <button 
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors group"
              title="Status Filter"
            >
              <Activity size={18} className="text-gray-600 group-hover:text-green-600" />
            </button>
            <button 
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors group"
              title="Date Range"
            >
              <Calendar size={18} className="text-gray-600 group-hover:text-purple-600" />
            </button>
            <button 
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors group"
              title="Media Types"
            >
              <Tag size={18} className="text-gray-600 group-hover:text-orange-600" />
            </button>
            <button 
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors group"
              title="Categories"
            >
              <Folder size={18} className="text-gray-600 group-hover:text-indigo-600" />
            </button>
          </div>
        ) : (
          /* Expanded State - Show full filters */
          <div className="space-y-6">
            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  id="search-input"
                  type="text" 
                  placeholder="Search..." 
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {['Active', 'Paused', 'Training', 'Public', 'Private'].map(status => (
                  <label key={status} className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filters.status.includes(status)}
                      onChange={() => handleStatusChange(status)}
                      className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)" 
                    />
                    <span className="ml-2 text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Date Range
              </label>
              <select 
                value={filters.dateRange}
                onChange={handleDateRangeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              >
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Custom range</option>
              </select>
            </div>

            {/* Media Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag size={16} className="inline mr-1" />
                Media Types
              </label>
              <div className="space-y-2">
                {[
                  { key: 'image', label: 'Images', icon: Image, color: 'text-blue-600' },
                  { key: 'video', label: 'Videos', icon: Video, color: 'text-purple-600' },
                  { key: 'audio', label: 'Audio', icon: Mic, color: 'text-green-600' },
                  { key: 'document', label: 'Documents', icon: FileText, color: 'text-gray-600' }
                ].map(({ key, label, icon: Icon, color }) => (
                  <label key={key} className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filters.mediaTypes.includes(key)}
                      onChange={() => handleMediaTypeChange(key)}
                      className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)" 
                    />
                    <Icon size={14} className={`ml-2 mr-1 ${color}`} />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Folder size={16} className="inline mr-1" />
                Categories
              </label>
              <div className="space-y-2">
                {['agent', 'workflow', 'notebook', 'Legal', 'Medical', 'Financial', 'General'].map(category => (
                  <label key={category} className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)" 
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="pt-4">
              <button 
                onClick={clearAllFilters}
                className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>

            {/* Active Filters Summary */}
            {(filters.search || filters.status.length > 0 || filters.mediaTypes.length > 0 || filters.categories.length > 0) && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  {filters.search && <div>Search: "{filters.search}"</div>}
                  {filters.status.length > 0 && <div>Status: {filters.status.join(', ')}</div>}
                  {filters.mediaTypes.length > 0 && <div>Media: {filters.mediaTypes.join(', ')}</div>}
                  {filters.categories.length > 0 && <div>Categories: {filters.categories.join(', ')}</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default LeftNavigation;