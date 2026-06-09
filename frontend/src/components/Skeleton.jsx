import React from 'react';

const Skeleton = ({ className }) => {
  return (
    <div className={`animate-pulse bg-gray-700 rounded-md \${className}`}></div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-4">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20 rounded" />
      </div>
    ))}
  </div>
);

export default Skeleton;
