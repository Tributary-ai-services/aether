import React from 'react';

const AgentCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    {/* Header section */}
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gray-200 rounded-lg"></div>
        <div>
          <div className="h-5 bg-gray-200 rounded w-28 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded-full w-16"></div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
      </div>
    </div>

    {/* Supported media section */}
    <div className="mb-3">
      <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
      <div className="flex gap-1 flex-wrap">
        <div className="h-6 bg-gray-200 rounded w-18"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
    </div>

    {/* Recent analysis section */}
    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
      <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </div>
    
    {/* Stats section */}
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
      </div>
      <div className="text-center">
        <div className="h-6 bg-gray-200 rounded w-10 mx-auto mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-14 mx-auto"></div>
      </div>
    </div>
  </div>
);

export default AgentCardSkeleton;