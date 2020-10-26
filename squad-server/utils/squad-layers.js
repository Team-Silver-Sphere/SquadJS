import axios from 'axios';
import didYouMean from 'didyoumean';
import fs from 'fs';
import Logger from 'core/logger';

class SquadLayersBase {
  get layerNames() {
    return this.layers.map((layer) => layer.name);
  }

  getLayerByCondition(condition) {
    const results = this.layers.filter(condition);
    return results.length === 1 ? results[0] : null;
  }

  getLayerByLayerName(layerName) {
    return this.getLayerByCondition((layer) => layer.layer === layerName);
  }

  getLayerByLayerClassname(layerClassname) {
    return this.getLayerByCondition((layer) => layer.layerClassname === layerClassname);
  }

  getLayerByLayerNameAutoCorrection(layerName) {
    return this.getLayerByLayerName(didYouMean(layerName, this.layerNames()));
  }

  getLayerByNumber(layerNumber) {
    return this.getLayerByCondition((layer) => layer.layerNumber === layerNumber);
  }
}

class SquadLayers extends SquadLayersBase {
  constructor(source) {
    super();
    Logger.verbose('SquadServer', 1, 'Creating SquadLayers...');

    this.source =
      source || 'https://raw.githubusercontent.com/Thomas-Smyth/squad-layers/master/layers.json';
    this.pulled = false;
  }

  async pull(force = false) {
    if (this.pulled && !force) return;

    this.layers = (await axios.get(this.source)).data;
    for (let i = 0; i < this.layers.length; i++) this.layers[i].layerNumber = i + 1;
  }

  buildPoolFromLayerNames(layerNames, activeFilter) {
    return new SquadLayersPool(
      this.layers.filter((layer) => layerNames.includes(layer.layer)),
      activeFilter
    );
  }

  buildPoolFromLayerNamesAutoCorrection(layerNames, activeFilter) {
    return this.buildPoolFromLayerNames(
      layerNames.map((layerName) => this.getLayerByLayerNameAutoCorrection(layerName)),
      activeFilter
    );
  }

  buildPoolFromFile(path, activeFilter, delimiter = '\n') {
    return this.buildPoolFromLayerNames(
      fs.readFileSync(path, 'utf8').split(delimiter),
      activeFilter
    );
  }

  buildPoolFromFilter(filter, activeFilter) {
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
      if (whitelistedLayers !== null && !whitelistedLayers.includes(layer.layer)) continue;
      if (blacklistedLayers !== null && blacklistedLayers.includes(layer.layer)) continue;

      // Whitelist / Blacklist Maps
      if (whitelistedMaps !== null && !whitelistedMaps.includes(layer.map)) continue;
      if (blacklistedMaps !== null && blacklistedMaps.includes(layer.map)) continue;

      // Whitelist / Blacklist Gamemodes
      if (whitelistedGamemodes !== null && !whitelistedGamemodes.includes(layer.gamemode)) continue;
      if (blacklistedGamemodes !== null && blacklistedGamemodes.includes(layer.gamemode)) continue;

      // Flag Count
      if (flagCountMin !== null && layer.flagCount < flagCountMin) continue;
      if (flagCountMax !== null && layer.flagCount > flagCountMax) continue;

      // Other Properties
      if (hasCommander !== null && layer.commander !== hasCommander) continue;
      if (hasTanks !== null && (layer.tanks !== 'N/A') !== hasTanks) continue;
      if (hasHelicopters !== null && (layer.helicopters !== 'N/A') !== hasHelicopters) continue;

      layers.push(layer);
    }

    return new SquadLayersPool(layers, activeFilter);
  }
}

class SquadLayersPool extends SquadLayersBase {
  constructor(layers, activeFilter = null) {
    super();

    this.layers = layers;
    for (let i = 0; i < this.layers.length; i++) this.layers[i].layerNumber = i + 1;
    this.activeFilter = activeFilter;
  }

  inPool(layer) {
    if (typeof layer === 'object') layer = layer.layer;
    return super.layerNames.includes(layer);
  }

  isHistoryCompliant(layerHistory, layer) {
    if (this.activeFilter === null) return true;

    if (typeof layer === 'object') layer = layer.layer;

    for (
      let i = 0;
      i < Math.min(layerHistory.length, this.activeFilter.layerHistoryTolerance);
      i++
    ) {
      if (new Date() - layerHistory[i].time > this.activeFilter.historyResetTime) return true;
      if (layerHistory[i].layer === layer) return false;
    }

    return true;
  }

  isMapHistoryCompliant(layerHistory, layer) {
    if (this.activeFilter === null) return true;

    if (typeof layer === 'string') layer = this.getLayerByLayerName(layer);

    for (let i = 0; i < Math.min(layerHistory.length, this.activeFilter.mapHistoryTolerance); i++) {
      if (new Date() - layerHistory[i].time > this.activeFilter.historyResetTime) return true;
      if (layerHistory[i].map === layer.map) return false;
    }

    return true;
  }

  isGamemodeHistoryCompliant(layerHistory, layer) {
    if (this.activeFilter === null) return true;

    if (typeof layer === 'string') layer = this.getLayerByLayerName(layer);

    const gamemodeHistoryTolerance = this.activeFilter.gamemodeHistoryTolerance[layer.gamemode];
    if (!gamemodeHistoryTolerance) return true;

    for (let i = 0; i < Math.min(layerHistory.length, gamemodeHistoryTolerance); i++) {
      if (new Date() - layerHistory[i].time > this.activeFilter.historyResetTime) return true;
      if (layerHistory[i].gamemode === layer.gamemode) return false;
    }

    return true;
  }

  isGamemodeRepetitiveCompliant(layerHistory, layer) {
    if (this.activeFilter === null) return true;

    if (typeof layer === 'string') layer = this.getLayerByLayerName(layer);

    const gamemodeRepetitiveTolerance = this.activeFilter.gamemodeRepetitiveTolerance[
      layer.gamemode
    ];
    if (!gamemodeRepetitiveTolerance) return true;

    for (let i = 0; i < Math.min(layerHistory.length, gamemodeRepetitiveTolerance); i++) {
      if (new Date() - layerHistory[i].time > this.activeFilter.historyResetTime) return true;

      if (layerHistory[i].gamemode.gamemode !== layer.gamemode) return true;
    }
    return false;
  }

  isFactionCompliant(layerHistory, layer) {
    if (this.activeFilter === null || this.activeFilter.factionComplianceEnabled === false)
      return true;

    if (layerHistory.length === 0) return true;

    if (typeof layer === 'string') layer = this.getLayerByLayerName(layer);

    return (
      !layerHistory[0] ||
      (layerHistory[0].teamOne.faction !== layer.teamTwo.faction &&
        layerHistory[0].teamTwo.faction !== layer.teamOne.faction)
    );
  }

  isFactionHistoryCompliant(layerHistory, layer, faction = null) {
    if (this.activeFilter === null) return true;

    if (typeof layer === 'string') layer = SquadLayers.getLayerByLayerName(layer);

    if (faction === null) {
      return (
        this.isFactionHistoryCompliant(layerHistory, layer, layer.teamOne.faction) &&
        this.isFactionHistoryCompliant(layerHistory, layer, layer.teamTwo.faction)
      );
    } else {
      const factionThreshold = this.activeFilter.factionHistoryTolerance[faction];
      if (!factionThreshold) return true;

      for (let i = 0; i < Math.min(layerHistory.length, factionThreshold); i++) {
        if (new Date() - layerHistory[i].time > this.activeFilter.historyResetTime) return true;
        if (
          layerHistory[i].teamOne.faction === faction ||
          layerHistory[i].teamTwo.faction === faction
        )
          return false;
      }

      return true;
    }
  }

  isFactionRepetitiveCompliant(layerHistory, layer, faction = null) {
    if (this.activeFilter === null) return true;

    if (typeof layer === 'string') layer = SquadLayers.getLayerByLayerName(layer);

    if (faction === null) {
      return (
        this.isFactionRepetitiveCompliant(layerHistory, layer, layer.teamOne.faction) &&
        this.isFactionRepetitiveCompliant(layerHistory, layer, layer.teamTwo.faction)
      );
    } else {
      const factionThreshold = this.activeFilter.factionRepetitiveTolerance[faction];
      if (!factionThreshold) return true;

      for (let i = 0; i < Math.min(layerHistory.length, factionThreshold); i++) {
        if (new Date() - layerHistory[i].time > this.activeFilter.historyResetTime) return true;

        if (
          layerHistory[i].teamOne.faction !== faction &&
          layerHistory[i].teamTwo.faction !== faction
        )
          return true;
      }

      return false;
    }
  }

  isPlayerCountCompliant(server, layer) {
    if (this.activeFilter === null || this.activeFilter.playerCountComplianceEnabled === false)
      return true;

    if (typeof layer === 'string') layer = this.getLayerByLayerName(layer);

    return !(
      server.players.length > layer.estimatedSuitablePlayerCount.max ||
      server.players.length < layer.estimatedSuitablePlayerCount.min
    );
  }
}

export { SquadLayers, SquadLayersPool };
