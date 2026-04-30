'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ShieldCheck, Send, MessageSquare, Info, ChevronLeft, Award } from 'lucide-react';
import Link from 'next/link';
import { useArtisanComms } from '@/context/ArtisanCommsContext';

interface Artisan {
  id: string;
  name: string;
  specialty: string;
  location: string;
  verified: boolean;
  avatar: string;
  bio: string;
  rating: number;
}

const ARTISANS: Artisan[] = [
  {
    id: '1',
    name: 'Master Haren Phukan',
    specialty: 'Assamese Silk Weaving',
    location: 'Sualkuchi, Assam',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1590004953392-5aba2e78319b?q=80&w=200&h=200&auto=format&fit=crop',
    bio: 'Fourth generation weaver specializing in Muga Silk. National award recipient.',
    rating: 4.9,
  },
  {
    id: '2',
    name: 'Anjali Sangma',
    specialty: 'Garo Traditional Pottery',
    location: 'Tura, Meghalaya',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1565193298415-53a1d4367c03?q=80&w=200&h=200&auto=format&fit=crop',
    bio: 'Master of terra-cotta techniques passed down through matrilineal tradition.',
    rating: 4.8,
  }
];

export default function ArtisanCommsPage() {
  const { messages, sendMessage } = useArtisanComms();
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan>(ARTISANS[0]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText, selectedArtisan.id);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6 glass-panel p-4 rounded-2xl border-amber-500/10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Artisan Direct</h2>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                <ShieldCheck className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-tighter">Verification Alpha</span>
              </div>
            </div>
            <p className="text-xs text-white/40 font-mono">Secure, Low-Latency Commission Channel</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <Award className="w-4 h-4" />
          New Commission
        </button>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Artisan List */}
        <div className="hidden lg:flex flex-col w-72 gap-3 overflow-y-auto no-scrollbar">
          {ARTISANS.map((artisan) => (
            <button
              key={artisan.id}
              onClick={() => setSelectedArtisan(artisan)}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 border ${
                selectedArtisan.id === artisan.id
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="relative">
                <Image 
                  src={artisan.avatar} 
                  alt={artisan.name} 
                  width={48}
                  height={48}
                  className="rounded-xl object-cover grayscale brightness-75" 
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black"></div>
              </div>
              <div className="flex flex-col items-start">
                <span className={`text-sm font-bold tracking-tight ${selectedArtisan.id === artisan.id ? 'text-amber-500' : 'text-white'}`}>
                  {artisan.name}
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-tighter">{artisan.specialty}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col glass-panel rounded-3xl border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden relative">
          {/* Chat Background Decals */}
          <div className="absolute top-4 right-4 text-[60px] font-black text-white/5 select-none pointer-events-none italic tracking-tighter">
            DIRECT
          </div>
          
          {/* Artisan Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 flex items-center justify-center border border-white/10">
                <MessageSquare className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide uppercase">{selectedArtisan.name}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest">Active Connection</span>
                </div>
              </div>
            </div>
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <Info className="w-5 h-5 text-white/40" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 rounded-tr-none'
                      : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] font-mono text-white/20 mt-1 uppercase">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-5 border-t border-white/5 bg-black/20">
            <div className="relative flex items-center gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Request custom weave patterns..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
              <button
                onClick={handleSendMessage}
                className="p-4 rounded-2xl bg-amber-500 text-black hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] group"
              >
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5 opacity-40">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[8px] font-mono uppercase tracking-widest text-white">End-to-End Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-40">
                <Award className="w-3 h-3" />
                <span className="text-[8px] font-mono uppercase tracking-widest text-white">Verified Identity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
