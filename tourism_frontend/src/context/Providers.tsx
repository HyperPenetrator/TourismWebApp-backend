'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { RecommendationProvider } from './RecommendationEngineContext';
import { ArtisanCommsProvider } from './ArtisanCommsContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
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
