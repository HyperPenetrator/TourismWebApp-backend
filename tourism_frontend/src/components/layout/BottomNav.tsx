'use client';

import React from 'react';
import { Home, Search, Plus, Bell, User } from 'lucide-react';

export const BottomNav = ({ 
  activeZone, 
  onZoneChange 
}: { 
  activeZone: string; 
  onZoneChange: (zone: string) => void 
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] bg-background/95 backdrop-blur-[20px] border-t border-spine-line px-2 pt-2 shadow-sm pb-[env(safe-area-inset-bottom,16px)]">
      <div className="max-w-screen-xl mx-auto flex items-center justify-around h-16">
        <NavItem 
          icon={<Home size={22} strokeWidth={2} />} 
          label="Home" 
          active={activeZone === 'Home'} 
          onClick={() => onZoneChange('Home')}
        />
        <NavItem 
          icon={<Search size={22} strokeWidth={2} />} 
          label="Search" 
          active={activeZone === 'Search'} 
          onClick={() => onZoneChange('Search')}
        />
        
        {/* Flush Center Action Node */}
        <NavItem 
          icon={<Plus size={24} strokeWidth={2.5} className="text-white bg-tactical-emerald rounded-lg p-1" />} 
          label="Post" 
          active={activeZone === 'Compose'} 
          onClick={() => onZoneChange('Compose')}
          isAction
        />

        <NavItem 
          icon={<Bell size={22} strokeWidth={2} />} 
          label="Notifs" 
          active={activeZone === 'Notifications'} 
          onClick={() => onZoneChange('Notifications')}
        />
        <NavItem 
          icon={<User size={22} strokeWidth={2} />} 
          label="Profile" 
          active={activeZone === 'Profile'} 
          onClick={() => onZoneChange('Profile')}
        />
      </div>
    </nav>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  isAction?: boolean;
}

const NavItem = ({ icon, label, active = false, onClick, isAction = false }: NavItemProps) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center flex-1 h-full relative group transition-colors duration-200`}
  >
    <div className={`transition-all duration-200 ${
      isAction 
        ? '' 
        : active ? 'text-tactical-emerald' : 'text-slate-400 group-hover:text-slate-600'
    }`}>
      {icon}
    </div>
    
    <span className={`text-[10px] font-semibold mt-1 transition-all duration-200 ${
      active ? 'text-tactical-emerald' : 'text-slate-400 group-hover:text-slate-600'
    }`}>
      {label}
    </span>
  </button>
);


