'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Camera, MapPin, Tag, Send, X } from 'lucide-react';

export const ComposeView = ({ onPostComplete }: { onPostComplete?: () => void }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !media) return;
    
    setIsPosting(true);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsPosting(false);
    setContent('');
    setMedia(null);
    if (onPostComplete) {
      onPostComplete();
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-10">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Create Intel Report</h2>
      </div>

      <div className="bg-white/5 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 p-4 backdrop-blur-md shadow-sm">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">OP</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Operative_01</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Field Agent</p>
          </div>
        </div>

        {/* Text Input */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your latest dispatch from the field..."
          className="w-full bg-transparent border-none outline-none resize-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 min-h-[120px] text-lg leading-relaxed"
        />

        {/* Media Preview */}
        {media && (
          <div className="relative mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
            <img src={media} alt="Attached Media" className="w-full h-auto max-h-[300px] object-cover" />
            <button 
              onClick={() => setMedia(null)}
              className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-black/80 backdrop-blur-md transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
            >
              <ImageIcon size={20} />
            </button>
            <button className="p-2 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
              <Camera size={20} />
            </button>
            <button className="p-2 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors hidden sm:block">
              <MapPin size={20} />
            </button>
            <button className="p-2 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors hidden sm:block">
              <Tag size={20} />
            </button>
          </div>

          <button
            onClick={handlePost}
            disabled={!content.trim() && !media || isPosting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
              !content.trim() && !media || isPosting
                ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:shadow-lg active:scale-95'
            }`}
          >
            {isPosting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Transmitting</span>
              </>
            ) : (
              <>
                <span>Broadcast</span>
                <Send size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
