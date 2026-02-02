import React from 'react';
import { Image, Video, Mic, FileText } from 'lucide-react';
import { useFilters } from '../../../context/FilterContext.jsx';
import FilterSection from './FilterSection.jsx';

// Map icon names to components
const iconMap = {
  'Image': Image,
  'Video': Video,
  'Mic': Mic,
  'FileText': FileText
};

/**
 * CheckboxFilter - A multi-select checkbox filter component
 *
 * @param {Object} config - The filter configuration
 * @param {string} sectionId - The current section ID
 */
const CheckboxFilter = ({ config, sectionId }) => {
  const { sectionFilters, toggleSectionFilterValue } = useFilters();

  const currentValues = sectionFilters?.[sectionId]?.[config.id] || [];

  const handleToggle = (value) => {
    toggleSectionFilterValue(sectionId, config.id, value);
  };

  return (
    <FilterSection label={config.label}>
      <div className="space-y-2">
        {config.options?.map(({ value, label, icon }) => {
          const IconComponent = icon ? iconMap[icon] : null;

          return (
            <label key={value} className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={currentValues.includes(value)}
                onChange={() => handleToggle(value)}
                className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)"
              />
              {IconComponent && (
                <IconComponent
                  size={14}
                  className="ml-2 mr-1 text-gray-500 group-hover:text-(--color-primary-600)"
                />
              )}
              <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </FilterSection>
  );
};

export default CheckboxFilter;
