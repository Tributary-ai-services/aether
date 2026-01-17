import React from 'react';

const MetricCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    {/* Header with icon */}
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="w-8 h-8 bg-gray-200 rounded"></div>
    </div>
    
    {/* Main metric */}
    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
    
    {/* Change indicator */}
    <div className="flex items-center gap-2">
      <div className="h-3 bg-gray-200 rounded w-3"></div>
      <div className="h-3 bg-gray-200 rounded w-12"></div>
    </div>
  </div>
);

export default MetricCardSkeleton;