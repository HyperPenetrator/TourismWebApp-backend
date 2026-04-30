'use client';

import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { HeaderSearch } from '@/components/layout/HeaderSearch';
import { DynamicFilterStrip } from '@/components/layout/DynamicFilterStrip';
import { BottomNav } from '@/components/layout/BottomNav';
import { ArtisanProfileCard } from '@/components/feed/ArtisanProfileCard';
import { ExperienceCard } from '@/components/feed/ExperienceCard';
import { ProfileView } from '@/components/profile/ProfileView';
import { useRecommendation } from '@/context/RecommendationEngineContext';

export default function Home() {
  const { recommendedItems, activeCategory } = useRecommendation();
  const [activeZone, setActiveZone] = React.useState('Home');
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (activeZone !== 'Search') {
      setSearchQuery('');
    }
  }, [activeZone]);

  return (
    <main className="relative min-h-screen bg-background pb-32">
      <TopBar />
      
      {/* Main Content Area */}
      <div className="max-w-screen-md mx-auto relative min-h-[60vh] px-4">
        {activeZone === 'Home' && <DynamicFilterStrip />}
        
        <div 
          key={activeZone}
          className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-forwards"
        >
          <div className="flex items-center justify-between px-2 pt-2 mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-tactical-emerald">
              {activeZone === 'Home' 
                ? (activeCategory ? `Filtered: ${activeCategory}` : 'Terra Command / Global Feed')
                : `Zone: ${activeZone}`}
            </h2>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-tactical-emerald animate-pulse"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
            </div>
          </div>

          <div className="flex flex-col">
            {activeZone === 'Home' ? (
              recommendedItems.map((item, index) => {
                if (item.type === 'artisan') {
                  return (
                    <ArtisanProfileCard 
                      key={`artisan-${item.id}`} 
                      artisan={item} 
                    />
                  );
                }
                
                return (
                  <ExperienceCard 
                    key={`experience-${item.id}`} 
                    experience={item} 
                  />
                );
              })
            ) : activeZone === 'Search' ? (
              <div className="flex flex-col">
                <HeaderSearch query={searchQuery} onQueryChange={setSearchQuery} />
                <div className="mt-4 mb-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Suggested Artisans</h3>
                  <div className="flex flex-col gap-4">
                    {recommendedItems.filter(i => i.type === 'artisan').slice(0, 2).map((item) => (
                      <ArtisanProfileCard key={`suggested-${item.id}`} artisan={item} />
                    ))}
                  </div>
                </div>
                <div className="mt-6 mb-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Trending Experiences</h3>
                  <div className="flex flex-col gap-4">
                    {recommendedItems.filter(i => i.type === 'experience').slice(0, 2).map((item) => (
                      <ExperienceCard key={`trending-${item.id}`} experience={item} />
                    ))}
                  </div>
                </div>
              </div>
            ) : activeZone === 'Profile' ? (
              <ProfileView />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-tactical-emerald/10 animate-pulse"></div>
                </div>
                <p className="text-sm font-medium">Synchronizing {activeZone} Data...</p>
              </div>
            )}
          </div>

          {activeZone === 'Home' && (
            <div className="py-10 flex flex-col items-center justify-center gap-4">
              <div className="h-[1px] w-12 bg-slate-200"></div>
              <p className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">End of Protocol Stream</p>
              <div className="h-[1px] w-12 bg-slate-200"></div>
            </div>
          )}
        </div>
      </div>

      <BottomNav activeZone={activeZone} onZoneChange={setActiveZone} />
    </main>
  );
}
