import React from 'react';

const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
    {/* Table header */}
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, index) => (
          <div key={index} className="h-4 bg-gray-200 rounded w-20"></div>
        ))}
      </div>
    </div>
    
    {/* Table rows */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TableSkeleton;