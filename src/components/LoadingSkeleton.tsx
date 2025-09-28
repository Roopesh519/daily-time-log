'use client';

interface LoadingSkeletonProps {
  type?: 'card' | 'entry' | 'button' | 'text';
  className?: string;
}

export default function LoadingSkeleton({ type = 'card', className = '' }: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  switch (type) {
    case 'card':
      return (
        <div className={`${baseClasses} h-24 w-full ${className}`} />
      );
    case 'entry':
      return (
        <div className={`${baseClasses} h-16 w-full ${className}`} />
      );
    case 'button':
      return (
        <div className={`${baseClasses} h-10 w-24 ${className}`} />
      );
    case 'text':
      return (
        <div className={`${baseClasses} h-4 w-3/4 ${className}`} />
      );
    default:
      return <div className={`${baseClasses} h-4 w-full ${className}`} />;
  }
}

export function DayCardSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white">
      <div className="text-center">
        <div className="animate-pulse bg-gray-200 rounded h-4 w-8 mx-auto mb-2" />
        <div className="animate-pulse bg-gray-200 rounded h-6 w-6 mx-auto mb-2" />
        <div className="animate-pulse bg-gray-200 rounded h-3 w-16 mx-auto mb-1" />
        <div className="animate-pulse bg-gray-200 rounded h-3 w-12 mx-auto" />
      </div>
    </div>
  );
}

export function EntrySkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center mr-4">
        <div className="animate-pulse bg-gray-200 rounded-full w-8 h-8" />
      </div>
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <div className="animate-pulse bg-gray-200 rounded-full w-3 h-3 mr-3" />
          <div className="animate-pulse bg-gray-200 rounded h-4 w-32" />
          <div className="animate-pulse bg-gray-200 rounded h-5 w-16 ml-2" />
        </div>
        <div className="animate-pulse bg-gray-200 rounded h-3 w-48 mb-2" />
        <div className="flex items-center">
          <div className="animate-pulse bg-gray-200 rounded h-3 w-3 mr-1" />
          <div className="animate-pulse bg-gray-200 rounded h-3 w-24" />
        </div>
      </div>
      <div className="flex space-x-2">
        <div className="animate-pulse bg-gray-200 rounded h-6 w-12" />
        <div className="animate-pulse bg-gray-200 rounded h-6 w-16" />
      </div>
    </div>
  );
}
