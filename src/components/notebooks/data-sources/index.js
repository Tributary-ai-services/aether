/**
 * Data Sources Components
 *
 * Barrel export for all data source components used in the DataSourceModal.
 */

// Phase 1: Simple sources (no credentials required)
export { default as TextInputSource } from './TextInputSource.jsx';
export { default as WebScrapingSource } from './WebScrapingSource.jsx';

// Phase 2: OAuth sources (coming soon)
// export { default as GoogleDriveSource } from './GoogleDriveSource.jsx';

// Phase 3: Database sources (coming soon)
// export { default as DatabaseSource } from './DatabaseSource.jsx';

// Phase 4: API and cloud storage (coming soon)
// export { default as ApiIntegrationSource } from './ApiIntegrationSource.jsx';
// export { default as CloudStorageSource } from './CloudStorageSource.jsx';

// Utility components (coming soon)
// export { default as SyncProgressPanel } from './SyncProgressPanel.jsx';
// export { default as SyncScheduleForm } from './SyncScheduleForm.jsx';
