import React from 'react';

const LoadingWrapper = ({ 
  loading, 
  error, 
  children, 
  SkeletonComponent, 
  skeletonCount = 6,
  errorTitle = "Error loading data",
  loadingText = "Loading..."
}) => {
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">{errorTitle}</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return children;
};

export default LoadingWrapper;