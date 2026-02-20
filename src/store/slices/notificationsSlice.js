import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// =====================
// Async Thunks
// =====================

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ limit = 20, offset = 0, unreadOnly = false } = {}, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notifications.getAll({ limit, offset, unreadOnly });
      if (response.success) {
        return {
          notifications: response.data.notifications || [],
          total: response.data.total || 0,
        };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch notifications');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notifications.getUnreadCount();
      if (response.success) {
        return response.data.unread_count || 0;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch unread count');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch unread count');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notifications.markAsRead(id);
      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.error || 'Failed to mark as read');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to mark as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notifications.markAllAsRead();
      if (response.success) {
        return true;
      } else {
        return rejectWithValue(response.error || 'Failed to mark all as read');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to mark all as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notifications.delete(id);
      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.error || 'Failed to delete notification');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete notification');
    }
  }
);

// =====================
// Slice
// =====================

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    total: 0,
    loading: false,
    error: null,
    toasts: [],
    paused: (() => {
      try {
        const saved = localStorage.getItem('notificationsPaused');
        return saved === 'true'; // Default to NOT paused (active polling)
      } catch {
        return false;
      }
    })(),
  },
  reducers: {
    addToast: (state, action) => {
      const toast = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.toasts = [toast, ...state.toasts].slice(0, 5);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    togglePaused: (state) => {
      state.paused = !state.paused;
      try {
        localStorage.setItem('notificationsPaused', state.paused.toString());
      } catch { /* ignore */ }
    },
    clearAll: (state) => {
      state.items = [];
      state.toasts = [];
      state.unreadCount = 0;
      state.total = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.notifications;
        state.total = action.payload.total;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchUnreadCount
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      // markAsRead
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        const item = state.items.find(n => n.id === id);
        if (item && !item.read) {
          item.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      // markAllAsRead
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.items.forEach(n => { n.read = true; });
        state.unreadCount = 0;
      })

      // delete
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const id = action.payload;
        const idx = state.items.findIndex(n => n.id === id);
        if (idx !== -1) {
          if (!state.items[idx].read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.items.splice(idx, 1);
          state.total = Math.max(0, state.total - 1);
        }
      });
  },
});

export const { addToast, removeToast, togglePaused, clearAll } = notificationsSlice.actions;

// =====================
// Selectors
// =====================

export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationsLoading = (state) => state.notifications.loading;
export const selectNotificationsPaused = (state) => state.notifications.paused;
export const selectToasts = (state) => state.notifications.toasts;

export default notificationsSlice.reducer;
