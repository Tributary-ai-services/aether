import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { getDefaultSectionFilters } from '../config/filterConfigs.ts';

// Get default section filters from configuration
const defaultSectionFilters = getDefaultSectionFilters();

// Initial filter state
const initialState = {
  // Section-aware filters
  currentSection: 'notebooks',
  sectionFilters: defaultSectionFilters,

  // Legacy global filters for backward compatibility
  search: '',
  status: [],
  dateRange: 'Last 30 days',
  mediaTypes: [],
  categories: []
};

// Filter actions
const FILTER_ACTIONS = {
  // Section-aware actions
  SET_CURRENT_SECTION: 'SET_CURRENT_SECTION',
  SET_SECTION_FILTER: 'SET_SECTION_FILTER',
  TOGGLE_SECTION_FILTER_VALUE: 'TOGGLE_SECTION_FILTER_VALUE',
  CLEAR_SECTION_FILTERS: 'CLEAR_SECTION_FILTERS',

  // Legacy global actions
  SET_SEARCH: 'SET_SEARCH',
  TOGGLE_STATUS: 'TOGGLE_STATUS',
  SET_DATE_RANGE: 'SET_DATE_RANGE',
  TOGGLE_MEDIA_TYPE: 'TOGGLE_MEDIA_TYPE',
  TOGGLE_CATEGORY: 'TOGGLE_CATEGORY',
  CLEAR_ALL: 'CLEAR_ALL',
  SET_FILTERS: 'SET_FILTERS'
};

// Filter reducer
const filterReducer = (state, action) => {
  switch (action.type) {
    // Section-aware actions
    case FILTER_ACTIONS.SET_CURRENT_SECTION:
      return { ...state, currentSection: action.payload };

    case FILTER_ACTIONS.SET_SECTION_FILTER: {
      const { sectionId, filterId, value } = action.payload;
      return {
        ...state,
        sectionFilters: {
          ...state.sectionFilters,
          [sectionId]: {
            ...state.sectionFilters[sectionId],
            [filterId]: value
          }
        }
      };
    }

    case FILTER_ACTIONS.TOGGLE_SECTION_FILTER_VALUE: {
      const { sectionId, filterId, value } = action.payload;
      const currentValues = state.sectionFilters[sectionId]?.[filterId] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      return {
        ...state,
        sectionFilters: {
          ...state.sectionFilters,
          [sectionId]: {
            ...state.sectionFilters[sectionId],
            [filterId]: newValues
          }
        }
      };
    }

    case FILTER_ACTIONS.CLEAR_SECTION_FILTERS: {
      const sectionId = action.payload;
      return {
        ...state,
        sectionFilters: {
          ...state.sectionFilters,
          [sectionId]: { ...defaultSectionFilters[sectionId] }
        }
      };
    }

    // Legacy global actions
    case FILTER_ACTIONS.SET_SEARCH:
      return { ...state, search: action.payload };

    case FILTER_ACTIONS.TOGGLE_STATUS:
      return {
        ...state,
        status: state.status.includes(action.payload)
          ? state.status.filter(s => s !== action.payload)
          : [...state.status, action.payload]
      };

    case FILTER_ACTIONS.SET_DATE_RANGE:
      return { ...state, dateRange: action.payload };

    case FILTER_ACTIONS.TOGGLE_MEDIA_TYPE:
      return {
        ...state,
        mediaTypes: state.mediaTypes.includes(action.payload)
          ? state.mediaTypes.filter(m => m !== action.payload)
          : [...state.mediaTypes, action.payload]
      };

    case FILTER_ACTIONS.TOGGLE_CATEGORY:
      return {
        ...state,
        categories: state.categories.includes(action.payload)
          ? state.categories.filter(c => c !== action.payload)
          : [...state.categories, action.payload]
      };

    case FILTER_ACTIONS.CLEAR_ALL:
      return {
        ...initialState,
        sectionFilters: { ...defaultSectionFilters }
      };

    case FILTER_ACTIONS.SET_FILTERS:
      return { ...state, ...action.payload };

    default:
      return state;
  }
};

// Create context
const FilterContext = createContext();

// Provider component
export const FilterProvider = ({ children }) => {
  const [filters, dispatch] = useReducer(filterReducer, initialState);

  // Section-aware action creators
  const setCurrentSection = useCallback((sectionId) => {
    dispatch({ type: FILTER_ACTIONS.SET_CURRENT_SECTION, payload: sectionId });
  }, []);

  const setSectionFilter = useCallback((sectionId, filterId, value) => {
    dispatch({
      type: FILTER_ACTIONS.SET_SECTION_FILTER,
      payload: { sectionId, filterId, value }
    });
  }, []);

  const toggleSectionFilterValue = useCallback((sectionId, filterId, value) => {
    dispatch({
      type: FILTER_ACTIONS.TOGGLE_SECTION_FILTER_VALUE,
      payload: { sectionId, filterId, value }
    });
  }, []);

  const clearSectionFilters = useCallback((sectionId) => {
    dispatch({ type: FILTER_ACTIONS.CLEAR_SECTION_FILTERS, payload: sectionId });
  }, []);

  // Legacy action creators
  const setSearch = (search) => {
    dispatch({ type: FILTER_ACTIONS.SET_SEARCH, payload: search });
  };

  const toggleStatus = (status) => {
    dispatch({ type: FILTER_ACTIONS.TOGGLE_STATUS, payload: status });
  };

  const setDateRange = (dateRange) => {
    dispatch({ type: FILTER_ACTIONS.SET_DATE_RANGE, payload: dateRange });
  };

  const toggleMediaType = (mediaType) => {
    dispatch({ type: FILTER_ACTIONS.TOGGLE_MEDIA_TYPE, payload: mediaType });
  };

  const toggleCategory = (category) => {
    dispatch({ type: FILTER_ACTIONS.TOGGLE_CATEGORY, payload: category });
  };

  const clearAllFilters = () => {
    dispatch({ type: FILTER_ACTIONS.CLEAR_ALL });
  };

  const setFilters = (newFilters) => {
    dispatch({ type: FILTER_ACTIONS.SET_FILTERS, payload: newFilters });
  };

  // Section-aware filter functions
  const filterAgents = (agents) => {
    const sectionFilters = filters.sectionFilters['agent-builder'] || {};
    const { search, showInternal, status, type, spaceType } = sectionFilters;

    return agents.filter(agent => {
      // Internal filter (default: hide internal agents)
      if (!showInternal && agent.is_internal) {
        return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const nameMatch = agent.name?.toLowerCase().includes(searchLower);
        const descMatch = agent.description?.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }

      // Status filter
      if (status && status.length > 0) {
        const agentStatus = agent.status?.toLowerCase();
        if (!status.includes(agentStatus)) {
          return false;
        }
      }

      // Type filter
      if (type && type.length > 0) {
        const agentType = agent.type?.toLowerCase();
        if (!type.includes(agentType)) {
          return false;
        }
      }

      // Space type filter
      if (spaceType && spaceType.length > 0) {
        const visibility = agent.is_public ? 'organization' : 'personal';
        if (!spaceType.includes(visibility)) {
          return false;
        }
      }

      return true;
    });
  };

  const filterNotebooks = (notebooks) => {
    const sectionFilters = filters.sectionFilters['notebooks'] || {};
    const { search, visibility, mediaTypes } = sectionFilters;

    return notebooks.filter(notebook => {
      // Search filter
      if (search && !notebook.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      // Visibility filter
      if (visibility && visibility.length > 0) {
        const notebookVisibility = notebook.public ? 'public' : 'private';
        if (!visibility.includes(notebookVisibility)) {
          return false;
        }
      }

      // Media type filter
      if (mediaTypes && mediaTypes.length > 0) {
        const hasMatchingMediaType = notebook.mediaTypes?.some(type =>
          mediaTypes.includes(type)
        );
        if (!hasMatchingMediaType) {
          return false;
        }
      }

      return true;
    });
  };

  const filterWorkflows = (workflows) => {
    const sectionFilters = filters.sectionFilters['workflows'] || {};
    const { search, status, triggerType } = sectionFilters;

    return workflows.filter(workflow => {
      // Search filter
      if (search && !workflow.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      // Status filter
      if (status && status.length > 0) {
        const workflowStatus = workflow.status?.toLowerCase();
        if (!status.includes(workflowStatus)) {
          return false;
        }
      }

      // Trigger type filter
      if (triggerType && triggerType.length > 0) {
        const trigger = workflow.triggerType?.toLowerCase();
        if (!triggerType.includes(trigger)) {
          return false;
        }
      }

      return true;
    });
  };

  const filterCommunityItems = (items) => {
    const sectionFilters = filters.sectionFilters['community'] || {};
    const { search, showInternal, itemType, rating } = sectionFilters;

    return items.filter(item => {
      // Internal/System tools filter
      if (!showInternal && item.isInternal) {
        return false;
      }

      // Search filter
      if (search) {
        const searchTerm = search.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(searchTerm) ||
                          item.title?.toLowerCase().includes(searchTerm);
        const authorMatch = item.author?.toLowerCase().includes(searchTerm);
        if (!nameMatch && !authorMatch) {
          return false;
        }
      }

      // Item type filter
      if (itemType && itemType.length > 0) {
        if (!itemType.includes(item.type)) {
          return false;
        }
      }

      // Rating filter
      if (rating && rating !== 'all') {
        const minRating = parseFloat(rating);
        if (item.rating < minRating) {
          return false;
        }
      }

      return true;
    });
  };

  // Get current section filters
  const getCurrentSectionFilters = useCallback(() => {
    return filters.sectionFilters[filters.currentSection] || {};
  }, [filters.sectionFilters, filters.currentSection]);

  // Check if any filters are active for a section
  const hasActiveFilters = useCallback((sectionId) => {
    const sectionFilters = filters.sectionFilters[sectionId] || {};
    const defaults = defaultSectionFilters[sectionId] || {};

    return Object.keys(sectionFilters).some(key => {
      const current = sectionFilters[key];
      const defaultVal = defaults[key];

      if (Array.isArray(current)) {
        return current.length > 0;
      }
      if (typeof current === 'string') {
        return current !== '' && current !== defaultVal;
      }
      if (typeof current === 'boolean') {
        return current !== defaultVal;
      }
      return false;
    });
  }, [filters.sectionFilters]);

  const value = {
    filters,
    // Section-aware state and actions
    currentSection: filters.currentSection,
    sectionFilters: filters.sectionFilters,
    setCurrentSection,
    setSectionFilter,
    toggleSectionFilterValue,
    clearSectionFilters,
    getCurrentSectionFilters,
    hasActiveFilters,
    // Legacy actions
    setSearch,
    toggleStatus,
    setDateRange,
    toggleMediaType,
    toggleCategory,
    clearAllFilters,
    setFilters,
    // Filter functions
    filterNotebooks,
    filterAgents,
    filterWorkflows,
    filterCommunityItems
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

// Custom hook to use filter context
export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

export default FilterContext;
