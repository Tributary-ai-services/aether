import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../store/hooks.js';
import {
  selectHasNewCritical,
  selectRecentViolations,
  clearNewCriticalFlag,
  clearRecentViolations,
} from '../../store/slices/complianceSlice.js';
import { Shield, X, AlertTriangle, ExternalLink } from 'lucide-react';

const ComplianceToast = ({ onOpenAuditTrail }) => {
  const dispatch = useDispatch();
  const hasNewCritical = useAppSelector(selectHasNewCritical);
  const recentViolations = useAppSelector(selectRecentViolations);
  const [visibleToasts, setVisibleToasts] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // Show toast for critical/high violations
  useEffect(() => {
    if (hasNewCritical) {
      // Get critical/high violations that haven't been dismissed
      const criticalViolations = recentViolations.filter(
        v => (v.severity === 'critical' || v.severity === 'high') && !dismissedIds.has(v.id)
      );

      if (criticalViolations.length > 0) {
        setVisibleToasts(criticalViolations.slice(0, 3)); // Show max 3 toasts
      }

      // Clear the flag after processing
      dispatch(clearNewCriticalFlag());
    }
  }, [hasNewCritical, recentViolations, dismissedIds, dispatch]);

  // Auto-dismiss toasts after 10 seconds
  useEffect(() => {
    if (visibleToasts.length > 0) {
      const timer = setTimeout(() => {
        setVisibleToasts([]);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [visibleToasts]);

  const handleDismiss = (id) => {
    setDismissedIds(prev => new Set([...prev, id]));
    setVisibleToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleDismissAll = () => {
    const ids = visibleToasts.map(t => t.id);
    setDismissedIds(prev => new Set([...prev, ...ids]));
    setVisibleToasts([]);
  };

  const handleViewDetails = () => {
    handleDismissAll();
    onOpenAuditTrail?.();
  };

  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          badge: 'bg-red-600 text-white',
        };
      case 'high':
        return {
          bg: 'bg-orange-50 border-orange-200',
          icon: 'text-orange-600',
          badge: 'bg-orange-600 text-white',
        };
      default:
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-600 text-white',
        };
    }
  };

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {visibleToasts.map((violation, index) => {
        const styles = getSeverityStyles(violation.severity);
        return (
          <div
            key={violation.id}
            className={`${styles.bg} border rounded-lg shadow-lg p-4 animate-slide-in-right`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className={`${styles.icon} flex-shrink-0`}>
                <Shield size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`${styles.badge} text-xs font-bold px-2 py-0.5 rounded`}>
                    {violation.severity?.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    Compliance Alert
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  {violation.rule_name || violation.ruleName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {violation.file_name || violation.fileName || 'Unknown file'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleViewDetails}
                    className="text-xs text-(--color-primary-600) hover:text-(--color-primary-700) font-medium flex items-center gap-1"
                  >
                    View Details
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(violation.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}

      {/* Dismiss all button when multiple toasts */}
      {visibleToasts.length > 1 && (
        <button
          onClick={handleDismissAll}
          className="text-xs text-gray-500 hover:text-gray-700 text-center py-1"
        >
          Dismiss all ({visibleToasts.length})
        </button>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ComplianceToast;
