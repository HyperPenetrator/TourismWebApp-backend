'use client';

import React from 'react';
import { MarketplaceFeed } from '@/components/marketplace/MarketplaceFeed';
import { MarketplaceUpload } from '@/components/marketplace/MarketplaceUpload';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';

export default function MarketplacePage() {
  return (
    <main className="relative min-h-screen bg-tactical-black pb-32">
      <TopBar />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-tactical-emerald/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[150px] rounded-full"></div>
      </div>

      <div className="max-w-screen-md mx-auto relative px-4 pt-24">
        <MarketplaceFeed />
      </div>

      <MarketplaceUpload />
      
      <BottomNav activeZone="Marketplace" onZoneChange={() => {}} />
    </main>
  );
}
