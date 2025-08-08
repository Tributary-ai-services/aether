import React from 'react';

const AnalyticsCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <div className="h-5 bg-gray-200 rounded w-32"></div>
      <div className="h-4 bg-gray-200 rounded w-4"></div>
    </div>
    
    {/* Chart area */}
    <div className="h-48 bg-gray-100 rounded-lg mb-4"></div>
    
    {/* Stats */}
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
      </div>
      <div className="text-center">
        <div className="h-6 bg-gray-200 rounded w-10 mx-auto mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-14 mx-auto"></div>
      </div>
      <div className="text-center">
        <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
      </div>
    </div>
  </div>
);

export default AnalyticsCardSkeleton;