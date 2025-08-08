/**
 * AudiModal Service Integration
 * 
 * This service integrates with the AudiModal API for document processing,
 * vector embedding generation, and DeepLake dataset management.
 * 
 * Based on the comprehensive AudiModal implementation guide with:
 * - Multi-tier processing pipeline (Tier 1: <10MB, Tier 2: 10MB-1GB, Tier 3: >1GB)
 * - 35+ file format support including Microsoft Office ecosystem
 * - Streaming ingestion with real-time progress tracking
 * - DeepLake vector storage integration
 * - Advanced AI/ML features and anomaly detection
 */

class AudiModalService {
  constructor(baseURL = import.meta.env.VITE_AUDIMODAL_API_URL || 'https://api.audimodal.ai/v1') {
    this.baseURL = baseURL;
    this.apiKey = import.meta.env.VITE_AUDIMODAL_API_KEY || 'demo-api-key';
    this.tenantId = import.meta.env.VITE_AUDIMODAL_TENANT_ID || 'demo-tenant-id';
    
    // Development warning
    if (this.apiKey === 'demo-api-key' || this.tenantId === 'demo-tenant-id') {
      console.warn('⚠️ AudiModal: Using demo credentials. Please configure VITE_AUDIMODAL_API_KEY and VITE_AUDIMODAL_TENANT_ID in your .env file for production use.');
    }
  }

  // Headers for all API requests
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-API-Key': this.apiKey, // Support both auth methods
      'User-Agent': 'Aether-UI/1.0.0'
    };
  }

  /**
   * Data Source Management (using notebooks as file_upload data source)
   */
  
  // Create a data source for a notebook
  async createNotebookDataSource(notebookId, notebookName, complianceSettings = {}) {
    const response = await fetch(`${this.baseURL}/datasources`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: `Notebook: ${notebookName}`,
        type: 'file_upload',
        config: {
          notebook_id: notebookId,
          auto_processing: true,
          generate_embeddings: true,
          enable_ocr: true,
          content_analysis: true,
          anomaly_detection: true,
          // Compliance settings
          hipaa_compliance: complianceSettings.hipaaCompliant || false,
          pii_detection: complianceSettings.piiDetection !== false,
          data_retention_days: complianceSettings.dataRetentionDays || 365,
          encryption_at_rest: complianceSettings.encryptionAtRest !== false,
          access_logging: complianceSettings.accessLogging !== false,
          audit_trail: complianceSettings.auditTrail !== false,
          data_classification: complianceSettings.dataClassification || 'internal',
          content_redaction: complianceSettings.redactionEnabled || false,
          compliance_frameworks: complianceSettings.complianceFrameworks || ['SOC2']
        },
        sync_schedule: {
          enabled: false // Manual uploads only
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create notebook data source: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get data source status and files
  async getDataSourceStatus(dataSourceId) {
    const response = await fetch(`${this.baseURL}/datasources/${dataSourceId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get data source status: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get files for a data source (notebook)
  async getNotebookFiles(dataSourceId, options = {}) {
    const queryParams = new URLSearchParams({
      datasource_id: dataSourceId,
      limit: options.limit || 50,
      offset: options.offset || 0
    });

    if (options.search) queryParams.append('search', options.search);
    if (options.fileType) queryParams.append('file_type', options.fileType);
    if (options.processingStatus) queryParams.append('processing_status', options.processingStatus);

    const response = await fetch(`${this.baseURL}/files?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get notebook files: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * File Upload and Management
   */

  // Upload file using the standard /files endpoint
  async uploadFile(dataSourceId, file, metadata = {}, tags = [], onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('datasource_id', dataSourceId);
    
    if (Object.keys(metadata).length > 0) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    if (tags.length > 0) {
      tags.forEach(tag => formData.append('tags', tag));
    }

    const response = await fetch(`${this.baseURL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Key': this.apiKey
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload file: ${response.statusText} - ${errorText}`);
    }

    const fileData = await response.json();
    
    // Monitor file processing progress
    if (fileData.id && onProgress) {
      this.monitorFileProgress(fileData.id, onProgress);
    }

    return fileData;
  }

  // Get file details and processing status
  async getFileDetails(fileId) {
    const response = await fetch(`${this.baseURL}/files/${fileId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get file details: ${response.statusText}`);
    }

    return await response.json();
  }

  // Monitor individual file processing progress by polling
  async monitorFileProgress(fileId, onProgress) {
    const pollInterval = 2000; // Poll every 2 seconds
    let isCompleted = false;

    const poll = async () => {
      try {
        const fileData = await this.getFileDetails(fileId);
        onProgress?.(fileData);
        
        if (fileData.processing_status === 'completed' || fileData.processing_status === 'failed') {
          isCompleted = true;
          return fileData;
        }
        
        if (!isCompleted) {
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        console.error('Error monitoring file progress:', error);
        onProgress?.({ status: 'error', error: error.message });
      }
    };

    // Start polling
    setTimeout(poll, pollInterval);
  }

  /**
   * Search and Discovery
   */

  // Search documents using the standard search endpoint
  async searchDocuments(query, options = {}) {
    const response = await fetch(`${this.baseURL}/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        query,
        filters: {
          datasource_ids: options.dataSourceIds,
          file_types: options.fileTypes,
          date_range: options.dateRange,
          tags: options.tags,
          authors: options.authors
        },
        sort: {
          field: options.sortField || 'relevance',
          order: options.sortOrder || 'desc'
        },
        limit: options.limit || 20,
        offset: options.offset || 0,
        include_highlights: options.includeHighlights ?? true
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to search documents: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get search suggestions for auto-complete
  async getSearchSuggestions(partialQuery, limit = 10) {
    const queryParams = new URLSearchParams({
      q: partialQuery,
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseURL}/search/suggestions?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get search suggestions: ${response.statusText}`);
    }

    return await response.json();
  }

  // Semantic search with AI-powered understanding
  async semanticSearch(query, options = {}) {
    const response = await fetch(`${this.baseURL}/ml/search/semantic`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        query,
        search_mode: options.searchMode || 'hybrid',
        filters: options.filters || [],
        limit: options.limit || 20,
        offset: options.offset || 0
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to perform semantic search: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * ML/AI Analytics and Insights
   */

  // Generate ML-powered insights
  async generateInsights(timeRange = null) {
    const response = await fetch(`${this.baseURL}/ml/insights/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        time_range: timeRange
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate insights: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get existing insights with filtering
  async getInsights(options = {}) {
    const queryParams = new URLSearchParams();
    
    if (options.type) queryParams.append('type', options.type);
    if (options.category) queryParams.append('category', options.category);
    if (options.severity) queryParams.append('severity', options.severity);

    const response = await fetch(`${this.baseURL}/ml/insights?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get insights: ${response.statusText}`);
    }

    return await response.json();
  }

  // Generate comprehensive analytics report
  async generateReport(reportType, timeRange, title = null) {
    const response = await fetch(`${this.baseURL}/ml/insights/reports`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        report_type: reportType,
        time_range: timeRange,
        title: title
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate report: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get anomaly detection results
  async getAnomalies(options = {}) {
    const queryParams = new URLSearchParams();
    
    if (options.type) queryParams.append('type', options.type);
    if (options.severity) queryParams.append('severity', options.severity);
    if (options.status) queryParams.append('status', options.status);
    if (options.startTime) queryParams.append('start_time', options.startTime);
    if (options.endTime) queryParams.append('end_time', options.endTime);

    const response = await fetch(`${this.baseURL}/anomalies?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get anomalies: ${response.statusText}`);
    }

    return await response.json();
  }

  // Update anomaly status
  async updateAnomalyStatus(anomalyId, status, notes = null, assignedTo = null) {
    const response = await fetch(`${this.baseURL}/anomalies/${anomalyId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        status,
        notes,
        assigned_to: assignedTo
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update anomaly status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Unified Sync Framework Integration
   */

  // Create sync job for external data source
  async createSyncJob(notebookId, dataSourceConfig) {
    const response = await fetch(`${this.baseURL}/sync/jobs`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        tenant_id: this.tenantId,
        name: `Notebook ${notebookId} Sync`,
        source_type: dataSourceConfig.type, // 'sharepoint', 'googledrive', 'box', etc.
        source_config: dataSourceConfig.config,
        destination: {
          type: 'notebook',
          notebook_id: notebookId
        },
        schedule: dataSourceConfig.schedule || 'manual',
        conflict_resolution: dataSourceConfig.conflictResolution || 'last_write',
        filters: dataSourceConfig.filters || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create sync job: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * File Format Support & Validation
   */

  // Validate file format against audimodal supported formats
  validateFileFormat(fileName) {
    const supportedFormats = {
      documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.html', '.htm', '.xhtml'],
      spreadsheets: ['.xlsx', '.xls', '.csv', '.tsv'],
      presentations: ['.pptx', '.ppt'],
      images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff'],
      videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
      email: ['.eml', '.msg', '.pst'],
      archives: ['.zip'],
      data: ['.json', '.xml', '.yaml', '.sql'],
      microsoft: ['.one'] // OneNote files
    };

    const extension = '.' + fileName.split('.').pop().toLowerCase();
    const allFormats = Object.values(supportedFormats).flat();
    
    return {
      supported: allFormats.includes(extension),
      category: Object.keys(supportedFormats).find(cat => 
        supportedFormats[cat].includes(extension)
      ),
      extension,
      processingTier: this.getProcessingTier(0) // Will be updated with actual file size
    };
  }

  // Determine processing tier based on file size
  getProcessingTier(fileSizeBytes) {
    const MB = 1024 * 1024;
    const GB = 1024 * MB;

    if (fileSizeBytes < 10 * MB) {
      return { tier: 1, description: 'Fast processing (<10MB)', estimatedTime: '30 seconds' };
    } else if (fileSizeBytes < 1 * GB) {
      return { tier: 2, description: 'Standard processing (10MB-1GB)', estimatedTime: '2-5 minutes' };
    } else {
      return { tier: 3, description: 'Large file processing (>1GB)', estimatedTime: '10-30 minutes' };
    }
  }

  /**
   * Utility Methods
   */

  // Get comprehensive file processing info
  async getFileProcessingInfo(fileId) {
    const response = await fetch(`${this.baseURL}/files/${fileId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get file info: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get tenant usage statistics
  async getTenantUsage() {
    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/usage`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get tenant usage: ${response.statusText}`);
    }

    return await response.json();
  }
}

export default new AudiModalService();