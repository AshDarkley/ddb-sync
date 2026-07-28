/**
 * Condition Mapper
 * Responsibility: Translate D&D Beyond condition ids into dnd5e status ids
 * SOLID: Single Responsibility - pure translation, no Foundry document access
 *
 * D&D Beyond stores a character's active conditions on the character JSON as
 * `conditions: [{ id, level }]`. The ids are DDB's own condition ids: the 15
 * core 5e conditions numbered 1-15 in alphabetical order. `level` is only
 * meaningful for Exhaustion (1-6) and is null for every other condition.
 *
 * dnd5e tracks the same conditions as status effects keyed by the lowercase
 * condition name, so the translation is a straight lookup table. Exhaustion is
 * the exception: dnd5e models it as a numeric actor attribute
 * (`system.attributes.exhaustion`) rather than a plain on/off status, so it is
 * kept out of the toggle set and reported separately via exhaustionLevel().
 *
 * NOTE: tests/core/services/ConditionMapper.test.js contains a mirror copy of
 * this class (jest cannot import Foundry ES modules). Keep them in sync.
 */
export class ConditionMapper {
  /** DDB condition id → dnd5e status id */
  static DDB_CONDITION_STATUS = Object.freeze({
    1: 'blinded',
    2: 'charmed',
    3: 'deafened',
    4: 'exhaustion',
    5: 'frightened',
    6: 'grappled',
    7: 'incapacitated',
    8: 'invisible',
    9: 'paralyzed',
    10: 'petrified',
    11: 'poisoned',
    12: 'prone',
    13: 'restrained',
    14: 'stunned',
    15: 'unconscious'
  });

  static EXHAUSTION_DDB_ID = 4;
  static EXHAUSTION_STATUS = 'exhaustion';
  static MAX_EXHAUSTION_LEVEL = 6;

  /**
   * The status ids this module owns and is therefore allowed to switch off
   * again when DDB no longer reports them. Anything outside this list (a GM's
   * own "concentrating" or "dead" marker, a module's custom status) is left
   * untouched. Exhaustion is excluded - it is driven by its level instead.
   * @returns {string[]}
   */
  static get toggleStatuses() {
    return Object.values(this.DDB_CONDITION_STATUS).filter((status) => status !== this.EXHAUSTION_STATUS);
  }

  /**
   * The on/off conditions DDB currently reports for a character.
   * Unknown ids (homebrew conditions) are ignored.
   * @param {Array<{id: number, level: ?number}>} ddbConditions - character.conditions
   * @returns {Set<string>} dnd5e status ids, excluding exhaustion
   */
  static toStatuses(ddbConditions) {
    const statuses = new Set();
    if (!Array.isArray(ddbConditions)) return statuses;

    for (const condition of ddbConditions) {
      const status = this.DDB_CONDITION_STATUS[Number(condition?.id)];
      if (!status || status === this.EXHAUSTION_STATUS) continue;
      statuses.add(status);
    }
    return statuses;
  }

  /**
   * The exhaustion level DDB currently reports for a character.
   * A present-but-levelless exhaustion entry counts as level 1; levels above
   * the 5e maximum are clamped.
   * @param {Array<{id: number, level: ?number}>} ddbConditions - character.conditions
   * @returns {number} 0 (not exhausted) through MAX_EXHAUSTION_LEVEL
   */
  static exhaustionLevel(ddbConditions) {
    if (!Array.isArray(ddbConditions)) return 0;

    const entry = ddbConditions.find((condition) => Number(condition?.id) === this.EXHAUSTION_DDB_ID);
    if (!entry) return 0;

    const level = Number(entry.level);
    if (!Number.isFinite(level) || level < 1) return 1;
    return Math.min(Math.floor(level), this.MAX_EXHAUSTION_LEVEL);
  }
}
