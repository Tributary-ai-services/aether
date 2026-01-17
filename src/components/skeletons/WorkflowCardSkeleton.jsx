import React from 'react';

const WorkflowCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-gray-200 rounded-lg"></div>
        <div>
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        <div className="h-4 bg-gray-200 rounded w-8"></div>
      </div>
    </div>
  </div>
);

export default WorkflowCardSkeleton;