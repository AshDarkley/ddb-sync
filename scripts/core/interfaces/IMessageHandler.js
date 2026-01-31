/**
 * Interface for message handling from DDB
 * Responsibility: Define contract for processing DDB messages
 * SOLID: Interface Segregation - each handler focuses on specific message types
 */
export class IMessageHandler {
  /**
   * Check if this handler can process the message
   * @param {Object} message - The DDB message
   * @returns {boolean}
   */
  canHandle(message) {
    throw new Error('canHandle must be implemented');
  }

  /**
   * Process the message
   * @param {Object} message - The DDB message
   * @returns {Promise<void>}
   */
  async handle(message) {
    throw new Error('handle must be implemented');
  }
}
