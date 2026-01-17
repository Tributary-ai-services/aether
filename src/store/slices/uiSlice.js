import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api.js';

// Async thunks for onboarding operations
export const fetchOnboardingStatus = createAsyncThunk(
  'ui/fetchOnboardingStatus',
  async (_, { rejectWithValue }) => {
    try {
      const status = await api.onboarding.getStatus();
      return {
        hasCompletedOnboarding: status.tutorial_completed,
        shouldAutoTrigger: status.should_auto_trigger
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to load onboarding status');
    }
  }
);

export const markOnboardingComplete = createAsyncThunk(
  'ui/markOnboardingComplete',
  async (_, { rejectWithValue }) => {
    try {
      await api.onboarding.markTutorialComplete();
      return true;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to mark tutorial complete');
    }
  }
);

export const resetOnboarding = createAsyncThunk(
  'ui/resetOnboarding',
  async (autoTrigger = false, { rejectWithValue }) => {
    try {
      await api.onboarding.resetTutorial();
      return { autoTrigger };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to reset tutorial');
    }
  }
);

const initialState = {
  modals: {
    createNotebook: false,
    notebookDetail: false,
    uploadDocument: false,
    notebookSettings: false,
    notebookManager: false,
    exportData: false,
    contentsView: false,
    onboarding: false
  },
  onboarding: {
    hasCompletedOnboarding: false,
    shouldAutoTrigger: false,
    isLoading: false,
    error: null
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

    // Onboarding modal control
    openOnboardingModal: (state) => {
      state.modals.onboarding = true;
    },
    closeOnboardingModal: (state) => {
      state.modals.onboarding = false;
    },
    clearOnboardingError: (state) => {
      state.onboarding.error = null;
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
  },
  extraReducers: (builder) => {
    // Fetch onboarding status
    builder
      .addCase(fetchOnboardingStatus.pending, (state) => {
        state.onboarding.isLoading = true;
        state.onboarding.error = null;
      })
      .addCase(fetchOnboardingStatus.fulfilled, (state, action) => {
        state.onboarding.isLoading = false;
        state.onboarding.hasCompletedOnboarding = action.payload.hasCompletedOnboarding;
        state.onboarding.shouldAutoTrigger = action.payload.shouldAutoTrigger;
      })
      .addCase(fetchOnboardingStatus.rejected, (state, action) => {
        state.onboarding.isLoading = false;
        state.onboarding.error = action.payload;
        // On error, default to not completed so tutorial can be shown
        state.onboarding.hasCompletedOnboarding = false;
        state.onboarding.shouldAutoTrigger = true;
      })

      // Mark onboarding complete
      .addCase(markOnboardingComplete.pending, (state) => {
        state.onboarding.error = null;
      })
      .addCase(markOnboardingComplete.fulfilled, (state) => {
        state.onboarding.hasCompletedOnboarding = true;
        state.onboarding.shouldAutoTrigger = false;
        state.modals.onboarding = false; // Auto-close modal
      })
      .addCase(markOnboardingComplete.rejected, (state, action) => {
        state.onboarding.error = action.payload;
      })

      // Reset onboarding
      .addCase(resetOnboarding.pending, (state) => {
        state.onboarding.error = null;
      })
      .addCase(resetOnboarding.fulfilled, (state, action) => {
        state.onboarding.hasCompletedOnboarding = false;
        state.onboarding.shouldAutoTrigger = action.payload.autoTrigger;
        state.modals.onboarding = true; // Auto-open modal after reset
      })
      .addCase(resetOnboarding.rejected, (state, action) => {
        state.onboarding.error = action.payload;
      });
  }
});

export const {
  openModal,
  closeModal,
  closeAllModals,
  openOnboardingModal,
  closeOnboardingModal,
  clearOnboardingError,
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

// Onboarding selectors
export const selectOnboardingModal = (state) => state.ui.modals.onboarding;
export const selectOnboardingState = (state) => state.ui.onboarding;
export const selectHasCompletedOnboarding = (state) => state.ui.onboarding.hasCompletedOnboarding;
export const selectShouldAutoTrigger = (state) => state.ui.onboarding.shouldAutoTrigger;
export const selectOnboardingLoading = (state) => state.ui.onboarding.isLoading;
export const selectOnboardingError = (state) => state.ui.onboarding.error;

export default uiSlice.reducer;