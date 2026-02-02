/**
 * SettingsValidator Tests
 * Tests validation of module settings
 */

class SettingsValidator {
  validateCobaltCookie(cookie) {
    if (!cookie || typeof cookie !== 'string') {
      throw new Error('CobaltSession cookie must be a non-empty string');
    }
    return true;
  }

  validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID must be a non-empty string');
    }
    return true;
  }

  validateCampaignId(campaignId) {
    if (!campaignId || typeof campaignId !== 'string') {
      throw new Error('Campaign ID must be a non-empty string');
    }
    return true;
  }

  validateProxyUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('Proxy URL must be a non-empty string');
    }
    try {
      new URL(url);
      return true;
    } catch (e) {
      throw new Error('Proxy URL must be a valid URL');
    }
  }

  validateCharacterMapping(mapping) {
    if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
      throw new Error('Character mapping must be a valid object');
    }
    // Validate that all keys and values are strings
    for (const [key, value] of Object.entries(mapping)) {
      if (typeof key !== 'string' || typeof value !== 'string') {
        throw new Error('Character mapping keys and values must be strings');
      }
    }
    return true;
  }

  validateAllSettings(settings) {
    const errors = [];

    if (!settings.cobaltCookie) {
      errors.push('CobaltSession cookie is required');
    }
    if (!settings.userId) {
      errors.push('User ID is required');
    }
    if (!settings.campaignId) {
      errors.push('Campaign ID is required');
    }

    if (settings.proxyUrl) {
      try {
        new URL(settings.proxyUrl);
      } catch (e) {
        errors.push('Proxy URL must be a valid URL');
      }
    }

    if (settings.characterMapping && typeof settings.characterMapping !== 'object') {
      errors.push('Character mapping must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

describe('SettingsValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new SettingsValidator();
  });

  describe('validateCobaltCookie', () => {
    it('should accept valid cookie string', () => {
      expect(validator.validateCobaltCookie('valid_cookie_token')).toBe(true);
    });

    it('should throw error for empty string', () => {
      expect(() => validator.validateCobaltCookie('')).toThrow();
    });

    it('should throw error for null', () => {
      expect(() => validator.validateCobaltCookie(null)).toThrow();
    });

    it('should throw error for non-string', () => {
      expect(() => validator.validateCobaltCookie(123)).toThrow();
    });
  });

  describe('validateUserId', () => {
    it('should accept valid user ID', () => {
      expect(validator.validateUserId('user123')).toBe(true);
    });

    it('should throw error for empty string', () => {
      expect(() => validator.validateUserId('')).toThrow();
    });

    it('should throw error for null', () => {
      expect(() => validator.validateUserId(null)).toThrow();
    });
  });

  describe('validateCampaignId', () => {
    it('should accept valid campaign ID', () => {
      expect(validator.validateCampaignId('campaign123')).toBe(true);
    });

    it('should throw error for empty string', () => {
      expect(() => validator.validateCampaignId('')).toThrow();
    });
  });

  describe('validateProxyUrl', () => {
    it('should accept valid URL', () => {
      expect(validator.validateProxyUrl('http://localhost:3000')).toBe(true);
      expect(validator.validateProxyUrl('https://proxy.example.com')).toBe(true);
    });

    it('should throw error for invalid URL', () => {
      expect(() => validator.validateProxyUrl('not-a-url')).toThrow();
    });

    it('should throw error for empty string', () => {
      expect(() => validator.validateProxyUrl('')).toThrow();
    });
  });

  describe('validateCharacterMapping', () => {
    it('should accept valid mapping object', () => {
      const mapping = { '123': 'actor-456', '789': 'actor-012' };
      expect(validator.validateCharacterMapping(mapping)).toBe(true);
    });

    it('should accept empty mapping object', () => {
      expect(validator.validateCharacterMapping({})).toBe(true);
    });

    it('should throw error for non-object', () => {
      expect(() => validator.validateCharacterMapping('not-an-object')).toThrow();
    });

    it('should throw error for array', () => {
      expect(() => validator.validateCharacterMapping([])).toThrow();
    });

    it('should throw error for non-string values', () => {
      const mapping = { '123': 456 };
      expect(() => validator.validateCharacterMapping(mapping)).toThrow();
    });
  });

  describe('validateAllSettings', () => {
    it('should validate complete valid settings', () => {
      const settings = {
        cobaltCookie: 'cookie123',
        userId: 'user123',
        campaignId: 'campaign123',
        proxyUrl: 'http://localhost:3000',
        characterMapping: { '123': 'actor-456' }
      };
      const result = validator.validateAllSettings(settings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report missing required fields', () => {
      const settings = {};
      const result = validator.validateAllSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('CobaltSession cookie is required');
    });

    it('should validate optional proxyUrl if provided', () => {
      const settings = {
        cobaltCookie: 'cookie123',
        userId: 'user123',
        campaignId: 'campaign123',
        proxyUrl: 'invalid-url'
      };
      const result = validator.validateAllSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Proxy URL must be a valid URL');
    });

    it('should allow missing optional proxyUrl', () => {
      const settings = {
        cobaltCookie: 'cookie123',
        userId: 'user123',
        campaignId: 'campaign123'
      };
      const result = validator.validateAllSettings(settings);
      expect(result.isValid).toBe(true);
    });
  });
});

module.exports = SettingsValidator;

