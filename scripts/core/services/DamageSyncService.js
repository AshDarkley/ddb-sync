import { IDamageSync } from '../interfaces/IDamageSync.js';

/**
 * Damage Sync Service
 * Responsibility: Handle damage synchronization from DDB to Foundry actors
 * SOLID: Single Responsibility - only handles damage updates
 */
export class DamageSyncService extends IDamageSync {
  constructor(characterDataService) {
    super();
    this.characterDataService = characterDataService;
    this.logger = console;
  }

  /**
   * Handle damage message from DDB WebSocket
   * @param {Object} message - DDB message containing damage data
   * @returns {Promise<void>}
   */
  async handleDamageUpdate(message) {
    try {
      if (!message.characterId) {
        this.logger.warn('DDB Sync | Invalid damage message format');
        return;
      }

      const ddbCharacterId = message.characterId;

      // Fetch character data from CharacterDataService
      const proxyResult = await this.characterDataService.fetchCharacterData(ddbCharacterId);
      if (!proxyResult || !proxyResult.success || !proxyResult.ddb?.character) {
        this.logger.warn(`DDB Sync | Failed to fetch character data for ${ddbCharacterId}`);
        return;
      }

      const character = proxyResult.ddb.character;

      const damageAmount = character.removedHitPoints || 0;

      // Get character mapping
      const mapping = game.settings.get('ddb-sync', 'characterMapping');
      const foundryActorId = mapping[ddbCharacterId];

      if (!foundryActorId) {
        this.logger.warn(`DDB Sync | No mapping found for DDB character ${ddbCharacterId}`);
        return;
      }

      await this.applyDamage(foundryActorId, damageAmount);
    } catch (err) {
      this.logger.error('DDB Sync | Error handling damage update:', err);
      ui.notifications.error('DDB Sync: Error processing damage update');
    }
  }

  /**
   * Apply damage to a Foundry actor
   * @param {string} foundryActorId - Foundry actor ID
   * @param {number} damageAmount - Amount of damage (positive for damage, negative for healing)
   * @returns {Promise<void>}
   */
  async applyDamage(foundryActorId, damageAmount) {
    const actor = game.actors.get(foundryActorId);

    if (!actor) {
      this.logger.warn(`DDB Sync | Actor not found: ${foundryActorId}`);
      return;
    }

    const currentHP = actor.system?.attributes?.hp?.value || 0;
    const maxHP = actor.system?.attributes?.hp?.effectiveMax || 0;
    const newHP = Math.max(0, maxHP - damageAmount);

    if (newHP === currentHP) {
      return; // No change needed
    }

    await actor.update({ 'system.attributes.hp.value': newHP });
    this.logger.log(`DDB Sync | Applied HP: ${currentHP} → ${newHP} for actor ${actor.name}`);
    ui.notifications.info(`${actor.name} hit points updated`);
  }
}
