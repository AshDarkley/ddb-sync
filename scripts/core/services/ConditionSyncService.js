import { ICharacterSync } from '../interfaces/ICharacterSync.js';
import { ConditionMapper } from './ConditionMapper.js';
import { Logger } from '../../utils/Logger.js';

/**
 * Condition Sync Service
 * Responsibility: Mirror a D&D Beyond character's conditions onto its Foundry actor
 * SOLID: Single Responsibility - only handles condition updates
 *
 * DDB does not send "condition added" / "condition removed" events; every
 * character change arrives as the same character-update event, and the
 * character JSON that follows carries the full condition list. So this service
 * reconciles rather than patches: whatever DDB reports becomes the actor's
 * state, for the conditions the module owns (see ConditionMapper.toggleStatuses).
 * Conditions outside that list are never touched, so GM-applied markers such as
 * "concentrating" or module-specific statuses survive a sync.
 */
export class ConditionSyncService extends ICharacterSync {
  constructor() {
    super();
    this.logger = Logger;
  }

  /**
   * Whether condition syncing is switched on in module settings.
   * @returns {boolean}
   */
  isEnabled() {
    try {
      return game.settings.get('ddb-sync', 'syncConditions') !== false;
    } catch {
      return true;
    }
  }

  /**
   * Reconcile an actor's conditions with the ones DDB reports.
   * @param {Actor} actor - The mapped Foundry actor
   * @param {Object} character - The DDB character JSON
   * @returns {Promise<void>}
   */
  async applyFromCharacter(actor, character) {
    if (!actor) return;

    const ddbConditions = character?.conditions;
    const desired = ConditionMapper.toStatuses(ddbConditions);
    const applied = [];
    const removed = [];

    for (const status of ConditionMapper.toggleStatuses) {
      const shouldBeActive = desired.has(status);
      if (shouldBeActive === this.hasStatus(actor, status)) continue;

      const toggled = await this.toggleStatus(actor, status, shouldBeActive);
      if (!toggled) continue;
      (shouldBeActive ? applied : removed).push(this.getConditionLabel(status));
    }

    const exhaustionChange = await this.syncExhaustion(actor, ConditionMapper.exhaustionLevel(ddbConditions));
    if (exhaustionChange) {
      (exhaustionChange.level > 0 ? applied : removed).push(exhaustionChange.label);
    }

    if (!applied.length && !removed.length) return;

    this.logger.log(
      `DDB Sync | Conditions for ${actor.name} - applied: [${applied.join(', ')}] removed: [${removed.join(', ')}]`
    );

    const summary = [
      applied.length ? `+${applied.join(', ')}` : null,
      removed.length ? `-${removed.join(', ')}` : null
    ].filter(Boolean).join(' ');
    ui.notifications.info(`${actor.name}: ${summary}`);
  }

  /**
   * Whether a status effect is currently active on the actor.
   * @param {Actor} actor - The Foundry actor
   * @param {string} status - dnd5e status id
   * @returns {boolean}
   */
  hasStatus(actor, status) {
    return actor?.statuses?.has?.(status) ?? false;
  }

  /**
   * Switch a status effect on or off.
   * @param {Actor} actor - The Foundry actor
   * @param {string} status - dnd5e status id
   * @param {boolean} active - Desired state
   * @returns {Promise<boolean>} True if the toggle was applied
   */
  async toggleStatus(actor, status, active) {
    if (typeof actor.toggleStatusEffect !== 'function') {
      this.logger.warn(`DDB Sync | Actor ${actor.name} cannot toggle status effects, skipping '${status}'`);
      return false;
    }

    try {
      await actor.toggleStatusEffect(status, { active });
      return true;
    } catch (err) {
      this.logger.error(`DDB Sync | Failed to set condition '${status}' on ${actor.name}:`, err);
      return false;
    }
  }

  /**
   * Bring the actor's exhaustion level in line with DDB.
   *
   * dnd5e models exhaustion as a numeric attribute and derives the matching
   * status effect from it, so the level is written and the effect left to the
   * system. Toggling the status here as well would fight it - the system reads
   * a plain toggle as "exhaustion 1" and would undo the level just written.
   * Only a system with no exhaustion attribute at all falls back to a toggle.
   *
   * @param {Actor} actor - The Foundry actor
   * @param {number} level - DDB exhaustion level (0-6)
   * @returns {Promise<?{level: number, label: string}>} The change made, or null
   */
  async syncExhaustion(actor, level) {
    const label = this.getConditionLabel(ConditionMapper.EXHAUSTION_STATUS);
    const change = { level, label: level > 0 ? `${label} ${level}` : label };
    const current = actor.system?.attributes?.exhaustion;

    if (current === undefined || current === null) {
      const shouldBeActive = level > 0;
      if (this.hasStatus(actor, ConditionMapper.EXHAUSTION_STATUS) === shouldBeActive) return null;
      const toggled = await this.toggleStatus(actor, ConditionMapper.EXHAUSTION_STATUS, shouldBeActive);
      return toggled ? change : null;
    }

    if (Number(current) === level) return null;

    try {
      await actor.update({ 'system.attributes.exhaustion': level });
    } catch (err) {
      this.logger.error(`DDB Sync | Failed to set exhaustion on ${actor.name}:`, err);
      return null;
    }
    return change;
  }

  /**
   * Human readable name for a status id, localised by the system where possible.
   * @param {string} status - dnd5e status id
   * @returns {string}
   */
  getConditionLabel(status) {
    const configured = CONFIG?.DND5E?.conditionTypes?.[status];
    const label = typeof configured === 'string' ? configured : configured?.label;
    if (label) return game.i18n?.localize?.(label) ?? label;
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
