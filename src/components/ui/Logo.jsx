import React from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';

const Logo = ({ size = 'default', className = '' }) => {
  const { theme } = useTheme();
  const { appName, logoUrl } = theme.branding;

  // Size configurations
  const sizeConfig = {
    small: {
      text: 'text-lg font-bold',
      image: 'h-6 w-auto'
    },
    default: {
      text: 'text-2xl font-bold',
      image: 'h-8 w-auto'
    },
    large: {
      text: 'text-3xl font-bold',
      image: 'h-12 w-auto'
    }
  };

  const config = sizeConfig[size] || sizeConfig.default;

  if (logoUrl) {
    return (
      <div className={`flex items-center ${className}`}>
        <img 
          src={logoUrl} 
          alt={appName}
          className={config.image}
          onError={(e) => {
            // Fallback to text logo if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <span 
          className={`text-gray-900 ${config.text}`}
          style={{ display: 'none' }}
        >
          {appName}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <span 
        className={`text-gray-900 ${config.text}`}
        style={{ color: `var(--color-primary-700)` }}
      >
        {appName}
      </span>
    </div>
  );
};

export default Logo;