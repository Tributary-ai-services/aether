import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  addToast,
  removeToast,
  togglePaused,
  clearAll,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsPaused,
  selectToasts,
} from '../store/slices/notificationsSlice.js';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const notificationsPaused = useSelector(selectNotificationsPaused);
  const toastNotifications = useSelector(selectToasts);
  const intervalRef = useRef(null);

  // Poll for notifications every 30s when not paused
  useEffect(() => {
    if (notificationsPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());

    // Poll
    intervalRef.current = setInterval(() => {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [notificationsPaused, dispatch]);

  const addNotification = useCallback((notification) => {
    const toast = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      autoRemove: true,
      ...notification,
    };
    dispatch(addToast(toast));
    return toast.id;
  }, [dispatch]);

  const removeToastNotification = useCallback((id) => {
    dispatch(removeToast(id));
  }, [dispatch]);

  // Auto-remove toasts after 5 seconds
  useEffect(() => {
    toastNotifications.forEach(toast => {
      if (toast.autoRemove !== false) {
        const timer = setTimeout(() => {
          dispatch(removeToast(toast.id));
        }, 5000);
        return () => clearTimeout(timer);
      }
    });
  }, [toastNotifications, dispatch]);

  const removeNotification = useCallback((id) => {
    dispatch(deleteNotification(id));
    dispatch(removeToast(id));
  }, [dispatch]);

  const clearAllNotifications = useCallback(() => {
    dispatch(clearAll());
  }, [dispatch]);

  const markAsRead = useCallback((id) => {
    dispatch(markNotificationAsRead(id));
  }, [dispatch]);

  const getUnreadCount = useCallback(() => {
    return unreadCount;
  }, [unreadCount]);

  const togglePauseNotifications = useCallback(() => {
    dispatch(togglePaused());
  }, [dispatch]);

  const value = {
    notifications,
    toastNotifications,
    notificationsPaused,
    addNotification,
    removeNotification,
    removeToastNotification,
    clearAllNotifications,
    markAsRead,
    getUnreadCount,
    togglePauseNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
