/**
 * DiceExtractor Tests
 * Tests extraction of dice information from D&D Beyond roll events
 */

class DiceExtractor {
  /**
   * Extract roll type from message
   */
  extractRollType(message) {
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message object');
    }

    const rollType = message.rollType || message.type;
    if (!rollType) {
      throw new Error('Roll type not found in message');
    }

    return rollType.toLowerCase();
  }

  /**
   * Extract dice count and type from message
   */
  extractDiceInfo(message) {
    if (!message.dice) {
      throw new Error('No dice information in message');
    }

    const dice = message.dice;
    return {
      diceCount: dice.count || 1,
      diceType: dice.sides || 20,
      diceValues: dice.values || [],
      modifier: dice.modifier || 0
    };
  }

  /**
   * Extract character ID from message
   */
  extractCharacterId(message) {
    if (!message.characterId && !message.character?.id) {
      throw new Error('Character ID not found in message');
    }

    return message.characterId || message.character.id;
  }

  /**
   * Extract damage amount from message
   */
  extractDamageAmount(message) {
    if (message.damage === undefined && message.damageAmount === undefined) {
      throw new Error('Damage amount not found in message');
    }

    return message.damage !== undefined ? message.damage : message.damageAmount;
  }

  /**
   * Extract all relevant dice data from a message
   */
  extractAll(message) {
    return {
      rollType: this.extractRollType(message),
      characterId: this.extractCharacterId(message),
      diceInfo: this.extractDiceInfo(message),
      timestamp: message.timestamp || new Date().toISOString()
    };
  }
}

describe('DiceExtractor', () => {
  let extractor;

  beforeEach(() => {
    extractor = new DiceExtractor();
  });

  describe('extractRollType', () => {
    it('should extract roll type from message', () => {
      const message = { rollType: 'Attack' };
      expect(extractor.extractRollType(message)).toBe('attack');
    });

    it('should use type field if rollType not present', () => {
      const message = { type: 'Damage' };
      expect(extractor.extractRollType(message)).toBe('damage');
    });

    it('should return lowercase roll type', () => {
      const message = { rollType: 'INITIATIVE' };
      expect(extractor.extractRollType(message)).toBe('initiative');
    });

    it('should throw error if roll type not found', () => {
      expect(() => extractor.extractRollType({})).toThrow();
      expect(() => extractor.extractRollType(null)).toThrow();
    });
  });

  describe('extractDiceInfo', () => {
    it('should extract dice information', () => {
      const message = {
        dice: {
          count: 2,
          sides: 6,
          values: [4, 5],
          modifier: 3
        }
      };
      const info = extractor.extractDiceInfo(message);
      expect(info.diceCount).toBe(2);
      expect(info.diceType).toBe(6);
      expect(info.diceValues).toEqual([4, 5]);
      expect(info.modifier).toBe(3);
    });

    it('should use default values if not provided', () => {
      const message = { dice: {} };
      const info = extractor.extractDiceInfo(message);
      expect(info.diceCount).toBe(1);
      expect(info.diceType).toBe(20);
      expect(info.diceValues).toEqual([]);
      expect(info.modifier).toBe(0);
    });

    it('should throw error if dice info missing', () => {
      expect(() => extractor.extractDiceInfo({})).toThrow();
    });
  });

  describe('extractCharacterId', () => {
    it('should extract character ID from top level', () => {
      const message = { characterId: '123' };
      expect(extractor.extractCharacterId(message)).toBe('123');
    });

    it('should extract character ID from nested object', () => {
      const message = { character: { id: '456' } };
      expect(extractor.extractCharacterId(message)).toBe('456');
    });

    it('should prefer top-level characterId', () => {
      const message = { characterId: '123', character: { id: '456' } };
      expect(extractor.extractCharacterId(message)).toBe('123');
    });

    it('should throw error if character ID not found', () => {
      expect(() => extractor.extractCharacterId({})).toThrow();
    });
  });

  describe('extractDamageAmount', () => {
    it('should extract damage field', () => {
      const message = { damage: 15 };
      expect(extractor.extractDamageAmount(message)).toBe(15);
    });

    it('should extract damageAmount field', () => {
      const message = { damageAmount: 20 };
      expect(extractor.extractDamageAmount(message)).toBe(20);
    });

    it('should prefer damage field', () => {
      const message = { damage: 15, damageAmount: 20 };
      expect(extractor.extractDamageAmount(message)).toBe(15);
    });

    it('should handle zero damage', () => {
      const message = { damage: 0 };
      expect(extractor.extractDamageAmount(message)).toBe(0);
    });

    it('should throw error if damage not found', () => {
      expect(() => extractor.extractDamageAmount({})).toThrow();
    });
  });

  describe('extractAll', () => {
    it('should extract all data from message', () => {
      const message = {
        rollType: 'Attack',
        characterId: '123',
        dice: { count: 1, sides: 20, values: [18], modifier: 5 },
        timestamp: '2026-01-30T10:00:00Z'
      };
      const result = extractor.extractAll(message);
      expect(result.rollType).toBe('attack');
      expect(result.characterId).toBe('123');
      expect(result.diceInfo.diceCount).toBe(1);
      expect(result.timestamp).toBe('2026-01-30T10:00:00Z');
    });

    it('should generate timestamp if not provided', () => {
      const message = {
        rollType: 'Damage',
        characterId: '456',
        dice: { count: 2, sides: 6 }
      };
      const result = extractor.extractAll(message);
      expect(result.timestamp).toBeDefined();
    });
  });
});

module.exports = DiceExtractor;
