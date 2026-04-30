'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export const TopBar = () => {
  const pathname = usePathname();
  const isSearch = pathname === '/search';

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-[20px] border-b border-spine-line px-4 py-[16px]">
      <div className="relative flex items-center justify-between max-w-screen-md mx-auto h-[28px]">
        <div className="w-8"></div> {/* Spacer for symmetry */}
        
        {/* Centered Logo: Spot-Lumina Aesthetic */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center group cursor-default select-none">
          <div className="flex items-center text-[28px] text-foreground tracking-[-0.02em]">
            <span className="font-sans font-normal lowercase">spot</span>
            <span className="text-tactical-emerald mx-[1.5px] relative flex items-center justify-center">
              <span className="relative z-10 font-bold transition-all duration-300">@</span>
              {/* @ Halo: Tightened contour for Atomic Core compression */}
              <span className={`absolute inset-[-2.5px] bg-tactical-emerald/15 blur-[2px] rounded-full transition-all duration-300 ease-in-out ${isSearch ? 'scale-110 opacity-100' : 'scale-100 opacity-60'}`}></span>
            </span>
            <span className="font-mono font-bold uppercase">NE</span>
          </div>
        </div>

        {/* Protocol Badge (Top-right utility) */}
        <div className="flex items-center justify-end w-8">
           <div className="w-5 h-5 rounded-full border border-tactical-emerald/30 flex items-center justify-center bg-tactical-emerald/5 group cursor-help transition-all hover:bg-tactical-emerald/10" title="Protocol: Terra">
             <div className="w-1.5 h-1.5 rounded-full bg-tactical-emerald animate-pulse"></div>
           </div>
        </div>
      </div>
    </header>
  );
};
