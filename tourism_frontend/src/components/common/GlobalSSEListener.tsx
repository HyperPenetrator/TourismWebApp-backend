'use client';

import { useEffect, useRef } from 'react';

export const GlobalSSEListener = () => {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const sseUrl = `${apiBase}/sse/marketplace`; // This endpoint broadcasts all events

    const connect = () => {
      console.log('[GlobalSSE] Connecting...');
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === 'engagement_update') {
            // Dispatch a custom event that components can listen to
            const customEvent = new CustomEvent('engagement_update', { detail: data.data });
            window.dispatchEvent(customEvent);
          }
          
          if (data.event === 'new_item') {
            const customEvent = new CustomEvent('new_marketplace_item', { detail: data.data });
            window.dispatchEvent(customEvent);
          }
        } catch (err) {
          console.error('[GlobalSSE] Parse error:', err);
        }
      };

      es.onerror = () => {
        es.close();
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  return null; // This is a logic-only component
};
