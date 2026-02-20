import React, { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  // Default visibility settings
  const defaultTabs = {
    notebooks: true,        // Default to true
    'agent-builder': true,  // Default to true (renamed from agents)
    workflows: true,
    analytics: false,
    community: true,        // Default to true
    streaming: false,
    'developer-tools': true // Developer Tools - default visible
  };

  const [visibleTabs, setVisibleTabs] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('navigationTabs');
    return saved ? JSON.parse(saved) : defaultTabs;
  });

  // Save to localStorage whenever visibility changes
  useEffect(() => {
    localStorage.setItem('navigationTabs', JSON.stringify(visibleTabs));
  }, [visibleTabs]);

  const toggleTab = (tabId) => {
    setVisibleTabs(prev => ({
      ...prev,
      [tabId]: !prev[tabId]
    }));
  };

  const setTabVisibility = (tabId, visible) => {
    setVisibleTabs(prev => ({
      ...prev,
      [tabId]: visible
    }));
  };

  const resetToDefaults = () => {
    setVisibleTabs(defaultTabs);
  };

  const value = {
    visibleTabs,
    toggleTab,
    setTabVisibility,
    resetToDefaults
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};