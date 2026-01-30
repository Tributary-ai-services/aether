import React from 'react';

/**
 * Theme-aware StatusBadge component for displaying status labels
 *
 * @param {Object} props
 * @param {'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'} props.variant - Badge color variant
 * @param {'sm' | 'md' | 'lg'} props.size - Badge size
 * @param {boolean} props.dot - Show status dot indicator
 * @param {boolean} props.pill - Use pill shape (rounded full)
 * @param {React.ReactNode} props.icon - Icon element to display
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Badge content
 */
const StatusBadge = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  pill = true,
  icon,
  className = '',
  children,
  ...props
}) => {
  // Map common status strings to variants
  const statusVariantMap = {
    // Success variants
    active: 'success',
    published: 'success',
    complete: 'success',
    completed: 'success',
    online: 'success',
    approved: 'success',
    enabled: 'success',
    // Warning variants
    draft: 'warning',
    pending: 'warning',
    paused: 'warning',
    review: 'warning',
    inactive: 'warning',
    // Error variants
    failed: 'error',
    error: 'error',
    offline: 'error',
    rejected: 'error',
    disabled: 'error',
    // Info variants
    running: 'info',
    processing: 'info',
    syncing: 'info',
    loading: 'info',
    // Keep other values as-is
    success: 'success',
    warning: 'warning',
    info: 'info',
    neutral: 'neutral',
    primary: 'primary'
  };

  // Resolve the actual variant from status string
  const resolvedVariant = statusVariantMap[variant] || statusVariantMap[children?.toString().toLowerCase()] || variant;

  // Base classes
  const baseClasses = 'inline-flex items-center font-medium';

  // Variant-specific classes using CSS custom properties
  const variantClasses = {
    success: 'bg-(--color-success-light) text-(--color-success-dark)',
    warning: 'bg-(--color-warning-light) text-(--color-warning-dark)',
    error: 'bg-(--color-error-light) text-(--color-error-dark)',
    info: 'bg-(--color-info-light) text-(--color-info-dark)',
    primary: 'bg-(--color-primary-100) text-(--color-primary-700)',
    neutral: 'bg-gray-100 text-gray-700'
  };

  // Dot color classes
  const dotClasses = {
    success: 'bg-(--color-success)',
    warning: 'bg-(--color-warning)',
    error: 'bg-(--color-error)',
    info: 'bg-(--color-primary-600)',
    primary: 'bg-(--color-primary-600)',
    neutral: 'bg-gray-400'
  };

  // Size-specific classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  // Dot sizes
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  // Border radius
  const radiusClasses = pill ? 'rounded-full' : 'rounded-md';

  // Icon size based on badge size
  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };

  // Clone icon with appropriate size if provided
  const renderIcon = () => {
    if (!icon) return null;
    return React.cloneElement(icon, {
      size: icon.props.size || iconSizes[size],
      className: icon.props.className
    });
  };

  return (
    <span
      className={`${baseClasses} ${variantClasses[resolvedVariant]} ${sizeClasses[size]} ${radiusClasses} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`${dotSizes[size]} ${dotClasses[resolvedVariant]} rounded-full`} />
      )}
      {icon && renderIcon()}
      {children}
    </span>
  );
};

/**
 * Convenience component for status badges that automatically maps status text
 */
export const AutoStatusBadge = ({ status, ...props }) => {
  const displayText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return (
    <StatusBadge variant={status} {...props}>
      {displayText}
    </StatusBadge>
  );
};

export default StatusBadge;
