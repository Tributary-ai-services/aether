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
  clearError as clearNotebooksError
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
  initializeUI
} from './slices/uiSlice.js';