'use client';

import React from 'react';
import { Heart, MessageCircle, Repeat2, Share, CheckCircle2 } from 'lucide-react';
import { ExperienceCarousel } from '../ui/ExperienceCarousel';

interface ArtisanProfileCardProps {
  artisan: {
    id: string;
    name: string;
    category: string;
    location: string;
    bio: string;
    images: string[];
    isVerified: boolean;
    rating: number;
  };
}

export const ArtisanProfileCard = ({ artisan }: ArtisanProfileCardProps) => {
  return (
    <div className="relative grid grid-cols-[70px_1fr] group">
      {/* The Spine Column */}
      <div className="flex flex-col items-center relative">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-spine-line shadow-sm z-10 bg-background">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${artisan.name}`} 
            alt={artisan.name} 
            className="w-full h-full object-cover" 
          />
        </div>
        {/* Visual Spine */}
        <div className="absolute left-[34.5px] top-[48px] bottom-0 w-[1px] bg-spine-line"></div>
      </div>

      {/* Content Column */}
      <div className="pb-8 pr-4">
        {/* Identity Header */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-semibold text-[15px] text-foreground leading-tight">
            {artisan.name}
          </span>
          {artisan.isVerified && (
            <CheckCircle2 size={14} className="text-blue-500 fill-blue-500 text-white" />
          )}
          <span className="text-slate-500 text-sm ml-1">·</span>
          <span className="text-slate-500 text-sm">2h</span>
        </div>

        {/* Bio / Text Content */}
        <p className="text-[15px] text-foreground/80 dark:text-slate-300 leading-normal mb-3">
          {artisan.bio}
        </p>

        {/* Experience Carousel */}
        <div className="mb-4">
          <ExperienceCarousel images={artisan.images} />
        </div>

        {/* Interaction Matrix (Action Bar) */}
        <div className="flex items-center justify-between max-w-[320px] text-slate-400">
          <button className="flex items-center gap-2 group/icon hover:text-tactical-green transition-colors">
            <Heart size={18} className="group-hover/icon:fill-tactical-green/20" />
            <span className="text-xs font-medium">24</span>
          </button>
          <button className="flex items-center gap-2 group/icon hover:text-tactical-green transition-colors">
            <MessageCircle size={18} />
            <span className="text-xs font-medium">12</span>
          </button>
          <button className="flex items-center gap-2 group/icon hover:text-tactical-green transition-colors">
            <Repeat2 size={18} />
            <span className="text-xs font-medium">6</span>
          </button>
          <button className="flex items-center gap-2 group/icon hover:text-tactical-green transition-colors">
            <Share size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};


