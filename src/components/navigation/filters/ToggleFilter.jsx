import React from 'react';
import { useFilters } from '../../../context/FilterContext.jsx';

/**
 * ToggleFilter - An on/off toggle switch filter component
 *
 * @param {Object} config - The filter configuration
 * @param {string} sectionId - The current section ID
 */
const ToggleFilter = ({ config, sectionId }) => {
  const { sectionFilters, setSectionFilter } = useFilters();

  const isEnabled = sectionFilters?.[sectionId]?.[config.id] ?? config.defaultValue ?? false;

  const handleToggle = () => {
    setSectionFilter(sectionId, config.id, !isEnabled);
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700 cursor-pointer" onClick={handleToggle}>
          {config.label}
        </label>
        {config.description && (
          <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer
          rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:ring-offset-2
          ${isEnabled ? 'bg-(--color-primary-600)' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

export default ToggleFilter;
