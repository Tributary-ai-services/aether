/**
 * SecurityBlockedToast Component
 *
 * Displays security blocked (403 with SECURITY_BLOCKED code) errors as a toast notification.
 * This is distinct from permission errors - it indicates the user's input contained
 * potentially malicious content (SQL injection, XSS, etc.) that was blocked.
 *
 * Listens for 'securityBlocked' events from aetherApi.
 */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  showSecurityBlocked,
  clearSecurityBlocked,
  selectSecurityBlocked
} from '../../store/slices/uiSlice.js';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';

// Map threat types to user-friendly descriptions
const threatTypeDescriptions = {
  sql_injection: 'SQL injection attempt',
  xss: 'Cross-site scripting (XSS)',
  html_injection: 'HTML injection',
  control_chars: 'Suspicious control characters'
};

// Map severity to styling
const severityStyles = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    icon: 'bg-red-100',
    iconColor: 'text-red-600',
    title: 'text-red-800',
    text: 'text-red-700',
    subtext: 'text-red-500',
    badge: 'bg-red-100 text-red-800'
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    icon: 'bg-orange-100',
    iconColor: 'text-orange-600',
    title: 'text-orange-800',
    text: 'text-orange-700',
    subtext: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-800'
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    icon: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
    subtext: 'text-yellow-500',
    badge: 'bg-yellow-100 text-yellow-800'
  },
  low: {
    bg: 'bg-(--color-primary-50)',
    border: 'border-(--color-primary-300)',
    icon: 'bg-(--color-primary-100)',
    iconColor: 'text-(--color-primary-600)',
    title: 'text-(--color-primary-700)',
    text: 'text-(--color-primary-600)',
    subtext: 'text-(--color-primary-500)',
    badge: 'bg-(--color-primary-100) text-(--color-primary-700)'
  }
};

const SecurityBlockedToast = () => {
  const dispatch = useDispatch();
  const securityBlocked = useSelector(selectSecurityBlocked);

  // Listen for security blocked events from aetherApi
  useEffect(() => {
    const handleSecurityBlocked = (event) => {
      console.log('[SecurityBlockedToast] Received securityBlocked event:', event.detail);
      dispatch(showSecurityBlocked({
        message: event.detail.message,
        threatTypes: event.detail.threatTypes,
        severity: event.detail.severity,
        action: event.detail.action,
        resource: event.detail.resource
      }));
    };

    window.addEventListener('securityBlocked', handleSecurityBlocked);
    console.log('[SecurityBlockedToast] Event listener registered');

    return () => {
      window.removeEventListener('securityBlocked', handleSecurityBlocked);
      console.log('[SecurityBlockedToast] Event listener removed');
    };
  }, [dispatch]);

  // Auto-dismiss based on severity:
  // - critical/high: NO auto-dismiss, require manual close
  // - medium: 15 seconds
  // - low: 10 seconds
  useEffect(() => {
    if (securityBlocked) {
      const severity = securityBlocked.severity || 'critical';
      console.log('[SecurityBlockedToast] State changed:', { severity, securityBlocked });

      // Critical and high severity require manual dismissal
      if (severity === 'critical' || severity === 'high') {
        console.log('[SecurityBlockedToast] Critical/high severity - NO auto-dismiss');
        return; // No auto-dismiss
      }

      console.log('[SecurityBlockedToast] Setting auto-dismiss timer for', severity);
      const dismissTime = severity === 'medium' ? 15000 : 10000;
      const timer = setTimeout(() => {
        console.log('[SecurityBlockedToast] Auto-dismissing');
        dispatch(clearSecurityBlocked());
      }, dismissTime);

      return () => clearTimeout(timer);
    } else {
      console.log('[SecurityBlockedToast] State cleared to null');
    }
  }, [securityBlocked, dispatch]);

  if (!securityBlocked) {
    return null;
  }

  const severity = securityBlocked.severity || 'critical';
  const styles = severityStyles[severity] || severityStyles.critical;

  // Get user-friendly threat descriptions
  const threatDescriptions = (securityBlocked.threatTypes || [])
    .map(type => threatTypeDescriptions[type] || type)
    .filter(Boolean);

  // Determine if this is a high-priority alert that requires attention
  const requiresManualDismiss = severity === 'critical' || severity === 'high';

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`${styles.bg} border-2 ${styles.border} rounded-lg shadow-xl p-5 max-w-lg`}>
        <div className="flex items-start gap-4">
          {/* Icon - larger for critical */}
          <div className={`flex-shrink-0 p-3 ${styles.icon} rounded-full`}>
            <ShieldAlert size={requiresManualDismiss ? 28 : 24} className={styles.iconColor} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-base font-bold ${styles.title}`}>
                {requiresManualDismiss ? '⚠️ Security Threat Blocked' : 'Security Alert'}
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${styles.badge}`}>
                {severity}
              </span>
            </div>

            <p className={`mt-2 text-sm ${styles.text}`}>
              {securityBlocked.message}
            </p>

            {/* Show what action was blocked */}
            {(securityBlocked.action || securityBlocked.resource) && (
              <div className={`mt-2 p-2 ${styles.icon} rounded text-xs ${styles.text}`}>
                <span className="font-semibold">Blocked request:</span>{' '}
                {securityBlocked.action?.toUpperCase() || 'REQUEST'} {securityBlocked.resource || ''}
              </div>
            )}

            {/* Show detected threat types with more detail */}
            {threatDescriptions.length > 0 && (
              <div className="mt-3">
                <p className={`text-xs font-bold ${styles.title}`}>Threats Detected:</p>
                <ul className={`mt-1 text-sm ${styles.text} space-y-1`}>
                  {threatDescriptions.map((desc, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${severity === 'critical' ? 'bg-red-500' : severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`}></span>
                      {desc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What the user should do */}
            <div className={`mt-4 p-3 bg-white bg-opacity-50 rounded border ${styles.border}`}>
              <p className={`text-xs font-semibold ${styles.title} flex items-center gap-2`}>
                <AlertTriangle size={14} />
                What to do:
              </p>
              <ul className={`mt-1 text-xs ${styles.text} list-disc list-inside space-y-1`}>
                <li>Review your input for special characters like quotes, semicolons, or angle brackets</li>
                <li>Remove any code-like content (SQL keywords, HTML tags, scripts)</li>
                {threatDescriptions.includes('SQL injection attempt') && (
                  <li>Avoid SQL keywords like SELECT, DROP, DELETE, UNION, OR, AND</li>
                )}
                {threatDescriptions.includes('Cross-site scripting (XSS)') && (
                  <li>Remove script tags, event handlers (onclick, onerror), and javascript: URLs</li>
                )}
              </ul>
            </div>

            {/* Manual dismiss notice for critical/high */}
            {requiresManualDismiss && (
              <p className={`mt-3 text-xs ${styles.subtext} italic`}>
                This alert requires manual dismissal. Click the X to close.
              </p>
            )}
          </div>

          {/* Close button - more prominent */}
          <button
            onClick={() => dispatch(clearSecurityBlocked())}
            className={`flex-shrink-0 p-2 ${styles.icon} hover:opacity-80 rounded-full transition-colors`}
            aria-label="Dismiss alert"
            title="Click to dismiss"
          >
            <X size={20} className={styles.iconColor} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityBlockedToast;
