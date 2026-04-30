'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share, CheckCircle2, ShieldAlert, Sparkles, X } from 'lucide-react';
import { ExperienceCarousel } from '../ui/ExperienceCarousel';

import { Artisan } from '@/context/RecommendationEngineContext';

interface ArtisanProfileCardProps {
  artisan: Artisan;
}

export const ArtisanProfileCard = ({ artisan }: ArtisanProfileCardProps) => {
  const [isArchived, setIsArchived] = useState(false);
  const [hasDeployedInterest, setHasDeployedInterest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGesture = async (action: 'SWIPE_RIGHT' | 'SWIPE_LEFT') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mcp/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'user_42',
          target_id: artisan.id,
          action: action,
          category: artisan.type === 'artisan' ? 'Handloom & Textile' : 'Cultural Heritage'
        })
      });
      
      const data = await response.json();
      console.log('MCP Engine Response:', data);

      if (action === 'SWIPE_RIGHT') {
        setHasDeployedInterest(true);
      } else {
        setIsArchived(true);
      }
    } catch (error) {
      console.error('Failed to communicate with MCP engine', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isArchived) {
    return (
      <div className="relative grid grid-cols-[70px_1fr] group mb-4 opacity-50">
        <div className="flex flex-col items-center relative">
          <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            <ShieldAlert size={20} className="text-slate-400" />
          </div>
          <div className="absolute left-[34.5px] top-[48px] bottom-0 w-[1px] bg-spine-line"></div>
        </div>
        <div className="pb-8 pr-4 flex items-center">
          <p className="text-sm font-mono text-slate-500 uppercase tracking-widest">Target Archived</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative grid grid-cols-[70px_1fr] group">
      {/* The Spine Column */}
      <div className="flex flex-col items-center relative">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-spine-line shadow-sm z-10 bg-background relative">
          <Image 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${artisan.name}`} 
            alt={artisan.name} 
            fill
            sizes="48px"
            className="object-cover" 
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

        {/* Tactical Action Bar */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleGesture('SWIPE_RIGHT')}
            disabled={hasDeployedInterest || isLoading}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition-all ${
              hasDeployedInterest 
                ? 'bg-tactical-emerald/10 border-tactical-emerald/30 text-tactical-emerald' 
                : 'bg-background border-slate-200 dark:border-slate-800 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            {hasDeployedInterest ? (
              <><Sparkles size={16} /> <span className="text-sm font-semibold tracking-wide">Interest Deployed</span></>
            ) : (
              <><Heart size={16} /> <span className="text-sm font-semibold">Deploy Interest</span></>
            )}
          </button>
          
          <button 
            onClick={() => handleGesture('SWIPE_LEFT')}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
            title="Archive Target"
          >
            <X size={20} />
          </button>

          <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-tactical-blue transition-all">
            <Share size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};


