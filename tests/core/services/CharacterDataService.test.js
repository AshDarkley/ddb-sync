/**
 * CharacterDataService Tests
 * Tests fetching and processing character data from D&D Beyond
 */

class CharacterDataService {
  constructor(proxyUrl = 'http://localhost:3000') {
    this.proxyUrl = proxyUrl;
  }

  /**
   * Format character URL for API call
   */
  formatCharacterUrl(characterId) {
    if (!characterId || typeof characterId !== 'string') {
      throw new Error('Invalid character ID');
    }

    return `${this.proxyUrl}/character/${characterId}`;
  }

  /**
   * Validate character data structure
   */
  validateCharacterData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid character data');
    }

    if (!data.id || !data.name) {
      throw new Error('Character data missing required fields: id, name');
    }

    return true;
  }

  /**
   * Extract relevant character info for mapping
   */
  extractCharacterInfo(characterData) {
    this.validateCharacterData(characterData);

    return {
      id: characterData.id,
      name: characterData.name,
      class: characterData.class || 'Unknown',
      level: characterData.level || 1,
      maxHp: characterData.maxHp || 0,
      currentHp: characterData.currentHp || 0,
      tempHp: characterData.tempHp || 0
    };
  }

  /**
   * Calculate character state
   */
  getCharacterState(characterData) {
    const hp = characterData.currentHp || 0;
    const maxHp = characterData.maxHp || 1;

    if (hp <= 0) {
      return 'dead';
    } else if (hp >= maxHp) {
      return 'healthy';
    } else if (hp < maxHp / 4) {
      return 'critical';
    } else {
      return 'wounded';
    }
  }

  /**
   * Format character data for display
   */
  formatCharacterDisplay(characterData) {
    const info = this.extractCharacterInfo(characterData);
    const state = this.getCharacterState(characterData);

    return {
      display: `${info.name} (Level ${info.level} ${info.class})`,
      health: `${info.currentHp}/${info.maxHp} HP`,
      state: state,
      details: info
    };
  }

  /**
   * Set proxy URL
   */
  setProxyUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid proxy URL');
    }

    this.proxyUrl = url;
    return true;
  }

  /**
   * Get current proxy URL
   */
  getProxyUrl() {
    return this.proxyUrl;
  }
}

describe('CharacterDataService', () => {
  let service;

  beforeEach(() => {
    service = new CharacterDataService('http://localhost:3000');
  });

  describe('formatCharacterUrl', () => {
    it('should format correct URL for character ID', () => {
      const url = service.formatCharacterUrl('123');
      expect(url).toBe('http://localhost:3000/character/123');
    });

    it('should use proxy URL in formatted URL', () => {
      service.setProxyUrl('https://api.example.com');
      const url = service.formatCharacterUrl('456');
      expect(url).toBe('https://api.example.com/character/456');
    });

    it('should throw error for invalid character ID', () => {
      expect(() => service.formatCharacterUrl(null)).toThrow();
      expect(() => service.formatCharacterUrl('')).toThrow();
      expect(() => service.formatCharacterUrl(123)).toThrow();
    });
  });

  describe('validateCharacterData', () => {
    it('should validate correct character data', () => {
      const data = { id: '123', name: 'Aragorn' };
      expect(service.validateCharacterData(data)).toBe(true);
    });

    it('should throw error for missing id', () => {
      const data = { name: 'Aragorn' };
      expect(() => service.validateCharacterData(data)).toThrow();
    });

    it('should throw error for missing name', () => {
      const data = { id: '123' };
      expect(() => service.validateCharacterData(data)).toThrow();
    });

    it('should throw error for invalid data', () => {
      expect(() => service.validateCharacterData(null)).toThrow();
      expect(() => service.validateCharacterData('not-object')).toThrow();
    });
  });

  describe('extractCharacterInfo', () => {
    it('should extract required character info', () => {
      const data = {
        id: '123',
        name: 'Aragorn',
        class: 'Ranger',
        level: 10,
        maxHp: 100,
        currentHp: 85,
        tempHp: 0
      };
      const info = service.extractCharacterInfo(data);

      expect(info.id).toBe('123');
      expect(info.name).toBe('Aragorn');
      expect(info.class).toBe('Ranger');
      expect(info.level).toBe(10);
      expect(info.maxHp).toBe(100);
      expect(info.currentHp).toBe(85);
      expect(info.tempHp).toBe(0);
    });

    it('should use defaults for missing optional fields', () => {
      const data = { id: '123', name: 'Legolas' };
      const info = service.extractCharacterInfo(data);

      expect(info.class).toBe('Unknown');
      expect(info.level).toBe(1);
      expect(info.maxHp).toBe(0);
    });
  });

  describe('getCharacterState', () => {
    it('should return dead when HP is 0', () => {
      const data = { currentHp: 0, maxHp: 100 };
      expect(service.getCharacterState(data)).toBe('dead');
    });

    it('should return dead when HP is negative', () => {
      const data = { currentHp: -10, maxHp: 100 };
      expect(service.getCharacterState(data)).toBe('dead');
    });

    it('should return healthy when at max HP', () => {
      const data = { currentHp: 100, maxHp: 100 };
      expect(service.getCharacterState(data)).toBe('healthy');
    });

    it('should return critical when below 25% HP', () => {
      const data = { currentHp: 20, maxHp: 100 };
      expect(service.getCharacterState(data)).toBe('critical');
    });

    it('should return wounded when between 25% and 100% HP', () => {
      const data = { currentHp: 75, maxHp: 100 };
      expect(service.getCharacterState(data)).toBe('wounded');
    });
  });

  describe('formatCharacterDisplay', () => {
    it('should format character for display', () => {
      const data = {
        id: '123',
        name: 'Gandalf',
        class: 'Wizard',
        level: 20,
        maxHp: 120,
        currentHp: 90,
        tempHp: 10
      };
      const display = service.formatCharacterDisplay(data);

      expect(display.display).toContain('Gandalf');
      expect(display.display).toContain('Level 20');
      expect(display.display).toContain('Wizard');
      expect(display.health).toBe('90/120 HP');
      expect(display.state).toBe('wounded');
    });

    it('should show correct state in display', () => {
      const data = {
        id: '123',
        name: 'Frodo',
        class: 'Rogue',
        level: 1,
        maxHp: 40,
        currentHp: 0
      };
      const display = service.formatCharacterDisplay(data);

      expect(display.state).toBe('dead');
    });
  });

  describe('setProxyUrl', () => {
    it('should set new proxy URL', () => {
      service.setProxyUrl('https://api.example.com');
      expect(service.getProxyUrl()).toBe('https://api.example.com');
    });

    it('should throw error for invalid URL', () => {
      expect(() => service.setProxyUrl(null)).toThrow();
      expect(() => service.setProxyUrl('')).toThrow();
    });

    it('should use new URL in subsequent calls', () => {
      service.setProxyUrl('https://new.api.com');
      const url = service.formatCharacterUrl('789');
      expect(url).toContain('https://new.api.com');
    });
  });

  describe('getProxyUrl', () => {
    it('should return current proxy URL', () => {
      expect(service.getProxyUrl()).toBe('http://localhost:3000');
    });

    it('should reflect changes after setProxyUrl', () => {
      service.setProxyUrl('https://updated.com');
      expect(service.getProxyUrl()).toBe('https://updated.com');
    });
  });
});

module.exports = CharacterDataService;
