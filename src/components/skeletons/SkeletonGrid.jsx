import React from 'react';

const SkeletonGrid = ({ SkeletonComponent, count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }, (_, index) => (
      <SkeletonComponent key={index} />
    ))}
  </div>
);

export default SkeletonGrid;