import { useEffect, useState, useRef } from 'react';
import { wsService } from '../services/websocket';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    wsService.connect();
    const unsub1 = wsService.on('connection', (d) => setConnected(Boolean(d.connected)));
    const unsub2 = wsService.on('message', setLastMessage);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  return { connected, lastMessage };
}

export function useWebSocketEvent(eventType: string, handler: (data: Record<string, unknown>) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    wsService.connect();
    return wsService.on(eventType, (data) => handlerRef.current(data));
  }, [eventType]);
}
