"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, ShieldCheck, Zap, AlertTriangle } from "lucide-react";
import { AnalysisEngine, AnalysisResult } from "@/lib/AnalysisEngine";

export default function DeepScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResult(null);
        startScan();
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    try {
      const analysis = await AnalysisEngine.matchPattern();
      setResult(analysis);
    } catch (error) {
      console.error("Scan failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-tactical-emerald animate-pulse" />
          <h2 className="text-xl font-bold tracking-tighter uppercase text-tactical-emerald">
            Deep Scan Alpha
          </h2>
        </div>
        <div className="px-2 py-0.5 border border-tactical-emerald/30 text-[10px] text-tactical-emerald/70 uppercase tracking-widest bg-tactical-emerald/5">
          v1.0.4-live
        </div>
      </div>

      {/* HUD Scanner Area */}
      <div className="hud-element glass-panel aspect-square w-full rounded-lg overflow-hidden border-tactical-emerald/20 flex flex-col items-center justify-center relative group">
        {image ? (
          <div className="relative w-full h-full">
            <img src={image} alt="Handloom Sample" className="w-full h-full object-cover" />
            {isScanning && <div className="scan-line" />}
            {!isScanning && result && (
              <div className="absolute inset-0 bg-tactical-emerald/10 animate-pulse pointer-events-none" />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-tactical-emerald/40 transition-colors group-hover:text-tactical-emerald/70">
            <Camera className="w-16 h-16 stroke-[1]" />
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-tighter">Ready for Input</p>
              <p className="text-[10px] opacity-60">Upload handloom texture for analysis</p>
            </div>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden" 
          accept="image/*"
        />
        
        {!isScanning && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-4 right-4 p-3 bg-tactical-emerald text-background rounded-full shadow-neon-strong hover:scale-105 active:scale-95 transition-transform"
          >
            <Upload className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Analysis Output */}
      <div className="space-y-4 min-h-[160px]">
        {isScanning ? (
          <div className="glass-panel p-6 rounded-lg border-tactical-emerald/20 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-tactical-emerald animate-ping" />
              <p className="text-xs uppercase tracking-widest text-tactical-emerald font-bold">
                Analyzing Texture Patterns...
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-tactical-emerald/10 rounded w-full overflow-hidden">
                <div className="h-full bg-tactical-emerald animate-[shimmer_1s_infinite] w-2/3" />
              </div>
              <div className="h-2 bg-tactical-emerald/10 rounded w-3/4 overflow-hidden">
                <div className="h-full bg-tactical-emerald animate-[shimmer_1.5s_infinite] w-1/2" />
              </div>
            </div>
          </div>
        ) : result ? (
          <div className="glass-panel p-6 rounded-lg border-tactical-emerald/40 relative overflow-hidden">
            {/* Top match indicator */}
            <div className="absolute top-0 right-0 p-2 bg-tactical-emerald text-background text-[10px] font-bold uppercase tracking-tighter">
              {result.matchPercentage}% Match
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-tactical-emerald/10 rounded-lg border border-tactical-emerald/20">
                <ShieldCheck className="w-6 h-6 text-tactical-emerald" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tactical-emerald leading-none mb-1">
                  {result.pattern.name}
                </h3>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">
                  Origin: {result.pattern.origin}
                </p>
                <div className="p-3 bg-black/40 border border-white/5 rounded text-xs text-white/70 italic">
                  "{result.pattern.texture}"
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 rounded-lg border-white/5 flex items-center gap-4 grayscale opacity-50">
            <AlertTriangle className="w-8 h-8 text-white/20" />
            <p className="text-[10px] uppercase tracking-widest text-white/40">
              Awaiting data packet for spectral analysis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
