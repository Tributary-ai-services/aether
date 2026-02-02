/**
 * Utility functions for notebook operations
 */

/**
 * Build a path string from a notebook up to its root
 */
export const buildNotebookPath = (notebook, allNotebooks) => {
  const path = [];
  let current = notebook;
  
  while (current) {
    path.unshift(current.name);
    if (current.parentId) {
      current = allNotebooks.find(nb => nb.id === current.parentId);
    } else {
      break;
    }
  }
  
  return path.join(' / ');
};

/**
 * Get all descendants of a notebook
 */
export const getNotebookDescendants = (notebookId, allNotebooks) => {
  const descendants = [];
  const visited = new Set();
  
  const collectDescendants = (id) => {
    if (visited.has(id)) return; // Prevent infinite loops
    visited.add(id);
    
    const children = allNotebooks.filter(nb => nb.parentId === id);
    for (const child of children) {
      descendants.push(child);
      collectDescendants(child.id);
    }
  };
  
  collectDescendants(notebookId);
  return descendants;
};

/**
 * Get all ancestors of a notebook
 */
export const getNotebookAncestors = (notebook, allNotebooks) => {
  const ancestors = [];
  let current = notebook;
  
  while (current && current.parentId) {
    const parent = allNotebooks.find(nb => nb.id === current.parentId);
    if (parent) {
      ancestors.push(parent);
      current = parent;
    } else {
      break;
    }
  }
  
  return ancestors.reverse(); // Return from root to parent
};

/**
 * Check if a notebook can be moved to a new parent (prevent circular references)
 */
export const canMoveNotebook = (notebookId, newParentId, allNotebooks) => {
  if (!newParentId) return true; // Can always move to root
  if (notebookId === newParentId) return false; // Can't be its own parent
  
  // Check if new parent is a descendant of the notebook
  const descendants = getNotebookDescendants(notebookId, allNotebooks);
  return !descendants.some(desc => desc.id === newParentId);
};

/**
 * Calculate total document count including children
 */
export const getTotalDocumentCount = (notebook, allNotebooks) => {
  let total = notebook.documentCount || 0;
  const descendants = getNotebookDescendants(notebook.id, allNotebooks);
  
  for (const descendant of descendants) {
    total += descendant.documentCount || 0;
  }
  
  return total;
};

/**
 * Get notebook depth in hierarchy
 */
export const getNotebookDepth = (notebook, allNotebooks) => {
  const ancestors = getNotebookAncestors(notebook, allNotebooks);
  return ancestors.length;
};

/**
 * Format notebook visibility for display
 */
export const formatVisibility = (visibility) => {
  const visibilityMap = {
    private: { label: 'Private', icon: '🔒', color: 'text-gray-600' },
    shared: { label: 'Shared', icon: '👥', color: 'text-(--color-primary-600)' },
    public: { label: 'Public', icon: '🌐', color: 'text-green-600' }
  };
  
  return visibilityMap[visibility] || visibilityMap.private;
};

/**
 * Sort notebooks by various criteria
 */
export const sortNotebooks = (notebooks, sortBy = 'name', sortOrder = 'asc') => {
  const sorted = [...notebooks].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'createdAt':
      case 'updatedAt':
        aValue = new Date(a[sortBy]);
        bValue = new Date(b[sortBy]);
        break;
      case 'documentCount':
        aValue = a.documentCount || 0;
        bValue = b.documentCount || 0;
        break;
      case 'visibility':
        aValue = a.visibility;
        bValue = b.visibility;
        break;
      default:
        aValue = a[sortBy];
        bValue = b[sortBy];
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
};

/**
 * Filter notebooks by multiple criteria
 */
export const filterNotebooks = (notebooks, filters = {}) => {
  return notebooks.filter(notebook => {
    // Text search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesName = notebook.name.toLowerCase().includes(searchTerm);
      const matchesDescription = notebook.description.toLowerCase().includes(searchTerm);
      const matchesTags = notebook.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      if (!matchesName && !matchesDescription && !matchesTags) {
        return false;
      }
    }
    
    // Visibility filter
    if (filters.visibility && notebook.visibility !== filters.visibility) {
      return false;
    }
    
    // Parent filter
    if (filters.parentId !== undefined && notebook.parentId !== filters.parentId) {
      return false;
    }
    
    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      const hasRequiredTag = filters.tags.some(tag => notebook.tags.includes(tag));
      if (!hasRequiredTag) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.dateRange) {
      const notebookDate = new Date(notebook.updatedAt);
      if (filters.dateRange.start && notebookDate < new Date(filters.dateRange.start)) {
        return false;
      }
      if (filters.dateRange.end && notebookDate > new Date(filters.dateRange.end)) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Generate a unique notebook name when duplicating
 */
export const generateUniqueNotebookName = (baseName, existingNotebooks) => {
  let counter = 1;
  let newName = `${baseName} (Copy)`;
  
  while (existingNotebooks.some(nb => nb.name === newName)) {
    counter++;
    newName = `${baseName} (Copy ${counter})`;
  }
  
  return newName;
};

/**
 * Validate notebook data
 */
export const validateNotebook = (notebookData) => {
  const errors = {};
  
  // Name validation
  if (!notebookData.name || !notebookData.name.trim()) {
    errors.name = 'Notebook name is required';
  } else if (notebookData.name.length > 100) {
    errors.name = 'Notebook name must be less than 100 characters';
  }
  
  // Description validation
  if (notebookData.description && notebookData.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }
  
  // Visibility validation
  const validVisibilities = ['private', 'shared', 'public'];
  if (notebookData.visibility && !validVisibilities.includes(notebookData.visibility)) {
    errors.visibility = 'Invalid visibility option';
  }
  
  // Tags validation
  if (notebookData.tags) {
    if (!Array.isArray(notebookData.tags)) {
      errors.tags = 'Tags must be an array';
    } else if (notebookData.tags.length > 10) {
      errors.tags = 'Maximum 10 tags allowed';
    } else if (notebookData.tags.some(tag => typeof tag !== 'string' || tag.length > 50)) {
      errors.tags = 'Each tag must be a string with less than 50 characters';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Export notebooks to JSON (for backup)
 */
export const exportNotebooksToJSON = (notebooks, metadata) => {
  const exportData = {
    notebooks,
    metadata: {
      ...metadata,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    }
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `aether-notebooks-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Get notebook statistics
 */
export const getNotebookStats = (notebooks) => {
  const stats = {
    total: notebooks.length,
    byVisibility: {
      private: 0,
      shared: 0,
      public: 0
    },
    byDepth: {},
    totalDocuments: 0,
    avgDocumentsPerNotebook: 0,
    mostRecentUpdate: null,
    oldestNotebook: null,
    topTags: {}
  };
  
  notebooks.forEach(notebook => {
    // Visibility stats
    stats.byVisibility[notebook.visibility] = (stats.byVisibility[notebook.visibility] || 0) + 1;
    
    // Document stats
    stats.totalDocuments += notebook.documentCount || 0;
    
    // Date stats
    const updatedAt = new Date(notebook.updatedAt);
    const createdAt = new Date(notebook.createdAt);
    
    if (!stats.mostRecentUpdate || updatedAt > stats.mostRecentUpdate) {
      stats.mostRecentUpdate = updatedAt;
    }
    
    if (!stats.oldestNotebook || createdAt < stats.oldestNotebook) {
      stats.oldestNotebook = createdAt;
    }
    
    // Tag stats
    if (notebook.tags) {
      notebook.tags.forEach(tag => {
        stats.topTags[tag] = (stats.topTags[tag] || 0) + 1;
      });
    }
    
    // Depth stats
    const depth = getNotebookDepth(notebook, notebooks);
    stats.byDepth[depth] = (stats.byDepth[depth] || 0) + 1;
  });
  
  stats.avgDocumentsPerNotebook = notebooks.length > 0 
    ? Math.round(stats.totalDocuments / notebooks.length * 10) / 10 
    : 0;
  
  return stats;
};