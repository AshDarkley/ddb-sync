/**
 * AttackRollHandler Tests
 * Tests handling of attack roll events from D&D Beyond
 */

class AttackRollHandler {
  constructor(characterMapper, diceExtractor) {
    this.characterMapper = characterMapper;
    this.diceExtractor = diceExtractor;
  }

  /**
   * Check if handler supports a given roll type
   */
  supports(rollType) {
    return rollType.toLowerCase() === 'attack' || rollType.toLowerCase() === 'tohit';
  }

  /**
   * Handle an attack roll
   */
  handle(message) {
    if (!this.supports(message.rollType)) {
      throw new Error(`Handler does not support roll type: ${message.rollType}`);
    }

    const characterId = this.diceExtractor.extractCharacterId(message);
    const diceInfo = this.diceExtractor.extractDiceInfo(message);
    const foundryActorId = this.characterMapper.getMapping(characterId);

    if (!foundryActorId) {
      throw new Error(`No actor found for character: ${characterId}`);
    }

    const total = diceInfo.diceValues.reduce((a, b) => a + b, 0) + diceInfo.modifier;
    const isCritical = diceInfo.diceValues[0] === 20;

    return {
      actorId: foundryActorId,
      rollType: 'attack',
      total: total,
      diceValues: diceInfo.diceValues,
      modifier: diceInfo.modifier,
      isCritical: isCritical,
      timestamp: message.timestamp || new Date().toISOString()
    };
  }

  /**
   * Get handler metadata
   */
  getMetadata() {
    return {
      name: 'AttackRollHandler',
      supports: ['attack', 'tohit'],
      description: 'Handles attack roll events from D&D Beyond'
    };
  }
}

describe('AttackRollHandler', () => {
  let handler;
  let mockMapper;
  let mockExtractor;

  beforeEach(() => {
    mockMapper = {
      getMapping: jest.fn((charId) => {
        if (charId === '123') return 'actor-456';
        return null;
      })
    };

    mockExtractor = {
      extractCharacterId: jest.fn((msg) => msg.characterId),
      extractDiceInfo: jest.fn((msg) => ({
        diceCount: 1,
        diceType: 20,
        diceValues: msg.diceValues || [15],
        modifier: msg.modifier || 0
      }))
    };

    handler = new AttackRollHandler(mockMapper, mockExtractor);
  });

  describe('supports', () => {
    it('should support attack rolls', () => {
      expect(handler.supports('attack')).toBe(true);
      expect(handler.supports('Attack')).toBe(true);
      expect(handler.supports('ATTACK')).toBe(true);
    });

    it('should support tohit rolls', () => {
      expect(handler.supports('tohit')).toBe(true);
      expect(handler.supports('ToHit')).toBe(true);
    });

    it('should not support other roll types', () => {
      expect(handler.supports('damage')).toBe(false);
      expect(handler.supports('save')).toBe(false);
      expect(handler.supports('ability')).toBe(false);
    });
  });

  describe('handle', () => {
    it('should handle attack roll successfully', () => {
      const message = {
        rollType: 'attack',
        characterId: '123',
        diceValues: [16],
        modifier: 3
      };
      const result = handler.handle(message);

      expect(result.actorId).toBe('actor-456');
      expect(result.rollType).toBe('attack');
      expect(result.total).toBe(19);
      expect(result.isCritical).toBe(false);
    });

    it('should mark critical hits', () => {
      const message = {
        rollType: 'attack',
        characterId: '123',
        diceValues: [20],
        modifier: 3
      };
      const result = handler.handle(message);

      expect(result.isCritical).toBe(true);
      expect(result.total).toBe(23);
    });

    it('should use alternative roll type name', () => {
      const message = {
        rollType: 'tohit',
        characterId: '123',
        diceValues: [15],
        modifier: 2
      };
      const result = handler.handle(message);

      expect(result.rollType).toBe('attack');
      expect(result.total).toBe(17);
    });

    it('should throw error for unsupported roll type', () => {
      const message = {
        rollType: 'damage',
        characterId: '123',
        diceValues: [10]
      };
      expect(() => handler.handle(message)).toThrow('does not support');
    });

    it('should throw error if character not mapped', () => {
      const message = {
        rollType: 'attack',
        characterId: 'unmapped',
        diceValues: [15],
        modifier: 2
      };
      mockMapper.getMapping.mockReturnValue(null);
      expect(() => handler.handle(message)).toThrow('No actor found');
    });

    it('should add timestamp to result', () => {
      const timestamp = '2026-01-30T10:00:00Z';
      const message = {
        rollType: 'attack',
        characterId: '123',
        diceValues: [15],
        modifier: 2,
        timestamp: timestamp
      };
      const result = handler.handle(message);

      expect(result.timestamp).toBe(timestamp);
    });

    it('should generate timestamp if not provided', () => {
      const message = {
        rollType: 'attack',
        characterId: '123',
        diceValues: [15],
        modifier: 2
      };
      const result = handler.handle(message);

      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getMetadata', () => {
    it('should return handler metadata', () => {
      const metadata = handler.getMetadata();

      expect(metadata.name).toBe('AttackRollHandler');
      expect(metadata.supports).toContain('attack');
      expect(metadata.supports).toContain('tohit');
      expect(metadata.description).toBeDefined();
    });
  });
});

module.exports = AttackRollHandler;
