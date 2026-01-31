/**
 * Interface for roll type handlers
 * Responsibility: Define contract for handling different roll types
 * SOLID: Interface Segregation - clients depend only on roll handling methods
 * Pattern: Strategy - different implementations for different roll types
 */
export class IRollHandler {
  /**
   * Check if this handler can process this roll type
   * @param {Object} rollData - The DDB roll data
   * @returns {boolean}
   */
  canHandle(rollData) {
    throw new Error('canHandle must be implemented');
  }

  usesCache() {
    throw new Error('usesCache must be implemented');
  }

  /**
   * Handle the roll
   * @param {Actor} actor - The Foundry actor
   * @param {Object} rollData - The DDB roll data
   * @returns {Promise<void>}
   */
  async handle(actor, rollData) {
    throw new Error('handle must be implemented');
  }
}
