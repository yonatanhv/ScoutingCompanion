/**
 * WebSocket service for real-time data synchronization 
 * Handles connection to server and message passing between devices
 */

import { toast } from "@/hooks/use-toast";
import type { MatchEntry } from "./types";

type WebSocketMessage = {
  type: string;
  timestamp: number;
  [key: string]: any;
};

type WebSocketListenerCallback = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private listeners: Map<string, Set<WebSocketListenerCallback>> = new Map();
  private pendingMessages: WebSocketMessage[] = [];

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      // Determine the WebSocket URL based on the current page protocol and host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      console.log(`Connecting to WebSocket server at ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      this.isConnected = false;
    }
  }

  /**
   * Send a message to the WebSocket server
   */
  send(type: string, data: any = {}): void {
    const message: WebSocketMessage = {
      type,
      ...data,
      timestamp: Date.now()
    };

    // If not connected, store the message to send later
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.pendingMessages.push(message);
      console.log('WebSocket not connected, message queued for later', message);
      this.connect(); // Try to connect
      return;
    }

    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      this.pendingMessages.push(message);
    }
  }

  /**
   * Send a new match entry to other connected clients
   */
  sendMatchEntry(matchEntry: MatchEntry): void {
    this.send('new_match', { matchData: matchEntry });
  }

  /**
   * Request a sync with the server
   */
  requestSync(): void {
    this.send('sync_request');
  }

  /**
   * Add a listener for a specific message type
   */
  addListener(type: string, callback: WebSocketListenerCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)?.add(callback);

    // Return a function to remove this listener
    return () => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.delete(callback);
        if (typeListeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Close the WebSocket connection
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Handle WebSocket connection open
   */
  private handleOpen(event: Event): void {
    console.log('WebSocket connection established');
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // Send any pending messages
    if (this.pendingMessages.length > 0) {
      console.log(`Sending ${this.pendingMessages.length} pending messages`);
      
      for (const message of this.pendingMessages) {
        try {
          this.socket?.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending pending message:', error);
        }
      }
      
      this.pendingMessages = [];
    }

    // Notify app about connection status
    this.notifyListeners('connection_status', { connected: true });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Log all incoming messages for debugging
      console.log('WebSocket message received:', message);

      if (message.type === 'connected') {
        toast({
          title: "Real-time sync connected",
          description: "Your device is now connected for real-time updates."
        });
      }
      
      // Notify specific listeners for this message type
      this.notifyListeners(message.type, message);
      
      // Also notify generic message listeners
      this.notifyListeners('message', message);
    } catch (error) {
      console.error('Error handling WebSocket message:', error, event.data);
    }
  }

  /**
   * Handle WebSocket connection close
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.isConnected = false;

    // Attempt to reconnect unless explicitly closed by the application
    if (event.code !== 1000) {
      this.attemptReconnect();
    }

    // Notify app about connection status
    this.notifyListeners('connection_status', { connected: false });
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnected = false;
    
    // Attempt to reconnect
    this.attemptReconnect();
    
    // Notify app about error
    this.notifyListeners('error', { event });
  }

  /**
   * Attempt to reconnect to the WebSocket server with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnect attempts reached. Giving up.');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Notify all listeners for a specific message type
   */
  private notifyListeners(type: string, data: any): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket listener for "${type}":`, error);
        }
      });
    }
  }

  /**
   * Check if the WebSocket is currently connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();

// Automatically connect when online and the module is imported
if (typeof window !== 'undefined' && navigator.onLine) {
  window.addEventListener('online', () => {
    console.log('Browser came online, connecting to WebSocket');
    webSocketService.connect();
  });
  
  window.addEventListener('offline', () => {
    console.log('Browser went offline, WebSocket will disconnect');
  });
  
  // Connect initially if online
  if (navigator.onLine) {
    console.log('Initializing WebSocket connection');
    setTimeout(() => webSocketService.connect(), 1000);
  }
}