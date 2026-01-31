/**
 * Interface for damage synchronization services
 * Responsibility: Define contract for syncing damage from DDB to Foundry
 * SOLID: Interface Segregation - clients depend only on damage sync methods
 */
export class IDamageSync {
  /**
   * Handle a damage message from DDB
   * @param {Object} message - The damage update message from DDB
   * @returns {Promise<void>}
   */
  async handleDamageUpdate(message) {
    throw new Error('handleDamageUpdate must be implemented');
  }

  /**
   * Apply damage to an actor
   * @param {string} foundryActorId - Foundry actor ID
   * @param {number} damageAmount - Amount of damage to apply
   * @returns {Promise<void>}
   */
  async applyDamage(foundryActorId, damageAmount) {
    throw new Error('applyDamage must be implemented');
  }
}
