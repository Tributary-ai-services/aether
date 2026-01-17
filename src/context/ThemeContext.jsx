import React, { createContext, useContext, useState, useEffect } from 'react';

// Default theme configuration
const defaultTheme = {
  // Branding
  branding: {
    appName: 'Aether',
    logoUrl: null, // Will use text logo if null
    faviconUrl: '/favicon.ico',
    tagline: 'AI Portal Platform'
  },
  
  // Theme mode
  mode: 'light', // 'light', 'dark', or 'system'
  
  // Color scheme
  colors: {
    // Primary colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    
    // Secondary colors
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87'
    },
    
    // Accent colors
    accent: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    },
    
    // Status colors
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Gray scale
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  
  // Layout
  layout: {
    borderRadius: {
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      full: '9999px'
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      base: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    }
  }
};

// Predefined theme presets
export const themePresets = {
  default: {
    name: 'Aether Blue',
    ...defaultTheme
  },
  
  corporate: {
    name: 'Corporate Gray',
    ...defaultTheme,
    branding: {
      ...defaultTheme.branding,
      appName: 'Enterprise AI'
    },
    colors: {
      ...defaultTheme.colors,
      primary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a'
      }
    }
  },
  
  nature: {
    name: 'Nature Green',
    ...defaultTheme,
    branding: {
      ...defaultTheme.branding,
      appName: 'EcoAI'
    },
    colors: {
      ...defaultTheme.colors,
      primary: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d'
      }
    }
  },
  
  sunset: {
    name: 'Sunset Orange',
    ...defaultTheme,
    branding: {
      ...defaultTheme.branding,
      appName: 'SolarAI'
    },
    colors: {
      ...defaultTheme.colors,
      primary: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12'
      }
    }
  },
  
  royal: {
    name: 'Royal Purple',
    ...defaultTheme,
    branding: {
      ...defaultTheme.branding,
      appName: 'RoyalAI'
    },
    colors: {
      ...defaultTheme.colors,
      primary: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c3aed',
        800: '#6b21a8',
        900: '#581c87'
      }
    }
  }
};

// Theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Try to load theme from localStorage
    const savedTheme = localStorage.getItem('aether-theme');
    if (savedTheme) {
      try {
        return JSON.parse(savedTheme);
      } catch (error) {
        console.warn('Failed to parse saved theme, using default');
      }
    }
    return defaultTheme;
  });

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('aether-theme', JSON.stringify(currentTheme));
    
    // Update CSS custom properties for dynamic theming
    updateCSSVariables(currentTheme);
    
    // Apply dark/light mode classes
    updateThemeMode(currentTheme.mode);
    
    // Update favicon if specified
    if (currentTheme.branding.faviconUrl) {
      updateFavicon(currentTheme.branding.faviconUrl);
    }
    
    // Update document title
    document.title = `${currentTheme.branding.appName} - ${currentTheme.branding.tagline}`;
  }, [currentTheme]);

  // Update CSS custom properties
  const updateCSSVariables = (theme) => {
    const root = document.documentElement;
    
    // Primary colors
    Object.entries(theme.colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });
    
    // Secondary colors
    Object.entries(theme.colors.secondary).forEach(([key, value]) => {
      root.style.setProperty(`--color-secondary-${key}`, value);
    });
    
    // Accent colors
    Object.entries(theme.colors.accent).forEach(([key, value]) => {
      root.style.setProperty(`--color-accent-${key}`, value);
    });
    
    // Status colors
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--color-info', theme.colors.info);
    
    // Gray colors
    Object.entries(theme.colors.gray).forEach(([key, value]) => {
      root.style.setProperty(`--color-gray-${key}`, value);
    });
  };

  // Update favicon
  const updateFavicon = (faviconUrl) => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  // Update theme mode (light/dark)
  const updateThemeMode = (mode) => {
    const root = document.documentElement;
    
    if (mode === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--bg-primary', '#1f2937');
      root.style.setProperty('--bg-secondary', '#111827');
      root.style.setProperty('--text-primary', '#f9fafb');
      root.style.setProperty('--text-secondary', '#d1d5db');
    } else if (mode === 'light') {
      root.classList.remove('dark');
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f9fafb');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#6b7280');
    } else if (mode === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      updateThemeMode(prefersDark ? 'dark' : 'light');
    }
  };

  // Theme management functions
  const setTheme = (theme) => {
    setCurrentTheme(theme);
  };

  const setThemePreset = (presetName) => {
    if (themePresets[presetName]) {
      setCurrentTheme(themePresets[presetName]);
    }
  };

  const updateBranding = (branding) => {
    setCurrentTheme(prev => ({
      ...prev,
      branding: { ...prev.branding, ...branding }
    }));
  };

  const updateColors = (colors) => {
    setCurrentTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, ...colors }
    }));
  };

  const resetTheme = () => {
    setCurrentTheme(defaultTheme);
  };

  const setThemeMode = (mode) => {
    setCurrentTheme(prev => ({
      ...prev,
      mode
    }));
  };

  // Helper functions to get themed values
  const getColor = (colorPath) => {
    const keys = colorPath.split('.');
    let value = currentTheme.colors;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    
    return value || '#000000';
  };

  const getPrimaryColor = (shade = '500') => {
    return currentTheme.colors.primary[shade] || currentTheme.colors.primary['500'];
  };

  const getSecondaryColor = (shade = '500') => {
    return currentTheme.colors.secondary[shade] || currentTheme.colors.secondary['500'];
  };

  const getAccentColor = (shade = '500') => {
    return currentTheme.colors.accent[shade] || currentTheme.colors.accent['500'];
  };

  const value = {
    theme: currentTheme,
    setTheme,
    setThemePreset,
    updateBranding,
    updateColors,
    resetTheme,
    setThemeMode,
    getColor,
    getPrimaryColor,
    getSecondaryColor,
    getAccentColor,
    themePresets
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;