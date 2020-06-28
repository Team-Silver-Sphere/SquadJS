import fs from 'fs';
import SquadLayers, { SquadLayers as SquadLayersClass } from './squad-layers.js';

export default class SquadLayerFilter extends SquadLayersClass {
  constructor(layers, activeLayerFilter = null) {
    super(layers);

    if (activeLayerFilter === null) {
      this.activeLayerFilter = null;
    } else {
      this.activeLayerFilter = {
        historyResetTime: 5 * 60 * 60 * 1000,
        layerHistoryTolerance: 8,
        mapHistoryTolerance: 4,
        gamemodeHistoryTolerance: {
          // defaults as off
          ...activeLayerFilter.gamemodeHistoryTolerance
        },
        gamemodeRepetitiveTolerance: {
          // defaults as off
          ...activeLayerFilter.gamemodeRepetitiveTolerance
        },
        playerCountComplianceEnabled: true,
        factionComplianceEnabled: true,
        factionHistoryTolerance: {
          // defaults as off
          ...activeLayerFilter.factionHistoryTolerance
        },
        factionRepetitiveTolerance: {
          // defaults as off
          ...activeLayerFilter.factionRepetitiveTolerance
        },
        ...activeLayerFilter
      };
    }
  }

  static buildFromList(layerNames, activeLayerFilter) {
    return new SquadLayerFilter(layerNames, activeLayerFilter);
  }

  static buildFromDidYouMeanList(layerNames, activeLayerFilter) {
    const layers = [];
    for (const layerName of layerNames) {
      const layer = SquadLayers.getLayerByDidYouMean(layerName, SquadLayers.getLayerNames());
      if (layer) layers.push(layer);
    }
    return new SquadLayerFilter(layers, activeLayerFilter);
  }

  static buildFromFile(filename, activeLayerFilter, delimiter = '\n') {
    const lines = fs.readFileSync('./connectors/data/layers.json', 'utf8').split(delimiter);
    const layers = [];

    const validLayerNames = SquadLayers.getLayerNames();

    for (const line of lines) {
      if (validLayerNames.contains(line)) layers.push(SquadLayers.getLayerByLayerName(line));
    }
    return new SquadLayerFilter(layers, activeLayerFilter);
  }

  static buildFromFilter(filter = {}, activeLayerFilter) {
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

    return new SquadLayerFilter(layers, activeLayerFilter);
  }

  inLayerPool(layer) {
    if (typeof layer === 'object') layer = layer.layer;
    return super.getLayerNames().includes(layer);
  }

  isLayerHistoryCompliant(server, layer) {
    if (this.activeLayerFilter === null) return true;

    if (typeof layer === 'object') layer = layer.layer;

    for (
      let i = 0;
      i < Math.min(server.layerHistory.length, this.activeLayerFilter.layerHistoryTolerance);
      i++
    ) {
      if (new Date() - server.layerHistory[i].time > this.activeLayerFilter.historyResetTime)
        return true;
      if (server.layerHistory[i].layer === layer) return false;
    }
    return true;
  }

  isMapHistoryCompliant(server, layer) {
    if (this.activeLayerFilter === null) return true;

    if (typeof layer === 'string') layer = SquadLayers.getLayerByLayerName(layer);

    for (
      let i = 0;
      i < Math.min(server.layerHistory.length, this.activeLayerFilter.mapHistoryTolerance);
      i++
    ) {
      if (new Date() - server.layerHistory[i].time > this.activeLayerFilter.historyResetTime)
        return true;

      if (server.layerHistory[i].map === layer.map) return false;
    }
    return true;
  }

  isGamemodeHistoryCompliant(server, layer) {
    if (this.activeLayerFilter === null) return true;

    if (typeof layer === 'string') layer = SquadLayers.getLayerByLayerName(layer);

    const gamemodeHistoryTolerance = this.activeLayerFilter.gamemodeHistoryTolerance[
      layer.gamemode
    ];
    if (!gamemodeHistoryTolerance) return true;

    for (let i = 0; i < Math.min(server.layerHistory.length, gamemodeHistoryTolerance); i++) {
      if (new Date() - server.layerHistory[i].time > this.activeLayerFilter.historyResetTime)
        return true;

      const historyLayer = SquadLayers.getLayerByLayerName(server.layerHistory[i].layer);
      if (!historyLayer) continue;

      if (historyLayer.gamemode === layer.gamemode) return false;
    }
    return true;
  }

  isGamemodeRepetitiveCompliant(server, layer) {
    if (this.activeLayerFilter === null) return true;

    if (typeof layer === 'string') layer = SquadLayers.getLayerByLayerName(layer);

    const gamemodeRepetitiveTolerance = this.activeLayerFilter.gamemodeRepetitiveTolerance[
      layer.gamemode
    ];
    if (!gamemodeRepetitiveTolerance) return true;

    for (let i = 0; i < Math.min(server.layerHistory.length, gamemodeRepetitiveTolerance); i++) {
      if (new Date() - server.layerHistory[i].time > this.activeLayerFilter.historyResetTime)
        return true;

      const historyLayer = SquadLayers.getLayerByLayerName(server.layerHistory[i].layer);
      if (!historyLayer) return true;

      if (historyLayer.gamemode !== layer.gamemode) return true;
    }
    return false;
  }

  isFactionCompliant(server, layer) {
    if (
      this.activeLayerFilter === null ||
      this.activeLayerFilter.factionComplianceEnabled === false
    )
      return true;
    if (server.layerHistory.length === 0) return true;

    if (typeof layer === 'string') layer = SquadLayers.getLayerByLayerName(layer);

    const historyLayer = SquadLayers.getLayerByLayerName(server.layerHistory[0].layer);

    return (
      !historyLayer ||
      (historyLayer.teamOne.faction !== layer.teamTwo.faction &&
        historyLayer.teamTwo.faction !== layer.teamOne.faction)
    );
  }

  isFactionHistoryCompliant(server, layer, faction = null) {
    if (this.activeLayerFilter === null) return true;

    if (typeof layer === 'string') layer = SquadLayers.getLayerByLayerName(layer);

    if (faction === null) {
      return (
        this.isFactionHistoryCompliant(server, layer, layer.teamOne.faction) &&
        this.isFactionHistoryCompliant(server, layer, layer.teamTwo.faction)
      );
    } else {
      const factionThreshold = this.activeLayerFilter.factionHistoryTolerance[faction];
      if (!factionThreshold) return true;

      for (let i = 0; i < Math.min(server.layerHistory.length, factionThreshold); i++) {
        if (new Date() - server.layerHistory[i].time > this.activeLayerFilter.historyResetTime)
          return true;

        const historyLayer = SquadLayers.getLayerByLayerName(server.layerHistory[i].layer);
        if (!historyLayer) continue;

        if (historyLayer.teamOne.faction === faction || historyLayer.teamTwo.faction === faction)
          return false;
      }

      return true;
    }
  }

  isFactionRepetitiveCompliant(server, layer, faction = null) {
    if (this.activeLayerFilter === null) return true;

    if (typeof layer === 'string') layer = SquadLayers.getLayerByLayerName(layer);

    if (faction === null) {
      return (
        this.isFactionRepetitiveCompliant(server, layer, layer.teamOne.faction) &&
        this.isFactionRepetitiveCompliant(server, layer, layer.teamTwo.faction)
      );
    } else {
      const factionThreshold = this.activeLayerFilter.factionRepetitiveTolerance[faction];
      if (!factionThreshold) return true;

      for (let i = 0; i < Math.min(server.layerHistory.length, factionThreshold); i++) {
        if (new Date() - server.layerHistory[i].time > this.activeLayerFilter.historyResetTime)
          return true;

        const historyLayer = SquadLayers.getLayerByLayerName(server.layerHistory[i].layer);
        if (!historyLayer) return true;

        if (historyLayer.teamOne.faction !== faction && historyLayer.teamTwo.faction !== faction)
          return true;
      }

      return false;
    }
  }

  isPlayerCountCompliant(server, layer) {
    if (
      this.activeLayerFilter === null ||
      this.activeLayerFilter.playerCountComplianceEnabled === false
    )
      return true;

    if (typeof layer === 'string') layer = SquadLayers.getLayerByLayerName(layer);

    return !(
      server.players.length > layer.estimatedSuitablePlayerCount.max ||
      server.players.length < layer.estimatedSuitablePlayerCount.min
    );
  }
}
