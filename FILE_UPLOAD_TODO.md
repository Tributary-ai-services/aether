# File Upload Implementation Todo List

## Overview
Implement a hybrid file upload strategy that uses direct multipart uploads for files <10MB and S3 storage for larger files.

**UPDATE: AudiModal already has comprehensive storage support including S3, GCS, Azure, and local storage with presigned URL generation!**

## Phase 1: Backend Configuration with MinIO (High Priority)
- [ ] **Configure AudiModal to use existing MinIO**
  - ✅ MinIO already running at localhost:9000 (tas-minio-shared)
  - ✅ S3 resolver already implemented (works with MinIO!)
  - Set AWS_ENDPOINT_URL=http://minio-shared:9000 (or localhost:9000)
  - Set credentials: minioadmin / minioadmin123
  - Create bucket for audimodal uploads
  - Test S3 resolver works with MinIO
  
- [ ] **Enable existing storage endpoints**
  - ✅ Storage service already exists at `/api/v1/tenants/{id}/storage/*`
  - ✅ Presigned URL endpoint exists at `/api/v1/tenants/{id}/storage/presigned`
  - Ensure storage handler is registered in router
  - Test existing endpoints work correctly with MinIO

## Phase 2: File Handler Updates (High Priority)
- [ ] **Modify file handler to support multipart uploads for files <10MB**
  - Add content-type detection for multipart/form-data
  - Parse multipart form data
  - Store files locally or in default storage
  - Create proper file records with actual content

- [ ] **Modify file handler to accept S3 URLs for files >10MB**
  - Accept JSON requests with S3 URLs
  - Validate S3 URL format and accessibility
  - Create file records pointing to S3 location
  - Queue for async processing if needed

## Phase 3: Frontend Implementation (High Priority)
- [ ] **Update frontend to detect file size and choose upload method**
  - Add file size check before upload
  - Route to appropriate upload method based on 10MB threshold
  - Show different UI feedback based on method

- [ ] **Implement S3 direct upload in frontend for large files**
  - Request presigned URL from backend
  - Upload directly to S3 using presigned URL
  - Send S3 URL to backend after successful upload
  - Handle S3 upload errors and retries

## Phase 4: Supporting Features (Medium Priority)
- [ ] **Add file download/streaming endpoint**
  - Support both local and S3 stored files
  - Generate presigned URLs for S3 downloads
  - Stream large files efficiently
  - Add proper content-disposition headers

- [ ] **Add S3 lifecycle policies for temporary file cleanup**
  - Configure automatic deletion of old temp files
  - Set up intelligent tiering for cost optimization
  - Archive old files to Glacier if needed

- [ ] **Implement file processing queue to handle S3 downloads**
  - Queue system for async file processing
  - Download from S3 when processing needed
  - Clean up local copies after processing

- [ ] **Add progress tracking for S3 uploads in frontend**
  - Show upload progress for large files
  - Handle multipart upload progress
  - Provide cancel/resume functionality

- [ ] **Create tests for S3 integration and file size routing**
  - Unit tests for storage service
  - Integration tests for upload flows
  - Test file size boundary conditions
  - Mock S3 for testing

- [ ] **Update API documentation for new file upload methods**
  - Document size-based routing
  - Add examples for both upload methods
  - Update OpenAPI specifications
  - Create migration guide

## Phase 5: Production AWS S3 Configuration (Medium Priority)
- [ ] **Configure production S3 bucket**
  - Create S3 bucket in AWS account
  - Set up IAM roles/policies for secure access
  - Configure bucket lifecycle policies
  - Set up CloudFront CDN for file serving (optional)

- [ ] **Configure CORS for S3 bucket**
  - Add CORS rules for browser uploads
  - Configure allowed origins
  - Set appropriate max age for preflight requests

- [ ] **Update AudiModal configuration for AWS**
  - Remove MinIO endpoint override
  - Configure AWS region
  - Set up IAM role or access keys
  - Test presigned URLs work with real S3

## Phase 6: Additional Storage Options & External File Support (Low Priority)
- [ ] **Support user-provided S3/storage URLs for existing files**
  - Add UI option to provide external S3 URL instead of uploading
  - Validate user has access to the provided S3 URL
  - Support various S3 URL formats (s3://, https://)
  - Allow specifying credentials for private buckets
  - Create file record pointing to existing S3 object
  - Skip upload step for pre-existing files

- [ ] **Add support for Google Cloud Storage**
  - ✅ GCS resolver already implemented
  - Configure GCS credentials
  - Test with real GCS bucket
  - Support user-provided GCS URLs (gs://)

- [ ] **Add support for Azure Blob Storage**
  - Implement Azure storage service
  - Add SAS token generation
  - Update frontend for Azure uploads
  - Support user-provided Azure URLs

- [ ] **Add support for direct imports from Google Drive**
  - OAuth integration for Google Drive
  - File picker implementation
  - Direct server-to-server transfer

- [ ] **Add support for direct imports from Dropbox**
  - Dropbox API integration
  - File picker widget
  - Handle Dropbox sharing links

## Implementation Notes

### File Size Routing Logic
```
if file.size < 10MB:
    use multipart upload directly to API
else:
    request presigned URL from API
    upload to S3
    send S3 URL to API
```

### API Endpoints
- `POST /api/v1/tenants/{id}/files` - Accepts both multipart and JSON (with S3 URL)
- `POST /api/v1/tenants/{id}/files/presigned-url` - Get S3 presigned URL
- `GET /api/v1/tenants/{id}/files/{file_id}/download` - Download file from any storage

### Environment Variables for MinIO (Development)
```
AWS_ENDPOINT_URL=http://localhost:9000
AWS_REGION=us-east-1
AWS_S3_BUCKET=audimodal-uploads
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_UPLOAD_EXPIRATION=3600 (1 hour)
AWS_S3_FORCE_PATH_STYLE=true
```

### Environment Variables for AWS S3 (Production)
```
AWS_REGION=us-east-1
AWS_S3_BUCKET=audimodal-uploads-prod
AWS_ACCESS_KEY_ID=xxx (or use IAM role)
AWS_SECRET_ACCESS_KEY=xxx
S3_UPLOAD_EXPIRATION=3600 (1 hour)
```

### Security Considerations
- Validate file types and sizes
- Scan for malware before processing
- Use separate buckets for temp vs permanent storage
- Implement proper IAM policies
- Add request signing for additional security