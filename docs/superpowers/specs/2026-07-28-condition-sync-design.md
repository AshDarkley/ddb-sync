# Condition Sync — Design

**Date:** 2026-07-28
**Target:** Foundry VTT v13, dnd5e, ddb-sync module

## Problem

A player toggles a condition (Poisoned, Prone, Exhaustion 3, ...) on their D&D Beyond
character sheet and nothing happens in Foundry. The GM has to spot it in the DDB game
log and re-apply it by hand, so the token on the board disagrees with the sheet the
player is looking at.

HP already syncs the other way round: DDB is treated as the source of truth and the
mapped Foundry actor follows it. Conditions should work the same way.

## What DDB gives us

The game-log websocket sends `character-sheet/character-update/fulfilled` for *any*
sheet change. The envelope carries the character id and nothing else useful — no diff,
no indication of what changed. The current state has to be read back from the proxy
(`POST /proxy/character`), whose response already contains everything needed:

```json
"conditions": [{ "id": 4, "level": 3 }, { "id": 11, "level": null }]
```

`id` is DDB's condition id — the 15 core 5e conditions numbered 1-15 alphabetically.
`level` is only meaningful for Exhaustion (id 4). No proxy change is required.

## Design

### 1. Translation — `core/services/ConditionMapper.js`

Pure lookup, no Foundry access, trivially testable. DDB id → dnd5e status id
(`12 → 'prone'`). Exhaustion is deliberately kept out of the on/off set and exposed as
`exhaustionLevel()` instead, because dnd5e models it as a numeric attribute rather than
a plain status. Unknown (homebrew) ids are ignored rather than guessed at.

### 2. Application — `core/services/ConditionSyncService.js`

Reconciles rather than patches, because the event carries no diff: whatever DDB reports
becomes the actor's state.

- Only the statuses in `ConditionMapper.toggleStatuses` are switched off when DDB stops
  reporting them. `concentrating`, `dead`, module-specific statuses and anything else
  outside that list are never touched.
- Exhaustion is written as `system.attributes.exhaustion` and the matching status effect
  is left to the system, which derives it from the level. Toggling the status as well
  would fight dnd5e: a plain toggle reads as "exhaustion 1" and would undo the level
  just written. A system exposing no exhaustion attribute falls back to a status toggle.
- Statuses already in the right state are skipped, so a character update that only
  changed HP causes no condition writes and no notification.

Accepted consequence: a condition the GM applies in Foundry alone is removed again on
the character's next DDB update. That is inherent to "DDB is the source of truth", and
is why the sync has an off switch (`syncConditions`, world scope, default on).

### 3. One fetch per event — `core/handlers/CharacterUpdateMessageHandler.js`

The obvious implementation — a second handler for the same event — would have fetched
the full character from the proxy twice per update, doubling DDB API traffic for every
HP tick at the table. Instead a single handler owns the event: it resolves the actor,
fetches once, and hands the character to each registered `ICharacterSync`
(`DamageSyncService`, `ConditionSyncService`). Adding a future sync (currency,
inspiration, spell slots) means registering another service in `DDBSyncManager`, not
touching the handler.

Each sync runs in its own try/catch: a condition that cannot be applied must not cost
the player their HP update, and vice versa. Sync services that are switched off in
settings are filtered out *before* the fetch, so disabling both makes character updates
free.

This replaces `DamageMessageHandler`, whose fetch-and-resolve logic moved into the
handler and whose `IDamageSync` interface was superseded by `ICharacterSync`. Wiring up
`isEnabled()` also fixed a latent bug: the `updateDamageOnly` setting was registered but
never read, so HP synced regardless of the checkbox.
