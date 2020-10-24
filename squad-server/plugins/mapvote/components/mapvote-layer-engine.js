export default class MapvoteLayerEngine {
  constructor(server, squadLayerPool) {
    this.server = server;
    this.layerPool = squadLayerPool;
  }

  // TODO: Refactor this logic into dynamic validator list
  async getLayerForVote(layer) {
    layer = this.layerPool.getLayerByLayerName(layer);

    if (!this.squadLayerFilter.inPool(layer)) {
      return { valid: false, message: `${layer.layer} is not in layer pool.` };
    }
    if (!this.squadLayerFilter.isHistoryCompliant(this.server.layerHistory, layer)) {
      return { valid: false, message: `${layer.layer} was played too recently.` };
    }
    if (!this.squadLayerFilter.isMapHistoryCompliant(this.server.layerHistory, layer)) {
      return { valid: false, message: `${layer.map} was played too recently.` };
    }
    if (!this.squadLayerFilter.isGamemodeHistoryCompliant(this.server.layerHistory, layer)) {
      return { valid: false, message: `${layer.gamemode} was played too recently.` };
    }
    if (!this.squadLayerFilter.isGamemodeRepetitiveCompliant(this.server.layerHistory, layer)) {
      return { valid: false, message: `${layer.gamemode} has been played too much recently.` };
    }
    if (!this.squadLayerFilter.isFactionCompliant(this.server.layerHistory, layer)) {
      return {
        valid: false,
        message: 'Cannot be played as one team will remain the same faction.'
      };
    }
    if (!this.squadLayerFilter.isFactionHistoryCompliant(this.server.layerHistory, layer)) {
      return {
        valid: false,
        message: `Cannot be played as either ${layer.teamOne.faction} or ${layer.teamTwo.faction} has been played too recently.`
      };
    }
    if (!this.squadLayerFilter.isFactionRepetitiveCompliant(this.server, layer)) {
      return {
        valid: false,
        message: `Cannot be played as either ${layer.teamOne.faction} or ${layer.teamTwo.faction} has been played too much recently.`
      };
    }
    if (!this.squadLayerFilter.isPlayerCountCompliant(this.server.layerHistory, layer)) {
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

  getLayerByName(name) {
    return this.layerPool.getLayerByLayerName(name);
  }

  getLayerWithAutocomplete(name) {
    return this.layerPool.getLayerByLayerNameAutoCorrection(name);
  }
}
