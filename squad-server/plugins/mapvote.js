import BasePlugin from './base-plugin.js';
import Logger from 'core/logger';

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
    this.autoRepeatBroadcastTimeout = null;
    this.layersHistory = [];
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
        default: 300,
        description: 'Number of seconds after round is started to begin auto map vote'
      },
      autoRepeatVoteBroadcastSeconds: {
        required: false,
        default: 60,
        description:
          'If mapvote is running, will repeat mapvote broadcast automatically each X seconds until finished'
      },
      layersHistorySize: {
        required: false,
        default: 3,
        description: 'Ensure X last vote winners are not used in map votes'
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
    if (info.message.match(/!(startmapvote|startvotemap)/i)) this.initMapVote(info.player.steamID);
    if (this.mapVote && !this.mapVote.result) {
      const voteMessage = info.message.match(/^(!vote)?\s*([1-5]){1}$/m);
      if (voteMessage) {
        this.processVote(info.player.steamID, voteMessage[voteMessage.length - 1]);
      }
    }
  }

  async initMapVote(steamID) {
    // vote already started or finished -> warn if possible, do nothing
    if (this.mapVote) {
      if (this.mapVote.result && steamID) {
        await this.server.rcon.warn(
          steamID,
          `Vote already finished! Result was: ${this.mapVote.result}`
        );
        return;
      }
      if (steamID) {
        await this.server.rcon.warn(steamID, 'Vote in progress! Check broadcasts for details');
      }
      return;
    }

    // no vote yet -> init new
    if (this.autoStartMapVoteTimeout) clearTimeout(this.autoStartMapVoteTimeout);
    const layersList = await this.getRandomLayers(5);
    Logger.verbose('MapVote', 1, `initMapVote for getLayers: ${layersList}`);
    this.mapVote = {
      layers: layersList,
      votes: {},
      result: null
    };

    // finish map vote after X seconds
    this.mapVoteTimeout = setTimeout(() => {
      this.finishMapVote();
    }, this.options.voteDurationSeconds * 1000);

    // repeat broadcast every X seconds until finished
    this.repeatingBroadcast();
  }

  async repeatingBroadcast() {
    this.broadcastMapVote();
    this.autoRepeatBroadcastTimeout = setTimeout(() => {
      this.repeatingBroadcast();
    }, this.options.autoRepeatVoteBroadcastSeconds * 1000);
  }

  async broadcastMapVote() {
    if (!this.mapVote) return;
    const layersMessage = this.mapVote.layers
      .map((layerName, index) => `[${index + 1}] - ${layerName}`)
      .join('\n');
    await this.server.rcon.broadcast(`MAPVOTE! Type number in chat to vote:\n${layersMessage}`);
  }

  async broadcastMapVoteResults(results) {
    const resultTable = results.map((el) => `${el.layer} - ${el.votes} vote(s)`).join('\n');
    await this.server.rcon.broadcast(
      `MAPVOTE finished, next map: ${this.mapVote.result} \n${resultTable}`
    );
  }

  // get sorted array of {layer:string, votes:number}
  async calculateResults() {
    const hist = {};
    this.mapVote.layers.forEach((layerName) => {
      hist[layerName] = 0;
    });
    Object.keys(this.mapVote.votes).forEach((id) => {
      hist[this.mapVote.votes[id]] += 1;
    });
    return Object.keys(hist)
      .map((layerName) => {
        return { layer: layerName, votes: hist[layerName] };
      })
      .sort(function (a, b) {
        return b.votes - a.votes; // max votes first
      });
  }

  async finishMapVote() {
    if (this.mapVoteTimeout) clearTimeout(this.mapVoteTimeout);
    if (this.autoRepeatBroadcastTimeout) clearTimeout(this.autoRepeatBroadcastTimeout);
    if (!this.mapVote) return;

    const sortedResults = this.calculateResults();

    if (sortedResults[0].votes >= this.options.minimumVotes) {
      this.mapVote.result = sortedResults[0].layer;
      this.memorizeLayer(this.mapVote.result);
      this.broadcastMapVoteResults(sortedResults);
      this.server.rcon.execute(`AdminSetNextLayer ${this.mapVote.result}`);
    } else {
      this.server.rcon.broadcast('Vote finished, none of the maps have enough votes');
      this.mapVote = null; // allows manual map vote restart, if no map won
    }
  }

  async memorizeLayer(layerName) {
    this.layersHistory.push(layerName);
    this.layersHistory = this.layersHistory.slice(-this.options.layersHistorySize);
  }

  async processVote(steamID, vote) {
    this.mapVote.votes[steamID] = this.mapVote.layers[parseInt(vote) - 1];
    await this.server.rcon.warn(steamID, `You voted for: ${this.mapVote.votes[steamID]}`);
  }

  async getRandomLayers(count) {
    return this.options.layers
      .sort(() => 0.5 - Math.random())
      .filter((layer) => !this.layersHistory.includes(layer))
      .slice(0, count);
  }

  async onNewGame() {
    this.mapVoteTimeout = null;
    this.autoRepeatBroadcastTimeout = null;
    this.mapVote = null;
    Logger.verbose(
      'MapVote',
      1,
      `New game started, registering automatic map vote in ${this.options.autoStartMapVoteSeconds} seconds`
    );
    this.autoStartMapVoteTimeout = setTimeout(() => {
      this.initMapVote(null);
    }, this.options.autoStartMapVoteSeconds * 1000);
  }
}
