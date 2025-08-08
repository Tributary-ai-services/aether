import React, { createContext, useContext, useReducer } from 'react';

// Initial filter state
const initialState = {
  search: '',
  status: [],
  dateRange: 'Last 30 days',
  mediaTypes: [],
  categories: []
};

// Filter actions
const FILTER_ACTIONS = {
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
      return initialState;
    
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

  // Action creators
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

  // Filter functions for different data types
  const filterNotebooks = (notebooks) => {
    return notebooks.filter(notebook => {
      // Search filter
      if (filters.search && !notebook.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Status filter (public/private)
      if (filters.status.length > 0) {
        const status = notebook.public ? 'Public' : 'Private';
        if (!filters.status.includes(status)) {
          return false;
        }
      }

      // Media type filter
      if (filters.mediaTypes.length > 0) {
        const hasMatchingMediaType = notebook.mediaTypes.some(type => 
          filters.mediaTypes.includes(type)
        );
        if (!hasMatchingMediaType) {
          return false;
        }
      }

      return true;
    });
  };

  const filterAgents = (agents) => {
    return agents.filter(agent => {
      // Search filter
      if (filters.search && !agent.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0) {
        const status = agent.status.charAt(0).toUpperCase() + agent.status.slice(1);
        if (!filters.status.includes(status)) {
          return false;
        }
      }

      // Media type filter
      if (filters.mediaTypes.length > 0) {
        const hasMatchingMediaType = agent.mediaSupport.some(type => 
          filters.mediaTypes.includes(type)
        );
        if (!hasMatchingMediaType) {
          return false;
        }
      }

      return true;
    });
  };

  const filterWorkflows = (workflows) => {
    return workflows.filter(workflow => {
      // Search filter
      if (filters.search && !workflow.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0) {
        const status = workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1);
        if (!filters.status.includes(status)) {
          return false;
        }
      }

      return true;
    });
  };

  const filterCommunityItems = (items) => {
    return items.filter(item => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!item.name.toLowerCase().includes(searchTerm) && 
            !item.author.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Category filter
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(item.type)) {
          return false;
        }
      }

      return true;
    });
  };

  const value = {
    filters,
    setSearch,
    toggleStatus,
    setDateRange,
    toggleMediaType,
    toggleCategory,
    clearAllFilters,
    setFilters,
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