/**
 * DamageMessageHandler Tests
 * Tests handling of damage/HP update messages from D&D Beyond
 */

class DamageMessageHandler {
  constructor(damageSyncService, characterMapper) {
    this.damageSyncService = damageSyncService;
    this.characterMapper = characterMapper;
  }

  /**
   * Check if this handler supports a message type
   */
  supports(messageType) {
    return messageType === 'damage' || messageType === 'hp_update' || messageType === 'character_update';
  }

  /**
   * Handle a damage message
   */
  handle(message) {
    if (!this.supports(message.type)) {
      throw new Error(`Handler does not support message type: ${message.type}`);
    }

    const characterId = message.characterId || message.character?.id;
    if (!characterId) {
      throw new Error('Character ID not found in message');
    }

    // Check if character is mapped
    if (!this.characterMapper.isMapped(characterId)) {
      return {
        success: false,
        reason: 'Character not mapped',
        characterId: characterId
      };
    }

    // Extract damage data
    const damageData = {
      maxHp: message.maxHp || 0,
      currentHp: message.currentHp !== undefined ? message.currentHp : message.maxHp || 0,
      tempHp: message.tempHp || 0
    };

    // Sync damage
    try {
      const result = this.damageSyncService.syncDamage(characterId, damageData);
      return {
        success: true,
        result: result,
        characterId: characterId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        characterId: characterId
      };
    }
  }

  /**
   * Get handler name
   */
  getName() {
    return 'DamageMessageHandler';
  }
}

describe('DamageMessageHandler', () => {
  let handler;
  let mockDamageService;
  let mockMapper;

  beforeEach(() => {
    mockDamageService = {
      syncDamage: jest.fn((charId, data) => ({
        actorId: 'actor-456',
        hpUpdate: {
          maxHp: data.maxHp,
          currentHp: data.currentHp,
          tempHp: data.tempHp,
          damageDealt: Math.max(0, data.maxHp - data.currentHp)
        }
      }))
    };

    mockMapper = {
      isMapped: jest.fn((charId) => charId === '123'),
      getMapping: jest.fn((charId) => charId === '123' ? 'actor-456' : null)
    };

    handler = new DamageMessageHandler(mockDamageService, mockMapper);
  });

  describe('supports', () => {
    it('should support damage message type', () => {
      expect(handler.supports('damage')).toBe(true);
    });

    it('should support hp_update message type', () => {
      expect(handler.supports('hp_update')).toBe(true);
    });

    it('should support character_update message type', () => {
      expect(handler.supports('character_update')).toBe(true);
    });

    it('should not support other message types', () => {
      expect(handler.supports('roll')).toBe(false);
      expect(handler.supports('unknown')).toBe(false);
    });
  });

  describe('handle', () => {
    it('should handle damage message successfully', () => {
      const message = {
        type: 'damage',
        characterId: '123',
        maxHp: 100,
        currentHp: 85,
        tempHp: 0
      };

      const result = handler.handle(message);

      expect(result.success).toBe(true);
      expect(result.result.actorId).toBe('actor-456');
      expect(mockDamageService.syncDamage).toHaveBeenCalledWith('123', expect.objectContaining({
        maxHp: 100,
        currentHp: 85,
        tempHp: 0
      }));
    });

    it('should handle character ID from nested object', () => {
      const message = {
        type: 'character_update',
        character: { id: '123' },
        maxHp: 100,
        currentHp: 75
      };

      const result = handler.handle(message);

      expect(result.success).toBe(true);
      expect(mockDamageService.syncDamage).toHaveBeenCalledWith('123', expect.any(Object));
    });

    it('should return failure if character not mapped', () => {
      const message = {
        type: 'damage',
        characterId: 'unmapped',
        maxHp: 100,
        currentHp: 85
      };

      const result = handler.handle(message);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Character not mapped');
    });

    it('should use default HP values', () => {
      const message = {
        type: 'hp_update',
        characterId: '123'
      };

      handler.handle(message);

      const call = mockDamageService.syncDamage.mock.calls[0];
      expect(call[1].maxHp).toBe(0);
      expect(call[1].tempHp).toBe(0);
    });

    it('should include temp HP in sync', () => {
      const message = {
        type: 'damage',
        characterId: '123',
        maxHp: 100,
        currentHp: 80,
        tempHp: 15
      };

      handler.handle(message);

      const call = mockDamageService.syncDamage.mock.calls[0];
      expect(call[1].tempHp).toBe(15);
    });

    it('should return error if damage sync fails', () => {
      mockDamageService.syncDamage.mockImplementation(() => {
        throw new Error('Sync failed');
      });

      const message = {
        type: 'damage',
        characterId: '123',
        maxHp: 100,
        currentHp: 85
      };

      const result = handler.handle(message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sync failed');
    });

    it('should throw error for unsupported message type', () => {
      const message = {
        type: 'unknown',
        characterId: '123'
      };

      expect(() => handler.handle(message)).toThrow('does not support');
    });

    it('should throw error if character ID missing', () => {
      const message = {
        type: 'damage',
        maxHp: 100
      };

      expect(() => handler.handle(message)).toThrow('Character ID');
    });
  });

  describe('getName', () => {
    it('should return handler name', () => {
      expect(handler.getName()).toBe('DamageMessageHandler');
    });
  });
});

module.exports = DamageMessageHandler;
