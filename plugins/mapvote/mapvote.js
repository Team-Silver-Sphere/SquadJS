import EventEmitter from 'events';

import SquadLayers from 'connectors/squad-layers';

export default class MapVote extends EventEmitter {
  constructor(server, squadLayerFilter) {
    super();
    this.server = server;
    this.squadLayerFilter = squadLayerFilter;

    this.layerVotes = {};
    this.playerVotes = {};
    this.currentWinner = null;
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
    if(!this.playerVotes[identifier]) return;

    if (this.layerVotes[this.playerVotes[identifier]]) this.layerVotes[this.playerVotes[identifier]] -= 1;
    if (this.layerVotes[this.playerVotes[identifier]] === 0) delete this.layerVotes[this.playerVotes[identifier]];

    delete this.playerVotes[identifier];
  }

  getResults() {
    let results;

    results = Object.keys(this.layerVotes).map(layerName => ({
      layer: this.squadLayerFilter.getLayerByLayerName(layerName),
      votes: this.layerVotes[layerName]
    }));

    results = results.sort((a, b) => {
      if (a.votes > b.votes) return -1;
      if (a.votes < b.votes) return 1;
      else return Math.random() < 0.5 ? 1 : -1;
    });

    return results;
  }

  async makeVote(identifier, layerName) {
    if (!this.squadLayerFilter.inLayerPool(layerName))
      throw new Error(`${layerName} is not in layer pool.`);

    this.removeVote(identifier);
    this.addVote(identifier, layerName);

    const results = this.getResults();
    const newWinner = results[0];

    if (newWinner !== this.currentWinner) {
      await this.server.rcon.execute(`AdminSetNextMap ${newWinner.layer.layer}`);

      this.emit('NEW_WINNER', results);

      this.currentWinner = newWinner;
    }

    return layerName;
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
