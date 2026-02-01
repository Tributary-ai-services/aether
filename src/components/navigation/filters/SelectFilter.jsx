import React from 'react';
import { useFilters } from '../../../context/FilterContext.jsx';
import FilterSection from './FilterSection.jsx';

/**
 * SelectFilter - A dropdown select filter component
 *
 * @param {Object} config - The filter configuration
 * @param {string} sectionId - The current section ID
 */
const SelectFilter = ({ config, sectionId }) => {
  const { sectionFilters, setSectionFilter } = useFilters();

  const currentValue = sectionFilters?.[sectionId]?.[config.id] || config.defaultValue || '';

  const handleChange = (e) => {
    setSectionFilter(sectionId, config.id, e.target.value);
  };

  return (
    <FilterSection label={config.label}>
      <select
        value={currentValue}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) text-sm bg-white"
      >
        {config.options?.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </FilterSection>
  );
};

export default SelectFilter;
