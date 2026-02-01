import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * FilterSection - A collapsible wrapper for filter groups
 *
 * @param {string} label - The section label
 * @param {ReactNode} children - The filter content
 * @param {boolean} defaultExpanded - Whether the section starts expanded
 * @param {ReactNode} icon - Optional icon to display
 */
const FilterSection = ({ label, children, defaultExpanded = true, icon: Icon }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-100 pb-4 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left mb-2"
      >
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
          {Icon && <Icon size={14} className="text-gray-500" />}
          {label}
        </label>
        <span className="text-gray-400">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default FilterSection;
