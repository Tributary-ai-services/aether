import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  // Initialize with some mock notifications for the bell icon
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Welcome to Aether',
      message: 'Your AI platform is ready to use',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      source: 'System',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Getting Started',
      message: 'Check out the Notebooks tab to begin processing documents',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      source: 'Help',
      read: true
    }
  ]);
  const [toastNotifications, setToastNotifications] = useState([]);
  const [notificationsPaused, setNotificationsPaused] = useState(() => {
    // Load pause state from localStorage
    const saved = localStorage.getItem('notificationsPaused');
    return saved === 'true';
  });

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    // Add to notifications list (for bell icon)
    setNotifications(prev => [newNotification, ...prev]);
    
    // Add to toast notifications if autoRemove is true
    if (notification.autoRemove) {
      setToastNotifications(prev => [newNotification, ...prev]);
    }
    
    return newNotification.id;
  }, []);

  const removeToastNotification = useCallback((id) => {
    setToastNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Auto-remove toast notifications after 5 seconds
  useEffect(() => {
    toastNotifications.forEach(notification => {
      if (notification.autoRemove) {
        setTimeout(() => {
          removeToastNotification(notification.id);
        }, 5000);
      }
    });
  }, [toastNotifications, removeToastNotification]);

  // Simulate real-time notifications
  useEffect(() => {
    let timeoutId;
    
    const simulateNotifications = () => {
      // Check if paused before scheduling next notification
      if (notificationsPaused) {
        // Schedule to check again in 30 seconds
        timeoutId = setTimeout(simulateNotifications, 30000);
        return;
      }

      const mockNotifications = [
        {
          type: 'success',
          title: 'Document Processed',
          message: 'contract_analysis.pdf has been successfully processed',
          timestamp: new Date(),
          source: 'Document Pipeline'
        },
        {
          type: 'info',
          title: 'Agent Training Complete',
          message: 'Legal Document Classifier v2.1 training completed with 94.2% accuracy',
          timestamp: new Date(),
          source: 'ML Training'
        },
        {
          type: 'warning',
          title: 'Storage Warning',
          message: 'Storage usage is at 85%. Consider archiving old documents.',
          timestamp: new Date(),
          source: 'System Monitor'
        },
        {
          type: 'info',
          title: 'Workflow Executed',
          message: 'Invoice Processing workflow completed successfully for 15 documents',
          timestamp: new Date(),
          source: 'Workflow Engine'
        },
        {
          type: 'success',
          title: 'Batch Processing Complete',
          message: '25 medical records processed and classified successfully',
          timestamp: new Date(),
          source: 'Document Pipeline'
        },
        {
          type: 'info',
          title: 'Model Deployed',
          message: 'Invoice Data Extractor v1.3 deployed to production',
          timestamp: new Date(),
          source: 'ML Pipeline'
        },
        {
          type: 'success',
          title: 'Compliance Check Passed',
          message: 'All documents meet HIPAA compliance requirements',
          timestamp: new Date(),
          source: 'Compliance Engine'
        }
      ];

      // Weight the notifications to favor success/info messages (90% chance)
      const successWeight = Math.random();
      let randomNotification;
      
      if (successWeight < 0.9) {
        // 90% chance of success/info/warning messages
        const nonErrorNotifications = mockNotifications.filter(n => n.type !== 'error');
        randomNotification = nonErrorNotifications[Math.floor(Math.random() * nonErrorNotifications.length)];
      } else {
        // 10% chance of error message
        randomNotification = {
          type: 'error',
          title: 'Processing Failed',
          message: 'Failed to process corrupted_file.pdf - file appears to be damaged',
          timestamp: new Date(),
          source: 'Document Pipeline'
        };
      }

      // Add the notification
      addNotification({
        ...randomNotification,
        id: Date.now() + Math.random(),
        autoRemove: true
      });

      // Schedule next notification in 4-6 minutes (240-360 seconds)
      const randomDelay = Math.random() * 120000 + 240000;
      timeoutId = setTimeout(simulateNotifications, randomDelay);
    };

    // Start simulation after 30 seconds
    timeoutId = setTimeout(simulateNotifications, 30000);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [notificationsPaused, addNotification]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setToastNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setToastNotifications([]);
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const togglePauseNotifications = () => {
    setNotificationsPaused(prev => {
      const newState = !prev;
      localStorage.setItem('notificationsPaused', newState.toString());
      return newState;
    });
  };

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
    togglePauseNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};