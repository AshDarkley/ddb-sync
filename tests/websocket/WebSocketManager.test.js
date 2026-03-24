/**
 * WebSocketManager Tests
 * Tests WebSocket connection management and lifecycle
 */

class WebSocketManager {
  constructor(options = {}) {
    this.url = options.url || 'ws://localhost:8080';
    this.reconnectInterval = options.reconnectInterval || 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
  }

  /**
   * Connect to WebSocket
   */
  connect() {
    if (this.connected) {
      throw new Error('Already connected');
    }

    // Simulate connection
    this.ws = {
      url: this.url,
      readyState: 1, // OPEN
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      send: jest.fn()
    };

    this.connected = true;
    this.reconnectAttempts = 0;
    return true;
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (!this.connected) {
      throw new Error('Not connected');
    }

    this.ws = null;
    this.connected = false;
    return true;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Subscribe to message events
   */
  on(eventType, callback) {
    if (!eventType || typeof callback !== 'function') {
      throw new Error('eventType and callback required');
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType).push(callback);
    return true;
  }

  /**
   * Unsubscribe from events
   */
  off(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      return false;
    }

    const callbacks = this.listeners.get(eventType);
    const index = callbacks.indexOf(callback);

    if (index > -1) {
      callbacks.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Emit event to listeners
   */
  emit(eventType, data) {
    if (!this.listeners.has(eventType)) {
      return false;
    }

    const callbacks = this.listeners.get(eventType);
    callbacks.forEach(cb => cb(data));
    return true;
  }

  /**
   * Send message through WebSocket
   */
  send(data) {
    if (!this.connected) {
      throw new Error('Not connected');
    }

    this.ws.send(JSON.stringify(data));
    return true;
  }

  /**
   * Set reconnection strategy
   */
  setReconnectInterval(interval) {
    if (interval < 0) {
      throw new Error('Interval must be non-negative');
    }

    this.reconnectInterval = interval;
    return true;
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      connected: this.connected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      listenerCount: this.listeners.size
    };
  }
}

describe('WebSocketManager', () => {
  let manager;

  beforeEach(() => {
    manager = new WebSocketManager({
      url: 'ws://localhost:8080',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10
    });
  });

  describe('connect', () => {
    it('should connect successfully', () => {
      const result = manager.connect();
      expect(result).toBe(true);
      expect(manager.isConnected()).toBe(true);
    });

    it('should reset reconnect attempts on connect', () => {
      manager.reconnectAttempts = 5;
      manager.connect();
      expect(manager.reconnectAttempts).toBe(0);
    });

    it('should throw error if already connected', () => {
      manager.connect();
      expect(() => manager.connect()).toThrow('Already connected');
    });

    it('should create websocket object', () => {
      manager.connect();
      expect(manager.ws).not.toBeNull();
      expect(manager.ws.url).toBe('ws://localhost:8080');
    });
  });

  describe('disconnect', () => {
    beforeEach(() => {
      manager.connect();
    });

    it('should disconnect successfully', () => {
      const result = manager.disconnect();
      expect(result).toBe(true);
      expect(manager.isConnected()).toBe(false);
    });

    it('should throw error if not connected', () => {
      manager.disconnect();
      expect(() => manager.disconnect()).toThrow('Not connected');
    });

    it('should clear websocket reference', () => {
      manager.disconnect();
      expect(manager.ws).toBeNull();
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(manager.isConnected()).toBe(false);
    });

    it('should return true when connected', () => {
      manager.connect();
      expect(manager.isConnected()).toBe(true);
    });

    it('should return false after disconnect', () => {
      manager.connect();
      manager.disconnect();
      expect(manager.isConnected()).toBe(false);
    });
  });

  describe('on', () => {
    it('should register event listener', () => {
      const callback = jest.fn();
      const result = manager.on('message', callback);
      expect(result).toBe(true);
    });

    it('should allow multiple listeners for same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      manager.on('message', callback1);
      manager.on('message', callback2);
      expect(manager.listeners.get('message')).toHaveLength(2);
    });

    it('should throw error if callback not a function', () => {
      expect(() => manager.on('message', 'not-function')).toThrow();
    });

    it('should throw error if eventType missing', () => {
      const callback = jest.fn();
      expect(() => manager.on(null, callback)).toThrow();
    });
  });

  describe('off', () => {
    it('should unregister event listener', () => {
      const callback = jest.fn();
      manager.on('message', callback);
      const result = manager.off('message', callback);
      expect(result).toBe(true);
      expect(manager.listeners.get('message')).toHaveLength(0);
    });

    it('should return false if listener not found', () => {
      const callback = jest.fn();
      const result = manager.off('message', callback);
      expect(result).toBe(false);
    });

    it('should only remove specified listener', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      manager.on('message', callback1);
      manager.on('message', callback2);
      manager.off('message', callback1);
      expect(manager.listeners.get('message')).toHaveLength(1);
      expect(manager.listeners.get('message')[0]).toBe(callback2);
    });
  });

  describe('emit', () => {
    it('should call all listeners for event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      manager.on('message', callback1);
      manager.on('message', callback2);

      manager.emit('message', { data: 'test' });

      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should return false if no listeners', () => {
      const result = manager.emit('unknown', {});
      expect(result).toBe(false);
    });

    it('should return true if listeners found', () => {
      manager.on('message', jest.fn());
      const result = manager.emit('message', {});
      expect(result).toBe(true);
    });
  });

  describe('send', () => {
    beforeEach(() => {
      manager.connect();
    });

    it('should send message when connected', () => {
      const data = { type: 'test', value: 42 };
      const result = manager.send(data);
      expect(result).toBe(true);
      expect(manager.ws.send).toHaveBeenCalled();
    });

    it('should throw error if not connected', () => {
      manager.disconnect();
      expect(() => manager.send({})).toThrow('Not connected');
    });

    it('should stringify data before sending', () => {
      const data = { type: 'roll', value: 20 };
      manager.send(data);
      expect(manager.ws.send).toHaveBeenCalledWith(JSON.stringify(data));
    });
  });

  describe('setReconnectInterval', () => {
    it('should set reconnect interval', () => {
      manager.setReconnectInterval(10000);
      expect(manager.reconnectInterval).toBe(10000);
    });

    it('should throw error for negative interval', () => {
      expect(() => manager.setReconnectInterval(-1)).toThrow();
    });

    it('should allow zero interval', () => {
      const result = manager.setReconnectInterval(0);
      expect(result).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return connection statistics', () => {
      manager.connect();
      manager.on('message', jest.fn());
      const stats = manager.getStats();

      expect(stats.connected).toBe(true);
      expect(stats.reconnectAttempts).toBe(0);
      expect(stats.maxReconnectAttempts).toBe(10);
      expect(stats.listenerCount).toBe(1);
    });

    it('should reflect state changes', () => {
      let stats = manager.getStats();
      expect(stats.connected).toBe(false);

      manager.connect();
      stats = manager.getStats();
      expect(stats.connected).toBe(true);
    });
  });
});

module.exports = WebSocketManager;
