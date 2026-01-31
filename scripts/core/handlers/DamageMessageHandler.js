import { IMessageHandler } from '../interfaces/IMessageHandler.js';

/**
 * Damage Message Handler
 * Responsibility: Handle damage update messages from DDB
 * SOLID: Single Responsibility - only processes damage messages
 */
export class DamageMessageHandler extends IMessageHandler {
  constructor(damageSyncService) {
    super();
    this.damageSyncService = damageSyncService;
  }

  /**
   * Check if this handler can process the message
   * @param {Object} message - The DDB message
   * @returns {boolean}
   */
  canHandle(message) {
    // Check various possible message type formats
    const messageType = message.eventType;
    return messageType === 'character-sheet/character-update/fulfilled';
  }

  /**
   * Process the damage message
   * @param {Object} message - The DDB message
   * @returns {Promise<void>}
   */
  async handle(message) {
    await this.damageSyncService.handleDamageUpdate(message);
  }
}
