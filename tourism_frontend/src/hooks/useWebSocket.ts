import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface WebSocketOptions<T> {
  onMessage?: (data: T) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
}

export const useWebSocket = <T = any>(url: string, options: WebSocketOptions<T> = {}) => {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { token } = useAuth();
  
  // Use refs for callbacks to avoid unnecessary reconnections when callbacks change
  const callbacksRef = useRef(options);
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    const { 
      reconnect = true, 
      reconnectInterval = 5000 
    } = callbacksRef.current;

    try {
      // Append token as query parameter for WebSocket auth
      const wsUrl = token ? `${url}?token=${token}` : url;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        callbacksRef.current.onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setData(payload);
          callbacksRef.current.onMessage?.(payload);
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        callbacksRef.current.onDisconnect?.();
        
        if (reconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (err) => {
        setError(err);
        callbacksRef.current.onError?.(err);
        ws.close();
      };

    } catch (err) {
      console.error("WebSocket connection error:", err);
    }
  }, [url, token]);

  useEffect(() => {
    connect();

    return () => {
      reconnectTimeoutRef.current && clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not open. Message not sent.");
    }
  }, []);

  return { data, isConnected, error, sendMessage };
};
