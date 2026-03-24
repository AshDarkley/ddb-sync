/**
 * Character Mapper - Manages D&D Beyond to Foundry character mappings
 * 
 * Responsibility: Manage and persist character ID mappings
 * SOLID: Single Responsibility - only handles mapping data and persistence
 */
export class CharacterMapper {
  constructor() {
    this._mapping = null; // Lazy-loaded
  }

  /**
   * Get the character mapping, loading it from settings if needed
   */
  get mapping() {
    if (this._mapping === null) {
      try {
        this._mapping = game.settings.get('ddb-sync', 'characterMapping') || {};
      } catch {
        this._mapping = {};
      }
    }
    return this._mapping;
  }

  /**
   * Reload mapping from settings
   */
  reloadMapping() {
    this._mapping = null;
  }

  getFoundryActor(ddbCharacterId) {
    const actorId = this.mapping[ddbCharacterId];
    if (!actorId) return null;
    
    return game.actors.get(actorId);
  }

  async setMapping(ddbCharacterId, foundryActorId) {
    this.mapping[ddbCharacterId] = foundryActorId;
    await game.settings.set('ddb-sync', 'characterMapping', this.mapping);
  }

  async removeMapping(ddbCharacterId) {
    delete this.mapping[ddbCharacterId];
    await game.settings.set('ddb-sync', 'characterMapping', this.mapping);
  }
}
