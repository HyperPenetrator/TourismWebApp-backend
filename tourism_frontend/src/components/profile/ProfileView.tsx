'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Settings, Edit, User, MapPin, Shield, Star, LogOut } from 'lucide-react';

export const ProfileView = () => {
  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-tactical-emerald/20 to-tactical-blue/20 border border-tactical-emerald/30 flex items-center justify-center relative overflow-hidden">
            <User size={40} className="text-tactical-emerald" />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-tactical-emerald border-4 border-background rounded-full"></div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">Command_User_01</h1>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
              <MapPin size={12} />
              <span>Assam, India</span>
              <span className="mx-1">•</span>
              <span className="text-tactical-emerald">Explorer Class</span>
            </div>
          </div>
        </div>
        
        {/* Theme Toggle & Settings */}
        <div className="flex flex-col items-end gap-4">
          <ThemeToggle />
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <Edit size={14} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Content / Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-lg font-black text-foreground">12</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Discoveries</span>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-lg font-black text-foreground">840</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">XP Points</span>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-lg font-black text-foreground">4.9</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rating</span>
        </div>
      </div>

      {/* Menu Options */}
      <div className="space-y-3">
        <ProfileMenuItem icon={<Star size={18} />} label="Saved Experiences" count="5" />
        <ProfileMenuItem icon={<Shield size={18} />} label="Security Protocol" />
        <ProfileMenuItem icon={<Settings size={18} />} label="Interface Settings" />
        <ProfileMenuItem icon={<LogOut size={18} />} label="Decommission Session" isDanger />
      </div>

      {/* Decorative Spine Line (Matches the design language) */}
      <div className="mt-12 py-8 flex flex-col items-center justify-center gap-4 border-t border-spine-line">
        <div className="w-1.5 h-1.5 rounded-full bg-tactical-emerald/30 animate-pulse"></div>
        <p className="text-[9px] font-mono text-slate-400 uppercase tracking-[0.4em]">Terra Command // Profile Synchronized</p>
      </div>
    </div>
  );
};

const ProfileMenuItem = ({ 
  icon, 
  label, 
  count, 
  isDanger = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  count?: string;
  isDanger?: boolean;
}) => (
  <button className={`
    w-full flex items-center justify-between p-5 rounded-[24px] transition-all duration-300 group
    ${isDanger 
      ? 'border border-red-500/10 bg-red-500/[0.02] text-red-500 hover:bg-red-500/[0.05]' 
      : `bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] text-[#1A1A1A] 
         hover:shadow-[0_15px_50px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5
         dark:bg-slate-900/50 dark:border dark:border-slate-800 dark:text-foreground dark:hover:bg-slate-900 dark:hover:shadow-none dark:hover:translate-y-0`}
  `}>
    <div className="flex items-center gap-4">
      <div className={`
        ${isDanger ? 'text-red-500' : 'text-tactical-emerald dark:text-slate-500 transition-all duration-300 group-hover:scale-110'}
        ${!isDanger && 'drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]'}
      `}>
        {React.cloneElement(icon as React.ReactElement, { size: 22, strokeWidth: 2.5 })}
      </div>
      <span className="text-[16px] font-bold tracking-tight">{label}</span>
    </div>
    {count && (
      <div className={`
        w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-bold
        ${isDanger 
          ? 'bg-red-500/10 text-red-500' 
          : 'bg-[#10B981] text-white shadow-[0_4px_10px_rgba(16,185,129,0.3)]'}
      `}>
        {count}
      </div>
    )}
  </button>
);
