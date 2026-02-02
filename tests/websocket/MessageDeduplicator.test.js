/**
 * MessageDeduplicator Tests
 * Tests deduplication logic to prevent duplicate message processing
 */

class MessageDeduplicator {
  constructor(windowMs = 5000) {
    this.windowMs = windowMs;
    this.seenMessages = new Map();
  }

  /**
   * Generate a hash for a message to identify duplicates
   */
  generateHash(message) {
    const str = JSON.stringify(message);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  isDuplicate(message) {
    const hash = this.generateHash(message);
    const now = Date.now();

    // Check if we've seen this hash recently
    if (this.seenMessages.has(hash)) {
      const lastSeen = this.seenMessages.get(hash);
      if (now - lastSeen < this.windowMs) {
        return true;
      }
    }

    // Record this message
    this.seenMessages.set(hash, now);
    this.cleanup(now);
    return false;
  }

  cleanup(now) {
    // Remove old entries outside the window
    for (const [hash, timestamp] of this.seenMessages.entries()) {
      if (now - timestamp > this.windowMs) {
        this.seenMessages.delete(hash);
      }
    }
  }

  reset() {
    this.seenMessages.clear();
  }

  getWindowMs() {
    return this.windowMs;
  }
}

describe('MessageDeduplicator', () => {
  let deduplicator;

  beforeEach(() => {
    deduplicator = new MessageDeduplicator(5000);
  });

  describe('isDuplicate', () => {
    it('should not mark first message as duplicate', () => {
      const message = { type: 'roll', value: 20 };
      const isDup = deduplicator.isDuplicate(message);
      expect(isDup).toBe(false);
    });

    it('should mark identical subsequent message as duplicate', () => {
      const message = { type: 'roll', value: 20 };
      deduplicator.isDuplicate(message);
      const isDup = deduplicator.isDuplicate(message);
      expect(isDup).toBe(true);
    });

    it('should not mark different messages as duplicates', () => {
      const msg1 = { type: 'roll', value: 20 };
      const msg2 = { type: 'roll', value: 19 };
      deduplicator.isDuplicate(msg1);
      const isDup = deduplicator.isDuplicate(msg2);
      expect(isDup).toBe(false);
    });

    it('should allow duplicate after window expires', (done) => {
      const dedup = new MessageDeduplicator(100); // 100ms window
      const message = { type: 'roll', value: 20 };
      dedup.isDuplicate(message);
      expect(dedup.isDuplicate(message)).toBe(true);

      // Wait for window to expire
      setTimeout(() => {
        expect(dedup.isDuplicate(message)).toBe(false);
        done();
      }, 150);
    });

    it('should handle complex nested objects', () => {
      const message = {
        type: 'damage',
        character: { id: 123, name: 'Aragorn' },
        damage: { value: 10, type: 'slashing' }
      };
      deduplicator.isDuplicate(message);
      const isDup = deduplicator.isDuplicate(message);
      expect(isDup).toBe(true);
    });

  describe('reset', () => {
    it('should clear all seen messages', () => {
      const message = { type: 'roll', value: 20 };
      deduplicator.isDuplicate(message);
      deduplicator.reset();
      const isDup = deduplicator.isDuplicate(message);
      expect(isDup).toBe(false);
    });
  });

  describe('generateHash', () => {
    it('should generate consistent hash for same message', () => {
      const message = { type: 'roll', value: 20 };
      const hash1 = deduplicator.generateHash(message);
      const hash2 = deduplicator.generateHash(message);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different messages', () => {
      const msg1 = { type: 'roll', value: 20 };
      const msg2 = { type: 'roll', value: 19 };
      const hash1 = deduplicator.generateHash(msg1);
      const hash2 = deduplicator.generateHash(msg2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', (done) => {
      const dedup = new MessageDeduplicator(100);
      const msg1 = { id: 1 };
      const msg2 = { id: 2 };

      dedup.isDuplicate(msg1);
      const size1 = dedup.seenMessages.size;

      setTimeout(() => {
        dedup.isDuplicate(msg2);
        const size2 = dedup.seenMessages.size;
        // After cleanup, old message should be removed
        expect(size2).toBeLessThanOrEqual(size1);
        done();
      }, 150);
    });
  });
});

module.exports = MessageDeduplicator;

