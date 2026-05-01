'use client';

import React, { useEffect, useRef } from 'react';
import { Activity, Clock, Layers, Radio, ShieldAlert } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { HUDData } from '@/lib/types';

export const LiveWeavingHUD = ({ artisanId = 'a1' }: { artisanId?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { data, isConnected } = useWebSocket<HUDData>(
    `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001'}/ws/weaving/${artisanId}`,
    {
      onConnect: () => console.log('HUD: Connection established'),
      onDisconnect: () => console.log('HUD: Connection closed. Ensure backend is running.'),
    }
  );

  // Handle auto-playing video simulation
  useEffect(() => {
    if (videoRef.current) {
      // Explicitly mute to satisfy browser autoplay policies
      videoRef.current.muted = true;
      videoRef.current.play().catch((error) => {
        if (error.name !== 'NotSupportedError') {
          console.warn('HUD: Autoplay blocked or failed:', error);
        }
      });
    }
  }, []);

  const progressValue = data ? parseFloat(data.metrics.current_progress.replace('%', '')) : 0;

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden border border-emerald-500/30 bg-black shadow-2xl group">
      {/* Video Background */}
      <video
        ref={videoRef}
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
        className="w-full h-full object-cover opacity-60 grayscale-[0.2]"
        loop
        muted
        playsInline
        autoPlay
      />

      {/* HUD OVERLAY LAYER */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Top HUD Row */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-emerald-500/40 bg-black/40 ${isConnected ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-gray-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                Live Broadcast
              </span>
            </div>
            <div className="flex items-center gap-2 px-2 py-0.5 text-[8px] font-mono text-emerald-500/70 uppercase tracking-tighter">
              <Radio size={8} /> 
              Stream ID: 0xNE-{artisanId.toUpperCase()}
            </div>
          </div>

          <div className="glass-panel px-4 py-2 rounded-xl flex flex-col items-end border-white/10 bg-black/20">
            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">
              Network Status
            </span>
            <div className="flex gap-1 items-end h-3">
              <div className="w-1 h-1 bg-emerald-500/80"></div>
              <div className="w-1 h-2 bg-emerald-500/80"></div>
              <div className="w-1 h-3 bg-emerald-500"></div>
              <div className="w-1 h-2.5 bg-emerald-500"></div>
            </div>
          </div>
        </div>

        {/* Center Tactical Elements */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Crosshair corners */}
          <div className="absolute top-1/4 left-1/4 w-8 h-8 border-t border-l border-emerald-500/20" />
          <div className="absolute top-1/4 right-1/4 w-8 h-8 border-t border-r border-emerald-500/20" />
          <div className="absolute bottom-1/4 left-1/4 w-8 h-8 border-b border-l border-emerald-500/20" />
          <div className="absolute bottom-1/4 right-1/4 w-8 h-8 border-b border-r border-emerald-500/20" />
        </div>

        {/* Data Readouts Sidebar */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <HUDReadout 
            icon={<Layers size={14} className="text-emerald-500" />} 
            label="Weave Complexity" 
            value={data?.metrics.weave_complexity || 'Analyzing...'} 
          />
          <HUDReadout 
            icon={<Activity size={14} className="text-emerald-500" />} 
            label="Pattern Integrity" 
            value={data?.metrics.pattern_integrity || '0.0%'} 
          />
        </div>

        {/* Bottom Metrics HUD */}
        <div className="flex flex-col gap-4">
          {/* Active Alerts */}
          {data?.alerts && data.alerts.length > 0 && (
            <div className="self-center flex items-center gap-3 px-4 py-2 glass-panel border-amber-500/50 bg-amber-950/20 rounded-xl animate-bounce">
              <ShieldAlert size={16} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wide">
                {data.alerts[0]}
              </span>
            </div>
          )}

          <div className="glass-panel p-4 rounded-2xl border-emerald-500/20 bg-black/40 backdrop-blur-xl hud-element">
            <div className="flex justify-between items-end mb-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                    Est. Completion
                  </span>
                </div>
                <div className="text-2xl font-black text-white tabular-nums tracking-tighter">
                  {data?.metrics.estimated_completion_time || '0.0 hours'}
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest mb-1">
                  Active Progress
                </span>
                <div className="text-xl font-bold text-emerald-400 tabular-nums">
                  {data?.metrics.current_progress || '0.00%'}
                </div>
              </div>
            </div>

            {/* Tactical Progress Bar */}
            <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                style={{ width: `${progressValue}%` }}
              />
              {/* Progress markers */}
              {[25, 50, 75].map(marker => (
                <div 
                  key={marker} 
                  className="absolute top-0 h-full w-[1px] bg-white/10" 
                  style={{ left: `${marker}%` }} 
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Interaction Layer (Overlay that reveals on hover) */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-sm pointer-events-auto cursor-pointer">
        <button className="px-8 py-3 bg-emerald-500 text-black font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-transform">
          Enter Dossier
        </button>
      </div>
    </div>
  );
};

const HUDReadout = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-center gap-3 glass-panel p-3 rounded-2xl border-white/5 bg-black/40 group/readout hover:border-emerald-500/30 transition-colors">
    <div className="p-2 rounded-lg bg-emerald-500/10">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">
        {label}
      </span>
      <span className="text-[11px] font-bold text-white group-hover/readout:text-emerald-400 transition-colors">
        {value}
      </span>
    </div>
  </div>
);
