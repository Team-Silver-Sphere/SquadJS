export default class MapvoteLayerEngine {
  constructor(server, options) {
    this.server = server;

    if (options.layerFilter) {
      this.layerPool = server.squadLayers.buildPoolFromFilter(options.layerFilter, null);
    } else {
      this.layerPool = server.squadLayers.buildPoolFromLayerNamesAutoCorrection(options.maps, null);
    }
  }

  // TODO: Refactor this logic into dynamic validator list
  async getLayerForVote(layer) {
    layer = this.layerPool.getLayerByLayerName(layer);

    if (!this.layerPool.inPool(layer)) {
      return { valid: false, message: `${layer.layer} is not in layer pool.` };
    }
    if (!this.layerPool.isHistoryCompliant(this.server.layerHistory, layer)) {
      return { valid: false, message: `${layer.layer} was played too recently.` };
    }
    if (!this.layerPool.isMapHistoryCompliant(this.server.layerHistory, layer)) {
      return { valid: false, message: `${layer.map} was played too recently.` };
    }
    if (!this.layerPool.isGamemodeHistoryCompliant(this.server.layerHistory, layer)) {
      return { valid: false, message: `${layer.gamemode} was played too recently.` };
    }
    if (!this.layerPool.isGamemodeRepetitiveCompliant(this.server.layerHistory, layer)) {
      return { valid: false, message: `${layer.gamemode} has been played too much recently.` };
    }
    if (!this.layerPool.isFactionCompliant(this.server.layerHistory, layer)) {
      return {
        valid: false,
        message: 'Cannot be played as one team will remain the same faction.'
      };
    }
    if (!this.layerPool.isFactionHistoryCompliant(this.server.layerHistory, layer)) {
      return {
        valid: false,
        message: `Cannot be played as either ${layer.teamOne.faction} or ${layer.teamTwo.faction} has been played too recently.`
      };
    }
    if (!this.layerPool.isFactionRepetitiveCompliant(this.server, layer)) {
      return {
        valid: false,
        message: `Cannot be played as either ${layer.teamOne.faction} or ${layer.teamTwo.faction} has been played too much recently.`
      };
    }
    if (!this.layerPool.isPlayerCountCompliant(this.server.layerHistory, layer)) {
      return {
        valid: false,
        message: `${layer.layer} is only suitable for a player count between ${layer.estimatedSuitablePlayerCount.min} and ${layer.estimatedSuitablePlayerCount.max}.`
      };
    }

    return { valid: true };
  }

  getLayerByNumber(number) {
    return this.layerPool.getLayerByNumber(number);
  }

  getLayerByLayerName(name) {
    return this.layerPool.getLayerByLayerName(name);
  }

  getLayerWithAutocomplete(name) {
    return this.layerPool.getLayerByLayerNameAutoCorrection(name);
  }
}
