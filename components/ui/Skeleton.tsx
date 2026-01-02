/**
 * Loading Skeleton Components
 * Provides visual feedback during data fetching
 */

export function ServicesSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 bg-gray-200 rounded-lg w-full" />
      ))}
    </div>
  );
}

export function CapstersSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-gray-200 rounded-lg w-full" />
      ))}
    </div>
  );
}

export function BookingFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-64" />
        </div>
        
        {/* Form fields skeleton */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-12 bg-gray-200 rounded-lg w-full" />
          </div>
        ))}
        
        {/* Button skeleton */}
        <div className="h-14 bg-gray-200 rounded-lg w-full" />
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-6 space-y-3">
          <div className="flex justify-between">
            <div className="h-6 bg-gray-200 rounded w-32" />
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function LoyaltySkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="animate-pulse space-y-6">
        {/* Points card skeleton */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 space-y-4">
          <div className="h-6 bg-purple-200 rounded w-32" />
          <div className="h-12 bg-purple-200 rounded w-24" />
          <div className="h-4 bg-purple-200 rounded w-48" />
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BranchSelectorSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
      <div className="h-12 bg-gray-200 rounded-lg w-full" />
    </div>
  );
}
