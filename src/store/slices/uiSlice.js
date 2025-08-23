import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  modals: {
    createNotebook: false,
    notebookDetail: false,
    uploadDocument: false,
    notebookSettings: false,
    notebookManager: false,
    exportData: false,
    contentsView: false
  },
  notifications: [],
  theme: 'light',
  sidebarCollapsed: false,
  viewMode: 'cards', // cards, tree, detail
  loading: {
    global: false,
    notebooks: false,
    auth: false
  }
};

let notificationId = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal management
    openModal: (state, action) => {
      const modalName = action.payload;
      if (modalName in state.modals) {
        state.modals[modalName] = true;
      }
    },
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (modalName in state.modals) {
        state.modals[modalName] = false;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal] = false;
      });
    },

    // Notification management  
    addNotification: (state, action) => {
      const notification = {
        id: ++notificationId,
        type: action.payload.type || 'info',
        title: action.payload.title || '',
        message: action.payload.message,
        duration: action.payload.duration || 5000,
        timestamp: Date.now()
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },

    // Theme management
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('aether_theme', action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('aether_theme', state.theme);
    },

    // Sidebar management
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('aether_sidebar_collapsed', state.sidebarCollapsed);
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('aether_sidebar_collapsed', action.payload);
    },

    // View mode management
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
      localStorage.setItem('aether_view_mode', action.payload);
    },

    // Loading state management
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    setNotebooksLoading: (state, action) => {
      state.loading.notebooks = action.payload;
    },
    setAuthLoading: (state, action) => {
      state.loading.auth = action.payload;
    },

    // Initialize UI from localStorage
    initializeUI: (state) => {
      const savedTheme = localStorage.getItem('aether_theme');
      if (savedTheme) {
        state.theme = savedTheme;
      }
      
      const savedSidebarState = localStorage.getItem('aether_sidebar_collapsed');
      if (savedSidebarState !== null) {
        state.sidebarCollapsed = JSON.parse(savedSidebarState);
      }
      
      const savedViewMode = localStorage.getItem('aether_view_mode');
      if (savedViewMode) {
        state.viewMode = savedViewMode;
      }
    }
  }
});

export const {
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
} = uiSlice.actions;

// Selectors
export const selectModals = (state) => state.ui.modals;
export const selectNotifications = (state) => state.ui.notifications;
export const selectTheme = (state) => state.ui.theme;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectViewMode = (state) => state.ui.viewMode;
export const selectLoading = (state) => state.ui.loading;

export default uiSlice.reducer;