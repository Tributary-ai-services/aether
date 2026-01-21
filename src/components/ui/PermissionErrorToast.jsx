/**
 * PermissionErrorToast Component
 *
 * Displays permission denied (403) errors as a toast notification.
 * Listens for 'permissionError' events from aetherApi.
 */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  showPermissionError,
  clearPermissionError,
  selectPermissionError
} from '../../store/slices/uiSlice.js';
import { ShieldOff, X } from 'lucide-react';

const PermissionErrorToast = () => {
  const dispatch = useDispatch();
  const permissionError = useSelector(selectPermissionError);

  // Listen for permission error events from aetherApi
  useEffect(() => {
    const handlePermissionError = (event) => {
      dispatch(showPermissionError({
        message: event.detail.message,
        action: event.detail.action,
        resource: event.detail.resource
      }));
    };

    window.addEventListener('permissionError', handlePermissionError);

    return () => {
      window.removeEventListener('permissionError', handlePermissionError);
    };
  }, [dispatch]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (permissionError) {
      const timer = setTimeout(() => {
        dispatch(clearPermissionError());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [permissionError, dispatch]);

  if (!permissionError) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 p-2 bg-red-100 rounded-full">
            <ShieldOff size={20} className="text-red-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-red-800">
              Permission Denied
            </h4>
            <p className="mt-1 text-sm text-red-700">
              {permissionError.message}
            </p>
            {permissionError.resource && (
              <p className="mt-1 text-xs text-red-500">
                Resource: {permissionError.resource}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => dispatch(clearPermissionError())}
            className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} className="text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionErrorToast;
