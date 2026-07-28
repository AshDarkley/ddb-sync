/**
 * ConditionSyncService Tests
 *
 * Repo convention: jest (CommonJS, node env) cannot import the Foundry ES
 * modules in scripts/, so the class below is an inline mirror of
 * scripts/core/services/ConditionSyncService.js (its ConditionMapper
 * dependency is mirrored in tests/mirrors/). If you change one, change both.
 */

const ConditionMapper = require('../../mirrors/ConditionMapper.js');

class ConditionSyncService {
  constructor() {
    this.logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  }

  isEnabled() {
    try {
      return game.settings.get('ddb-sync', 'syncConditions') !== false;
    } catch {
      return true;
    }
  }

  async applyFromCharacter(actor, character) {
    if (!actor) return;

    const ddbConditions = character?.conditions;
    const desired = ConditionMapper.toStatuses(ddbConditions);
    const applied = [];
    const removed = [];

    for (const status of ConditionMapper.toggleStatuses) {
      const shouldBeActive = desired.has(status);
      if (shouldBeActive === this.hasStatus(actor, status)) continue;

      const toggled = await this.toggleStatus(actor, status, shouldBeActive);
      if (!toggled) continue;
      (shouldBeActive ? applied : removed).push(this.getConditionLabel(status));
    }

    const exhaustionChange = await this.syncExhaustion(actor, ConditionMapper.exhaustionLevel(ddbConditions));
    if (exhaustionChange) {
      (exhaustionChange.level > 0 ? applied : removed).push(exhaustionChange.label);
    }

    if (!applied.length && !removed.length) return;

    this.logger.log(
      `DDB Sync | Conditions for ${actor.name} - applied: [${applied.join(', ')}] removed: [${removed.join(', ')}]`
    );

    const summary = [
      applied.length ? `+${applied.join(', ')}` : null,
      removed.length ? `-${removed.join(', ')}` : null
    ].filter(Boolean).join(' ');
    ui.notifications.info(`${actor.name}: ${summary}`);
  }

  hasStatus(actor, status) {
    return actor?.statuses?.has?.(status) ?? false;
  }

  async toggleStatus(actor, status, active) {
    if (typeof actor.toggleStatusEffect !== 'function') {
      this.logger.warn(`DDB Sync | Actor ${actor.name} cannot toggle status effects, skipping '${status}'`);
      return false;
    }

    try {
      await actor.toggleStatusEffect(status, { active });
      return true;
    } catch (err) {
      this.logger.error(`DDB Sync | Failed to set condition '${status}' on ${actor.name}:`, err);
      return false;
    }
  }

  async syncExhaustion(actor, level) {
    const label = this.getConditionLabel(ConditionMapper.EXHAUSTION_STATUS);
    const change = { level, label: level > 0 ? `${label} ${level}` : label };
    const current = actor.system?.attributes?.exhaustion;

    if (current === undefined || current === null) {
      const shouldBeActive = level > 0;
      if (this.hasStatus(actor, ConditionMapper.EXHAUSTION_STATUS) === shouldBeActive) return null;
      const toggled = await this.toggleStatus(actor, ConditionMapper.EXHAUSTION_STATUS, shouldBeActive);
      return toggled ? change : null;
    }

    if (Number(current) === level) return null;

    try {
      await actor.update({ 'system.attributes.exhaustion': level });
    } catch (err) {
      this.logger.error(`DDB Sync | Failed to set exhaustion on ${actor.name}:`, err);
      return null;
    }
    return change;
  }

  getConditionLabel(status) {
    const configured = CONFIG?.DND5E?.conditionTypes?.[status];
    const label = typeof configured === 'string' ? configured : configured?.label;
    if (label) return game.i18n?.localize?.(label) ?? label;
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

/** Minimal stand-in for a dnd5e Actor. */
function makeActor({ name = 'Hero', statuses = [], exhaustion = 0 } = {}) {
  const actor = {
    name,
    statuses: new Set(statuses),
    system: { attributes: { exhaustion } },
    update: jest.fn(async (data) => {
      if ('system.attributes.exhaustion' in data) {
        actor.system.attributes.exhaustion = data['system.attributes.exhaustion'];
      }
    })
  };
  actor.toggleStatusEffect = jest.fn(async (status, { active } = {}) => {
    if (active) actor.statuses.add(status);
    else actor.statuses.delete(status);
  });
  return actor;
}

describe('ConditionSyncService', () => {
  let service;

  beforeEach(() => {
    global.game = {
      settings: { get: jest.fn(() => true) },
      i18n: { localize: (key) => key }
    };
    global.ui = { notifications: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } };
    global.CONFIG = {};
    service = new ConditionSyncService();
  });

  describe('isEnabled', () => {
    it('is on by default', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('is off when the setting is disabled', () => {
      global.game.settings.get = jest.fn(() => false);
      expect(service.isEnabled()).toBe(false);
    });

    it('falls back to on when the setting is unavailable', () => {
      global.game.settings.get = jest.fn(() => { throw new Error('not registered'); });
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('applyFromCharacter', () => {
    it('applies a condition set on D&D Beyond', async () => {
      const actor = makeActor();
      await service.applyFromCharacter(actor, { conditions: [{ id: 12, level: null }] });

      expect(actor.toggleStatusEffect).toHaveBeenCalledWith('prone', { active: true });
      expect(actor.statuses.has('prone')).toBe(true);
      expect(ui.notifications.info).toHaveBeenCalledWith('Hero: +Prone');
    });

    it('applies several conditions at once', async () => {
      const actor = makeActor();
      await service.applyFromCharacter(actor, { conditions: [{ id: 11 }, { id: 13 }] });

      expect(actor.statuses.has('poisoned')).toBe(true);
      expect(actor.statuses.has('restrained')).toBe(true);
    });

    it('removes a condition cleared on D&D Beyond', async () => {
      const actor = makeActor({ statuses: ['poisoned'] });
      await service.applyFromCharacter(actor, { conditions: [] });

      expect(actor.toggleStatusEffect).toHaveBeenCalledWith('poisoned', { active: false });
      expect(actor.statuses.has('poisoned')).toBe(false);
      expect(ui.notifications.info).toHaveBeenCalledWith('Hero: -Poisoned');
    });

    it('reports additions and removals together', async () => {
      const actor = makeActor({ statuses: ['poisoned'] });
      await service.applyFromCharacter(actor, { conditions: [{ id: 12 }] });

      expect(ui.notifications.info).toHaveBeenCalledWith('Hero: +Prone -Poisoned');
    });

    it('leaves status effects the module does not own alone', async () => {
      const actor = makeActor({ statuses: ['concentrating', 'dead'] });
      await service.applyFromCharacter(actor, { conditions: [] });

      expect(actor.statuses.has('concentrating')).toBe(true);
      expect(actor.statuses.has('dead')).toBe(true);
      expect(actor.toggleStatusEffect).not.toHaveBeenCalled();
    });

    it('does nothing when Foundry already matches D&D Beyond', async () => {
      const actor = makeActor({ statuses: ['prone'] });
      await service.applyFromCharacter(actor, { conditions: [{ id: 12 }] });

      expect(actor.toggleStatusEffect).not.toHaveBeenCalled();
      expect(actor.update).not.toHaveBeenCalled();
      expect(ui.notifications.info).not.toHaveBeenCalled();
    });

    it('clears managed conditions when the character carries none', async () => {
      const actor = makeActor({ statuses: ['prone', 'stunned'] });
      await service.applyFromCharacter(actor, {});

      expect(actor.statuses.has('prone')).toBe(false);
      expect(actor.statuses.has('stunned')).toBe(false);
    });

    it('ignores a null actor', async () => {
      await expect(service.applyFromCharacter(null, { conditions: [{ id: 12 }] })).resolves.toBeUndefined();
    });

    it('skips - without throwing - an actor that cannot toggle status effects', async () => {
      const actor = makeActor();
      delete actor.toggleStatusEffect;

      await service.applyFromCharacter(actor, { conditions: [{ id: 12 }] });

      expect(service.logger.warn).toHaveBeenCalled();
      expect(ui.notifications.info).not.toHaveBeenCalled();
    });

    it('keeps going when one condition fails to apply', async () => {
      const actor = makeActor();
      actor.toggleStatusEffect = jest.fn(async (status, { active } = {}) => {
        if (status === 'poisoned') throw new Error('locked document');
        if (active) actor.statuses.add(status);
        else actor.statuses.delete(status);
      });

      await service.applyFromCharacter(actor, { conditions: [{ id: 11 }, { id: 12 }] });

      expect(service.logger.error).toHaveBeenCalled();
      expect(actor.statuses.has('prone')).toBe(true);
      expect(ui.notifications.info).toHaveBeenCalledWith('Hero: +Prone');
    });
  });

  describe('exhaustion', () => {
    it('writes the exhaustion level from D&D Beyond', async () => {
      const actor = makeActor();
      await service.applyFromCharacter(actor, { conditions: [{ id: 4, level: 3 }] });

      expect(actor.update).toHaveBeenCalledWith({ 'system.attributes.exhaustion': 3 });
      expect(ui.notifications.info).toHaveBeenCalledWith('Hero: +Exhaustion 3');
    });

    it('leaves the exhaustion status effect to the system', async () => {
      // Toggling it as well would be read as "exhaustion 1" and undo the level.
      const actor = makeActor();
      await service.applyFromCharacter(actor, { conditions: [{ id: 4, level: 3 }] });

      expect(actor.toggleStatusEffect).not.toHaveBeenCalled();
    });

    it('clears exhaustion when D&D Beyond no longer reports it', async () => {
      const actor = makeActor({ statuses: ['exhaustion'], exhaustion: 2 });
      await service.applyFromCharacter(actor, { conditions: [] });

      expect(actor.update).toHaveBeenCalledWith({ 'system.attributes.exhaustion': 0 });
      expect(actor.toggleStatusEffect).not.toHaveBeenCalled();
      expect(ui.notifications.info).toHaveBeenCalledWith('Hero: -Exhaustion');
    });

    it('does not touch the actor when the level already matches', async () => {
      const actor = makeActor({ statuses: ['exhaustion'], exhaustion: 2 });
      await service.applyFromCharacter(actor, { conditions: [{ id: 4, level: 2 }] });

      expect(actor.update).not.toHaveBeenCalled();
      expect(ui.notifications.info).not.toHaveBeenCalled();
    });

    it('falls back to a status toggle when the system tracks no exhaustion level', async () => {
      const actor = makeActor();
      delete actor.system.attributes.exhaustion;

      await service.applyFromCharacter(actor, { conditions: [{ id: 4, level: 2 }] });

      expect(actor.update).not.toHaveBeenCalled();
      expect(actor.toggleStatusEffect).toHaveBeenCalledWith('exhaustion', { active: true });
      expect(ui.notifications.info).toHaveBeenCalledWith('Hero: +Exhaustion 2');
    });

    it('does nothing on a levelless system when the status already matches', async () => {
      const actor = makeActor({ statuses: ['exhaustion'] });
      delete actor.system.attributes.exhaustion;

      await service.applyFromCharacter(actor, { conditions: [{ id: 4, level: 2 }] });

      expect(actor.toggleStatusEffect).not.toHaveBeenCalled();
      expect(ui.notifications.info).not.toHaveBeenCalled();
    });
  });

  describe('getConditionLabel', () => {
    it('uses the localised system label when available', () => {
      global.CONFIG = { DND5E: { conditionTypes: { prone: { label: 'DND5E.ConProne' } } } };
      global.game.i18n.localize = (key) => (key === 'DND5E.ConProne' ? 'Prone' : key);

      expect(service.getConditionLabel('prone')).toBe('Prone');
    });

    it('falls back to the capitalised status id', () => {
      expect(service.getConditionLabel('restrained')).toBe('Restrained');
    });
  });
});
