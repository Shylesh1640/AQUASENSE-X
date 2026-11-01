type MessageHandler = (data: Record<string, unknown>) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000;

  private getUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/v1/ws/live`;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;
    try {
      this.ws = new WebSocket(this.getUrl());
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit('connection', { connected: true } as unknown as Record<string, unknown>);
      };
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.emit(msg.type, msg.data);
          this.emit('message', msg);
        } catch {
          // ignore malformed messages
        }
      };
      this.ws.onclose = () => {
        this.emit('connection', { connected: false } as unknown as Record<string, unknown>);
        this.scheduleReconnect();
      };
      this.ws.onerror = () => {
        // error handling done by onclose
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
    this.ws?.close();
    this.ws = null;
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectDelay * Math.min(this.reconnectAttempts + 1, 5));
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  private emit(type: string, data: Record<string, unknown>) {
    this.handlers.get(type)?.forEach((h) => {
      try {
        h(data);
      } catch {
        // prevent handler errors from breaking the loop
      }
    });
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
