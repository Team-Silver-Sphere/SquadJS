import { MAP_VOTE_NEW_WINNER, MAP_VOTE_START, MAP_VOTE_END } from 'mapvote/constants';
import EventEmitter from 'events';

export default class MapvoteVoteEngine extends EventEmitter {
  constructor(layerEngine, options = {}) {
    super();
    this.layerEngine = layerEngine;
    this.minVoteCount = options.minVoteCount || null;

    this.cleanupVoteProps();
  }

  cleanupVoteProps() {
    this.layerVotes = {};
    this.layerVoteTimes = {};
    this.playerVotes = {};
    this.currentWinner = null;

    this.state = MapVoteState.NOT_STARTED;
  }

  initializeVote() {
    this.cleanupVoteProps();

    this.state = MapVoteState.IN_PROGRESS;

    this.emit(MAP_VOTE_START);
  }

  async makeVote(identifier, layer) {
    var layerResult = this.layerEngine.getLayerForVote(layer);

    if (!layerResult.valid) {
      return layerResult.message;
    }

    this.removeVote(identifier);
    this.addVote(identifier, layer.layer);

    const results = this.getResults(true);

    if (results.length > 0) {
      if (results[0].layer.layer !== this.currentWinner) {
        this.emit(MAP_VOTE_NEW_WINNER, results);
        this.currentWinner = results[0].layer.layer;
      }
    }

    return layer.layer;
  }

  removeVote(identifier) {
    if (!this.playerVotes[identifier]) return;

    if (this.layerVotes[this.playerVotes[identifier]])
      this.layerVotes[this.playerVotes[identifier]] -= 1;

    if (this.layerVotes[this.playerVotes[identifier]] === 0) {
      delete this.layerVotes[this.playerVotes[identifier]];
      delete this.layerVoteTimes[this.playerVotes[identifier]];
    }

    delete this.playerVotes[identifier];
  }

  endVote() {
    if (this.state !== MapVoteState.IN_PROGRESS) {
      return 'No Vote in progress';
    }

    this.emit(MAP_VOTE_END, this.getResults());
  }

  getResults(applyMinVoteCount = false) {
    if (this.state !== MapVoteState.IN_PROGRESS && this.state !== MapVoteState.FINISHED) {
      return 'No vote results';
    }

    if (
      !applyMinVoteCount ||
      this.minVoteCount === null ||
      Object.keys(this.playerVotes).length >= this.minVoteCount
    ) {
      return Object.keys(this.layerVotes)
        .map((layerName) => ({
          layer: this.layerEngine.getLayerByLayerName(layerName),
          votes: this.layerVotes[layerName]
        }))
        .sort((a, b) => {
          if (a.votes > b.votes) return -1;
          if (a.votes < b.votes) return 1;
          return this.layerVoteTimes[a.layer.layer] < this.layerVoteTimes[b.layer.layer] ? -1 : 1;
        });
    } else return [];
  }

  async makeVoteByDidYouMean(identifier, layerName) {
    // Extract validation method and separate check for NotStarted / Finished
    if (this.state !== MapVoteState.IN_PROGRESS) {
      return 'Vote not in progress';
    }

    const layer = this.layerEngine.getLayerByDidYouMean(layerName);
    if (layer === null) throw new Error(`${layerName} is not a Squad layer.`);
    return this.makeVote(identifier, layer.layer);
  }

  async makeVoteByNumber(identifier, number) {
    // Extract validation method and separate check for NotStarted / Finished
    if (this.state !== MapVoteState.IN_PROGRESS) {
      return 'Vote not in progress';
    }

    const layer = this.layerEngine.getLayerByNumber(number);
    return this.makeVote(identifier, layer.layer);
  }
}

const MapVoteState = {
  NOT_STARTED: 0,
  IN_PROGRESS: 1,
  FINISHED: 2,
  DESTROYED: 3
};
