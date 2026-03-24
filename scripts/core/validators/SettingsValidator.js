/**
 * Settings Validator
 * Responsibility: Validate module settings
 * SOLID: Single Responsibility - only validates settings
 */
export class SettingsValidator {
  static REQUIRED_SETTINGS = ['cobaltCookie', 'campaignId', 'userId'];

  /**
   * Validate that all required settings are configured
   * @returns {{isValid: boolean, missing: Array<string>}}
   */
  static validateRequired() {
    const missing = [];

    for (const setting of this.REQUIRED_SETTINGS) {
      const value = game.settings.get('ddb-sync', setting);
      if (!value) {
        missing.push(setting);
      }
    }

    return {
      isValid: missing.length === 0,
      missing
    };
  }

  /**
   * Get human-readable names for missing settings
   * @param {Array<string>} missingSettings - Array of setting keys
   * @returns {Array<string>} Human-readable names
   */
  static getSettingNames(missingSettings) {
    const names = {
      cobaltCookie: 'CobaltSession cookie',
      campaignId: 'Campaign ID',
      userId: 'User ID',
      proxyUrl: 'Proxy URL'
    };

    return missingSettings.map(key => names[key] || key);
  }

  /**
   * Format validation errors as user-friendly message
   * @returns {{message: string, isValid: boolean}}
   */
  static validate() {
    const validation = this.validateRequired();

    if (!validation.isValid) {
      const names = this.getSettingNames(validation.missing);
      const message = `DDB Sync: Missing required settings: ${names.join(', ')}. Configure in module settings.`;
      return { message, isValid: false };
    }

    return {
      message: 'All required settings are configured',
      isValid: true
    };
  }
}
