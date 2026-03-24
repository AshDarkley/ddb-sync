# Unit Testing Guide

This document outlines the unit testing approach for the DDB Sync module.

## Overview

The test suite provides comprehensive coverage of core services, message handlers, dice roll handlers, and WebSocket utilities. 

**Test Summary:**
- **Total Test Suites:** 15+ files
- **Total Test Cases:** 200+ tests
- **Coverage Areas:**
  - Core services (character mapping, damage sync, validation)
  - Message handlers (dice rolls, damage updates)
  - Dice handlers (attacks, saves, ability checks, initiative)
  - WebSocket management (connection, deduplication)
  - Data extraction and validation

### Installation
```bash
npm install
```

This installs Jest as a dev dependency (configured in `package.json`).

### Running Tests

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode (re-run on file changes):**
```bash
npm run test:watch
```

**Run tests with coverage report:**
```bash
npm run test:coverage
```

## Test Structure

Tests are organized in the `tests/` directory, mirroring the source structure:

```
tests/
├── core/
│   ├── services/
│   │   ├── CharacterDataService.test.js
│   │   ├── CharacterMapper.test.js
│   │   ├── DamageSyncService.test.js
│   │   └── MessageDispatcher.test.js
│   ├── handlers/
│   │   ├── DamageMessageHandler.test.js
│   │   └── DiceRollMessageHandler.test.js
│   └── SettingsValidator.test.js
├── dice/
│   ├── DiceExtractor.test.js
│   ├── RollBuilder.test.js
│   ├── RollStrategyDispatcher.test.js
│   └── handlers/
│       ├── AttackRollHandler.test.js
│       └── RollHandlers.test.js
└── websocket/
    ├── MessageDeduplicator.test.js
    └── WebSocketManager.test.js
```

## Test Files Overview

### Core Services

#### CharacterMapper.test.js
Tests the character mapping service which manages D&D Beyond to Foundry actor associations:
- Adding and removing mappings
- Retrieving mappings
- Checking if a character is mapped
- Bulk loading mappings

#### DamageSyncService.test.js
Tests the damage synchronization service:
- Syncing damage between D&D Beyond and Foundry
- Calculating HP updates
- Determining character states (healed, dead, healing needed)
- Handling temporary HP

#### SettingsValidator.test.js
Tests validation of all module settings:
- CobaltSession cookie validation
- User ID validation
- Campaign ID validation
- Proxy URL validation
- Character mapping validation
- Bulk validation of all settings

#### MessageDispatcher.test.js
Tests message routing and dispatching:
- Registering and unregistering handlers
- Finding handlers for message types
- Dispatching messages to handlers
- Safe dispatch with error handling
- Getting supported types

#### CharacterDataService.test.js
Tests character data fetching and processing:
- Formatting character URLs for API calls
- Validating character data structures
- Extracting character information
- Determining character state (dead, critical, wounded, healthy)
- Formatting character display information
- Managing proxy URLs

### Core Handlers

#### DiceRollMessageHandler.test.js
Tests handling of incoming dice roll messages:
- Supporting various message types (dice_roll, roll)
- Extracting roll information from messages
- Routing to appropriate roll handlers via dispatcher
- Using default values for optional fields

#### DamageMessageHandler.test.js
Tests handling of damage/HP update messages:
- Supporting various message types (damage, hp_update, character_update)
- Extracting character IDs from different message structures
- Syncing damage to mapped characters
- Gracefully handling unmapped characters
- Error handling and reporting

### Dice Handlers

#### DiceExtractor.test.js
Tests extraction of dice information from D&D Beyond messages:
- Extracting roll types
- Extracting dice count and sides
- Extracting character IDs
- Extracting damage amounts
- Extracting all relevant dice data

#### RollBuilder.test.js
Tests dice roll extraction and processing:
- Dice notation generation (e.g., "1d20+5")
- Parsing roll strings
- Calculating roll totals
- Critical hit/fail detection
- Building complete roll result objects

#### RollStrategyDispatcher.test.js
Tests routing of rolls to appropriate handlers:
- Registering roll handler strategies
- Finding handlers for roll types
- Dispatching rolls to correct handlers
- Getting supported roll types
- Safe dispatching with error handling

#### AttackRollHandler.test.js
Tests handling of attack roll events:
- Supporting attack and tohit roll types
- Computing attack roll totals with modifiers
- Detecting critical hits (nat 20)
- Applying attack rolls to mapped actors
- Proper timestamp handling

#### RollHandlers.test.js (SaveRollHandler, AbilityCheckRollHandler, InitiativeRollHandler)
Tests for additional roll types:
- **SaveRollHandler**: Saves with ability type tracking
- **AbilityCheckRollHandler**: Ability checks and skill checks
- **InitiativeRollHandler**: Initiative rolls with single die value

### WebSocket

#### MessageDeduplicator.test.js
Tests the message deduplication service to prevent duplicate processing:
- Detecting duplicate messages
- Hash generation for messages
- Cleanup of expired entries
- Time window-based deduplication

#### WebSocketManager.test.js
Tests WebSocket connection management:
- Connecting and disconnecting
- Connection state checking
- Event listener registration and triggering
- Sending messages through the connection
- Reconnection configuration
- Connection statistics tracking

## Writing New Tests

### Test Structure
Each test file should follow this pattern:

```javascript
describe('ServiceName', () => {
  let service;

  beforeEach(() => {
    // Initialize service or mock dependencies
    service = new ServiceName();
  });

  describe('methodName', () => {
    it('should describe expected behavior', () => {
      const result = service.methodName(input);
      expect(result).toBe(expected);
    });

    it('should handle edge cases', () => {
      expect(() => service.methodName(invalid)).toThrow();
    });
  });
});
```

### Best Practices

1. **One responsibility per test**: Each test should verify a single behavior
2. **Clear naming**: Use descriptive test names that explain what's being tested
3. **Arrange-Act-Assert**: Structure tests with setup, execution, and assertion
4. **Mock dependencies**: Use Jest mocks for external services
5. **Test edge cases**: Include tests for errors, boundaries, and invalid inputs
6. **Use beforeEach**: Set up common test fixtures to reduce duplication

## Mocking in Tests

Jest provides built-in mocking support. Example:

```javascript
const mockMapper = {
  getMapping: jest.fn((ddbId) => {
    const mappings = { '123': 'actor-456' };
    return mappings[ddbId] || null;
  })
};

const service = new DamageSyncService(mockMapper);
```

## Coverage Goals

Aim for:
- **Statements**: 80%+ coverage
- **Branches**: 75%+ coverage
- **Functions**: 80%+ coverage
- **Lines**: 80%+ coverage

View detailed coverage reports in `coverage/` after running `npm run test:coverage`.

## Integration with CI/CD

Add test execution to your CI pipeline:

```yaml
# Example: GitHub Actions, GitLab CI, etc.
test:
  script:
    - npm install
    - npm test
    - npm run test:coverage
```

## Future Test Expansion

Additional tests to consider as the project grows:

- **core/DDBSyncManager.test.js** - Main module orchestration and initialization
- **core/overrides/RollEvaluationOverride.test.js** - Roll evaluation custom logic
- **dice/DiceRollHandler.test.js** - Dice roll handler orchestration
- **websocket/DDBWebSocket.test.js** - Low-level WebSocket connection handling
- **Integration tests** - End-to-end tests for multi-component flows
- **Mock Foundry API tests** - Tests using Foundry VTT mock objects
- **Performance tests** - Benchmarks for message processing and roll handling

## Troubleshooting

**Tests not running?**
- Ensure Jest is installed: `npm install --save-dev jest`
- Check that test files end in `.test.js`
- Verify `jest.config.js` is in the root directory

**Module not found errors?**
- Update test imports to match your actual file structure
- Use relative paths (e.g., `../../../scripts/...`)

**Async test timeouts?**
- Increase Jest timeout in `jest.config.js`: `testTimeout: 10000`
- Ensure async tests use `done()` callback or return a Promise
