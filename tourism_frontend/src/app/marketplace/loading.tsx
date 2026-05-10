import React from 'react';
import { SkeletonBlock, SkeletonGrid } from '@/components/ui/skeletons';

export default function MarketplaceLoading() {
  return (
    <main className="relative min-h-screen bg-tactical-black pb-32">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-tactical-emerald/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[150px] rounded-full" />
      </div>
      <div className="max-w-screen-md mx-auto relative px-4 pt-24">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <SkeletonBlock className="h-7 w-48 rounded-lg" />
            <SkeletonBlock className="h-4 w-36 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-700 animate-pulse" />
            <SkeletonBlock className="h-4 w-24 rounded-full" />
          </div>
        </div>
        <SkeletonGrid count={4} />
      </div>
    </main>
  );
}
