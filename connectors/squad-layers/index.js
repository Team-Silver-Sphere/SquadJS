import fs from 'fs';

class SquadLayers {
  constructor() {
    this.layers = JSON.parse(
      fs.readFileSync('./connectors/squad-layers/layers.json', 'utf8')
    );
  }

  getLayerByLayerName(layerName) {
    const layer = this.layers.filter(layer => layer.layer === layerName);
    return layer.length === 1 ? layer[0] : null;
  }

  getLayerByLayerClassname(layerClassname) {
    const layer = this.layers.filter(
      layer => layer.layerClassname === layerClassname
    );
    return layer.length === 1 ? layer[0] : null;
  }

  getLayerNames() {
    return this.layers.map(layer => layer.layer);
  }

  getFilteredLayers(filter = {}) {
    const whitelistedLayers = filter.whitelistedLayers || null;
    const blacklistedLayers = filter.blacklistedLayers || null;
    const whitelistedMaps = filter.whitelistedMaps || null;
    const blacklistedMaps = filter.blacklistedMaps || null;
    const whitelistedGamemodes = filter.whitelistedGamemodes || null;
    const blacklistedGamemodes = filter.blacklistedGamemodes || ['Training'];
    const flagCountMin = filter.flagCountMin || null;
    const flagCountMax = filter.flagCountMax || null;
    const hasCommander = filter.hasCommander || null;
    const hasTanks = filter.hasTanks || null;
    const hasHelicopters = filter.hasHelicopters || null;

    const layers = [];

    for (const layer of this.layers) {
      // Whitelist / Blacklist Layers
      if (
        whitelistedLayers !== null &&
        !whitelistedLayers.includes(layer.layer)
      )
        continue;
      if (blacklistedLayers !== null && blacklistedLayers.includes(layer.layer))
        continue;

      // Whitelist / Blacklist Maps
      if (whitelistedMaps !== null && !whitelistedMaps.includes(layer.map))
        continue;
      if (blacklistedMaps !== null && blacklistedMaps.includes(layer.map))
        continue;

      // Whitelist / Blacklist Gamemodes
      if (
        whitelistedGamemodes !== null &&
        !whitelistedGamemodes.includes(layer.gamemode)
      )
        continue;
      if (
        blacklistedGamemodes !== null &&
        blacklistedGamemodes.includes(layer.gamemode)
      )
        continue;

      // Flag Count
      if (flagCountMin !== null && layer.flagCount < flagCountMin) continue;
      if (flagCountMax !== null && layer.flagCount > flagCountMax) continue;

      // Other Properties
      if (hasCommander !== null && layer.commander !== hasCommander) continue;
      if (hasTanks !== null && (layer.tanks !== 'N/A') !== hasTanks) continue;
      if (
        hasHelicopters !== null &&
        (layer.helicopters !== 'N/A') !== hasHelicopters
      )
        continue;

      layers.push(layer.layer);
    }

    return layers;
  }

  isHistoryCompliant(layerHistory, layer, options = {}) {
    const layerTolerance = options.layerTolerance || 4;
    const mapTolerance = options.mapTolerance || 2;
    const timeTolerance = options.timeTolerance || 5 * 60 * 60 * 1000;

    for (let i = 0; i < layerHistory.length; i++) {
      if (i >= Math.max(layerHistory, mapTolerance)) return true;
      if (new Date() - layerHistory[i].time > timeTolerance) return true;

      if (
        i < layerTolerance &&
        layerHistory[i].map === this.getLayerByLayerName(layer).map
      )
        return false;
      if (i < layerTolerance && layerHistory[i].layer === layer) return false;
    }
    return true;
  }

  isPlayerCountCompliant(playerCount, layer) {
    return !(
      playerCount >
        this.getLayerByLayerName(layer).estimatedSuitablePlayerCount.max ||
      playerCount <
        this.getLayerByLayerName(layer).estimatedSuitablePlayerCount.min
    );
  }
}

export default new SquadLayers();
