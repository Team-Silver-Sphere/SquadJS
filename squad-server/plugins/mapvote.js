import BasePlugin from './base-plugin.js';
import Logger from 'core/logger';

// todo: memorize last N layers to ensure non-repeating vote items
// todo: repeat broadcast until vote is finished
// todo: show result hist when vote finished

export default class MapVote extends BasePlugin {
  static get description() {
    return 'The <code>MapVote</code> plugin allows to start mapvotes to choose next layer';
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);
    this.mapVote = null;
    this.onChatMessage = this.onChatMessage.bind(this);
    this.onNewGame = this.onNewGame.bind(this);
    this.mapVoteTimeout = null;
    this.autoStartMapVoteTimeout = null;
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      voteDurationSeconds: {
        required: false,
        default: 300,
        description: 'Map vote duration in seconds'
      },
      minimumVotes: {
        required: false,
        default: 1,
        description: 'Minimum number of votes for a map to win'
      },
      autoStartMapVoteSeconds: {
        required: false,
        default: 60,
        description: 'Number of seconds after round is started to begin auto map vote'
      },
      layers: {
        required: true,
        description: 'Layer names to include in map rotation'
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
    if (info.message.match(/!(mapvote|votemap)/i)) this.initMapVote(info.player.steamID);
    if (this.mapVote && !this.mapVote.result) {
      const voteMessage = info.message.match(/^(!vote)?\s*([1-5]){1}$/m);
      if (voteMessage) {
        this.processVote(info.player.steamID, voteMessage[voteMessage.length - 1]);
      }
    }
  }

  async initMapVote(steamID) {
    if (this.mapVote && this.mapVote.result) {
      if (steamID) {
        await this.server.rcon.warn(
          steamID,
          `Vote already finished! Vote result: ${this.mapVote.result}`
        );
      }
      return;
    }
    if (!this.mapVote) {
      if (this.autoStartMapVoteTimeout) clearTimeout(this.autoStartMapVoteTimeout);
      const layersList = await this.getRandomLayers(5);
      Logger.verbose('MapVote', 1, `initMapVote for getLayers: ${layersList}`);
      this.mapVote = {
        layers: layersList,
        votes: {},
        result: null
      };
      this.mapVoteTimeout = setTimeout(() => {
        this.finishMapVote();
      }, this.options.voteDurationSeconds * 1000);
    }
    const layersMessage = this.mapVote.layers
      .map((layerName, index) => `[${index + 1}] - ${layerName}`)
      .join('\n');
    await this.server.rcon.broadcast(`Map vote! Type number in chat to vote:\n${layersMessage}`);
  }

  async finishMapVote() {
    Logger.verbose('MapVote', 1, `finishMapVote`);
    if (this.mapVoteTimeout) clearTimeout(this.mapVoteTimeout);
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
        return b.votes - a.votes; // max votes first
      });

    const resultLog = sortedResults.map((el) => el.layer + ':' + el.votes).join(', ');
    this.mapVote.result = sortedResults[0].layer;
    Logger.verbose('MapVote', 1, `Map vote finished: ${resultLog}`);

    if (sortedResults[0].votes >= this.options.minimumVotes) {
      this.server.rcon.broadcast(`Vote finished, next map: ${this.mapVote.result}`);
      this.server.rcon.execute(`AdminSetNextLayer ${this.mapVote.result}`);
    } else {
      this.server.rcon.broadcast('Vote finished, none of the maps have enough votes');
    }
  }

  async processVote(steamID, vote) {
    this.mapVote.votes[steamID] = this.mapVote.layers[parseInt(vote) - 1];
    await this.server.rcon.warn(steamID, `You voted for: ${this.mapVote.votes[steamID]}`);
  }

  async getRandomLayers(count) {
    return this.options.layers.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  async onNewGame() {
    Logger.verbose('MapVote', 1, 'onNewGame');
    this.mapVoteTimeout = null;
    this.mapVote = null;
    this.autoStartMapVoteTimeout = setTimeout(() => {
      this.initMapVote(null);
    }, this.options.autoStartMapVoteSeconds * 1000);
  }
}
