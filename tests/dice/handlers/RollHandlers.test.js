/**
 * Additional Roll Handlers Tests
 * Tests for Save, Ability Check, and Initiative roll handlers
 */

class SaveRollHandler {
  constructor(characterMapper, diceExtractor) {
    this.characterMapper = characterMapper;
    this.diceExtractor = diceExtractor;
  }

  supports(rollType) {
    return rollType.toLowerCase() === 'save';
  }

  handle(message) {
    if (!this.supports(message.rollType)) {
      throw new Error(`Handler does not support: ${message.rollType}`);
    }

    const characterId = this.diceExtractor.extractCharacterId(message);
    const diceInfo = this.diceExtractor.extractDiceInfo(message);
    const foundryActorId = this.characterMapper.getMapping(characterId);

    if (!foundryActorId) {
      throw new Error(`No actor for character: ${characterId}`);
    }

    const total = diceInfo.diceValues.reduce((a, b) => a + b, 0) + diceInfo.modifier;

    return {
      actorId: foundryActorId,
      rollType: 'save',
      ability: message.ability || 'unknown',
      total: total,
      diceValues: diceInfo.diceValues,
      modifier: diceInfo.modifier
    };
  }
}

class AbilityCheckRollHandler {
  constructor(characterMapper, diceExtractor) {
    this.characterMapper = characterMapper;
    this.diceExtractor = diceExtractor;
  }

  supports(rollType) {
    return rollType.toLowerCase() === 'ability' || rollType.toLowerCase() === 'check';
  }

  handle(message) {
    if (!this.supports(message.rollType)) {
      throw new Error(`Handler does not support: ${message.rollType}`);
    }

    const characterId = this.diceExtractor.extractCharacterId(message);
    const diceInfo = this.diceExtractor.extractDiceInfo(message);
    const foundryActorId = this.characterMapper.getMapping(characterId);

    const total = diceInfo.diceValues.reduce((a, b) => a + b, 0) + diceInfo.modifier;

    return {
      actorId: foundryActorId,
      rollType: 'ability',
      ability: message.ability || 'unknown',
      total: total,
      diceValues: diceInfo.diceValues,
      modifier: diceInfo.modifier
    };
  }
}

class InitiativeRollHandler {
  constructor(characterMapper, diceExtractor) {
    this.characterMapper = characterMapper;
    this.diceExtractor = diceExtractor;
  }

  supports(rollType) {
    return rollType.toLowerCase() === 'initiative' || rollType.toLowerCase() === 'init';
  }

  handle(message) {
    if (!this.supports(message.rollType)) {
      throw new Error(`Handler does not support: ${message.rollType}`);
    }

    const characterId = this.diceExtractor.extractCharacterId(message);
    const diceInfo = this.diceExtractor.extractDiceInfo(message);
    const foundryActorId = this.characterMapper.getMapping(characterId);

    const total = diceInfo.diceValues[0] + diceInfo.modifier;

    return {
      actorId: foundryActorId,
      rollType: 'initiative',
      total: total,
      diceValue: diceInfo.diceValues[0],
      modifier: diceInfo.modifier
    };
  }
}

describe('SaveRollHandler', () => {
  let handler;
  let mockMapper;
  let mockExtractor;

  beforeEach(() => {
    mockMapper = {
      getMapping: jest.fn((charId) => charId === '123' ? 'actor-456' : null)
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

    handler = new SaveRollHandler(mockMapper, mockExtractor);
  });

  describe('supports', () => {
    it('should support save rolls', () => {
      expect(handler.supports('save')).toBe(true);
      expect(handler.supports('SAVE')).toBe(true);
    });

    it('should not support other types', () => {
      expect(handler.supports('attack')).toBe(false);
    });
  });

  describe('handle', () => {
    it('should handle save roll', () => {
      const message = {
        rollType: 'save',
        characterId: '123',
        diceValues: [12],
        modifier: 2,
        ability: 'dexterity'
      };

      const result = handler.handle(message);

      expect(result.rollType).toBe('save');
      expect(result.ability).toBe('dexterity');
      expect(result.total).toBe(14);
    });
  });
});

describe('AbilityCheckRollHandler', () => {
  let handler;
  let mockMapper;
  let mockExtractor;

  beforeEach(() => {
    mockMapper = {
      getMapping: jest.fn((charId) => charId === '123' ? 'actor-456' : null)
    };

    mockExtractor = {
      extractCharacterId: jest.fn((msg) => msg.characterId),
      extractDiceInfo: jest.fn((msg) => ({
        diceCount: 1,
        diceType: 20,
        diceValues: msg.diceValues || [10],
        modifier: msg.modifier || 0
      }))
    };

    handler = new AbilityCheckRollHandler(mockMapper, mockExtractor);
  });

  describe('supports', () => {
    it('should support ability checks', () => {
      expect(handler.supports('ability')).toBe(true);
      expect(handler.supports('check')).toBe(true);
      expect(handler.supports('ABILITY')).toBe(true);
    });

    it('should not support other types', () => {
      expect(handler.supports('save')).toBe(false);
    });
  });

  describe('handle', () => {
    it('should handle ability check', () => {
      const message = {
        rollType: 'ability',
        characterId: '123',
        diceValues: [14],
        modifier: 1,
        ability: 'strength'
      };

      const result = handler.handle(message);

      expect(result.rollType).toBe('ability');
      expect(result.ability).toBe('strength');
      expect(result.total).toBe(15);
    });

    it('should use check as rollType name', () => {
      const message = {
        rollType: 'check',
        characterId: '123',
        diceValues: [8],
        modifier: 2
      };

      const result = handler.handle(message);

      expect(result.rollType).toBe('ability');
    });
  });
});

describe('InitiativeRollHandler', () => {
  let handler;
  let mockMapper;
  let mockExtractor;

  beforeEach(() => {
    mockMapper = {
      getMapping: jest.fn((charId) => charId === '123' ? 'actor-456' : null)
    };

    mockExtractor = {
      extractCharacterId: jest.fn((msg) => msg.characterId),
      extractDiceInfo: jest.fn((msg) => ({
        diceCount: 1,
        diceType: 20,
        diceValues: msg.diceValues || [16],
        modifier: msg.modifier || 0
      }))
    };

    handler = new InitiativeRollHandler(mockMapper, mockExtractor);
  });

  describe('supports', () => {
    it('should support initiative rolls', () => {
      expect(handler.supports('initiative')).toBe(true);
      expect(handler.supports('init')).toBe(true);
      expect(handler.supports('INITIATIVE')).toBe(true);
    });

    it('should not support other types', () => {
      expect(handler.supports('attack')).toBe(false);
    });
  });

  describe('handle', () => {
    it('should handle initiative roll', () => {
      const message = {
        rollType: 'initiative',
        characterId: '123',
        diceValues: [18],
        modifier: 3
      };

      const result = handler.handle(message);

      expect(result.rollType).toBe('initiative');
      expect(result.diceValue).toBe(18);
      expect(result.total).toBe(21);
      expect(result.modifier).toBe(3);
    });

    it('should use init as rollType name', () => {
      const message = {
        rollType: 'init',
        characterId: '123',
        diceValues: [15],
        modifier: 2
      };

      const result = handler.handle(message);

      expect(result.rollType).toBe('initiative');
      expect(result.total).toBe(17);
    });

    it('should only use first dice value for initiative', () => {
      const message = {
        rollType: 'initiative',
        characterId: '123',
        diceValues: [15, 10, 8], // Multiple values
        modifier: 2
      };

      const result = handler.handle(message);

      expect(result.diceValue).toBe(15); // Only uses first
      expect(result.total).toBe(17);
    });
  });
});

module.exports = {
  SaveRollHandler,
  AbilityCheckRollHandler,
  InitiativeRollHandler
};
