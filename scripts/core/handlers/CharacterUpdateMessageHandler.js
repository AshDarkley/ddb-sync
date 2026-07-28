import { IMessageHandler } from '../interfaces/IMessageHandler.js';
import { Logger } from '../../utils/Logger.js';

/**
 * Character Update Message Handler
 * Responsibility: Handle character-update messages from DDB
 * SOLID: Open/Closed - new aspects of a character are synced by registering
 *        another ICharacterSync, not by changing this class
 *
 * DDB reports every sheet change - HP, conditions, anything else - as the same
 * character-update event, and the event carries no payload beyond the character
 * id, so the current state has to be fetched from the proxy. That fetch happens
 * once here and the resulting character is handed to every registered sync
 * service, instead of each service fetching its own copy.
 */
export class CharacterUpdateMessageHandler extends IMessageHandler {
  static EVENT_TYPE = 'character-sheet/character-update/fulfilled';

  /**
   * @param {CharacterDataService} characterDataService - Fetches DDB character data
   * @param {CharacterMapper} characterMapper - Resolves DDB character id to Foundry actor
   * @param {Array<ICharacterSync>} syncServices - Services applying the fetched state
   */
  constructor(characterDataService, characterMapper, syncServices = []) {
    super();
    this.characterDataService = characterDataService;
    this.characterMapper = characterMapper;
    this.syncServices = syncServices;
    this.logger = Logger;
  }

  /**
   * Check if this handler can process the message
   * @param {Object} message - The DDB message
   * @returns {boolean}
   */
  canHandle(message) {
    return message?.eventType === CharacterUpdateMessageHandler.EVENT_TYPE;
  }

  /**
   * Process the character update message
   * @param {Object} message - The DDB message
   * @returns {Promise<void>}
   */
  async handle(message) {
    try {
      const ddbCharacterId = message?.characterId;
      if (!ddbCharacterId) {
        this.logger.warn('DDB Sync | Character update message has no characterId');
        return;
      }

      const actor = this.characterMapper.getFoundryActor(ddbCharacterId);
      if (!actor) {
        this.logger.warn(`DDB Sync | No mapped Foundry actor for DDB character ${ddbCharacterId}`);
        return;
      }

      const enabledSyncs = this.syncServices.filter((sync) => sync.isEnabled());
      if (!enabledSyncs.length) return;

      const proxyResult = await this.characterDataService.fetchCharacterData(ddbCharacterId);
      const character = proxyResult?.ddb?.character;
      if (!proxyResult?.success || !character) {
        this.logger.warn(`DDB Sync | Failed to fetch character data for ${ddbCharacterId}`);
        return;
      }

      // One failing sync must not stop the others - a condition that cannot be
      // applied should not cost the player their HP update, and vice versa.
      for (const sync of enabledSyncs) {
        try {
          await sync.applyFromCharacter(actor, character);
        } catch (err) {
          this.logger.error(`DDB Sync | ${sync.constructor.name} failed for ${actor.name}:`, err);
          ui.notifications.error(`DDB Sync: Error syncing ${actor.name} from D&D Beyond`);
        }
      }
    } catch (err) {
      this.logger.error('DDB Sync | Error handling character update:', err);
      ui.notifications.error('DDB Sync: Error processing character update');
    }
  }
}
