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
  constructor(baseURL = import.meta.env.VITE_AUDIMODAL_API_URL || 'http://localhost:8084/api/v1') {
    this.baseURL = baseURL;
    this.apiKey = import.meta.env.VITE_AUDIMODAL_API_KEY || 'demo-api-key';
    this.tenantId = import.meta.env.VITE_AUDIMODAL_TENANT_ID || '9855e094-36a6-4d3a-a4f5-d77da4614439';
    
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

  // Helper method to format file sizes for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Data Source Management (using notebooks as file_upload data source)
   */
  
  // Create or get existing data source for a notebook
  async createNotebookDataSource(notebookId, notebookName, complianceSettings = {}) {
    const dataSourceName = `Notebook: ${notebookName}`;
    
    // First, check if a data source with this name already exists
    try {
      const existingDataSources = await this.getDataSources();
      const existingDataSource = existingDataSources.find(ds => ds.name === dataSourceName);
      
      if (existingDataSource) {
        console.log(`📋 Data source "${dataSourceName}" already exists, using existing one.`);
        return existingDataSource;
      }
    } catch (error) {
      console.warn('Could not check existing data sources:', error);
      // Continue to create new one
    }

    // Create new data source if none exists
    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/data-sources`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: dataSourceName,
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

    const result = await response.json();
    return result.data || result;
  }

  // Get all data sources for this tenant
  async getDataSources() {
    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/data-sources`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get data sources: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  // Get data source status and files
  async getDataSourceStatus(dataSourceId) {
    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/data-sources/${dataSourceId}`, {
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

    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/files?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get notebook files: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Normalize the response structure
    return {
      data: {
        files: result.data || []
      },
      files: result.data || [], // For backward compatibility
      meta: result.meta || {}
    };
  }

  /**
   * File Upload and Management
   */

  // Upload file using the standard /files endpoint
  // TEMPORARY: Creating metadata-only record until backend supports multipart uploads
  async uploadFile(dataSourceId, file, metadata = {}, tags = [], onProgress = null) {
    const fileSize = file.size;
    const MAX_MULTIPART_SIZE = 10 * 1024 * 1024; // 10MB
    
    console.log(`📁 Uploading file: ${file.name} (${this.formatFileSize(fileSize)})`);
    
    if (fileSize <= MAX_MULTIPART_SIZE) {
      console.log('🔽 Using multipart upload for small file');
      return await this.uploadFileMultipart(dataSourceId, file, metadata, tags, onProgress);
    } else {
      console.log('☁️ Using S3 direct upload for large file');
      return await this.uploadFileViaS3(dataSourceId, file, metadata, tags, onProgress);
    }
  }

  // Multipart upload for files <= 10MB
  async uploadFileMultipart(dataSourceId, file, metadata = {}, tags = [], onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('datasource_id', dataSourceId);
    
    // Add metadata as JSON string if provided
    if (metadata && Object.keys(metadata).length > 0) {
      formData.append('metadata', JSON.stringify({
        ...metadata,
        upload_method: 'multipart',
        upload_timestamp: new Date().toISOString(),
        tags: tags
      }));
    }

    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Key': this.apiKey
        // Don't set Content-Type for FormData - browser sets it with boundary
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload file: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const fileData = result.data || result;
    
    // Report upload completion
    if (onProgress) {
      onProgress({ processing_status: 'uploaded', progress: 100, upload_method: 'multipart' });
    }

    return fileData;
  }

  // S3 upload for files > 10MB with enhanced progress tracking
  async uploadFileViaS3(dataSourceId, file, metadata = {}, tags = [], onProgress = null) {
    try {
      // Step 1: Get presigned URL from backend
      if (onProgress) {
        onProgress({ 
          processing_status: 'requesting_upload_url', 
          progress: 5,
          upload_method: 's3_direct'
        });
      }

      const bucketName = 'audimodal-uploads'; // Should match backend config
      const fileName = `${Date.now()}_${file.name}`;
      const s3Url = `s3://${bucketName}/${fileName}`;
      
      const presignedResponse = await fetch(`${this.baseURL}/tenants/${this.tenantId}/storage/presigned`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          url: s3Url,
          method: 'PUT',
          expiration: 3600 // 1 hour
        })
      });

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text();
        throw new Error(`Failed to get presigned URL: ${presignedResponse.statusText} - ${errorText}`);
      }

      const presignedData = await presignedResponse.json();
      const presignedUrl = presignedData.data?.url || presignedData.url;

      if (!presignedUrl) {
        throw new Error('No presigned URL received from backend');
      }

      // Step 2: Upload file directly to S3 with progress tracking
      if (onProgress) {
        onProgress({ 
          processing_status: 'uploading_to_s3', 
          progress: 10,
          upload_method: 's3_direct'
        });
      }

      // Create XMLHttpRequest for better progress tracking
      const uploadResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const uploadProgress = Math.round((event.loaded / event.total) * 70) + 10; // 10-80% range
            onProgress({
              processing_status: 'uploading_to_s3',
              progress: uploadProgress,
              upload_method: 's3_direct',
              bytes_uploaded: event.loaded,
              bytes_total: event.total
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`S3 upload failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('S3 upload failed due to network error'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('S3 upload was aborted'));
        });

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      if (onProgress) {
        onProgress({ 
          processing_status: 's3_upload_complete', 
          progress: 80,
          upload_method: 's3_direct'
        });
      }

      // Step 3: Create file record in backend with S3 URL
      const fileRecord = {
        url: s3Url,
        filename: file.name,
        extension: file.name.split('.').pop() || '',
        content_type: file.type,
        size: file.size,
        data_source_id: dataSourceId,
        metadata: {
          ...metadata,
          upload_method: 's3_direct',
          upload_timestamp: new Date().toISOString(),
          s3_key: fileName,
          s3_bucket: bucketName,
          tags: tags
        },
        validate_access: false // Skip access validation since we just uploaded
      };

      if (onProgress) {
        onProgress({ 
          processing_status: 'creating_file_record', 
          progress: 90,
          upload_method: 's3_direct'
        });
      }

      const createResponse = await fetch(`${this.baseURL}/tenants/${this.tenantId}/files`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(fileRecord)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create file record: ${createResponse.statusText} - ${errorText}`);
      }

      const result = await createResponse.json();
      const fileData = result.data || result;

      if (onProgress) {
        onProgress({ 
          processing_status: 'completed', 
          progress: 100, 
          upload_method: 's3_direct',
          file_id: fileData.id
        });
      }

      console.log(`✅ S3 upload completed: ${file.name} -> ${s3Url}`);
      return fileData;

    } catch (error) {
      console.error('S3 upload failed:', error);
      if (onProgress) {
        onProgress({ 
          processing_status: 'failed', 
          error: error.message, 
          upload_method: 's3_direct' 
        });
      }
      throw error;
    }
  }

  // Get file details and processing status
  async getFileDetails(fileId) {
    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/files/${fileId}`, {
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
    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/ml/insights/generate`, {
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

  // Analyze a specific document/file
  async analyzeDocument(documentId, options = {}) {
    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/ml-analysis/documents/${documentId}/analyze`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze document: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get analysis results for a specific document
  async getDocumentAnalysisResults(documentId, chunkId = null) {
    const queryParams = new URLSearchParams();
    if (chunkId) queryParams.append('chunk_id', chunkId);

    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/ml-analysis/documents/${documentId}/results?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get document analysis results: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get analysis summary for a specific document
  async getDocumentAnalysisSummary(documentId) {
    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/ml-analysis/documents/${documentId}/summary`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get document analysis summary: ${response.statusText}`);
    }

    return await response.json();
  }

  // Analyze multiple documents in batch
  async analyzeBatch(documentIds, options = {}) {
    const requests = documentIds.map(docId => ({
      document_id: docId,
      options: options
    }));

    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/ml-analysis/batch`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        requests: requests,
        options: options
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze documents in batch: ${response.statusText}`);
    }

    return await response.json();
  }

  // List all ML analysis results with filtering
  async listAnalysisResults(options = {}) {
    const queryParams = new URLSearchParams();
    if (options.documentId) queryParams.append('document_id', options.documentId);
    if (options.analysisType) queryParams.append('analysis_type', options.analysisType);
    if (options.status) queryParams.append('status', options.status);
    if (options.page) queryParams.append('page', options.page);
    if (options.pageSize) queryParams.append('page_size', options.pageSize);

    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/ml-analysis/results?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to list analysis results: ${response.statusText}`);
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

  // Delete a document
  async deleteDocument(documentId) {
    const response = await fetch(`${this.baseURL}/tenants/${this.tenantId}/files/${documentId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete document: ${response.statusText} - ${errorText}`);
    }

    // Check if there's a response body before trying to parse JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // Return success indicator if no JSON body (204 No Content is common for DELETE)
    return { success: true, status: response.status };
  }

  // Get document analysis (comprehensive stats)
  async getDocumentAnalysis(documentId) {
    try {
      // Try to get the analysis summary first
      const analysisResponse = await fetch(`${this.baseURL}/tenants/${this.tenantId}/ml-analysis/documents/${documentId}/summary`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (analysisResponse.ok) {
        return await analysisResponse.json();
      }

      // If summary is not available, try to get basic analysis results
      const resultsResponse = await fetch(`${this.baseURL}/tenants/${this.tenantId}/ml-analysis/documents/${documentId}/results`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (resultsResponse.ok) {
        return await resultsResponse.json();
      }

      // If no analysis is available, return null
      return null;

    } catch (error) {
      console.error('Failed to get document analysis:', error);
      return null;
    }
  }
}

export default new AudiModalService();