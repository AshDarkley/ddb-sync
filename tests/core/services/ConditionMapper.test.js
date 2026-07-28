/**
 * ConditionMapper Tests
 *
 * Repo convention: jest (CommonJS, node env) cannot import the Foundry ES
 * modules in scripts/, so these tests run against the CommonJS mirror in
 * tests/mirrors/ConditionMapper.js. If you change
 * scripts/core/services/ConditionMapper.js, change the mirror too.
 */

const ConditionMapper = require('../../mirrors/ConditionMapper.js');

describe('ConditionMapper', () => {
  describe('toStatuses', () => {
    it('maps a DDB condition id to the matching dnd5e status id', () => {
      expect(ConditionMapper.toStatuses([{ id: 12, level: null }])).toEqual(new Set(['prone']));
    });

    it('maps every core condition', () => {
      const all = Object.keys(ConditionMapper.DDB_CONDITION_STATUS).map((id) => ({ id: Number(id), level: null }));
      const statuses = ConditionMapper.toStatuses(all);

      expect(statuses.size).toBe(14); // 15 conditions minus exhaustion
      expect(statuses.has('blinded')).toBe(true);
      expect(statuses.has('unconscious')).toBe(true);
    });

    it('maps multiple simultaneous conditions', () => {
      const statuses = ConditionMapper.toStatuses([{ id: 11 }, { id: 13 }]);
      expect(statuses).toEqual(new Set(['poisoned', 'restrained']));
    });

    it('accepts string ids from the DDB payload', () => {
      expect(ConditionMapper.toStatuses([{ id: '5' }])).toEqual(new Set(['frightened']));
    });

    it('leaves exhaustion out - it is driven by its level, not a toggle', () => {
      expect(ConditionMapper.toStatuses([{ id: 4, level: 3 }])).toEqual(new Set());
    });

    it('ignores unknown (homebrew) condition ids', () => {
      expect(ConditionMapper.toStatuses([{ id: 99 }, { id: 12 }])).toEqual(new Set(['prone']));
    });

    it('returns an empty set for an empty condition list', () => {
      expect(ConditionMapper.toStatuses([])).toEqual(new Set());
    });

    it('returns an empty set when conditions are missing', () => {
      expect(ConditionMapper.toStatuses(undefined)).toEqual(new Set());
      expect(ConditionMapper.toStatuses(null)).toEqual(new Set());
    });
  });

  describe('exhaustionLevel', () => {
    it('returns the level DDB reports', () => {
      expect(ConditionMapper.exhaustionLevel([{ id: 4, level: 3 }])).toBe(3);
    });

    it('returns 0 when the character is not exhausted', () => {
      expect(ConditionMapper.exhaustionLevel([{ id: 12, level: null }])).toBe(0);
    });

    it('returns 0 for an empty or missing condition list', () => {
      expect(ConditionMapper.exhaustionLevel([])).toBe(0);
      expect(ConditionMapper.exhaustionLevel(undefined)).toBe(0);
    });

    it('treats a levelless exhaustion entry as level 1', () => {
      expect(ConditionMapper.exhaustionLevel([{ id: 4, level: null }])).toBe(1);
      expect(ConditionMapper.exhaustionLevel([{ id: 4 }])).toBe(1);
      expect(ConditionMapper.exhaustionLevel([{ id: 4, level: 0 }])).toBe(1);
    });

    it('clamps levels above the 5e maximum', () => {
      expect(ConditionMapper.exhaustionLevel([{ id: 4, level: 9 }])).toBe(6);
    });
  });

  describe('toggleStatuses', () => {
    it('covers the core conditions except exhaustion', () => {
      const statuses = ConditionMapper.toggleStatuses;
      expect(statuses).toHaveLength(14);
      expect(statuses).not.toContain('exhaustion');
      expect(statuses).toContain('grappled');
    });
  });
});
