export { default as store } from './store.js';
export { useAppDispatch, useAppSelector } from './hooks.js';

// Re-export actions for convenience
export {
  fetchNotebooks,
  createNotebook,
  updateNotebook,
  deleteNotebook,
  setSelectedNotebook,
  clearSelectedNotebook,
  updateNotebookDocumentCount,
  clearError as clearNotebooksError,
  // Document actions
  fetchNotebookDocuments,
  clearNotebookDocuments,
  clearDocumentsError,
  // Document selectors
  selectAllDocuments,
  selectDocumentsLoading,
  selectDocumentsError,
  selectNotebookDocuments
} from './slices/notebooksSlice.js';

export {
  loginUser,
  refreshToken,
  logoutUser,
  initializeAuth,
  clearError as clearAuthError,
  setToken
} from './slices/authSlice.js';

export {
  openModal,
  closeModal,
  closeAllModals,
  openOnboardingModal,
  closeOnboardingModal,
  clearOnboardingError,
  fetchOnboardingStatus,
  markOnboardingComplete,
  resetOnboarding,
  selectOnboardingModal,
  selectOnboardingState,
  selectHasCompletedOnboarding,
  selectShouldAutoTrigger,
  selectOnboardingLoading,
  selectOnboardingError,
  addNotification,
  removeNotification,
  clearAllNotifications,
  setTheme,
  toggleTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setViewMode,
  setGlobalLoading,
  setNotebooksLoading,
  setAuthLoading,
  initializeUI,
  selectModals
} from './slices/uiSlice.js';

export {
  fetchViolations,
  fetchSummary,
  acknowledgeViolation,
  bulkAcknowledgeViolations,
  setFilters,
  clearFilters,
  selectViolations,
  selectViolationsLoading,
  selectSummary,
  selectSummaryLoading,
  selectUnacknowledgedCount,
  selectFilters,
  selectViolationsMeta,
  selectAcknowledgeLoading,
  selectBulkAcknowledgeLoading
} from './slices/complianceSlice.js';