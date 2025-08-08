/**
 * Notebook Persistence Service
 * 
 * Provides CRUD operations for notebooks with backend API integration.
 * Falls back to localStorage for mock data when API is unavailable.
 */

// Import the Aether API service
import { aetherApi } from './aetherApi.js';

// Initial notebook data - in a real app this would come from an API
const notebooksData = {
  "notebooks": [
    {
      "id": "nb_1",
      "name": "Research Projects",
      "description": "Academic and industry research",
      "visibility": "private",
      "createdAt": "2024-01-10T09:00:00Z",
      "updatedAt": "2024-01-20T15:30:00Z",
      "documentCount": 45,
      "tags": ["research", "academic"],
      "parentId": null,
      "children": ["nb_2", "nb_4"],
      "complianceSettings": {
        "hipaaCompliant": true,
        "piiDetection": true,
        "dataRetentionDays": 365,
        "encryptionAtRest": true,
        "accessLogging": true,
        "auditTrail": true,
        "dataClassification": "confidential",
        "redactionEnabled": true,
        "complianceFrameworks": ["GDPR", "SOC2", "ISO27001", "PCI-DSS"]
      }
    },
    {
      "id": "nb_2",
      "name": "AI Ethics Research",
      "description": "Papers and studies on AI ethics",
      "visibility": "shared",
      "createdAt": "2024-01-12T10:00:00Z",
      "updatedAt": "2024-01-18T14:20:00Z",
      "documentCount": 12,
      "tags": ["ai", "ethics", "research"],
      "parentId": "nb_1",
      "children": ["nb_3"],
      "complianceSettings": {
        "hipaaCompliant": false,
        "piiDetection": true,
        "dataRetentionDays": 1095,
        "encryptionAtRest": true,
        "accessLogging": true,
        "auditTrail": true,
        "dataClassification": "restricted",
        "redactionEnabled": true,
        "complianceFrameworks": ["GDPR", "CCPA"]
      }
    },
    {
      "id": "nb_3",
      "name": "Bias in ML Models",
      "description": "Research on algorithmic bias",
      "visibility": "private",
      "createdAt": "2024-01-15T11:30:00Z",
      "updatedAt": "2024-01-19T16:45:00Z",
      "documentCount": 8,
      "tags": ["ml", "bias", "algorithms"],
      "parentId": "nb_2",
      "children": [],
      "complianceSettings": {
        "hipaaCompliant": false,
        "piiDetection": true,
        "dataRetentionDays": 730,
        "encryptionAtRest": true,
        "accessLogging": true,
        "auditTrail": true,
        "dataClassification": "internal",
        "redactionEnabled": false,
        "complianceFrameworks": ["SOC2"]
      }
    },
    {
      "id": "nb_4",
      "name": "Technical Papers",
      "description": "Latest research papers",
      "visibility": "public",
      "createdAt": "2024-01-08T08:15:00Z",
      "updatedAt": "2024-01-22T12:10:00Z",
      "documentCount": 23,
      "tags": ["technical", "papers", "research"],
      "parentId": "nb_1",
      "children": []
    },
    {
      "id": "nb_5",
      "name": "Meeting Notes",
      "description": "Company meeting recordings and notes",
      "visibility": "shared",
      "createdAt": "2024-01-05T14:00:00Z",
      "updatedAt": "2024-01-25T10:30:00Z",
      "documentCount": 67,
      "tags": ["meetings", "notes", "company"],
      "parentId": null,
      "children": ["nb_6"]
    },
    {
      "id": "nb_6",
      "name": "Q1 2024 Meetings",
      "description": "First quarter meetings",
      "visibility": "shared",
      "createdAt": "2024-01-15T09:30:00Z",
      "updatedAt": "2024-01-20T11:15:00Z",
      "documentCount": 15,
      "tags": ["q1", "2024", "meetings"],
      "parentId": "nb_5",
      "children": []
    },
    {
      "id": "nb_7",
      "name": "Personal Documents",
      "description": "Personal files and documents",
      "visibility": "private",
      "createdAt": "2024-01-03T16:20:00Z",
      "updatedAt": "2024-01-28T13:45:00Z",
      "documentCount": 34,
      "tags": ["personal", "documents"],
      "parentId": null,
      "children": []
    },
    {
      "id": "nb_8",
      "name": "Project Alpha",
      "description": "Confidential project documentation",
      "visibility": "private",
      "createdAt": "2024-01-20T10:00:00Z",
      "updatedAt": "2024-01-29T14:20:00Z",
      "documentCount": 28,
      "tags": ["project", "alpha", "confidential"],
      "parentId": null,
      "children": []
    },
    {
      "id": "nb_9",
      "name": "Training Materials",
      "description": "Educational content and tutorials",
      "visibility": "public",
      "createdAt": "2024-01-18T12:30:00Z",
      "updatedAt": "2024-01-26T09:15:00Z",
      "documentCount": 19,
      "tags": ["training", "education", "tutorials"],
      "parentId": null,
      "children": []
    },
    {
      "id": "nb_10",
      "name": "Client Communications",
      "description": "Email chains and client documents",
      "visibility": "shared",
      "createdAt": "2024-01-12T15:45:00Z",
      "updatedAt": "2024-01-27T11:30:00Z",
      "documentCount": 42,
      "tags": ["clients", "communications", "email"],
      "parentId": null,
      "children": []
    }
  ],
  "metadata": {
    "version": "1.0",
    "lastUpdated": "2024-01-30T10:00:00Z",
    "totalNotebooks": 10,
    "nextId": 11
  }
};

class NotebookService {
  constructor() {
    // Initialize with data from localStorage or fallback to default data
    this.loadFromStorage();
  }

  /**
   * Load data from localStorage or initialize with default data
   */
  loadFromStorage() {
    try {
      const savedData = localStorage.getItem('aether_notebooks');
      if (savedData) {
        const data = JSON.parse(savedData);
        // Check if ALL notebooks have compliance settings - if any are missing, reload from default data
        const allHaveComplianceSettings = data.notebooks && data.notebooks.every(nb => nb.complianceSettings);
        if (!allHaveComplianceSettings) {
          console.log('🔄 Updating notebook data to include compliance settings...');
          this.notebooks = [...notebooksData.notebooks];
          this.metadata = { ...notebooksData.metadata };
          this.saveToStorage(); // Save the updated data
        } else {
          this.notebooks = data.notebooks || [...notebooksData.notebooks];
          this.metadata = data.metadata || { ...notebooksData.metadata };
        }
      } else {
        // First time load - initialize with default data
        this.notebooks = [...notebooksData.notebooks];
        this.metadata = { ...notebooksData.metadata };
        this.saveToStorage();
      }
    } catch (error) {
      console.warn('Failed to load notebooks from localStorage, using default data:', error);
      this.notebooks = [...notebooksData.notebooks];
      this.metadata = { ...notebooksData.metadata };
    }
  }

  /**
   * Save data to localStorage
   */
  saveToStorage() {
    try {
      const data = {
        notebooks: this.notebooks,
        metadata: this.metadata
      };
      localStorage.setItem('aether_notebooks', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save notebooks to localStorage:', error);
    }
  }

  /**
   * Get all notebooks
   */
  async getAllNotebooks() {
    console.log('🚀 Fetching notebooks from API');
    
    try {
      const response = await aetherApi.notebooks.getAll();
      
      if (response.success && response.data) {
        // API returns {notebooks: [], total: 0, ...}
        const notebooks = response.data.notebooks || [];
        console.log('✅ Notebooks fetched from API:', notebooks.length, 'notebooks');
        
        // Return API data with metadata
        return {
          notebooks: notebooks,
          metadata: {
            totalNotebooks: response.data.total || notebooks.length,
            lastUpdated: new Date().toISOString(),
            version: '2.0'
          }
        };
      } else {
        throw new Error('API response was not successful');
      }
    } catch (error) {
      console.error('❌ API fetch failed:', error.message);
      throw new Error(`Failed to fetch notebooks: ${error.message}`);
    }
  }

  /**
   * Get notebook by ID
   */
  async getNotebookById(id) {
    await this.delay(50);
    const notebook = this.notebooks.find(nb => nb.id === id);
    if (!notebook) {
      throw new Error(`Notebook with ID ${id} not found`);
    }
    return notebook;
  }

  /**
   * Get notebooks by parent ID (for hierarchical structure)
   */
  async getNotebooksByParent(parentId = null) {
    await this.delay(50);
    return this.notebooks.filter(nb => nb.parentId === parentId);
  }

  /**
   * Get default compliance settings
   */
  getDefaultComplianceSettings() {
    return {
      hipaaCompliant: false,
      piiDetection: true,
      dataRetentionDays: 365,
      encryptionAtRest: true,
      accessLogging: true,
      auditTrail: true,
      dataClassification: 'internal',
      redactionEnabled: false,
      complianceFrameworks: ['SOC2']
    };
  }

  /**
   * Create a new notebook
   */
  async createNotebook(notebookData) {
    console.log('🚀 Creating notebook via API:', notebookData);
    
    try {
      const response = await aetherApi.notebooks.create(notebookData);
      
      if (response.success && response.data) {
        console.log('✅ Notebook created successfully via API:', response.data);
        return response.data;
      } else {
        throw new Error('API response was not successful');
      }
    } catch (error) {
      console.error('❌ API notebook creation failed:', error.message);
      throw new Error(`Failed to create notebook: ${error.message}`);
    }
  }

  /**
   * Update an existing notebook
   */
  async updateNotebook(id, updates) {
    await this.delay(150);
    
    const notebookIndex = this.notebooks.findIndex(nb => nb.id === id);
    if (notebookIndex === -1) {
      throw new Error(`Notebook with ID ${id} not found`);
    }

    const now = new Date().toISOString();
    const currentNotebook = this.notebooks[notebookIndex];
    
    // Handle parent change
    if (updates.parentId !== undefined && updates.parentId !== currentNotebook.parentId) {
      // Remove from old parent's children
      if (currentNotebook.parentId) {
        const oldParent = this.notebooks.find(nb => nb.id === currentNotebook.parentId);
        if (oldParent) {
          oldParent.children = oldParent.children.filter(childId => childId !== id);
          oldParent.updatedAt = now;
        }
      }

      // Add to new parent's children
      if (updates.parentId) {
        const newParent = this.notebooks.find(nb => nb.id === updates.parentId);
        if (newParent && !newParent.children.includes(id)) {
          newParent.children.push(id);
          newParent.updatedAt = now;
        }
      }
    }

    // Update the notebook
    this.notebooks[notebookIndex] = {
      ...currentNotebook,
      ...updates,
      id, // Ensure ID can't be changed
      updatedAt: now
    };

    // Update metadata
    this.metadata.lastUpdated = now;

    // Persist changes
    await this.persistData();

    return this.notebooks[notebookIndex];
  }

  /**
   * Delete a notebook via API
   */
  async deleteNotebook(id, deleteChildren = false) {
    console.log('🗑️ Deleting notebook via API:', id);
    
    try {
      const response = await aetherApi.notebooks.delete(id);
      
      if (response.success) {
        console.log('✅ Notebook deleted successfully via API');
        return { success: true, deletedId: id };
      } else {
        throw new Error('API response was not successful');
      }
    } catch (error) {
      console.error('❌ API notebook deletion failed:', error.message);
      throw new Error(`Failed to delete notebook: ${error.message}`);
    }
  }

  /**
   * Search notebooks by name, description, or tags
   */
  async searchNotebooks(query, filters = {}) {
    await this.delay(100);
    
    const searchTerm = query.toLowerCase();
    let results = this.notebooks.filter(notebook => {
      const matchesQuery = !query || 
        notebook.name.toLowerCase().includes(searchTerm) ||
        notebook.description.toLowerCase().includes(searchTerm) ||
        notebook.tags.some(tag => tag.toLowerCase().includes(searchTerm));

      const matchesVisibility = !filters.visibility || notebook.visibility === filters.visibility;
      const matchesParent = filters.parentId === undefined || notebook.parentId === filters.parentId;
      const matchesTags = !filters.tags || filters.tags.some(tag => notebook.tags.includes(tag));

      return matchesQuery && matchesVisibility && matchesParent && matchesTags;
    });

    return {
      notebooks: results,
      total: results.length,
      query,
      filters
    };
  }

  /**
   * Get notebook hierarchy as a tree structure
   */
  async getNotebookTree() {
    console.log('🌳 Fetching notebook tree from API');
    
    try {
      // Get all notebooks from API
      const response = await aetherApi.notebooks.getAll();
      
      if (response.success && response.data) {
        const notebooks = response.data.notebooks || [];
        console.log('✅ Notebooks fetched for tree:', notebooks.length, 'notebooks');
        
        // Build tree structure from flat list
        const buildTree = (parentId = null) => {
          return notebooks
            .filter(nb => (nb.parent_id || nb.parentId) === parentId)
            .map(notebook => ({
              ...notebook,
              // Normalize parent_id field (backend uses parent_id, frontend expects parentId)
              parentId: notebook.parent_id || notebook.parentId,
              children: buildTree(notebook.id)
            }));
        };
        
        const tree = buildTree();
        console.log('🌳 Tree structure built:', tree.length, 'root nodes');
        return tree;
      } else {
        throw new Error('API response was not successful');
      }
    } catch (error) {
      console.error('❌ API tree fetch failed:', error.message);
      throw new Error(`Failed to fetch notebook tree: ${error.message}`);
    }
  }

  /**
   * Update document count for a notebook
   */
  async updateDocumentCount(notebookId, count) {
    await this.delay(50);
    
    const notebook = this.notebooks.find(nb => nb.id === notebookId);
    if (!notebook) {
      throw new Error(`Notebook with ID ${notebookId} not found`);
    }

    notebook.documentCount = count;
    notebook.updatedAt = new Date().toISOString();
    
    // Update metadata
    this.metadata.lastUpdated = notebook.updatedAt;

    // Persist changes
    await this.persistData();

    return notebook;
  }

  /**
   * Get notebooks with pagination
   */
  async getNotebooks(options = {}) {
    await this.delay(100);
    
    const {
      page = 1,
      limit = 50,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      parentId = null
    } = options;

    let notebooks = this.notebooks.filter(nb => nb.parentId === parentId);

    // Sort notebooks
    notebooks.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotebooks = notebooks.slice(startIndex, endIndex);

    return {
      notebooks: paginatedNotebooks,
      pagination: {
        page,
        limit,
        total: notebooks.length,
        pages: Math.ceil(notebooks.length / limit)
      },
      metadata: this.metadata
    };
  }

  /**
   * Persist data to localStorage
   */
  async persistData() {
    await this.delay(50);
    
    // Update last modified timestamp
    this.metadata.lastUpdated = new Date().toISOString();
    
    // Save to localStorage
    this.saveToStorage();
    
    console.log('📝 Notebook data persisted to localStorage at', this.metadata.lastUpdated);
    
    return true;
  }

  /**
   * Reset to original data (useful for testing)
   */
  async resetData() {
    this.notebooks = [...notebooksData.notebooks];
    this.metadata = { ...notebooksData.metadata };
    await this.persistData();
    return true;
  }

  /**
   * Get statistics about notebooks
   */
  async getStatistics() {
    await this.delay(50);
    
    const stats = {
      total: this.notebooks.length,
      byVisibility: {
        private: this.notebooks.filter(nb => nb.visibility === 'private').length,
        shared: this.notebooks.filter(nb => nb.visibility === 'shared').length,
        public: this.notebooks.filter(nb => nb.visibility === 'public').length
      },
      totalDocuments: this.notebooks.reduce((sum, nb) => sum + nb.documentCount, 0),
      rootNotebooks: this.notebooks.filter(nb => nb.parentId === null).length,
      childNotebooks: this.notebooks.filter(nb => nb.parentId !== null).length,
      mostRecentUpdate: Math.max(...this.notebooks.map(nb => new Date(nb.updatedAt).getTime())),
      oldestNotebook: Math.min(...this.notebooks.map(nb => new Date(nb.createdAt).getTime()))
    };

    return stats;
  }

  /**
   * Utility method to simulate async delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export default new NotebookService();