import { useState, useEffect, useRef } from 'react';

export const useSSE = <T = any>(url: string | null) => {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryDelayRef = useRef(2000);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!url) return;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      console.log(`[SSE] Connecting to ${url}...`);
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        console.log(`[SSE] Connected to ${url}`);
        setIsConnected(true);
        setError(null);
        retryDelayRef.current = 2000; // Reset on success
      };

      es.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
        } catch (err) {
          console.error('[SSE] Error parsing message:', err);
        }
      };

      es.onerror = (err) => {
        console.warn(`[SSE] Error with ${url}. Retrying in ${retryDelayRef.current/1000}s...`, err);
        setError('Connection failed');
        setIsConnected(false);
        es.close();
        
        retryTimerRef.current = setTimeout(() => {
          retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30000);
          connect();
        }, retryDelayRef.current);
      };
    };

    connect();

    return () => {
      console.log(`[SSE] Disconnecting from ${url}...`);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [url]);

  return { data, isConnected, error };
};
