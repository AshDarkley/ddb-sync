/**
 * DiceRollMessageHandler Tests
 * Tests handling of dice roll messages from D&D Beyond
 */

class DiceRollMessageHandler {
  constructor(rollDispatcher, diceExtractor) {
    this.rollDispatcher = rollDispatcher;
    this.diceExtractor = diceExtractor;
  }

  /**
   * Check if this handler supports a message type
   */
  supports(messageType) {
    return messageType === 'dice_roll' || messageType === 'roll';
  }

  /**
   * Handle a dice roll message
   */
  handle(message) {
    if (!this.supports(message.type)) {
      throw new Error(`Handler does not support message type: ${message.type}`);
    }

    // Extract dice info from message
    const rollType = this.diceExtractor.extractRollType(message);
    const characterId = this.diceExtractor.extractCharacterId(message);

    // Prepare message for dispatcher
    const rollMessage = {
      rollType: rollType,
      characterId: characterId,
      diceValues: message.diceValues || [],
      modifier: message.modifier || 0,
      timestamp: message.timestamp || new Date().toISOString()
    };

    // Dispatch to appropriate roll handler
    return this.rollDispatcher.dispatch(rollMessage);
  }

  /**
   * Get handler name
   */
  getName() {
    return 'DiceRollMessageHandler';
  }
}

describe('DiceRollMessageHandler', () => {
  let handler;
  let mockDispatcher;
  let mockExtractor;

  beforeEach(() => {
    mockDispatcher = {
      dispatch: jest.fn((msg) => ({
        handled: true,
        rollType: msg.rollType,
        characterId: msg.characterId
      }))
    };

    mockExtractor = {
      extractRollType: jest.fn((msg) => msg.rollType),
      extractCharacterId: jest.fn((msg) => msg.characterId)
    };

    handler = new DiceRollMessageHandler(mockDispatcher, mockExtractor);
  });

  describe('supports', () => {
    it('should support dice_roll message type', () => {
      expect(handler.supports('dice_roll')).toBe(true);
    });

    it('should support roll message type', () => {
      expect(handler.supports('roll')).toBe(true);
    });

    it('should not support other message types', () => {
      expect(handler.supports('damage')).toBe(false);
      expect(handler.supports('character')).toBe(false);
    });
  });

  describe('handle', () => {
    it('should handle dice roll message successfully', () => {
      const message = {
        type: 'dice_roll',
        rollType: 'attack',
        characterId: '123',
        diceValues: [18],
        modifier: 5
      };

      const result = handler.handle(message);

      expect(mockDispatcher.dispatch).toHaveBeenCalled();
      expect(result.handled).toBe(true);
      expect(result.rollType).toBe('attack');
    });

    it('should extract character ID from message', () => {
      const message = {
        type: 'roll',
        rollType: 'damage',
        characterId: '456',
        diceValues: [6, 5]
      };

      handler.handle(message);

      expect(mockExtractor.extractCharacterId).toHaveBeenCalledWith(message);
    });

    it('should pass extracted data to dispatcher', () => {
      const message = {
        type: 'dice_roll',
        rollType: 'save',
        characterId: '789',
        diceValues: [12],
        modifier: 3
      };

      handler.handle(message);

      const dispatchCall = mockDispatcher.dispatch.mock.calls[0][0];
      expect(dispatchCall.rollType).toBe('save');
      expect(dispatchCall.characterId).toBe('789');
      expect(dispatchCall.diceValues).toEqual([12]);
      expect(dispatchCall.modifier).toBe(3);
    });

    it('should use default modifier if not provided', () => {
      const message = {
        type: 'dice_roll',
        rollType: 'ability',
        characterId: '123',
        diceValues: [14]
      };

      handler.handle(message);

      const dispatchCall = mockDispatcher.dispatch.mock.calls[0][0];
      expect(dispatchCall.modifier).toBe(0);
    });

    it('should use default diceValues if not provided', () => {
      const message = {
        type: 'dice_roll',
        rollType: 'attack',
        characterId: '123'
      };

      handler.handle(message);

      const dispatchCall = mockDispatcher.dispatch.mock.calls[0][0];
      expect(dispatchCall.diceValues).toEqual([]);
    });

    it('should add timestamp to roll message', () => {
      const timestamp = '2026-01-30T10:00:00Z';
      const message = {
        type: 'dice_roll',
        rollType: 'attack',
        characterId: '123',
        diceValues: [15],
        timestamp: timestamp
      };

      handler.handle(message);

      const dispatchCall = mockDispatcher.dispatch.mock.calls[0][0];
      expect(dispatchCall.timestamp).toBe(timestamp);
    });

    it('should throw error for unsupported message type', () => {
      const message = {
        type: 'unknown',
        rollType: 'attack',
        characterId: '123'
      };

      expect(() => handler.handle(message)).toThrow('does not support');
    });
  });

  describe('getName', () => {
    it('should return handler name', () => {
      expect(handler.getName()).toBe('DiceRollMessageHandler');
    });
  });
});

module.exports = DiceRollMessageHandler;
