import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const getSocketURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // If explicitly set to empty string or undefined, use relative path
  if (envUrl === '' || envUrl === undefined) {
    return '';
  }
  return envUrl;
};

const SOCKET_URL = getSocketURL();

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      toast.success('Real-time updates connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        toast.error('Disconnected from server');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Failed to connect to real-time updates');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      toast.success('Real-time updates reconnected');
    });

    // VM Status Changes
    this.socket.on('vm:status', (data: any) => {
      console.log('VM status changed:', data);
      // Trigger refetch of VM list
      window.dispatchEvent(new CustomEvent('vm:status', { detail: data }));
    });

    // VM Operation Progress
    this.socket.on('vm:progress', (data: any) => {
      console.log('VM operation progress:', data);
      const { vmName, operation, progress, message } = data;
      toast.info(`${vmName}: ${operation} ${progress}%${message ? ` - ${message}` : ''}`);
      window.dispatchEvent(new CustomEvent('vm:progress', { detail: data }));
    });

    // VM Operation Complete
    this.socket.on('vm:operation:complete', (data: any) => {
      console.log('VM operation complete:', data);
      const { vmName, operation, success, result } = data;
      if (success) {
        toast.success(`${vmName}: ${operation} completed successfully`);
      } else {
        toast.error(`${vmName}: ${operation} failed - ${result?.error || 'Unknown error'}`);
      }
      window.dispatchEvent(new CustomEvent('vm:operation:complete', { detail: data }));
    });

    // VM List Updated
    this.socket.on('vm:list:updated', (data: any) => {
      console.log('VM list updated');
      window.dispatchEvent(new CustomEvent('vm:list:updated', { detail: data }));
    });

    // VM Created
    this.socket.on('vm:created', (data: any) => {
      console.log('VM created:', data);
      toast.success(`VM ${data.vmName} created successfully`);
      window.dispatchEvent(new CustomEvent('vm:created', { detail: data }));
    });

    // VM Deleted
    this.socket.on('vm:deleted', (data: any) => {
      console.log('VM deleted:', data);
      toast.info(`VM ${data.vmName} deleted`);
      window.dispatchEvent(new CustomEvent('vm:deleted', { detail: data }));
    });

    // System Notifications
    this.socket.on('system:notification', (data: any) => {
      console.log('System notification:', data);
      const { message, type } = data;
      switch (type) {
        case 'info':
          toast.info(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'success':
          toast.success(message);
          break;
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket disconnected');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const websocketClient = new WebSocketClient();

// Auto-connect on import
if (typeof window !== 'undefined') {
  websocketClient.connect();
}
