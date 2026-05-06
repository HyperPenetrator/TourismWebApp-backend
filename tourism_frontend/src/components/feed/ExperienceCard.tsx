'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Share, Clock, Tag, Zap, CheckCircle2 } from 'lucide-react';
import { ExperienceCarousel } from '../ui/ExperienceCarousel';

import { Experience } from '@/context/RecommendationEngineContext';

interface ExperienceCardProps {
  experience: Experience;
}

export const ExperienceCard = ({ experience }: ExperienceCardProps) => {
  const [bookingState, setBookingState] = useState<'idle' | 'scanning' | 'booked'>('idle');

  const handleBooking = async () => {
    if (bookingState !== 'idle') return;
    setBookingState('scanning');
    // Simulate scanning / API delay
    await new Promise((r) => setTimeout(r, 1800));
    setBookingState('booked');
  };

  return (
    <div className="relative grid grid-cols-[70px_1fr] group">
      {/* The Spine Column */}
      <div className="flex flex-col items-center relative">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-spine-line shadow-sm z-10 bg-background flex items-center justify-center">
          <div className="bg-tactical-emerald/10 w-full h-full flex items-center justify-center">
            <Tag size={20} className="text-tactical-emerald" />
          </div>
        </div>
        {/* Visual Spine */}
        <div className="absolute left-[34.5px] top-[48px] bottom-0 w-[1px] bg-spine-line"></div>
      </div>

      {/* Content Column */}
      <div className="pb-8 pr-4">
        {/* Identity Header */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-semibold text-[15px] text-foreground leading-tight">
            NE Explorer
          </span>
          <span className="text-slate-500 text-sm ml-1">·</span>
          <span className="text-slate-500 text-sm">4h</span>
        </div>

        <div className="mb-2">
           <h3 className="text-[17px] font-bold text-foreground leading-tight mb-1">{experience.title}</h3>
           <div className="flex items-center gap-3 text-slate-500 text-[12px]">
             <div className="flex items-center gap-1">
               <Clock size={12} className="text-tactical-emerald" />
               <span>{experience.duration}</span>
             </div>
             <div className="font-bold text-tactical-emerald">₹{experience.price}</div>
           </div>
        </div>

        {/* Description */}
        <p className="text-[15px] text-foreground/80 dark:text-slate-300 leading-normal mb-3">
          {experience.description}
        </p>

        {/* Experience Carousel */}
        <div className="mb-4">
          <ExperienceCarousel images={experience.images} />
        </div>

        {/* Initiate Booking — with tactical scanning animation */}
        <button
          onClick={handleBooking}
          disabled={bookingState !== 'idle'}
          className={`relative w-full mb-4 overflow-hidden rounded-xl py-2.5 text-sm font-bold tracking-wide transition-all duration-300 border flex items-center justify-center gap-2 ${
            bookingState === 'booked'
              ? 'bg-tactical-emerald/10 border-tactical-emerald text-tactical-emerald cursor-default'
              : bookingState === 'scanning'
              ? 'bg-slate-900 border-tactical-emerald/50 text-tactical-emerald/70 cursor-wait'
              : 'bg-background border-slate-200 dark:border-slate-800 text-foreground hover:border-tactical-emerald/50 hover:bg-tactical-emerald/5'
          }`}
        >
          {/* Scanning sweep line */}
          {bookingState === 'scanning' && (
            <span
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
            >
              <span className="absolute top-0 left-0 h-full w-[2px] bg-tactical-emerald/60 shadow-[0_0_8px_2px_rgba(16,185,129,0.5)] animate-[scanline_1.2s_linear_infinite]" />
            </span>
          )}
          {bookingState === 'booked' ? (
            <><CheckCircle2 size={15} /> Deployment Confirmed</>
          ) : bookingState === 'scanning' ? (
            <><Zap size={15} className="animate-pulse" /> Scanning Target...</>
          ) : (
            <><Zap size={15} /> Initiate Booking</>
          )}
        </button>

        {/* Interaction Matrix (Action Bar) */}
        <div className="flex items-center justify-between max-w-[320px] text-slate-400">
          <button className="flex items-center gap-2 group/icon hover:text-tactical-green transition-colors">
            <Heart size={18} className="group-hover/icon:fill-tactical-green/20" />
            <span className="text-xs font-medium">42</span>
          </button>
          <button className="flex items-center gap-2 group/icon hover:text-tactical-green transition-colors">
            <MessageCircle size={18} />
            <span className="text-xs font-medium">8</span>
          </button>
          <button className="flex items-center gap-2 group/icon hover:text-tactical-green transition-colors">
            <Repeat2 size={18} />
            <span className="text-xs font-medium">15</span>
          </button>
          <button className="flex items-center gap-2 group/icon hover:text-tactical-green transition-colors">
            <Share size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
