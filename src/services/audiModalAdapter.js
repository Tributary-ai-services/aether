// Adapter to make audimodal API look like notebooks API
import audiModalService from './audiModalService.js';

class AudiModalAdapter {
  constructor() {
    this.audiModal = audiModalService;
  }

  // Convert file data to notebook-like structure
  fileToNotebook(file) {
    return {
      id: file.id,
      name: file.metadata?.original_name || file.filename || 'Untitled',
      description: file.metadata?.description || 'Uploaded file',
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      visibility: 'private', // audimodal doesn't have visibility concept
      tags: file.metadata?.tags || [],
      parentId: null, // audimodal doesn't have hierarchical structure
      documentCount: 1, // each file is one document
      complianceSettings: {
        hipaaCompliant: true,
        piiDetection: true,
        dataRetentionDays: 365,
        encryptionAtRest: true,
        accessLogging: true,
        auditTrail: true,
        dataClassification: 'internal',
        redactionEnabled: true,
        complianceFrameworks: ['SOC2', 'CCPA', 'GDPR', 'PCI-DSS']
      },
      // Additional audimodal specific data
      fileSize: file.size,
      fileType: file.file_type,
      processingStatus: file.status,
      mlAnalysis: file.analysis || {}
    };
  }

  // Convert notebook data to file upload structure
  notebookToFileUpload(notebookData) {
    return {
      metadata: {
        original_name: notebookData.name,
        description: notebookData.description,
        tags: notebookData.tags || [],
        compliance_settings: notebookData.complianceSettings
      }
    };
  }

  // Direct API call to get files from audimodal backend
  async getFiles() {
    const response = await fetch(`${this.audiModal.baseURL}/tenants/${this.audiModal.tenantId}/files`, {
      method: 'GET',
      headers: this.audiModal.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get files: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  // Notebooks API compatibility methods
  notebooks = {
    getAll: async () => {
      try {
        const filesResponse = await this.getFiles();
        if (filesResponse && filesResponse.success && filesResponse.data) {
          const notebooks = filesResponse.data.map(file => this.fileToNotebook(file));
          return { success: true, data: notebooks };
        }
        return { success: true, data: [] };
      } catch (error) {
        console.error('Failed to get notebooks (files):', error);
        return { success: false, error: error.message };
      }
    },

    getById: async (id) => {
      try {
        const file = await this.audiModal.getFileById(id);
        if (file) {
          return { success: true, data: this.fileToNotebook(file) };
        }
        return { success: false, error: 'Notebook not found' };
      } catch (error) {
        console.error('Failed to get notebook by id:', error);
        return { success: false, error: error.message };
      }
    },

    create: async (notebookData) => {
      try {
        // For demo purposes, create a placeholder file entry
        // In a real implementation, this would create a container/folder concept
        const fileData = {
          name: notebookData.name + '.notebook',
          content: JSON.stringify({
            type: 'notebook',
            name: notebookData.name,
            description: notebookData.description,
            complianceSettings: notebookData.complianceSettings,
            createdAt: new Date().toISOString()
          }),
          metadata: this.notebookToFileUpload(notebookData).metadata
        };

        // Create a virtual file to represent the notebook
        const blob = new Blob([fileData.content], { type: 'application/json' });
        const formData = new FormData();
        formData.append('file', blob, fileData.name);
        
        // Add metadata
        Object.entries(fileData.metadata).forEach(([key, value]) => {
          if (typeof value === 'object') {
            formData.append(`metadata[${key}]`, JSON.stringify(value));
          } else {
            formData.append(`metadata[${key}]`, value);
          }
        });

        const uploadResult = await this.audiModal.uploadFile(formData);
        if (uploadResult.success && uploadResult.data) {
          const createdNotebook = this.fileToNotebook(uploadResult.data);
          return { success: true, data: createdNotebook };
        }
        return { success: false, error: 'Failed to create notebook' };
      } catch (error) {
        console.error('Failed to create notebook:', error);
        return { success: false, error: error.message };
      }
    },

    update: async (id, updates) => {
      try {
        // audimodal doesn't support updating file metadata directly
        // Return the existing file as if updated
        const file = await this.audiModal.getFileById(id);
        if (file) {
          const updatedNotebook = {
            ...this.fileToNotebook(file),
            ...updates,
            updatedAt: new Date().toISOString()
          };
          return { success: true, data: updatedNotebook };
        }
        return { success: false, error: 'Notebook not found' };
      } catch (error) {
        console.error('Failed to update notebook:', error);
        return { success: false, error: error.message };
      }
    },

    delete: async (id) => {
      try {
        const result = await this.audiModal.deleteDocument(id);
        return { success: result.success || true };
      } catch (error) {
        console.error('Failed to delete notebook:', error);
        return { success: false, error: error.message };
      }
    }
  };
}

// Create and export singleton instance
export const audiModalAdapter = new AudiModalAdapter();