/**
 * Filter Configuration System
 *
 * Defines section-specific filter configurations for the left navigation panel.
 * Each section can have different filters appropriate to its content type.
 */

export interface FilterOption {
  value: string;
  label: string;
  icon?: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'search' | 'checkbox' | 'toggle' | 'select';
  placeholder?: string;
  options?: FilterOption[];
  defaultValue?: string | boolean | string[];
  description?: string;
}

export interface SectionFilterConfig {
  sectionId: string;
  filters: FilterConfig[];
  defaultState: Record<string, string | boolean | string[]>;
}

/**
 * Section filter configurations
 * Each key corresponds to a route/section in the application
 */
export const SECTION_FILTER_CONFIGS: Record<string, SectionFilterConfig> = {
  'notebooks': {
    sectionId: 'notebooks',
    filters: [
      {
        id: 'search',
        type: 'search',
        label: 'Search',
        placeholder: 'Search notebooks...'
      },
      {
        id: 'visibility',
        type: 'checkbox',
        label: 'Visibility',
        options: [
          { value: 'public', label: 'Public' },
          { value: 'private', label: 'Private' }
        ]
      },
      {
        id: 'dateRange',
        type: 'select',
        label: 'Date Range',
        options: [
          { value: 'Last 24 hours', label: 'Last 24 hours' },
          { value: 'Last 7 days', label: 'Last 7 days' },
          { value: 'Last 30 days', label: 'Last 30 days' },
          { value: 'Last 90 days', label: 'Last 90 days' },
          { value: 'Custom range', label: 'Custom range' }
        ],
        defaultValue: 'Last 30 days'
      },
      {
        id: 'mediaTypes',
        type: 'checkbox',
        label: 'Media Types',
        options: [
          { value: 'image', label: 'Images', icon: 'Image' },
          { value: 'video', label: 'Videos', icon: 'Video' },
          { value: 'audio', label: 'Audio', icon: 'Mic' },
          { value: 'document', label: 'Documents', icon: 'FileText' }
        ]
      }
    ],
    defaultState: {
      search: '',
      visibility: [],
      dateRange: 'Last 30 days',
      mediaTypes: []
    }
  },

  'agent-builder': {
    sectionId: 'agent-builder',
    filters: [
      {
        id: 'search',
        type: 'search',
        label: 'Search',
        placeholder: 'Search agents...'
      },
      {
        id: 'showInternal',
        type: 'toggle',
        label: 'Show System Agents',
        defaultValue: false,
        description: 'Include internal system agents in the list'
      },
      {
        id: 'status',
        type: 'checkbox',
        label: 'Status',
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'active', label: 'Active' },
          { value: 'disabled', label: 'Disabled' }
        ]
      },
      {
        id: 'type',
        type: 'checkbox',
        label: 'Agent Type',
        options: [
          { value: 'conversational', label: 'Conversational' },
          { value: 'qa', label: 'Q&A' },
          { value: 'producer', label: 'Producer' },
          { value: 'assistant', label: 'Assistant' }
        ]
      },
      {
        id: 'spaceType',
        type: 'checkbox',
        label: 'Visibility',
        options: [
          { value: 'personal', label: 'Personal' },
          { value: 'organization', label: 'Organization' }
        ]
      }
    ],
    defaultState: {
      search: '',
      showInternal: false,
      status: [],
      type: [],
      spaceType: []
    }
  },

  'workflows': {
    sectionId: 'workflows',
    filters: [
      {
        id: 'search',
        type: 'search',
        label: 'Search',
        placeholder: 'Search workflows...'
      },
      {
        id: 'status',
        type: 'checkbox',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'paused', label: 'Paused' },
          { value: 'draft', label: 'Draft' }
        ]
      },
      {
        id: 'triggerType',
        type: 'checkbox',
        label: 'Trigger Type',
        options: [
          { value: 'manual', label: 'Manual' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'event', label: 'Event-based' },
          { value: 'webhook', label: 'Webhook' }
        ]
      }
    ],
    defaultState: {
      search: '',
      status: [],
      triggerType: []
    }
  },

  'community': {
    sectionId: 'community',
    filters: [
      {
        id: 'search',
        type: 'search',
        label: 'Search',
        placeholder: 'Search marketplace...'
      },
      {
        id: 'showInternal',
        type: 'toggle',
        label: 'Show System Tools',
        defaultValue: false,
        description: 'Show built-in system tools and agents'
      },
      {
        id: 'itemType',
        type: 'checkbox',
        label: 'Item Type',
        options: [
          { value: 'agent', label: 'Agents' },
          { value: 'workflow', label: 'Workflows' },
          { value: 'notebook', label: 'Notebooks' },
          { value: 'template', label: 'Templates' }
        ]
      },
      {
        id: 'rating',
        type: 'select',
        label: 'Rating',
        options: [
          { value: 'all', label: 'All Ratings' },
          { value: '4+', label: '4+ Stars' },
          { value: '3+', label: '3+ Stars' }
        ],
        defaultValue: 'all'
      },
      {
        id: 'sortBy',
        type: 'select',
        label: 'Sort By',
        options: [
          { value: 'downloads', label: 'Most Downloads' },
          { value: 'rating', label: 'Highest Rated' },
          { value: 'newest', label: 'Newest' }
        ],
        defaultValue: 'downloads'
      }
    ],
    defaultState: {
      search: '',
      showInternal: false,
      itemType: [],
      rating: 'all',
      sortBy: 'downloads'
    }
  },

  'analytics': {
    sectionId: 'analytics',
    filters: [
      {
        id: 'search',
        type: 'search',
        label: 'Search',
        placeholder: 'Search models...'
      },
      {
        id: 'modelStatus',
        type: 'checkbox',
        label: 'Model Status',
        options: [
          { value: 'deployed', label: 'Deployed' },
          { value: 'training', label: 'Training' },
          { value: 'failed', label: 'Failed' },
          { value: 'archived', label: 'Archived' }
        ]
      },
      {
        id: 'experimentStatus',
        type: 'checkbox',
        label: 'Experiment Status',
        options: [
          { value: 'running', label: 'Running' },
          { value: 'completed', label: 'Completed' },
          { value: 'pending', label: 'Pending' }
        ]
      }
    ],
    defaultState: {
      search: '',
      modelStatus: [],
      experimentStatus: []
    }
  },

  'streaming': {
    sectionId: 'streaming',
    filters: [
      {
        id: 'search',
        type: 'search',
        label: 'Search',
        placeholder: 'Search streams...'
      },
      {
        id: 'streamStatus',
        type: 'checkbox',
        label: 'Stream Status',
        options: [
          { value: 'live', label: 'Live' },
          { value: 'paused', label: 'Paused' },
          { value: 'ended', label: 'Ended' }
        ]
      },
      {
        id: 'sourceType',
        type: 'checkbox',
        label: 'Source Type',
        options: [
          { value: 'api', label: 'API' },
          { value: 'webhook', label: 'Webhook' },
          { value: 'kafka', label: 'Kafka' },
          { value: 'file', label: 'File Upload' }
        ]
      },
      {
        id: 'mediaType',
        type: 'checkbox',
        label: 'Media Type',
        options: [
          { value: 'text', label: 'Text' },
          { value: 'json', label: 'JSON' },
          { value: 'binary', label: 'Binary' }
        ]
      }
    ],
    defaultState: {
      search: '',
      streamStatus: [],
      sourceType: [],
      mediaType: []
    }
  },

  'developer-tools': {
    sectionId: 'developer-tools',
    filters: [], // Developer tools has its own internal tab navigation
    defaultState: {}
  }
};

/**
 * Maps route paths to section IDs
 */
export const getRouteSection = (pathname: string): string => {
  if (pathname === '/' || pathname.startsWith('/notebooks')) return 'notebooks';
  if (pathname === '/agent-builder' || pathname.startsWith('/agent-builder')) return 'agent-builder';
  if (pathname === '/workflows' || pathname.startsWith('/workflows')) return 'workflows';
  if (pathname === '/analytics' || pathname.startsWith('/analytics')) return 'analytics';
  if (pathname === '/community' || pathname.startsWith('/community')) return 'community';
  if (pathname === '/streaming' || pathname.startsWith('/streaming')) return 'streaming';
  if (pathname.startsWith('/developer-tools')) return 'developer-tools';
  return 'notebooks'; // Default fallback
};

/**
 * Get filter configuration for a section
 */
export const getSectionFilterConfig = (sectionId: string): SectionFilterConfig | undefined => {
  return SECTION_FILTER_CONFIGS[sectionId];
};

/**
 * Get default state for all sections
 */
export const getDefaultSectionFilters = (): Record<string, Record<string, string | boolean | string[]>> => {
  const defaults: Record<string, Record<string, string | boolean | string[]>> = {};
  Object.keys(SECTION_FILTER_CONFIGS).forEach(sectionId => {
    defaults[sectionId] = { ...SECTION_FILTER_CONFIGS[sectionId].defaultState };
  });
  return defaults;
};

export default SECTION_FILTER_CONFIGS;
