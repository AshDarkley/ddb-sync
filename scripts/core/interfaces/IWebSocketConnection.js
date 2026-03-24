/**
 * Interface for WebSocket connection management
 * Responsibility: Define contract for WebSocket lifecycle and event handling
 * SOLID: Interface Segregation - clients depend only on needed methods
 */
export class IWebSocketConnection {
  /**
   * Connect to the WebSocket server
   * @returns {Promise<void>}
   */
  async connect() {
    throw new Error('connect must be implemented');
  }

  /**
   * Disconnect from the WebSocket server
   * @returns {void}
   */
  disconnect() {
    throw new Error('disconnect must be implemented');
  }

  /**
   * Check if currently connected
   * @returns {boolean}
   */
  isConnected() {
    throw new Error('isConnected must be implemented');
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    throw new Error('on must be implemented');
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  off(event, handler) {
    throw new Error('off must be implemented');
  }
}
