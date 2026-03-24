/**
 * RollBuilder Tests
 * Tests extraction and building of dice rolls from D&D Beyond data
 */

class RollBuilder {
  /**
   * Extract dice notation from a roll result
   */
  extractDiceNotation(diceCount, diceType, modifier = 0) {
    if (!Number.isInteger(diceCount) || diceCount < 1) {
      throw new Error('Dice count must be a positive integer');
    }
    if (!Number.isInteger(diceType) || diceType < 1) {
      throw new Error('Dice type must be a positive integer');
    }

    const notation = `${diceCount}d${diceType}`;
    if (modifier !== 0) {
      const sign = modifier > 0 ? '+' : '';
      return `${notation}${sign}${modifier}`;
    }
    return notation;
  }

  /**
   * Parse roll result and extract individual die values
   */
  parseRollResult(rollString) {
    const dicePattern = /(\d+)d(\d+)/;
    const match = rollString.match(dicePattern);
    if (!match) {
      throw new Error('Invalid roll format');
    }

    return {
      diceCount: parseInt(match[1]),
      diceType: parseInt(match[2]),
      notation: rollString
    };
  }

  /**
   * Calculate total from dice roll
   */
  calculateTotal(diceValues, modifier = 0) {
    if (!Array.isArray(diceValues)) {
      throw new Error('diceValues must be an array');
    }

    const sum = diceValues.reduce((acc, val) => {
      if (!Number.isInteger(val) || val < 1) {
        throw new Error('Invalid dice value');
      }
      return acc + val;
    }, 0);

    return sum + modifier;
  }

  /**
   * Determine if a roll is a critical hit (nat 20)
   */
  isCriticalHit(rollValue, diceType = 20) {
    return rollValue === diceType;
  }

  /**
   * Determine if a roll is a critical fail (nat 1)
   */
  isCriticalFail(rollValue) {
    return rollValue === 1;
  }

  /**
   * Build full roll result object
   */
  buildRollResult(diceCount, diceType, diceValues, modifier = 0, rollType = 'generic') {
    const total = this.calculateTotal(diceValues, modifier);
    return {
      rollType: rollType,
      diceCount: diceCount,
      diceType: diceType,
      diceValues: diceValues,
      modifier: modifier,
      total: total,
      isCritical: this.isCriticalHit(diceValues[0]),
      isFail: this.isCriticalFail(diceValues[0])
    };
  }
}

describe('RollBuilder', () => {
  let rollBuilder;

  beforeEach(() => {
    rollBuilder = new RollBuilder();
  });

  describe('extractDiceNotation', () => {
    it('should extract simple dice notation', () => {
      expect(rollBuilder.extractDiceNotation(1, 20)).toBe('1d20');
      expect(rollBuilder.extractDiceNotation(2, 6)).toBe('2d6');
    });

    it('should include positive modifier', () => {
      expect(rollBuilder.extractDiceNotation(1, 20, 5)).toBe('1d20+5');
    });

    it('should include negative modifier', () => {
      expect(rollBuilder.extractDiceNotation(1, 20, -3)).toBe('1d20-3');
    });

    it('should omit zero modifier', () => {
      expect(rollBuilder.extractDiceNotation(1, 20, 0)).toBe('1d20');
    });

    it('should throw error for invalid dice count', () => {
      expect(() => rollBuilder.extractDiceNotation(0, 20)).toThrow();
      expect(() => rollBuilder.extractDiceNotation(-1, 20)).toThrow();
      expect(() => rollBuilder.extractDiceNotation(1.5, 20)).toThrow();
    });

    it('should throw error for invalid dice type', () => {
      expect(() => rollBuilder.extractDiceNotation(1, 0)).toThrow();
      expect(() => rollBuilder.extractDiceNotation(1, -1)).toThrow();
    });
  });

  describe('parseRollResult', () => {
    it('should parse simple roll notation', () => {
      const result = rollBuilder.parseRollResult('1d20');
      expect(result.diceCount).toBe(1);
      expect(result.diceType).toBe(20);
    });

    it('should parse notation with modifier', () => {
      const result = rollBuilder.parseRollResult('2d6+5');
      expect(result.diceCount).toBe(2);
      expect(result.diceType).toBe(6);
    });

    it('should throw error for invalid format', () => {
      expect(() => rollBuilder.parseRollResult('invalid')).toThrow();
      expect(() => rollBuilder.parseRollResult('20')).toThrow();
    });
  });

  describe('calculateTotal', () => {
    it('should sum dice values', () => {
      const total = rollBuilder.calculateTotal([15, 3, 8]);
      expect(total).toBe(26);
    });

    it('should add modifier to sum', () => {
      const total = rollBuilder.calculateTotal([15, 3, 8], 5);
      expect(total).toBe(31);
    });

    it('should handle single die', () => {
      const total = rollBuilder.calculateTotal([20]);
      expect(total).toBe(20);
    });

    it('should handle single die with modifier', () => {
      const total = rollBuilder.calculateTotal([15], 5);
      expect(total).toBe(20);
    });

    it('should handle negative modifier', () => {
      const total = rollBuilder.calculateTotal([10, 5], -3);
      expect(total).toBe(12);
    });

    it('should throw error for non-array input', () => {
      expect(() => rollBuilder.calculateTotal('not-array')).toThrow();
    });

    it('should throw error for invalid die values', () => {
      expect(() => rollBuilder.calculateTotal([0, 5])).toThrow();
      expect(() => rollBuilder.calculateTotal([1.5, 5])).toThrow();
    });
  });

  describe('isCriticalHit', () => {
    it('should return true for nat 20', () => {
      expect(rollBuilder.isCriticalHit(20)).toBe(true);
    });

    it('should return false for non-20 rolls', () => {
      expect(rollBuilder.isCriticalHit(19)).toBe(false);
      expect(rollBuilder.isCriticalHit(1)).toBe(false);
    });

    it('should use custom dice type', () => {
      expect(rollBuilder.isCriticalHit(12, 12)).toBe(true);
      expect(rollBuilder.isCriticalHit(11, 12)).toBe(false);
    });
  });

  describe('isCriticalFail', () => {
    it('should return true for nat 1', () => {
      expect(rollBuilder.isCriticalFail(1)).toBe(true);
    });

    it('should return false for non-1 rolls', () => {
      expect(rollBuilder.isCriticalFail(2)).toBe(false);
      expect(rollBuilder.isCriticalFail(20)).toBe(false);
    });
  });

  describe('buildRollResult', () => {
    it('should build complete roll result', () => {
      const result = rollBuilder.buildRollResult(1, 20, [15], 5, 'attack');
      expect(result.rollType).toBe('attack');
      expect(result.total).toBe(20);
      expect(result.isCritical).toBe(false);
      expect(result.isFail).toBe(false);
    });

    it('should mark critical hits', () => {
      const result = rollBuilder.buildRollResult(1, 20, [20], 0, 'attack');
      expect(result.isCritical).toBe(true);
    });

    it('should mark critical fails', () => {
      const result = rollBuilder.buildRollResult(1, 20, [1], 5, 'attack');
      expect(result.isFail).toBe(true);
    });

    it('should handle multiple dice', () => {
      const result = rollBuilder.buildRollResult(3, 6, [4, 5, 6], 0, 'damage');
      expect(result.total).toBe(15);
      expect(result.diceCount).toBe(3);
    });
  });
});

module.exports = RollBuilder;
