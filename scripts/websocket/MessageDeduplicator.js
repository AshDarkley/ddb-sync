/**
 * Message Deduplicator
 * Responsibility: Track and prevent duplicate message processing
 * SOLID: Single Responsibility - only manages message deduplication
 */
export class MessageDeduplicator {
  constructor(maxHistorySize = 50) {
    this.processedMessageIds = new Set();
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Create a unique key for a roll message
   */
  static createMessageKey(characterId, rollType, action, ddbMessageId) {
    return `${characterId}-${rollType}-${action}-${ddbMessageId}`;
  }

  /**
   * Check if a message has been processed
   */
  isProcessed(messageKey) {
    return this.processedMessageIds.has(messageKey);
  }

  /**
   * Mark a message as processed
   */
  markProcessed(messageKey) {
    this.processedMessageIds.add(messageKey);
    this.cleanupOldMessages();
  }

  /**
   * Clean up old message IDs to prevent memory leaks
   */
  cleanupOldMessages() {
    if (this.processedMessageIds.size > this.maxHistorySize) {
      const idsArray = Array.from(this.processedMessageIds);
      const oldestId = idsArray[0];
      this.processedMessageIds.delete(oldestId);
    }
  }

  /**
   * Get the count of processed messages
   */
  getProcessedCount() {
    return this.processedMessageIds.size;
  }

  /**
   * Clear all processed messages
   */
  clear() {
    this.processedMessageIds.clear();
  }
}
