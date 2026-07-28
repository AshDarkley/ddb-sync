/**
 * Inline mirror of scripts/core/services/ConditionMapper.js.
 *
 * Repo convention: jest (CommonJS, node env) cannot import the Foundry ES
 * modules in scripts/, so the class is mirrored here in CommonJS. Two suites
 * need it (ConditionMapper and ConditionSyncService), so it lives in
 * tests/mirrors/ rather than being copied into both. It is not a suite itself -
 * jest only picks up *.test.js. If you change the module, change this too.
 */

class ConditionMapper {
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

  static get toggleStatuses() {
    return Object.values(this.DDB_CONDITION_STATUS).filter((status) => status !== this.EXHAUSTION_STATUS);
  }

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

  static exhaustionLevel(ddbConditions) {
    if (!Array.isArray(ddbConditions)) return 0;

    const entry = ddbConditions.find((condition) => Number(condition?.id) === this.EXHAUSTION_DDB_ID);
    if (!entry) return 0;

    const level = Number(entry.level);
    if (!Number.isFinite(level) || level < 1) return 1;
    return Math.min(Math.floor(level), this.MAX_EXHAUSTION_LEVEL);
  }
}

module.exports = ConditionMapper;
