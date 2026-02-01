import React from 'react';
import { Search } from 'lucide-react';
import { useFilters } from '../../../context/FilterContext.jsx';

/**
 * SearchFilter - A search input filter component
 *
 * @param {Object} config - The filter configuration
 * @param {string} sectionId - The current section ID
 */
const SearchFilter = ({ config, sectionId }) => {
  const { sectionFilters, setSectionFilter } = useFilters();

  const currentValue = sectionFilters?.[sectionId]?.[config.id] || '';

  const handleChange = (e) => {
    setSectionFilter(sectionId, config.id, e.target.value);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {config.label}
      </label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={config.placeholder || 'Search...'}
          value={currentValue}
          onChange={handleChange}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) text-sm"
        />
      </div>
    </div>
  );
};

export default SearchFilter;
