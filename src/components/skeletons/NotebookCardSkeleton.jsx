import React from 'react';

const NotebookCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    {/* Header section */}
    <div className="flex justify-between items-start mb-4">
      <div className="h-5 bg-gray-200 rounded w-40"></div>
      <div className="flex items-center gap-2">
        <div className="h-4 bg-gray-200 rounded w-8"></div>
        <div className="h-4 bg-gray-200 rounded w-4"></div>
        <div className="h-4 bg-gray-200 rounded w-4"></div>
      </div>
    </div>

    {/* Media types section */}
    <div className="flex gap-1 mb-3">
      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      <div className="h-6 bg-gray-200 rounded-full w-18"></div>
    </div>

    {/* Latest processing section */}
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <div className="h-3 bg-gray-200 rounded w-28 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </div>
    
    {/* Stats section */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="text-center p-3 bg-blue-50 rounded-lg">
        <div className="h-8 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
      </div>
      <div className="text-center p-3 bg-green-50 rounded-lg">
        <div className="h-8 bg-gray-200 rounded w-6 mx-auto mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
      </div>
    </div>
    
    {/* Footer section */}
    <div className="flex justify-between items-center">
      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      <div className="h-4 bg-gray-200 rounded w-12"></div>
    </div>
  </div>
);

export default NotebookCardSkeleton;