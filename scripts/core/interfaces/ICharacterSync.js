/**
 * Interface for character sync services
 * Responsibility: Define contract for mirroring DDB character state onto a Foundry actor
 * SOLID: Interface Segregation - one method per sync concern (HP, conditions, ...)
 *
 * Implementations receive an already-resolved actor and an already-fetched DDB
 * character, so a single character-update event costs one proxy round trip no
 * matter how many aspects of the character are synced.
 */
export class ICharacterSync {
  /**
   * Whether this sync is switched on in module settings.
   * @returns {boolean}
   */
  isEnabled() {
    return true;
  }

  /**
   * Apply the relevant part of the DDB character state to the actor.
   * @param {Actor} actor - The mapped Foundry actor
   * @param {Object} character - The DDB character JSON
   * @returns {Promise<void>}
   */
  async applyFromCharacter(actor, character) {
    throw new Error('applyFromCharacter must be implemented');
  }
}
