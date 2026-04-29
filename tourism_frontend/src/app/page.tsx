'use client';

import React from 'react';
import { HeaderSearch } from '@/components/layout/HeaderSearch';
import { ArtisanProfileCard } from '@/components/feed/ArtisanProfileCard';
import { ExperienceCard } from '@/components/feed/ExperienceCard';
import { LiveWeavingHUD } from '@/components/feed/LiveWeavingHUD';
import DeepScanner from '@/components/feed/DeepScanner';
import { useRecommendation, FeedItem, Artisan, Experience } from '@/context/RecommendationEngineContext';

export default function Home() {
  const { recommendedItems, activeCategory } = useRecommendation();

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-emerald-800/5 blur-[100px] rounded-full"></div>
      </div>

      <HeaderSearch />
      
      {/* Deep Scanning Discovery Layer */}
      <div className="mb-6 px-1">
        <DeepScanner />
      </div>

      {/* Scrollable Feed Area */}
      <div className="space-y-8 mt-2">
        {/* Featured Artisan Dossier / Live HUD Section */}
        {(!activeCategory || activeCategory === 'Authentic Handloom') && (
          <div className="px-1 animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-emerald-500/20"></div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60">Featured Artisan Dossier</h3>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-emerald-500/20"></div>
              </div>
              <LiveWeavingHUD artisanId="a1" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">
            {activeCategory ? `Filtered: ${activeCategory}` : 'Command Center / Global Feed'}
          </h2>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30"></div>
          </div>
        </div>

        <div className="space-y-6">
          {recommendedItems.map((item: FeedItem, index: number) => {
            // Recommendation logic: Top items, active category matches, or verified artisans
            const isRecommended = index < 1 || 
                                (activeCategory !== null && item.category === activeCategory) ||
                                (item.type === 'artisan' && item.isVerified);
            
            if (item.type === 'artisan') {
              return (
                <ArtisanProfileCard 
                  key={`artisan-${item.id}`} 
                  artisan={item as Artisan} 
                  isRecommended={isRecommended}
                />
              );
            }
            
            return (
              <ExperienceCard 
                key={`experience-${item.id}`} 
                experience={item as Experience} 
                isRecommended={isRecommended}
              />
            );
          })}
        </div>

        {/* End of Stream Indicator */}
        <div className="py-10 flex flex-col items-center justify-center gap-4">
          <div className="h-[1px] w-12 bg-white/10"></div>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">End of Data Stream</p>
          <div className="h-[1px] w-12 bg-white/10"></div>
        </div>
      </div>
    </div>
  );
}
