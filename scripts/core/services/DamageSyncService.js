import { ICharacterSync } from '../interfaces/ICharacterSync.js';
import { Logger } from '../../utils/Logger.js';

/**
 * Damage Sync Service
 * Responsibility: Handle damage synchronization from DDB to Foundry actors
 * SOLID: Single Responsibility - only handles damage updates
 */
export class DamageSyncService extends ICharacterSync {
  constructor() {
    super();
    this.logger = Logger;
  }

  /**
   * Whether damage syncing is switched on in module settings.
   * @returns {boolean}
   */
  isEnabled() {
    try {
      return game.settings.get('ddb-sync', 'updateDamageOnly') !== false;
    } catch {
      return true;
    }
  }

  /**
   * Apply the DDB character's damage to the actor.
   * @param {Actor} actor - The mapped Foundry actor
   * @param {Object} character - The DDB character JSON
   * @returns {Promise<void>}
   */
  async applyFromCharacter(actor, character) {
    if (!actor) return;
    await this.applyDamage(actor.id, character?.removedHitPoints || 0);
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
