"use client";

import React from "react";
import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

export const SkeletonBlock: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div
    className={`relative overflow-hidden bg-white/5 dark:bg-slate-800/20 animate-pulse ${className}`}
    aria-busy="true"
    aria-label="Loading content"
  >
    <div className="absolute inset-0 skeleton-shimmer" />
  </div>
);

export const SkeletonText: React.FC<SkeletonProps & { lines?: number }> = ({ 
  className = "", 
  lines = 3 
}) => (
  <div className={`space-y-2 ${className}`} aria-busy="true">
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBlock
        key={i}
        className={`h-3 rounded-md ${i === lines - 1 && lines > 1 ? "w-3/5" : "w-full"}`}
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<SkeletonProps & { rounded?: "full" | "xl" }> = ({ 
  className = "", 
  rounded = "full" 
}) => (
  <SkeletonBlock className={`${rounded === "full" ? "rounded-full" : "rounded-xl"} ${className}`} />
);

export const SkeletonCard: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`glass-card p-4 space-y-4 ${className}`} aria-busy="true">
    <SkeletonBlock className="aspect-square rounded-xl w-full" />
    <div className="space-y-2">
      <SkeletonBlock className="h-4 w-full rounded-md" />
      <SkeletonBlock className="h-4 w-3/4 rounded-md" />
    </div>
    <SkeletonBlock className="h-6 w-20 rounded-lg" />
  </div>
);

export const SkeletonGrid: React.FC<SkeletonProps & { count?: number; grid?: boolean }> = ({ 
  className = "", 
  count = 4,
  grid = true
}) => (
  <div className={`${grid ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"} ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonList: React.FC<SkeletonProps & { count?: number; variant?: "vertical" | "horizontal" }> = ({ 
  className = "", 
  count = 5,
  variant = "vertical"
}) => (
  <div className={`space-y-4 ${className}`} aria-busy="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`flex items-center gap-4 ${variant === "horizontal" ? "glass-card p-3" : ""}`}>
        <SkeletonAvatar className="w-10 h-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-3/4 rounded-md" />
          <SkeletonBlock className="h-2 w-1/4 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonHUD: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`glass-card p-6 space-y-6 ${className}`} aria-busy="true">
    <div className="flex items-center justify-between">
      <SkeletonBlock className="h-5 w-32 rounded-lg" />
      <SkeletonBlock className="h-5 w-24 rounded-lg" />
    </div>
    
    <SkeletonBlock className="aspect-video w-full rounded-2xl" />
    
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-48 rounded-md" />
          <SkeletonBlock className="h-3 w-full rounded-md" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-40 rounded-md" />
          <SkeletonBlock className="h-3 w-1/2 rounded-md" />
        </div>
      </div>
    </div>
    
    <SkeletonBlock className="h-2 w-full rounded-full" />
  </div>
);
