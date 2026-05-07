'use client';

import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { HeaderSearch } from '@/components/layout/HeaderSearch';
import { DynamicFilterStrip } from '@/components/layout/DynamicFilterStrip';
import { BottomNav } from '@/components/layout/BottomNav';
import { ArtisanProfileCard } from '@/components/feed/ArtisanProfileCard';
import { ExperienceCard } from '@/components/feed/ExperienceCard';
import { ProfileView } from '@/components/profile/ProfileView';
import { ComposeView } from '@/components/feed/ComposeView';
import { LiveWeavingHUD } from '@/components/feed/LiveWeavingHUD';
import DeepScanner from '@/components/feed/DeepScanner';
import { MarketplaceFeed } from '@/components/marketplace/MarketplaceFeed';
import { MarketplaceUpload } from '@/components/marketplace/MarketplaceUpload';
import { MyUploads } from '@/components/marketplace/MyUploads';
import { NotificationsHUD } from '@/components/notifications/NotificationsHUD';
import { useRecommendationEngine, Artisan, Experience } from '@/context/RecommendationEngineContext';

export default function Home() {
  const { recommendedItems, activeCategory } = useRecommendationEngine();
  const [activeZone, setActiveZone] = React.useState('Home');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [marketplaceTab, setMarketplaceTab] = React.useState<'feed' | 'my-uploads'>('feed');

  React.useEffect(() => {
    if (activeZone !== 'Marketplace' && activeZone !== 'Search') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery('');
    }
  }, [activeZone]);

  return (
    <main className="relative min-h-[100dvh] bg-background pb-[calc(10rem+env(safe-area-inset-bottom))]">
      <TopBar />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-900/10 dark:bg-emerald-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-emerald-800/5 dark:bg-emerald-400/5 blur-[100px] rounded-full"></div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-screen-md mx-auto relative min-h-[60vh] px-4">
        {activeZone === 'Home' && (
          <>
            <HeaderSearch query={searchQuery} onQueryChange={setSearchQuery} />
            <div className="mb-6 px-1">
              <DeepScanner />
            </div>
            <DynamicFilterStrip />
          </>
        )}
        
        <div 
          key={activeZone}
          className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-forwards"
        >
          {activeZone === 'Home' && (
            <div className="flex items-center justify-between px-2 pt-2 mb-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-tactical-emerald">
                {activeCategory ? `Filtered: ${activeCategory}` : 'Terra Command / Global Feed'}
              </h2>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-tactical-emerald animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
              </div>
            </div>
          )}

          {/* Featured Artisan Dossier / Live HUD Section */}
          {activeZone === 'Home' && (!activeCategory || activeCategory === 'Authentic Handloom') && (
            <div className="px-1 animate-in fade-in slide-in-from-top-4 duration-1000 delay-300 mb-8">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-emerald-500/20"></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60">Featured Artisan Dossier</h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-emerald-500/20"></div>
                </div>
                <LiveWeavingHUD artisanId="a1" />
              </div>
            </div>
          )}

          <div className="flex flex-col">
            {activeZone === 'Home' ? (
              recommendedItems.map((item) => {
                if (item.type === 'artisan') {
                  return (
                    <ArtisanProfileCard 
                      key={item.id} 
                      artisan={item} 
                    />
                  );
                }
                
                return (
                  <ExperienceCard 
                    key={item.id} 
                    experience={item as Experience} 
                  />
                );
              })
            ) : activeZone === 'Marketplace' ? (
              <div className="flex flex-col relative pb-20">
                {/* Marketplace Sub-tab Toggle */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setMarketplaceTab('feed')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      marketplaceTab === 'feed'
                        ? 'bg-tactical-emerald text-white border-tactical-emerald'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:border-tactical-emerald/40'
                    }`}
                  >
                    Live Feed
                  </button>
                  <button
                    onClick={() => setMarketplaceTab('my-uploads')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      marketplaceTab === 'my-uploads'
                        ? 'bg-tactical-emerald text-white border-tactical-emerald'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:border-tactical-emerald/40'
                    }`}
                  >
                    My Uploads
                  </button>
                </div>
                {marketplaceTab === 'feed' ? <MarketplaceFeed /> : <MyUploads />}
                <MarketplaceUpload />
              </div>
            ) : activeZone === 'Profile' ? (
              <ProfileView />
            ) : activeZone === 'Compose' ? (
              <ComposeView onPostComplete={() => setActiveZone('Home')} />
            ) : activeZone === 'Notifications' ? (
              <NotificationsHUD />
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
