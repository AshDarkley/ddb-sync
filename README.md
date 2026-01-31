# DDB Sync Module

A Foundry VTT module that synchronizes D&D Beyond dice rolls and character health with Foundry VTT in real-time using a WebSocket-based listener and modular service/handler architecture.

## Overview

DDB Sync listens for messages from D&D Beyond; deduplicates and dispatches them to specialized handlers to:
- Capture and apply dice rolls to Foundry actors
- Sync HP/damage updates without overwriting unrelated character data
- Provide a UI for mapping D&D Beyond characters to Foundry actors

## Key Capabilities
- Real-time WebSocket listener with reconnection handling (`websocket/DDBWebSocket.js`)
- Message deduplication to prevent duplicate processing (`websocket/MessageDeduplicator.js`)
- Service layer for fetching and mapping character data (`core/services/`)
- Multiple roll handlers for attack, damage, saves, ability checks, and initiative (`dice/handlers/`)
- Settings-driven behavior and a character-mapping UI for manual overrides (`config/SettingsRegistry.js`, `ui/CharacterMappingApplication.js`)

## Project Structure (high level)
- `module.json`, `package.json` — module metadata
- `scripts/main.js` — Foundry module bootstrap
- `core/` — central manager (`DDBSyncManager.js`), handlers, services and validators
- `dice/` — extraction, builders, strategies and handlers for roll types
- `websocket/` — WebSocket handling and deduplication
- `ui/`, `templates/` — mapping UI and templates
- `examples/` — sample D&D Beyond payloads used for testing

## Architecture & Flow

1. `websocket/DDBWebSocket.js` receives incoming messages.
2. `websocket/MessageDeduplicator.js` filters out already-seen messages.
3. `core/MessageDispatcher.js` routes messages to a handler in `core/handlers/` or `dice/handlers/`.
4. Handlers call service layer functions (`core/services/*`) to apply changes to Foundry actors.

This separation keeps message handling, business logic, and Foundry integration cleanly separated and easy to extend.

## Configuration
Configure settings via the module settings (registered in `config/SettingsRegistry.js`):
- `cobaltCookie` — D&D Beyond `CobaltSession` cookie (for proxied API access)
- `userId` — D&D Beyond user id used to scope incoming messages
- `campaignId` — campaign identifier (optional filter)
- `proxyUrl` — optional proxy server URL (e.g., `http://localhost:3000`)
- `captureRolls` (boolean) — enable/disable automatic roll capture
- `updateDamageOnly` (boolean) — when true, only HP/damage updates are applied automatically
- `characterMapping` — mapping of DDB character IDs to Foundry actor IDs

Refer to `config/SettingsRegistry.js` for exact keys and defaults.

## Installation
1. Place the module folder into Foundry's `modules` directory.
2. Enable the module in Foundry's Module Management.
3. Configure the module settings; start the optional proxy if required.

If you use an external proxy for D&D Beyond API access, ensure the proxy provides authenticated messages and is reachable via `proxyUrl`.

## Usage
- Use the `Character Mapping` UI to map DDB characters to Foundry actors and run manual syncs.
- Enable `captureRolls` to let the module automatically capture and apply relevant rolls.
- Toggle `updateDamageOnly` if you only want HP/damage changes applied automatically.

## Troubleshooting
- Connection issues: verify `cobaltCookie`, `campaignId`, `proxyUrl` and check browser console logs for WebSocket errors.
- Missing rolls: ensure `captureRolls` is enabled and the DDB character is mapped to an actor.
- Duplicate events: consult the deduplication logic in `websocket/MessageDeduplicator.js` and increase window if upstream replays occur.

## Developer Notes
- Add a new roll type: implement a handler in `dice/handlers/` and register it with the dispatcher.
- Extend mapping logic: modify `core/services/CharacterMapper.js` and update `ui/CharacterMappingApplication.js`.

## Where to look in code
- Entry: `scripts/main.js`
- Core manager: `core/DDBSyncManager.js`
- WebSocket & dedupe: `websocket/DDBWebSocket.js`, `websocket/MessageDeduplicator.js`
- Services: `core/services/`
- Dice logic: `dice/`
- UI & templates: `ui/`, `templates/`

## License
See `module.json` for license metadata.

## Support
Open an issue in the repo or contact the maintainer for feature requests and bug reports.
