# DDB Sync Module

![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads%20(Latest)&query=assets%5B0%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FAshDarkley%2Fddb-sync%2Freleases%2Flatest)
![Foundry Minimum Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FAshDarkley%2Fddb-sync%2Fmain%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.minimum&colorB=orange)
![Foundry Verified Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FAshDarkley%2Fddb-sync%2Fmain%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=green)

A Foundry VTT module that synchronizes D&D Beyond dice rolls and character health with Foundry VTT in real-time using a WebSocket-based listener and modular service/handler architecture.  No browser extensions needed!

## Patreon

Full functionality of this module is freely available.  However, if you like it please consider providing support.  Any you can give is greatly appreciated.  [Patreon](https://patreon.com/ashdarkley)

## Overview

DDB Sync listens for messages from D&D Beyond; deduplicates and dispatches them to specialized handlers to:
- Capture and apply dice rolls to Foundry actors
- Sync HP/damage updates without overwriting unrelated character data
- Provide a UI for mapping D&D Beyond characters to Foundry actors
- On each player actor sheet choose the desired dice roll type: Normal, Manual (prompt for manual dice entry), D&D Beyond (listen for rolls from D&D Beyond)   

## System Requirements
- **Foundry VTT**: Version 13 or higher (verified on v13)
- **D&D 5e System**: Required for character and ability mapping
- **DDB Proxy**: Required to proxy requests to D&D Beyond.  Must be your own install and not Mr Primates hosted version as this require a small change to the proxy to function correctly. 

## IMPORTANT! REQUIRES custom DDB Proxy
- **DDB Proxy** - A proxy server for D&D Beyond API Access
  - GitHub: [ddb-proxy repository](https://github.com/MrPrimate/ddb-proxy)
  - The proxy intercepts D&D Beyond API calls and provides authenticated access 

**Important**: The DDB Proxy requires a manual configuration change before use.

1. Set up the DDB Proxy server from the repository
2. Open the proxy's `index.js` file
3. Locate the `/proxy/auth` endpoint
4. Modify the auth response to include the token:
    ```javascript
    // Find this section in index.js:
    res.json({
        token: token, // ADD THIS LINE
    });
    ```
5. Restart the proxy server

This ensures the module can receive the authentication token needed for subsequent API calls.


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
1. **CobaltSession Cookie** (`cobaltCookie`)
    - Your D&D Beyond authentication cookie
    - Find in browser DevTools > Application > Cookies > D&D Beyond site
    - Copy the value of the `CobaltSession` cookie

2. **Cobalt User ID** (`userId`)
    - Your D&D Beyond user ID
    - Find in browser DevTools > Console > Type in: console.log(Cobalt.User.Id)
    - Copy the value

3. **Campaign ID** (`campaignId`)
    - The D&D Beyond campaign ID
    - Found in the campaign URL: `dndbeyond.com/campaigns/{campaignId}`

4. **Proxy Server URL** (`proxyUrl`)
    - Custom proxy server for API calls (default: `http://localhost:3000`)
    - Required, plus see note above about necessary customization

5. **Update Character Damage** (`updateDamageOnly`)
    - When enabled, character updates sync HP/damage changes (default: `true`)
    - When disabled, characetr updates are ignored

6. **Character Mapping** (`characterMapping`)
    - Mapping of D&D Beyond character IDs to Foundry actor IDs

7. **Enable DDB Dice Sync** (`captureRolls`)
    - Enable/disable automatic roll capture

Refer to `config/SettingsRegistry.js` for exact keys and defaults.

## Installation
1. Place the module folder into Foundry's `modules` directory.
2. Enable the module in Foundry's Module Management.
3. Configure the module settings; start the proxy.

Ensure the proxy provides authenticated messages and is reachable via `proxyUrl`.

## Usage
- Use the `Character Mapping` UI to map DDB characters to Foundry actors.
- Enable `captureRolls` to let the module automatically capture and apply relevant rolls.
- Toggle `updateDamageOnly` if you only want HP/damage changes applied automatically.
- Open a player actor sheet and choose the desired dice roll "Normal", "Manual", or "D&D Beyond"

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


