'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'artisan';
  text: string;
  timestamp: string;
}

interface Commission {
  id: string;
  title: string;
  description: string;
  budget?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  artisanId: string;
}

interface ArtisanCommsContextType {
  messages: Message[];
  commissions: Commission[];
  sendMessage: (text: string, artisanId: string) => void;
  requestCommission: (title: string, description: string, artisanId: string, budget?: string) => void;
}

const ArtisanCommsContext = createContext<ArtisanCommsContextType | undefined>(undefined);

export const ArtisanCommsProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'artisan',
      text: 'Namaste! How can I help you with your custom heritage request today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [commissions, setCommissions] = useState<Commission[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sendMessage = (text: string, _artisanId: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);

    // Simple simulated response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'artisan',
        text: 'I have received your message. Let me review the details and get back to you shortly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const requestCommission = (title: string, description: string, artisanId: string, budget?: string) => {
    const newCommission: Commission = {
      id: `COM-${Math.floor(Math.random() * 10000)}`,
      title,
      description,
      budget,
      status: 'pending',
      artisanId
    };
    setCommissions(prev => [...prev, newCommission]);
    
    // Auto-message for commission
    sendMessage(`Commission Request: ${title}\n\n${description}`, artisanId);
  };

  return (
    <ArtisanCommsContext.Provider value={{ messages, commissions, sendMessage, requestCommission }}>
      {children}
    </ArtisanCommsContext.Provider>
  );
};

export const useArtisanComms = () => {
  const context = useContext(ArtisanCommsContext);
  if (context === undefined) {
    throw new Error('useArtisanComms must be used within an ArtisanCommsProvider');
  }
  return context;
};
