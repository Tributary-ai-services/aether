import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';

const AuthLoadingIndicator = ({ children, showRefreshIndicator = true, showLoadingIndicator = true }) => {
  const { isLoading, isRefreshing, authError } = useAuth();

  // Show loading state
  if (showLoadingIndicator && isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-(--color-primary-600)"></div>
            <span className="text-gray-700">Authenticating...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      
      {/* Token refresh indicator */}
      {showRefreshIndicator && isRefreshing && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-(--color-primary-600) text-(--color-primary-contrast) px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-opacity-20 border-t-white"></div>
            <span className="text-sm">Refreshing session...</span>
          </div>
        </div>
      )}
      
      {/* Auth error indicator */}
      {authError && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Authentication error</span>
          </div>
        </div>
      )}
    </>
  );
};

// Compact version for specific components
export const AuthRefreshIndicator = () => {
  const { isRefreshing } = useAuth();

  if (!isRefreshing) return null;

  return (
    <div className="inline-flex items-center space-x-2 text-(--color-primary-600) text-sm">
      <div className="animate-spin rounded-full h-3 w-3 border border-(--color-primary-600) border-opacity-20 border-t-(--color-primary-600)"></div>
      <span>Refreshing...</span>
    </div>
  );
};

// Error display component
export const AuthErrorDisplay = ({ className = "" }) => {
  const { authError, clearAuthError } = useAuth();

  if (!authError) return null;

  const errorMessages = {
    refresh_token_expired: 'Your session has expired. Please log in again.',
    invalid_refresh_token: 'Invalid session. Please log in again.',
    refresh_failed: 'Failed to refresh session. Please log in again.',
    refresh_error: 'Session refresh error. Please try again.',
    logout_failed: 'Logout failed. Please try again.',
    manual_refresh_failed: 'Manual refresh failed. Please try again.',
    unknown: 'Authentication error occurred. Please try again.',
  };

  return (
    <div className={`bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">
            {errorMessages[authError] || errorMessages.unknown}
          </span>
        </div>
        <button
          onClick={clearAuthError}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default AuthLoadingIndicator;