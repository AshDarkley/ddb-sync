/**
 * CharacterUpdateMessageHandler Tests
 *
 * Repo convention: jest (CommonJS, node env) cannot import the Foundry ES
 * modules in scripts/, so the class below is an inline mirror of
 * scripts/core/handlers/CharacterUpdateMessageHandler.js. If you change one,
 * change both.
 */

class CharacterUpdateMessageHandler {
  static EVENT_TYPE = 'character-sheet/character-update/fulfilled';

  constructor(characterDataService, characterMapper, syncServices = []) {
    this.characterDataService = characterDataService;
    this.characterMapper = characterMapper;
    this.syncServices = syncServices;
    this.logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  }

  canHandle(message) {
    return message?.eventType === CharacterUpdateMessageHandler.EVENT_TYPE;
  }

  async handle(message) {
    try {
      const ddbCharacterId = message?.characterId;
      if (!ddbCharacterId) {
        this.logger.warn('DDB Sync | Character update message has no characterId');
        return;
      }

      const actor = this.characterMapper.getFoundryActor(ddbCharacterId);
      if (!actor) {
        this.logger.warn(`DDB Sync | No mapped Foundry actor for DDB character ${ddbCharacterId}`);
        return;
      }

      const enabledSyncs = this.syncServices.filter((sync) => sync.isEnabled());
      if (!enabledSyncs.length) return;

      const proxyResult = await this.characterDataService.fetchCharacterData(ddbCharacterId);
      const character = proxyResult?.ddb?.character;
      if (!proxyResult?.success || !character) {
        this.logger.warn(`DDB Sync | Failed to fetch character data for ${ddbCharacterId}`);
        return;
      }

      for (const sync of enabledSyncs) {
        try {
          await sync.applyFromCharacter(actor, character);
        } catch (err) {
          this.logger.error(`DDB Sync | ${sync.constructor.name} failed for ${actor.name}:`, err);
          ui.notifications.error(`DDB Sync: Error syncing ${actor.name} from D&D Beyond`);
        }
      }
    } catch (err) {
      this.logger.error('DDB Sync | Error handling character update:', err);
      ui.notifications.error('DDB Sync: Error processing character update');
    }
  }
}

const CHARACTER = { id: 123, name: 'Hero', removedHitPoints: 7, conditions: [{ id: 12, level: null }] };

/** Stand-in for an ICharacterSync implementation. */
function makeSync(name, { enabled = true, fail = false } = {}) {
  class Sync {
    constructor() {
      this.isEnabled = jest.fn(() => enabled);
      this.applyFromCharacter = jest.fn(async () => {
        if (fail) throw new Error(`${name} failed`);
      });
    }
  }
  Object.defineProperty(Sync, 'name', { value: name });
  return new Sync();
}

describe('CharacterUpdateMessageHandler', () => {
  let handler;
  let actor;
  let characterDataService;
  let characterMapper;
  let damageSync;
  let conditionSync;

  beforeEach(() => {
    global.ui = { notifications: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } };
    actor = { id: 'actor-456', name: 'Hero' };
    characterDataService = {
      fetchCharacterData: jest.fn(async () => ({ success: true, ddb: { character: CHARACTER } }))
    };
    characterMapper = { getFoundryActor: jest.fn(() => actor) };
    damageSync = makeSync('DamageSyncService');
    conditionSync = makeSync('ConditionSyncService');
    handler = new CharacterUpdateMessageHandler(characterDataService, characterMapper, [damageSync, conditionSync]);
  });

  describe('canHandle', () => {
    it('accepts fulfilled character updates', () => {
      expect(handler.canHandle({ eventType: 'character-sheet/character-update/fulfilled' })).toBe(true);
    });

    it('rejects other event types', () => {
      expect(handler.canHandle({ eventType: 'dice/roll/fulfilled' })).toBe(false);
      expect(handler.canHandle({ eventType: 'character-sheet/character-update' })).toBe(false);
      expect(handler.canHandle({})).toBe(false);
      expect(handler.canHandle(null)).toBe(false);
    });
  });

  describe('handle', () => {
    const message = { eventType: CharacterUpdateMessageHandler.EVENT_TYPE, characterId: '123' };

    it('feeds every sync service from a single fetch', async () => {
      await handler.handle(message);

      expect(characterDataService.fetchCharacterData).toHaveBeenCalledTimes(1);
      expect(damageSync.applyFromCharacter).toHaveBeenCalledWith(actor, CHARACTER);
      expect(conditionSync.applyFromCharacter).toHaveBeenCalledWith(actor, CHARACTER);
    });

    it('skips sync services that are switched off', async () => {
      conditionSync = makeSync('ConditionSyncService', { enabled: false });
      handler = new CharacterUpdateMessageHandler(characterDataService, characterMapper, [damageSync, conditionSync]);

      await handler.handle(message);

      expect(damageSync.applyFromCharacter).toHaveBeenCalled();
      expect(conditionSync.applyFromCharacter).not.toHaveBeenCalled();
    });

    it('does not fetch at all when every sync is switched off', async () => {
      handler = new CharacterUpdateMessageHandler(characterDataService, characterMapper, [
        makeSync('DamageSyncService', { enabled: false }),
        makeSync('ConditionSyncService', { enabled: false })
      ]);

      await handler.handle(message);

      expect(characterDataService.fetchCharacterData).not.toHaveBeenCalled();
    });

    it('keeps syncing when one sync service fails', async () => {
      damageSync = makeSync('DamageSyncService', { fail: true });
      handler = new CharacterUpdateMessageHandler(characterDataService, characterMapper, [damageSync, conditionSync]);

      await handler.handle(message);

      expect(handler.logger.error).toHaveBeenCalled();
      expect(conditionSync.applyFromCharacter).toHaveBeenCalledWith(actor, CHARACTER);
    });

    it('ignores a message without a character id', async () => {
      await handler.handle({ eventType: CharacterUpdateMessageHandler.EVENT_TYPE });

      expect(characterDataService.fetchCharacterData).not.toHaveBeenCalled();
      expect(handler.logger.warn).toHaveBeenCalled();
    });

    it('ignores an unmapped character without fetching', async () => {
      characterMapper.getFoundryActor = jest.fn(() => null);

      await handler.handle(message);

      expect(characterDataService.fetchCharacterData).not.toHaveBeenCalled();
      expect(damageSync.applyFromCharacter).not.toHaveBeenCalled();
    });

    it('stops when the proxy returns no character', async () => {
      characterDataService.fetchCharacterData = jest.fn(async () => ({ success: false, message: 'nope' }));

      await handler.handle(message);

      expect(damageSync.applyFromCharacter).not.toHaveBeenCalled();
      expect(handler.logger.warn).toHaveBeenCalled();
    });

    it('does not throw when the fetch itself fails', async () => {
      characterDataService.fetchCharacterData = jest.fn(async () => { throw new Error('network down'); });

      await expect(handler.handle(message)).resolves.toBeUndefined();
      expect(handler.logger.error).toHaveBeenCalled();
      expect(ui.notifications.error).toHaveBeenCalled();
    });
  });
});
