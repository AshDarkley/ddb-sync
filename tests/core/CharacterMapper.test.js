/**
 * CharacterMapper Service Tests
 * Tests mapping logic between D&D Beyond characters and Foundry actors
 */

class CharacterMapper {
  constructor() {
    this.mappings = {};
  }

  addMapping(ddbId, foundryId) {
    if (!ddbId || !foundryId) {
      throw new Error('Both ddbId and foundryId are required');
    }
    this.mappings[ddbId] = foundryId;
    return true;
  }

  removeMapping(ddbId) {
    if (!this.mappings[ddbId]) {
      throw new Error(`No mapping found for ddbId: ${ddbId}`);
    }
    delete this.mappings[ddbId];
    return true;
  }

  getMapping(ddbId) {
    return this.mappings[ddbId] || null;
  }

  getMappings() {
    return { ...this.mappings };
  }

  isMapped(ddbId) {
    return ddbId in this.mappings;
  }

  loadMappings(mappingsData) {
    this.mappings = { ...mappingsData };
    return true;
  }
}

describe('CharacterMapper', () => {
  let mapper;

  beforeEach(() => {
    mapper = new CharacterMapper();
  });

  describe('addMapping', () => {
    it('should add a mapping between ddbId and foundryId', () => {
      const result = mapper.addMapping('123', 'actor-456');
      expect(result).toBe(true);
      expect(mapper.getMapping('123')).toBe('actor-456');
    });

    it('should throw error if ddbId is missing', () => {
      expect(() => mapper.addMapping(null, 'actor-456')).toThrow();
    });

    it('should throw error if foundryId is missing', () => {
      expect(() => mapper.addMapping('123', null)).toThrow();
    });

    it('should overwrite existing mapping', () => {
      mapper.addMapping('123', 'actor-456');
      mapper.addMapping('123', 'actor-789');
      expect(mapper.getMapping('123')).toBe('actor-789');
    });
  });

  describe('removeMapping', () => {
    it('should remove an existing mapping', () => {
      mapper.addMapping('123', 'actor-456');
      const result = mapper.removeMapping('123');
      expect(result).toBe(true);
      expect(mapper.getMapping('123')).toBeNull();
    });

    it('should throw error if mapping does not exist', () => {
      expect(() => mapper.removeMapping('non-existent')).toThrow();
    });
  });

  describe('getMapping', () => {
    it('should return the mapped foundryId for a ddbId', () => {
      mapper.addMapping('123', 'actor-456');
      expect(mapper.getMapping('123')).toBe('actor-456');
    });

    it('should return null if mapping does not exist', () => {
      expect(mapper.getMapping('non-existent')).toBeNull();
    });
  });

  describe('getMappings', () => {
    it('should return all mappings as a copy', () => {
      mapper.addMapping('123', 'actor-456');
      mapper.addMapping('789', 'actor-012');
      const mappings = mapper.getMappings();
      expect(mappings).toEqual({ '123': 'actor-456', '789': 'actor-012' });
    });

    it('should return a copy, not a reference', () => {
      mapper.addMapping('123', 'actor-456');
      const mappings = mapper.getMappings();
      mappings['999'] = 'actor-999';
      expect(mapper.getMapping('999')).toBeNull();
    });
  });

  describe('isMapped', () => {
    it('should return true if ddbId is mapped', () => {
      mapper.addMapping('123', 'actor-456');
      expect(mapper.isMapped('123')).toBe(true);
    });

    it('should return false if ddbId is not mapped', () => {
      expect(mapper.isMapped('non-existent')).toBe(false);
    });
  });

  describe('loadMappings', () => {
    it('should load all mappings from data object', () => {
      const data = { '123': 'actor-456', '789': 'actor-012' };
      mapper.loadMappings(data);
      expect(mapper.getMappings()).toEqual(data);
    });

    it('should replace existing mappings', () => {
      mapper.addMapping('old', 'actor-old');
      mapper.loadMappings({ '123': 'actor-456' });
      expect(mapper.getMapping('old')).toBeNull();
      expect(mapper.getMapping('123')).toBe('actor-456');
    });
  });
});

module.exports = CharacterMapper;
