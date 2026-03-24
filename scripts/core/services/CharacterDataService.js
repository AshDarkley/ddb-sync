/**
 * Character Data Service - Fetches character data from D&D Beyond via proxy
 * 
 * Responsibility: Retrieve character data from DDB for use in synchronization
 * SOLID: Single Responsibility - only handles character data fetching
 */
export class CharacterDataService {
  constructor() {
    this.logger = console;
  }

  /**
   * Fetch character data from D&D Beyond via proxy
   * @param {string} characterId - DDB character ID
   * @returns {Promise<Object|null>} Character data or null if fetch fails
   */
  async fetchCharacterData(characterId) {
    try {
      const cobaltCookie = game.settings.get('ddb-sync', 'cobaltCookie');
      const proxyUrl = game.settings.get('ddb-sync', 'proxyUrl');
      
      // First get a token via the proxy
      const tokenResponse = await fetch(`${proxyUrl}/proxy/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cobalt: cobaltCookie
        })
      });

      if (!tokenResponse.ok) {
        this.logger.error(`DDB Sync | Failed to get auth token: ${tokenResponse.status}`);
        return null;
      }

      const tokenData = await tokenResponse.json();
      const token = tokenData.token;

      if (!token) {
        this.logger.error('DDB Sync | No token in auth response');
        return null;
      }

      // Fetch character data via proxy
      const response = await fetch(`${proxyUrl}/proxy/character`, {
        method: 'POST',
        body: JSON.stringify({
          cobalt: cobaltCookie,
          characterId: characterId,
          campaignId: game.settings.get('ddb-sync', 'campaignId'),
          devMode: false,
          filterModifiers: false,
          splitSpells: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        this.logger.error(`DDB Sync | Failed to fetch character data: ${response.status}`);
        return null;
      }

      const characterData = await response.json();
      
      this.logger.log(`DDB Sync | Character data fetched for ${characterId}`);
      return characterData;
    } catch (err) {
      this.logger.error(`DDB Sync | Error fetching character data:`, err);
      return null;
    }
  }
}
