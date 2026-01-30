import React from 'react';

/**
 * Theme-aware Button component with multiple variants
 *
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} props.variant - Button style variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state
 * @param {React.ReactNode} props.icon - Icon element to display
 * @param {'left' | 'right'} props.iconPosition - Position of icon
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  children,
  ...props
}) => {
  // Base classes applied to all buttons
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Variant-specific classes using CSS custom properties
  const variantClasses = {
    primary: 'bg-(--color-primary-600) text-(--color-primary-contrast) hover:bg-(--color-primary-700) active:bg-(--color-primary-800) focus:ring-(--color-primary-500) disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed',
    outline: 'bg-transparent border border-(--color-primary-600) text-(--color-primary-600) hover:bg-(--color-primary-50) active:bg-(--color-primary-100) focus:ring-(--color-primary-500) disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-(--color-primary-600) hover:bg-(--color-primary-50) active:bg-(--color-primary-100) focus:ring-(--color-primary-500) disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-(--color-error) text-white hover:bg-(--color-error-dark) focus:ring-(--color-error) disabled:opacity-50 disabled:cursor-not-allowed'
  };

  // Size-specific classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2'
  };

  // Icon size based on button size
  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  };

  const isDisabled = disabled || loading;

  // Clone icon with appropriate size if provided
  const renderIcon = () => {
    if (!icon) return null;
    return React.cloneElement(icon, {
      size: icon.props.size || iconSizes[size],
      className: loading ? 'animate-spin' : icon.props.className
    });
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <svg
      className="animate-spin"
      width={iconSizes[size]}
      height={iconSizes[size]}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && iconPosition === 'left' && <LoadingSpinner />}
      {!loading && icon && iconPosition === 'left' && renderIcon()}
      {children}
      {!loading && icon && iconPosition === 'right' && renderIcon()}
      {loading && iconPosition === 'right' && <LoadingSpinner />}
    </button>
  );
};

export default Button;
