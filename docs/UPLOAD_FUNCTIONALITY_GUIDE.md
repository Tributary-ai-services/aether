# Document Upload Functionality Guide

## 📤 Where to Find the Upload Feature

The document upload functionality is now available in **three locations**:

### 1. **Notebook Cards** (Card View) - ✅ NEW!
- Navigate to the **Notebooks** tab
- Each notebook card now has a green **"Upload"** button
- Click the button to open the upload modal for that specific notebook

### 2. **Notebook Detail View** (Tree View)
- Navigate to the **Notebooks** tab
- Click the **Tree View** button (folder icon) in the top right
- Select a notebook from the tree
- The detail view on the right will show an **"Upload Documents"** button in the header

### 3. **Direct Access Steps**
1. Go to the **Notebooks** tab
2. You'll see notebook cards in a grid layout
3. Each card displays:
   - Notebook name and description
   - Tags
   - Document count
   - Sub-notebook count
   - **Green "Upload" button** 🟢
   - Blue "Open →" link

## 🚀 Using the Upload Feature

When you click the Upload button:

1. **Document Upload Modal** opens with:
   - Drag & drop area
   - File selection button
   - Multi-file support
   - Real-time validation
   - Processing tier indicators

2. **Supported Features**:
   - **35+ file formats** (PDF, DOCX, XLSX, images, videos, etc.)
   - **Multi-tier processing**:
     - Tier 1: <10MB (30 seconds)
     - Tier 2: 10MB-1GB (2-5 minutes)
     - Tier 3: >1GB (10-30 minutes)
   - **AudiModal Integration** for AI processing
   - **Progress tracking** for each file
   - **Error handling** with clear messages

3. **After Upload**:
   - Files are processed via AudiModal API
   - Vector embeddings generated
   - Semantic search enabled
   - Content analysis performed
   - Anomaly detection runs

## 🔍 Troubleshooting

If you don't see the upload button:

1. **Refresh the browser** to ensure latest code is loaded
2. **Check you're on the Notebooks tab**
3. **Create a notebook first** if none exist (use "New Notebook" button)
4. **Check browser console** for any errors

## 📝 Notes

- The upload functionality requires AudiModal API configuration
- Set your API credentials in the `.env` file:
  ```
  VITE_AUDIMODAL_API_URL=https://api.audimodal.ai/v1
  VITE_AUDIMODAL_API_KEY=your-api-key-here
  VITE_AUDIMODAL_TENANT_ID=your-tenant-id-here
  ```
- Currently using demo credentials which will show a warning in the console