/**
 * Cloud Drive Provider Definitions
 *
 * Configuration for supported cloud drive providers including
 * Google Drive, OneDrive, and SharePoint.
 */

export const CLOUD_DRIVE_PROVIDERS = {
  GOOGLE_DRIVE: 'google',
  ONEDRIVE: 'onedrive',
  SHAREPOINT: 'sharepoint',
};

export const cloudDriveProviders = [
  {
    id: CLOUD_DRIVE_PROVIDERS.GOOGLE_DRIVE,
    name: 'Google Drive',
    description: 'Import files from your Google Drive',
    icon: 'google-drive',
    color: '#4285F4',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100',
    iconColor: 'text-blue-600',
    oauthProvider: 'google',
    requiresSiteSelection: false,
    supportedMimeTypes: [
      'application/pdf',
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.google-apps.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'text/markdown',
      'image/png',
      'image/jpeg',
    ],
  },
  {
    id: CLOUD_DRIVE_PROVIDERS.ONEDRIVE,
    name: 'OneDrive',
    description: 'Import files from your OneDrive',
    icon: 'onedrive',
    color: '#0078D4',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    hoverColor: 'hover:bg-sky-100',
    iconColor: 'text-sky-600',
    oauthProvider: 'microsoft',
    requiresSiteSelection: false,
    supportedMimeTypes: [],
  },
  {
    id: CLOUD_DRIVE_PROVIDERS.SHAREPOINT,
    name: 'SharePoint',
    description: 'Import from SharePoint document libraries',
    icon: 'sharepoint',
    color: '#038387',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    hoverColor: 'hover:bg-teal-100',
    iconColor: 'text-teal-600',
    oauthProvider: 'microsoft',
    requiresSiteSelection: true,
    supportedMimeTypes: [],
  },
];

/**
 * Get provider config by ID
 */
export const getProviderById = (providerId) => {
  return cloudDriveProviders.find((p) => p.id === providerId) || null;
};

/**
 * Get the OAuth provider name for a cloud drive provider
 * (Google Drive -> google, OneDrive/SharePoint -> microsoft)
 */
export const getOAuthProvider = (providerId) => {
  const provider = getProviderById(providerId);
  return provider?.oauthProvider || null;
};

/**
 * File type icons based on MIME type
 */
export const FILE_TYPE_ICONS = {
  'application/pdf': 'FileText',
  'application/vnd.google-apps.document': 'FileText',
  'application/vnd.google-apps.spreadsheet': 'Table',
  'application/vnd.google-apps.presentation': 'Presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'FileText',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Table',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Presentation',
  'text/plain': 'FileText',
  'text/csv': 'Table',
  'text/markdown': 'FileText',
  'image/png': 'Image',
  'image/jpeg': 'Image',
  'folder': 'Folder',
};

/**
 * Format file size to human-readable string
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};
