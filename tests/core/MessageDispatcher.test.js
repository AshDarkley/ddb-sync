/**
 * MessageDispatcher Tests
 * Tests routing of messages to appropriate handlers
 */

class MessageDispatcher {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Register a handler for a message type
   */
  registerHandler(messageType, handler) {
    if (!messageType || typeof messageType !== 'string') {
      throw new Error('messageType must be a non-empty string');
    }
    if (typeof handler !== 'function') {
      throw new Error('handler must be a function');
    }
    this.handlers.set(messageType, handler);
    return true;
  }

  /**
   * Get handler for a message type
   */
  getHandler(messageType) {
    return this.handlers.get(messageType) || null;
  }

  /**
   * Dispatch a message to the appropriate handler
   */
  dispatch(message) {
    if (!message || typeof message !== 'object') {
      throw new Error('message must be a valid object');
    }

    const messageType = message.type;
    if (!messageType) {
      throw new Error('message.type is required');
    }

    const handler = this.getHandler(messageType);
    if (!handler) {
      throw new Error(`No handler registered for message type: ${messageType}`);
    }

    return handler(message);
  }

  /**
   * Safely dispatch a message, returning error instead of throwing
   */
  dispatchSafe(message) {
    try {
      const result = this.dispatch(message);
      return {
        success: true,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all registered handler types
   */
  getRegisteredTypes() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Unregister a handler
   */
  unregisterHandler(messageType) {
    return this.handlers.delete(messageType);
  }

  /**
   * Clear all handlers
   */
  clearHandlers() {
    this.handlers.clear();
    return true;
  }
}

describe('MessageDispatcher', () => {
  let dispatcher;

  beforeEach(() => {
    dispatcher = new MessageDispatcher();
  });

  describe('registerHandler', () => {
    it('should register a handler for a message type', () => {
      const handler = jest.fn();
      const result = dispatcher.registerHandler('roll', handler);
      expect(result).toBe(true);
      expect(dispatcher.getHandler('roll')).toBe(handler);
    });

    it('should throw error if messageType is missing', () => {
      const handler = jest.fn();
      expect(() => dispatcher.registerHandler(null, handler)).toThrow();
      expect(() => dispatcher.registerHandler('', handler)).toThrow();
    });

    it('should throw error if handler is not a function', () => {
      expect(() => dispatcher.registerHandler('roll', 'not-a-function')).toThrow();
      expect(() => dispatcher.registerHandler('roll', {})).toThrow();
    });

    it('should overwrite existing handler for same type', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      dispatcher.registerHandler('roll', handler1);
      dispatcher.registerHandler('roll', handler2);
      expect(dispatcher.getHandler('roll')).toBe(handler2);
    });
  });

  describe('getHandler', () => {
    it('should return handler for registered type', () => {
      const handler = jest.fn();
      dispatcher.registerHandler('roll', handler);
      expect(dispatcher.getHandler('roll')).toBe(handler);
    });

    it('should return null for unregistered type', () => {
      expect(dispatcher.getHandler('unknown')).toBeNull();
    });
  });

  describe('dispatch', () => {
    beforeEach(() => {
      dispatcher.registerHandler('roll', jest.fn((msg) => ({ processed: true, type: msg.type })));
      dispatcher.registerHandler('damage', jest.fn((msg) => ({ hp: msg.damage })));
    });

    it('should dispatch message to appropriate handler', () => {
      const message = { type: 'roll', value: 20 };
      const result = dispatcher.dispatch(message);
      expect(result).toEqual({ processed: true, type: 'roll' });
    });

    it('should pass message to handler', () => {
      const handler = jest.fn();
      dispatcher.registerHandler('test', handler);
      const message = { type: 'test', data: 'test-data' };
      dispatcher.dispatch(message);
      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should throw error if message is not an object', () => {
      expect(() => dispatcher.dispatch('not-object')).toThrow();
      expect(() => dispatcher.dispatch(null)).toThrow();
    });

    it('should throw error if message.type is missing', () => {
      expect(() => dispatcher.dispatch({})).toThrow();
      expect(() => dispatcher.dispatch({ data: 'test' })).toThrow();
    });

    it('should throw error if no handler for message type', () => {
      const message = { type: 'unknown' };
      expect(() => dispatcher.dispatch(message)).toThrow('No handler registered');
    });

    it('should propagate handler errors', () => {
      const handler = jest.fn(() => {
        throw new Error('Handler error');
      });
      dispatcher.registerHandler('error', handler);
      expect(() => dispatcher.dispatch({ type: 'error' })).toThrow('Handler error');
    });
  });

  describe('dispatchSafe', () => {
    beforeEach(() => {
      dispatcher.registerHandler('roll', jest.fn((msg) => ({ value: 20 })));
    });

    it('should return success result for valid message', () => {
      const result = dispatcher.dispatchSafe({ type: 'roll' });
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ value: 20 });
    });

    it('should return error result instead of throwing', () => {
      const result = dispatcher.dispatchSafe({ type: 'unknown' });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should catch handler errors', () => {
      const handler = jest.fn(() => {
        throw new Error('Test error');
      });
      dispatcher.registerHandler('error', handler);
      const result = dispatcher.dispatchSafe({ type: 'error' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Test error');
    });
  });

  describe('getRegisteredTypes', () => {
    it('should return array of registered types', () => {
      dispatcher.registerHandler('roll', jest.fn());
      dispatcher.registerHandler('damage', jest.fn());
      const types = dispatcher.getRegisteredTypes();
      expect(types).toContain('roll');
      expect(types).toContain('damage');
      expect(types.length).toBe(2);
    });

    it('should return empty array if no handlers registered', () => {
      const types = dispatcher.getRegisteredTypes();
      expect(types).toEqual([]);
    });
  });

  describe('unregisterHandler', () => {
    it('should unregister a handler', () => {
      dispatcher.registerHandler('roll', jest.fn());
      expect(dispatcher.getHandler('roll')).not.toBeNull();
      dispatcher.unregisterHandler('roll');
      expect(dispatcher.getHandler('roll')).toBeNull();
    });

    it('should return false if handler does not exist', () => {
      const result = dispatcher.unregisterHandler('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('clearHandlers', () => {
    it('should clear all handlers', () => {
      dispatcher.registerHandler('roll', jest.fn());
      dispatcher.registerHandler('damage', jest.fn());
      dispatcher.clearHandlers();
      expect(dispatcher.getRegisteredTypes()).toEqual([]);
    });

    it('should return true', () => {
      const result = dispatcher.clearHandlers();
      expect(result).toBe(true);
    });
  });
});

module.exports = MessageDispatcher;
