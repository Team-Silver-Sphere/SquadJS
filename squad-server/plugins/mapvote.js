// import layers from '../layers/layers.js';
import BasePlugin from './base-plugin.js';

export default class MapVote extends BasePlugin {
  static get description() {
    return 'The <code>MapVote</code> plugin allows to start mapvotes to choose next layer';
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);
    this.mapVote = null;
    this.onChatMessage = this.onChatMessage.bind(this);
    this.onNewGame = this.onNewGame.bind(this);
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      voteDurationSeconds: {
        required: false,
        default: 30,
        description: 'Map vote duration in seconds'
      },
      minimumVotes: {
        required: false,
        default: 1,
        description: 'Minimum number of votes for mapvote to succeed'
      },
      autoStartMapVoteSeconds: {
        required: false,
        default: 0,
        description:
          'Number of seconds after round startet to begin auto mapvote (if 0 - only manual start)'
      }
    };
  }

  async mount() {
    this.server.on('CHAT_MESSAGE', this.onChatMessage);
    this.server.on('NEW_GAME', this.onNewGame);
  }

  async unmount() {
    this.server.removeEventListener('CHAT_MESSAGE', this.onChatMessage);
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
  }

  async onChatMessage(info) {
    if (info.message.match(/!mapvote/)) this.initMapVote(info);
    if (this.mapVote && info.message.match(/^[1-5]{1}/)) this.processVote(info);
  }

  async initMapVote(info) {
    if (this.mapVote && this.mapVote.result) {
      await this.server.rcon.warn(
        info.player.steamID,
        `Vote already finished! Vote result: ${this.mapVote.result}`
      );
      return;
    }
    if (!this.mapVote) {
      const layersList = this.getLayers();
      this.mapVote = {
        layers: layersList,
        votes: {},
        result: null
      };
      setTimeout(this.finishMapVote, this.options.voteDurationSeconds * 1000);
    }

    const layersMessage = this.mapVote.layers
      .map((layerName, index) => `${index + 1} - ${layerName}`)
      .join(', ');
    console.log(`Map vote: ${layersMessage}`);
    // await this.server.rcon.broadcast(`Map vote: ${messageLayers}`);
  }

  async finishMapVote() {
    if (!this.mapVote) return;
    const hist = {};
    this.mapVote.layers.forEach((layerName) => {
      hist[layerName] = 0;
    });
    Object.keys(this.mapVote.votes).forEach((id) => {
      hist[this.mapVote.votes[id]] += 1;
    });
    const sortedResults = Object.keys(hist)
      .map((layerName) => {
        return { layer: layerName, votes: hist[layerName] };
      })
      .sort(function (a, b) {
        return b.votes - a.votes;
      }); // max votes first

    if (sortedResults[0].votes >= this.options.minimumVotes) {
      this.mapVote.result = sortedResults[0].layerName;
    }
    if (this.mapVote.result) {
      this.server.rcon.broadcast(`Vote finished, next layer: ${this.mapVote.result}`);
    } else {
      this.server.rcon.broadcast('Vote finished, none of the layers got enough votes');
    }
    // todo - set next layer
  }

  async processVote(info) {
    this.mapVote.votes[info.player.steamID] = this.mapVote.layers[parseInt(info.message) - 1];
    await this.server.rcon.warn(
      info.player.steamID,
      `You voted for: ${this.mapVote.votes[info.player.steamID]}`
    );
  }

  async getLayers() {
    // todo - get 5 actual layers for vote from layers list
    return ['layerA', 'layerB', 'layerC', 'layerD', 'layerE'];
  }

  async onNewGame() {
    this.mapVote = null;
  }
}
