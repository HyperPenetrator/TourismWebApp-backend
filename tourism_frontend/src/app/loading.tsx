import React from 'react';
import { SkeletonBlock } from '@/components/ui/skeletons';

export default function RootLoading() {
  return (
    <div className="fixed inset-0 bg-tactical-black flex flex-col items-center justify-center gap-6 z-[100]">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center skeleton-shimmer overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-tactical-emerald/20 animate-pulse" />
        </div>
        <div className="absolute -inset-4 bg-tactical-emerald/5 blur-2xl rounded-full animate-pulse" />
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <SkeletonBlock className="h-4 w-48 rounded-md" />
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">
          Synchronizing Neural Link
        </p>
      </div>
      
      {/* HUD-style corners */}
      <div className="fixed top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-white/10" />
      <div className="fixed top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-white/10" />
      <div className="fixed bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-white/10" />
      <div className="fixed bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-white/10" />
    </div>
  );
}
