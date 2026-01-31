/**
 * RollStrategyDispatcher Tests
 * Tests routing of rolls to appropriate handlers based on roll type
 */

class RollStrategyDispatcher {
  constructor() {
    this.strategies = new Map();
  }

  /**
   * Register a roll handler strategy
   */
  registerStrategy(handler) {
    if (!handler || typeof handler.supports !== 'function' || typeof handler.handle !== 'function') {
      throw new Error('Handler must have supports() and handle() methods');
    }

    const metadata = handler.getMetadata ? handler.getMetadata() : {};
    const supportedTypes = metadata.supports || [];

    for (const type of supportedTypes) {
      this.strategies.set(type.toLowerCase(), handler);
    }

    return true;
  }

  /**
   * Find handler for a roll type
   */
  findHandler(rollType) {
    return this.strategies.get(rollType.toLowerCase()) || null;
  }

  /**
   * Dispatch roll to appropriate handler
   */
  dispatch(message) {
    if (!message || !message.rollType) {
      throw new Error('Message must contain rollType');
    }

    const handler = this.findHandler(message.rollType);
    if (!handler) {
      throw new Error(`No handler found for roll type: ${message.rollType}`);
    }

    return handler.handle(message);
  }

  /**
   * Get all supported roll types
   */
  getSupportedTypes() {
    return Array.from(this.strategies.keys());
  }

  /**
   * Check if roll type is supported
   */
  supports(rollType) {
    return this.strategies.has(rollType.toLowerCase());
  }
}

describe('RollStrategyDispatcher', () => {
  let dispatcher;

  beforeEach(() => {
    dispatcher = new RollStrategyDispatcher();
  });

  describe('registerStrategy', () => {
    it('should register a valid handler', () => {
      const handler = {
        supports: jest.fn((type) => type === 'attack'),
        handle: jest.fn((msg) => ({ result: 'handled' })),
        getMetadata: jest.fn(() => ({ supports: ['attack', 'tohit'] }))
      };

      const result = dispatcher.registerStrategy(handler);
      expect(result).toBe(true);
      expect(dispatcher.supports('attack')).toBe(true);
      expect(dispatcher.supports('tohit')).toBe(true);
    });

    it('should throw error if handler missing supports method', () => {
      const handler = { handle: jest.fn() };
      expect(() => dispatcher.registerStrategy(handler)).toThrow();
    });

    it('should throw error if handler missing handle method', () => {
      const handler = { supports: jest.fn() };
      expect(() => dispatcher.registerStrategy(handler)).toThrow();
    });

    it('should throw error if handler is null', () => {
      expect(() => dispatcher.registerStrategy(null)).toThrow();
    });

    it('should register multiple strategies', () => {
      const attackHandler = {
        supports: jest.fn(),
        handle: jest.fn(),
        getMetadata: jest.fn(() => ({ supports: ['attack'] }))
      };

      const damageHandler = {
        supports: jest.fn(),
        handle: jest.fn(),
        getMetadata: jest.fn(() => ({ supports: ['damage'] }))
      };

      dispatcher.registerStrategy(attackHandler);
      dispatcher.registerStrategy(damageHandler);

      expect(dispatcher.getSupportedTypes().length).toBe(2);
    });
  });

  describe('findHandler', () => {
    beforeEach(() => {
      const handler = {
        supports: jest.fn(),
        handle: jest.fn(),
        getMetadata: jest.fn(() => ({ supports: ['attack', 'tohit'] }))
      };
      dispatcher.registerStrategy(handler);
    });

    it('should find handler for supported roll type', () => {
      const handler = dispatcher.findHandler('attack');
      expect(handler).not.toBeNull();
    });

    it('should find handler case-insensitively', () => {
      const handler1 = dispatcher.findHandler('ATTACK');
      const handler2 = dispatcher.findHandler('Attack');
      expect(handler1).not.toBeNull();
      expect(handler2).not.toBeNull();
    });

    it('should return null for unsupported roll type', () => {
      const handler = dispatcher.findHandler('unknown');
      expect(handler).toBeNull();
    });
  });

  describe('dispatch', () => {
    beforeEach(() => {
      const handler = {
        supports: jest.fn((type) => type === 'attack'),
        handle: jest.fn((msg) => ({ rolled: msg.rollType })),
        getMetadata: jest.fn(() => ({ supports: ['attack'] }))
      };
      dispatcher.registerStrategy(handler);
    });

    it('should dispatch message to appropriate handler', () => {
      const message = { rollType: 'attack', value: 20 };
      const result = dispatcher.dispatch(message);

      expect(result).toEqual({ rolled: 'attack' });
    });

    it('should throw error if no handler found', () => {
      const message = { rollType: 'unknown' };
      expect(() => dispatcher.dispatch(message)).toThrow('No handler found');
    });

    it('should throw error if message missing rollType', () => {
      const message = { value: 20 };
      expect(() => dispatcher.dispatch(message)).toThrow('rollType');
    });

    it('should throw error if message is null', () => {
      expect(() => dispatcher.dispatch(null)).toThrow();
    });
  });

  describe('getSupportedTypes', () => {
    it('should return all supported roll types', () => {
      const attackHandler = {
        supports: jest.fn(),
        handle: jest.fn(),
        getMetadata: jest.fn(() => ({ supports: ['attack', 'tohit'] }))
      };

      const damageHandler = {
        supports: jest.fn(),
        handle: jest.fn(),
        getMetadata: jest.fn(() => ({ supports: ['damage'] }))
      };

      dispatcher.registerStrategy(attackHandler);
      dispatcher.registerStrategy(damageHandler);

      const types = dispatcher.getSupportedTypes();
      expect(types).toContain('attack');
      expect(types).toContain('tohit');
      expect(types).toContain('damage');
    });

    it('should return empty array if no strategies registered', () => {
      const types = dispatcher.getSupportedTypes();
      expect(types).toEqual([]);
    });
  });

  describe('supports', () => {
    beforeEach(() => {
      const handler = {
        supports: jest.fn(),
        handle: jest.fn(),
        getMetadata: jest.fn(() => ({ supports: ['save', 'ability'] }))
      };
      dispatcher.registerStrategy(handler);
    });

    it('should return true for supported roll type', () => {
      expect(dispatcher.supports('save')).toBe(true);
      expect(dispatcher.supports('ability')).toBe(true);
    });

    it('should return false for unsupported roll type', () => {
      expect(dispatcher.supports('unknown')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(dispatcher.supports('SAVE')).toBe(true);
      expect(dispatcher.supports('Save')).toBe(true);
    });
  });
});

module.exports = RollStrategyDispatcher;
