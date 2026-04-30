'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[50px] h-[26px]" />; // Placeholder
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`
        relative w-[50px] h-[26px] rounded-full transition-colors duration-400 ease-in-out
        ${isDark ? 'bg-[#1E293B]' : 'bg-[#E2E8F0]'}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-tactical-emerald
        group
      `}
      aria-label="Toggle Dark Mode"
    >
      {/* Thumb */}
      <div
        className={`
          absolute top-[2px] left-[2px] w-[22px] h-[22px] rounded-full 
          flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${isDark ? 'translate-x-[24px] bg-[#10B981]' : 'translate-x-0 bg-[#FFFFFF]'}
          shadow-sm
          group-active:scale-x-125 group-active:scale-y-75
        `}
      >
        {isDark ? (
          <Moon size={12} className="text-slate-900 fill-slate-900" />
        ) : (
          <Sun size={12} className="text-slate-400" />
        )}
      </div>
    </button>
  );
};
