import fs from 'fs';
import SquadLayers, {
  SquadLayers as SquadLayersClass
} from './squad-layers.js';

export default class SquadLayerFilter extends SquadLayersClass {
  static buildFromList(layerNames) {
    return new SquadLayerFilter(layerNames);
  }

  static buildFromDidYouMeanList(layerNames) {
    const layers = [];
    for (const layerName of layerNames) {
      const layer = SquadLayers.getLayerByDidYouMean(
        layerName,
        SquadLayers.getLayerNames()
      );
      if (layer) layers.push(layer);
    }
    return new SquadLayerFilter(layers);
  }

  static buildFromFile(filename, delimiter = '\n') {
    const lines = fs
      .readFileSync('./connectors/data/layers.json', 'utf8')
      .split(delimiter);
    const layers = [];

    const validLayerNames = SquadLayers.getLayerNames();

    for (const line of lines) {
      if (validLayerNames.contains(line))
        layers.push(SquadLayers.getLayerByLayerName(line));
    }
    return new SquadLayerFilter(layers);
  }

  static buildFromFilter(filter = {}) {
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

    for (const layer of SquadLayers.getLayers()) {
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

      layers.push(layer);
    }

    return new SquadLayerFilter(layers);
  }

  inLayerPool(layerName) {
    return super.getLayerNames().includes(layerName);
  }
}
