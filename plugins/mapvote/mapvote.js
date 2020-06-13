import EventEmitter from 'events';

import SquadLayers from 'connectors/squad-layers';

export default class MapVote extends EventEmitter {
  constructor(server, squadLayerFilter, options = {}) {
    super();
    this.server = server;
    this.squadLayerFilter = squadLayerFilter;

    this.layerVotes = {};
    this.playerVotes = {};
    this.currentWinner = null;

    this.minVoteCount = options.minVoteCount || null;
  }

  addVote(identifier, layerName) {
    if (this.layerVotes[layerName]) {
      this.layerVotes[layerName] += 1;
    } else {
      this.layerVotes[layerName] = 1;
    }
    this.playerVotes[identifier] = layerName;
  }

  removeVote(identifier) {
    if (!this.playerVotes[identifier]) return;

    if (this.layerVotes[this.playerVotes[identifier]])
      this.layerVotes[this.playerVotes[identifier]] -= 1;
    if (this.layerVotes[this.playerVotes[identifier]] === 0)
      delete this.layerVotes[this.playerVotes[identifier]];

    delete this.playerVotes[identifier];
  }

  getResults(applyMinVoteCount = false) {
    if (
      !applyMinVoteCount ||
      this.minVoteCount === null ||
      Object.keys(this.playerVotes).length >= this.minVoteCount
    ) {
      return Object.keys(this.layerVotes)
        .map(layerName => ({
          layer: this.squadLayerFilter.getLayerByLayerName(layerName),
          votes: this.layerVotes[layerName]
        }))
        .sort((a, b) => {
          if (a.votes > b.votes) return -1;
          if (a.votes < b.votes) return 1;
          else return Math.random() < 0.5 ? 1 : -1;
        });
    } else return [];
  }

  async makeVote(identifier, layer) {
    layer = SquadLayers.getLayerByLayerName(layer);

    if (!this.squadLayerFilter.inLayerPool(layer))
      throw new Error(`${layer.layer} is not in layer pool.`);

    if (!this.squadLayerFilter.isLayerHistoryCompliant(this.server, layer))
      throw new Error(`${layer.layer} was played too recently.`);
    if (!this.squadLayerFilter.isMapHistoryCompliant(this.server, layer))
      throw new Error(`${layer.map} was played too recently.`);
    if (!this.squadLayerFilter.isGamemodeHistoryCompliant(this.server, layer))
      throw new Error(`${layer.gamemode} was played too recently.`);
    if (!this.squadLayerFilter.isPlayerCountCompliant(this.server, layer))
      throw new Error(
        `${layer.layer} is only suitable for a player count between ${layer.estimatedSuitablePlayerCount.min} and ${layer.estimatedSuitablePlayerCount.max}.`
      );

    this.removeVote(identifier);
    this.addVote(identifier, layer.layer);

    const results = this.getResults(true);

    if (results.length > 0) {
      if (results[0] !== this.currentWinner) {
        await this.server.rcon.execute(
          `AdminSetNextMap ${results[0].layer.layer}`
        );
        this.emit('NEW_WINNER', results);
        this.currentWinner = results[0];
      }
    }

    return layer.layer;
  }

  async makeVoteByDidYouMean(identifier, layerName) {
    const layer = SquadLayers.getLayerByDidYouMean(layerName);
    if (layer === null) throw new Error(`${layerName} is not a Squad layer.`);
    return this.makeVote(identifier, layer.layer);
  }

  async makeVoteByNumber(identifier, number) {
    const layer = this.squadLayerFilter.getLayerByNumber(number);
    return this.makeVote(identifier, layer.layer);
  }
}
