"use client";

import { Loader2 } from "lucide-react";

export function DashboardLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

// Skeleton loaders for specific sections
export function CaseStudyListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function ProjectListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
}
