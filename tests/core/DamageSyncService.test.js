/**
 * DamageSyncService Tests
 * Tests damage/HP synchronization between D&D Beyond and Foundry
 */

class DamageSyncService {
  constructor(characterMapper) {
    this.characterMapper = characterMapper;
  }

  /**
   * Sync damage from D&D Beyond to Foundry actor
   */
  syncDamage(ddbCharacterId, damageData) {
    if (!ddbCharacterId || !damageData) {
      throw new Error('ddbCharacterId and damageData are required');
    }

    const foundryActorId = this.characterMapper.getMapping(ddbCharacterId);
    if (!foundryActorId) {
      throw new Error(`No mapping found for character ${ddbCharacterId}`);
    }

    const hpUpdate = this.calculateHPUpdate(damageData);
    return {
      actorId: foundryActorId,
      hpUpdate: hpUpdate,
      appliedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate HP update from damage data
   */
  calculateHPUpdate(damageData) {
    const maxHp = damageData.maxHp || 0;
    const currentHp = damageData.currentHp !== undefined ? damageData.currentHp : maxHp;
    const tempHp = damageData.tempHp || 0;

    return {
      maxHp: maxHp,
      currentHp: currentHp,
      tempHp: tempHp,
      damageDealt: Math.max(0, maxHp - currentHp)
    };
  }

  /**
   * Check if character is at max HP
   */
  isFullyHealed(damageData) {
    return damageData.currentHp === damageData.maxHp && damageData.tempHp === 0;
  }

  /**
   * Check if character is dead (0 or negative HP)
   */
  isDead(damageData) {
    return damageData.currentHp <= 0;
  }

  /**
   * Get healing needed to reach max HP
   */
  getHealingNeeded(damageData) {
    if (this.isFullyHealed(damageData)) {
      return 0;
    }
    return Math.max(0, damageData.maxHp - damageData.currentHp);
  }
}

describe('DamageSyncService', () => {
  let damageService;
  let mockMapper;

  beforeEach(() => {
    mockMapper = {
      getMapping: jest.fn((ddbId) => {
        const mappings = { '123': 'actor-456', '789': 'actor-012' };
        return mappings[ddbId] || null;
      })
    };
    damageService = new DamageSyncService(mockMapper);
  });

  describe('syncDamage', () => {
    it('should sync damage for a mapped character', () => {
      const damageData = { maxHp: 50, currentHp: 40, tempHp: 0 };
      const result = damageService.syncDamage('123', damageData);

      expect(result.actorId).toBe('actor-456');
      expect(result.hpUpdate).toEqual({
        maxHp: 50,
        currentHp: 40,
        tempHp: 0,
        damageDealt: 10
      });
      expect(result.appliedAt).toBeDefined();
    });

    it('should throw error if character is not mapped', () => {
      const damageData = { maxHp: 50, currentHp: 40, tempHp: 0 };
      expect(() => damageService.syncDamage('unmapped', damageData)).toThrow();
    });

    it('should throw error if ddbCharacterId is missing', () => {
      const damageData = { maxHp: 50, currentHp: 40, tempHp: 0 };
      expect(() => damageService.syncDamage(null, damageData)).toThrow();
    });

    it('should throw error if damageData is missing', () => {
      expect(() => damageService.syncDamage('123', null)).toThrow();
    });

    it('should handle temporary HP', () => {
      const damageData = { maxHp: 50, currentHp: 40, tempHp: 5 };
      const result = damageService.syncDamage('123', damageData);
      expect(result.hpUpdate.tempHp).toBe(5);
    });
  });

  describe('calculateHPUpdate', () => {
    it('should calculate HP update correctly', () => {
      const damageData = { maxHp: 100, currentHp: 75, tempHp: 10 };
      const update = damageService.calculateHPUpdate(damageData);

      expect(update.maxHp).toBe(100);
      expect(update.currentHp).toBe(75);
      expect(update.tempHp).toBe(10);
      expect(update.damageDealt).toBe(25);
    });

    it('should handle default values', () => {
      const damageData = { maxHp: 50 };
      const update = damageService.calculateHPUpdate(damageData);

      expect(update.maxHp).toBe(50);
      expect(update.currentHp).toBe(50);
      expect(update.tempHp).toBe(0);
      expect(update.damageDealt).toBe(0);
    });

    it('should not calculate negative damage', () => {
      const damageData = { maxHp: 50, currentHp: 60, tempHp: 0 };
      const update = damageService.calculateHPUpdate(damageData);
      expect(update.damageDealt).toBe(0);
    });
  });

  describe('isFullyHealed', () => {
    it('should return true when at max HP with no temp HP', () => {
      const damageData = { maxHp: 100, currentHp: 100, tempHp: 0 };
      expect(damageService.isFullyHealed(damageData)).toBe(true);
    });

    it('should return false when below max HP', () => {
      const damageData = { maxHp: 100, currentHp: 99, tempHp: 0 };
      expect(damageService.isFullyHealed(damageData)).toBe(false);
    });

    it('should return false when has temp HP', () => {
      const damageData = { maxHp: 100, currentHp: 100, tempHp: 5 };
      expect(damageService.isFullyHealed(damageData)).toBe(false);
    });
  });

  describe('isDead', () => {
    it('should return true when HP is 0', () => {
      const damageData = { currentHp: 0 };
      expect(damageService.isDead(damageData)).toBe(true);
    });

    it('should return true when HP is negative', () => {
      const damageData = { currentHp: -10 };
      expect(damageService.isDead(damageData)).toBe(true);
    });

    it('should return false when HP is positive', () => {
      const damageData = { currentHp: 1 };
      expect(damageService.isDead(damageData)).toBe(false);
    });
  });

  describe('getHealingNeeded', () => {
    it('should return healing needed to reach max HP', () => {
      const damageData = { maxHp: 100, currentHp: 75, tempHp: 0 };
      expect(damageService.getHealingNeeded(damageData)).toBe(25);
    });

    it('should return 0 when fully healed', () => {
      const damageData = { maxHp: 100, currentHp: 100, tempHp: 0 };
      expect(damageService.getHealingNeeded(damageData)).toBe(0);
    });

    it('should not return negative healing needed', () => {
      const damageData = { maxHp: 100, currentHp: 110, tempHp: 0 };
      expect(damageService.getHealingNeeded(damageData)).toBe(0);
    });

    it('should ignore temp HP in healing calculation', () => {
      const damageData = { maxHp: 100, currentHp: 75, tempHp: 10 };
      expect(damageService.getHealingNeeded(damageData)).toBe(25);
    });
  });
});

module.exports = DamageSyncService;
