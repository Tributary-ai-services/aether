import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * AI Assist Button - A sparkles icon button that triggers the Prompt Assistant
 * Designed to sit next to text fields (description, system_prompt) in agent creation forms
 */
const AIAssistButton = ({
  onClick,
  disabled = false,
  loading = false,
  tooltip = 'Get AI assistance',
  size = 'default',
  className = ''
}) => {
  const sizeClasses = {
    small: 'p-1',
    default: 'p-1.5',
    large: 'p-2'
  };

  const iconSizes = {
    small: 14,
    default: 16,
    large: 20
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={tooltip}
      className={`
        ${sizeClasses[size] || sizeClasses.default}
        rounded-lg
        transition-all duration-200
        ${disabled || loading
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-purple-500 hover:text-purple-600 hover:bg-purple-50 active:bg-purple-100'
        }
        focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-1
        ${className}
      `}
    >
      <Sparkles
        size={iconSizes[size] || iconSizes.default}
        className={loading ? 'animate-pulse' : ''}
      />
    </button>
  );
};

/**
 * AI Assist Label - A complete label with integrated assist button
 * Used for form fields that should have AI assistance
 */
export const AIAssistLabel = ({
  htmlFor,
  label,
  required = false,
  onAssistClick,
  assistDisabled = false,
  assistLoading = false,
  assistTooltip = 'Get AI assistance',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <AIAssistButton
        onClick={onAssistClick}
        disabled={assistDisabled}
        loading={assistLoading}
        tooltip={assistTooltip}
        size="small"
      />
    </div>
  );
};

export default AIAssistButton;
