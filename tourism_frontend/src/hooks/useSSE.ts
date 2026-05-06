import { useState, useEffect, useRef } from 'react';

export const useSSE = <T = any>(url: string | null) => {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url) return;

    console.log(`[SSE] Connecting to ${url}...`);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log(`[SSE] Connected to ${url}`);
      setIsConnected(true);
      setError(null);
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
      console.error(`[SSE] Error with ${url}:`, err);
      setError('Connection failed');
      setIsConnected(false);
      es.close();
    };

    return () => {
      console.log(`[SSE] Disconnecting from ${url}...`);
      es.close();
      eventSourceRef.current = null;
    };
  }, [url]);

  return { data, isConnected, error };
};
