/**
 * Character Mapping Application - UI for managing character mappings
 * 
 * Responsibility: Provide FormApplication UI for character mapping management
 * SOLID: Single Responsibility - only handles UI interaction and rendering
 */
export class CharacterMappingApplication extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'ddb-character-mapping',
    position: {
      width: 500,
      height: 'auto'
    },
    tag: "form",
    classes: ['ddb-sync', 'character-mapping'],
    window: {
      icon: "fas fa-gear",
      title: "ddbCharacterMapping.form.title"
    }
  }

  static PARTS = {
    ddbCharacterMapping: {
      template: 'modules/ddb-sync/templates/character-mapping.html',
    }
  }

  get title() {
    return 'D&D Beyond Character Mapping';
  }

  _prepareContext() {
    const mapping = game.settings.get('ddb-sync', 'characterMapping') || {};
    const actors = game.actors.filter(a => a.type === 'character');
    
    const mappings = Object.entries(mapping).map(([ddbId, actorId]) => {
      const actor = game.actors.get(actorId);
      return {
        ddbCharacterId: ddbId,
        actorId: actorId,
        actorName: actor ? actor.name : 'Unknown Actor'
      };
    });

    return {
      mappings,
      actors: actors.map(a => ({ id: a.id, name: a.name }))
    };
  }

  _onRender(context, options) {
    
    const htmlElement = this.element; // html instanceof HTMLElement ? html : html[0];

    // Add new mapping
    const addButton = htmlElement.querySelector('.add-mapping');
    if (addButton) {
      addButton.addEventListener('click', async (ev) => {
        ev.preventDefault();
        const ddbIdInput = htmlElement.querySelector('input[name="new-ddb-id"]');
        const actorSelect = htmlElement.querySelector('select[name="new-actor-id"]');
        
        const ddbId = ddbIdInput?.value?.trim();
        const actorId = actorSelect?.value;
        
        if (!ddbId || !actorId) {
          ui.notifications.warn('Please enter both DDB Character ID and select a Foundry Actor');
          return;
        }

        await game.DDBSync.characterMapper.setMapping(ddbId, actorId);
        var actor = await game.DDBSync.characterMapper.getFoundryActor(ddbId); // Ensure mapping is loaded
        if (actor) {
          await actor.setFlag('ddb-sync', 'ddbCharacterId', ddbId);
        }
        ui.notifications.info('Character mapping added');
        this.render();
      });
    }

    // Remove mapping buttons
    htmlElement.querySelectorAll('.remove-mapping').forEach(btn => {
      btn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        const ddbId = ev.currentTarget.dataset.ddbId;
        await game.DDBSync.characterMapper.removeMapping(ddbId);
        var actor = await game.DDBSync.characterMapper.getFoundryActor(ddbId); // Ensure mapping is loaded
        if (actor) {
          await actor.unsetFlag('ddb-sync', 'ddbCharacterId');
        }
        ui.notifications.info('Character mapping removed');
        this.render();
      });
    });
  }
};