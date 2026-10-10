import BasePlugin from './base-plugin.js';
import fs from 'fs';
import path from 'path';

export default class FogOfWar extends BasePlugin {
  static get description() {
    return 'The <code>FogOfWar</code> plugin automatically disables fog of war for specific map layers.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      mode: {
        required: false,
        description: 'Fog of war mode to set.',
        default: 1
      },
      delay: {
        required: false,
        description: 'Delay (in ms) between each step of fog of war handling.',
        default: 10 * 1000
      },
      mapListPath: {
        required: false,
        description: 'Path to JSON file with map layer IDs that should have fog turned off.',
        default: './fog_off_maps.json'
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);
    this.validMapLayers = [];
    this.onNewGame = this.onNewGame.bind(this);
  }

  async mount() {
    console.log('[FogOfWar] Plugin mounted.');
    this.loadMapList();
    this.server.on('NEW_GAME', this.onNewGame);
  }

  async unmount() {
    this.server.removeListener('NEW_GAME', this.onNewGame);
  }

  loadMapList() {
    try {
      const fullPath = path.resolve(this.options.mapListPath);
      if (fs.existsSync(fullPath)) {
        const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        this.validMapLayers = json.layers || [];
        console.log(`[FogOfWar] Loaded ${this.validMapLayers.length} fog-off layers from ${this.options.mapListPath}`);
      } else {
        console.log(`[FogOfWar] Map list JSON file not found at ${fullPath}`);
      }
    } catch (err) {
      console.error(`[FogOfWar] Failed to load map list: ${err.message}`);
    }
  }

  async getLayerWithRetry(retries = 5, delay = 3000) {
    for (let i = 0; i < retries; i++) {
      try {
        let layerObj = this.server.currentLayer;
        if (!layerObj) {
          layerObj = await this.server.rcon.getCurrentMap();
          if (layerObj && layerObj.layer) {
            return layerObj.layer;
          }
        } else if (layerObj.layerid) {
          return layerObj.layerid;
        }
      } catch (err) {
        console.error(`[FogOfWar] Error while getting map layer: ${err.message}`);
      }

      console.log(`[FogOfWar] Retry ${i + 1}/${retries} — waiting ${delay}ms for map layer...`);
      await new Promise((res) => setTimeout(res, delay));
    }

    return null;
  }

  async onNewGame() {
    this.loadMapList(); // reload JSON each time a new game starts

    const layerId = await this.getLayerWithRetry();

    if (!layerId) {
      console.log('[FogOfWar] Could not determine current map layer after retries.');
      return;
    }

    if (this.validMapLayers.includes(layerId)) {
      const delaySeconds = Math.floor(this.options.delay / 1000);
      console.log(`[FogOfWar] Map layer ${layerId} is in fog-off list. Disabling fog of war in ${delaySeconds * 2} seconds...`);

      // Step 1: Initial delay before warning
      /*await new Promise((res) => setTimeout(res, this.options.delay));

      try {
        await this.server.rcon.broadcast(`Fog of war will be disabled for this map in ${delaySeconds} seconds.`);
      } catch (err) {
        console.error(`[FogOfWar] Failed to send broadcast message: ${err.message}`);
      }*/

      // Step 2: Delay again before disabling fog of war
      setTimeout(async () => {
        try {
          await this.server.rcon.setFogOfWar(this.options.mode);
          console.log(`[FogOfWar] Fog of war set to ${this.options.mode} for map layer: ${layerId}`);
          //await this.server.rcon.broadcast('Fog of war has been disabled. Check your maps.');
        } catch (err) {
          console.error(`[FogOfWar] Failed to set fog of war: ${err.message}`);
        }
      }, this.options.delay);
    } else {
      console.log(`[FogOfWar] Map layer ${layerId} not in fog-off list — skipping fog of war command.`);
    }
  }
}
