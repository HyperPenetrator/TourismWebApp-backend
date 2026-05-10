import React from 'react';
import { SkeletonBlock, SkeletonList } from '@/components/ui/skeletons';

export default function ArtisanCommsLoading() {
  return (
    <main className="relative h-screen bg-tactical-black overflow-hidden flex flex-col">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
        <SkeletonBlock className="h-6 w-40 rounded-lg" />
        <SkeletonBlock className="h-8 w-8 rounded-full" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-80 border-r border-white/5 flex flex-col bg-black/20">
          <div className="p-4 border-b border-white/5">
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
          <div className="p-4">
            <SkeletonList count={6} />
          </div>
        </div>

        {/* Chat Area Skeleton */}
        <div className="flex-1 flex flex-col bg-tactical-black/40">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-32 rounded-md" />
                <SkeletonBlock className="h-3 w-20 rounded-md" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6 space-y-8">
            <div className="flex flex-col gap-4">
              <SkeletonBlock className="h-16 w-1/2 rounded-2xl rounded-tl-none" />
              <SkeletonBlock className="h-12 w-1/3 rounded-2xl rounded-tl-none" />
            </div>
            <div className="flex flex-col items-end gap-4">
              <SkeletonBlock className="h-14 w-2/5 rounded-2xl rounded-tr-none" />
            </div>
            <div className="flex flex-col gap-4">
              <SkeletonBlock className="h-20 w-3/5 rounded-2xl rounded-tl-none" />
            </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-black/20">
            <SkeletonBlock className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
