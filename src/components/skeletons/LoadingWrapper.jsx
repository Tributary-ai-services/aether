import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const LoadingWrapper = ({
  loading,
  error,
  children,
  SkeletonComponent,
  skeletonCount = 6,
  errorTitle = "Error loading data",
  loadingText = "Loading...",
  showErrorAsBanner = true  // New prop: show error as dismissible banner while showing children
}) => {
  const [errorDismissed, setErrorDismissed] = useState(false);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
          <span className="text-gray-600">{loadingText}</span>
        </div>
        {SkeletonComponent && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: skeletonCount }, (_, index) => (
              <SkeletonComponent key={index} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show error as a dismissible banner while still showing children
  // This allows users to see existing data even when there's an error
  return (
    <div>
      {error && !errorDismissed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h3 className="text-red-800 font-medium">{errorTitle}</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorDismissed(true)}
            className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-100 transition-colors"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {children}
    </div>
  );
};

export default LoadingWrapper;