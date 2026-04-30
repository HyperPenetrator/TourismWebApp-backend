'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { RecommendationProvider } from './RecommendationEngineContext';
import { ArtisanCommsProvider } from './ArtisanCommsContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      disableTransitionOnChange
    >
      <AuthProvider>
        <RecommendationProvider>
          <ArtisanCommsProvider>
            {children}
          </ArtisanCommsProvider>
        </RecommendationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
