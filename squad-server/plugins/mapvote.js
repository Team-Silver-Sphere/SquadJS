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
        default: 0,
        description:
          'Number of seconds after round is started to begin auto map vote, 0 to disable auto mapvote start'
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
        default: [
          'Albasrah_AAS_v1',
          'Albasrah_AAS_v2',
          'Albasrah_AAS_v3',
          'Albasrah_RAAS_v1',
          'Albasrah_Invasion_v1',
          'Albasrah_Invasion_v2',
          'Albasrah_Invasion_v3',
          'Albasrah_Invasion_v4',
          'Albasrah_Invasion_v5',
          'Albasrah_Invasion_v6',
          'Albasrah_Insurgency_v1',
          'Albasrah_TC_v1',
          'Albasrah_TC_v2',
          'Anvil_AAS_v1',
          'Anvil_AAS_v2',
          'Anvil_RAAS_v1',
          'Anvil_RAAS_v2',
          'Anvil_RAAS_v3',
          'Anvil_RAAS_v4',
          'Anvil_Invasion_v1',
          'Anvil_Invasion_v2',
          'Anvil_TC_v1',
          'Belaya_AAS_v1',
          'Belaya_AAS_v2',
          'Belaya_AAS_v3',
          'Belaya_RAAS_v1',
          'Belaya_RAAS_v2',
          'Belaya_RAAS_v3',
          'Belaya_RAAS_v4',
          'Belaya_RAAS_v5',
          'Belaya_Invasion_v1',
          'Belaya_Invasion_v2',
          'Belaya_Invasion_v3',
          'Chora_AAS_v1',
          'Chora_AAS_v2',
          'Chora_AAS_v3',
          'Chora_AAS_v4',
          'Chora_AAS_v5',
          'Chora_RAAS_v1',
          'Chora_RAAS_v2',
          'Chora_RAAS_v3',
          'Chora_RAAS_v4',
          'Chora_Invasion_v1',
          'Chora_Invasion_v2',
          'Chora_Insurgency_v1',
          'Chora_TC_v1',
          'Fallujah_AAS_v1',
          'Fallujah_AAS_v2',
          'Fallujah_RAAS_v1',
          'Fallujah_RAAS_v2',
          'Fallujah_RAAS_v3',
          'Fallujah_RAAS_v4',
          'Fallujah_RAAS_v5',
          'Fallujah_Invasion_v1',
          'Fallujah_Invasion_v2',
          'Fallujah_Invasion_v3',
          'Fallujah_Invasion_v4',
          'Fallujah_Invasion_v5',
          'Fallujah_Insurgency_v1',
          'Fallujah_TC_v1',
          'Fallujah_TC_v2',
          'FoolsRoad_AAS_v1',
          'FoolsRoad_AAS_v2',
          'FoolsRoad_RAAS_v1',
          'FoolsRoad_RAAS_v2',
          'FoolsRoad_RAAS_v3',
          'FoolsRoad_RAAS_v4',
          'FoolsRoad_RAAS_v5',
          'FoolsRoad_Invasion_v1',
          'FoolsRoad_Destruction_v1',
          'FoolsRoad_TC_v1',
          'GooseBay_AAS_v1',
          'GooseBay_AAS_v2',
          'GooseBay_RAAS_v1',
          'GooseBay_RAAS_v2',
          'GooseBay_Invasion_v1',
          'GooseBay_Invasion_v2',
          'GooseBay_Invasion_v3',
          'Gorodok_AAS_v1',
          'Gorodok_AAS_v2',
          'Gorodok_AAS_v3',
          'Gorodok_RAAS_v01',
          'Gorodok_RAAS_v02',
          'Gorodok_RAAS_v03',
          'Gorodok_RAAS_v04',
          'Gorodok_RAAS_v05',
          'Gorodok_RAAS_v06',
          'Gorodok_RAAS_v07',
          'Gorodok_RAAS_v08',
          'Gorodok_RAAS_v09',
          'Gorodok_RAAS_v10',
          'Gorodok_RAAS_v11',
          'Gorodok_TC_v1',
          'Gorodok_TC_v2',
          'Gorodok_Invasion_v1',
          'Gorodok_Invasion_v2',
          'Gorodok_Invasion_v3',
          'Gorodok_Insurgency_v1',
          'Gorodok_Destruction_v1',
          'Kamdesh_AAS_v1',
          'Kamdesh_RAAS_v1',
          'Kamdesh_RAAS_v2',
          'Kamdesh_RAAS_v3',
          'Kamdesh_RAAS_v4',
          'Kamdesh_RAAS_v5',
          'Kamdesh_RAAS_v6',
          'Kamdesh_RAAS_v7',
          'Kamdesh_Insurgency_v1',
          'Kamdesh_Insurgency_v2',
          'Kamdesh_Invasion_v1',
          'Kamdesh_Invasion_v2',
          'Kamdesh_Invasion_v3',
          'Kamdesh_Invasion_v4',
          'Kamdesh_Invasion_v5',
          'Kamdesh_Invasion_v6',
          'Kamdesh_Invasion_v7',
          'Kamdesh_Invasion_v7',
          'Kamdesh_TC_v1',
          'Kamdesh_TC_v2',
          'Kamdesh_TC_v3',
          'Kamdesh_TC_v4',
          'Kohat_AAS_v1',
          'Kohat_AAS_v2',
          'Kohat_AAS_v3',
          'Kohat_RAAS_v1',
          'Kohat_RAAS_v2',
          'Kohat_RAAS_v3',
          'Kohat_RAAS_v4',
          'Kohat_RAAS_v5',
          'Kohat_RAAS_v6',
          'Kohat_RAAS_v7',
          'Kohat_RAAS_v8',
          'Kohat_RAAS_v9',
          'Kohat_Insurgency_v1',
          'Kohat_Invasion_v1',
          'Kohat_Invasion_v2',
          'Kohat_Invasion_v3',
          'Kohat_TC_v1',
          'Kokan_AAS_v1',
          'Kokan_AAS_v2',
          'Kokan_AAS_v3',
          'Kokan_RAAS_v1',
          'Kokan_RAAS_v2',
          'Kokan_RAAS_v3',
          'Kokan_RAAS_v4',
          'Kokan_Insurgency_v1',
          'Kokan_Invasion_v1',
          'Kokan_TC_v1',
          'Lashkar_AAS_v1',
          'Lashkar_AAS_v2',
          'Lashkar_AAS_v3',
          'Lashkar_AAS_v4',
          'Lashkar_RAAS_v1',
          'Lashkar_RAAS_v2',
          'Lashkar_RAAS_v3',
          'Lashkar_RAAS_v4',
          'Lashkar_Insurgency_v1',
          'Lashkar_Invasion_v1',
          'Lashkar_Invasion_v2',
          'Lashkar_Invasion_v3',
          'Lashkar_TC_v1',
          'Lashkar_TC_v2',
          'Lashkar_TC_v3',
          'Lashkar_TC_v4',
          'Lashkar_TC_v5',
          'Logar_AAS_v1',
          'Logar_AAS_v2',
          'Logar_AAS_v3',
          'Logar_RAAS_v1',
          'Logar_RAAS_v2',
          'Logar_RAAS_v3',
          'Logar_Insurgency_v1',
          'Logar_TC_v1',
          'Manic_AAS_v1',
          'Manic_AAS_v2',
          'Manic_RAAS_v1',
          'Manic_RAAS_v2',
          'Manic_RAAS_v3',
          'Manic_RAAS_v4',
          'Manic_Invasion_v1',
          'Manic_Invasion_v2',
          'Manic_TC_v1',
          'Mestia_AAS_v1',
          'Mestia_AAS_v2',
          'Mestia_RAAS_v1',
          'Mestia_RAAS_v2',
          'Mestia_Invasion_v1',
          'Mestia_Invasion_v2',
          'Mestia_TC_v1',
          'Mutaha_AAS_v1',
          'Mutaha_AAS_v2',
          'Mutaha_AAS_v3',
          'Mutaha_AAS_v4',
          'Mutaha_RAAS_v1',
          'Mutaha_RAAS_v2',
          'Mutaha_RAAS_v3',
          'Mutaha_RAAS_v4',
          'Mutaha_RAAS_v5',
          'Mutaha_Invasion_v1',
          'Mutaha_Invasion_v2',
          'Mutaha_Invasion_v3',
          'Mutaha_Invasion_v4',
          'Mutaha_TC_v1',
          'Mutaha_TC_v2',
          'Narva_AAS_v1',
          'Narva_AAS_v2',
          'Narva_AAS_v3',
          'Narva_RAAS_v1',
          'Narva_RAAS_v2',
          'Narva_RAAS_v3',
          'Narva_RAAS_v4',
          'Narva_Invasion_v1',
          'Narva_Invasion_v2',
          'Narva_Invasion_v3',
          'Narva_Invasion_v4',
          'Narva_TC_v1',
          'Narva_TC_v2',
          'Narva_Destruction_v1',
          'Skorpo_AAS_v1',
          'Skorpo_RAAS_v1',
          'Skorpo_RAAS_v2',
          'Skorpo_RAAS_v3',
          'Skorpo_RAAS_v4',
          'Skorpo_RAAS_v5',
          'Skorpo_Invasion_v1',
          'Skorpo_Invasion_v2',
          'Skorpo_TC_v1',
          'Skorpo_TC_v2',
          'Skorpo_TC_v3',
          'Sumari_AAS_v1',
          'Sumari_AAS_v2',
          'Sumari_AAS_v3',
          'Sumari_AAS_v4',
          'Sumari_RAAS_v1',
          'Sumari_RAAS_v2',
          'Sumari_Insurgency_v1',
          'Sumari_Invasion_v1',
          'Sumari_TC_v1',
          'Tallil_AAS_v1',
          'Tallil_AAS_v2',
          'Tallil_RAAS_v1',
          'Tallil_RAAS_v2',
          'Tallil_RAAS_v3',
          'Tallil_RAAS_v4',
          'Tallil_RAAS_v5',
          'Tallil_RAAS_v6',
          'Tallil_RAAS_v7',
          'Tallil_Invasion_v1',
          'Tallil_Invasion_v2',
          'Tallil_Invasion_v3',
          'Tallil_Invasion_v4',
          'Tallil_Tanks_v1',
          'Tallil_Tanks_v2',
          'Yehorivka_AAS_v1',
          'Yehorivka_AAS_v2',
          'Yehorivka_AAS_v3',
          'Yehorivka_RAAS_v01',
          'Yehorivka_RAAS_v02',
          'Yehorivka_RAAS_v03',
          'Yehorivka_RAAS_v04',
          'Yehorivka_RAAS_v05',
          'Yehorivka_RAAS_v06',
          'Yehorivka_RAAS_v07',
          'Yehorivka_RAAS_v08',
          'Yehorivka_RAAS_v09',
          'Yehorivka_RAAS_v10',
          'Yehorivka_RAAS_v11',
          'Yehorivka_RAAS_v12',
          'Yehorivka_Destruction_v1',
          'Yehorivka_Invasion_v1',
          'Yehorivka_Invasion_v2',
          'Yehorivka_Invasion_v3',
          'Yehorivka_TC_v1',
          'Yehorivka_TC_v2',
          'Yehorivka_TC_v3'
        ],
        description: 'Array of layer names to include in map rotation'
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

    const sortedResults = await this.calculateResults();

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
    if (this.options.autoStartMapVoteSeconds > 0) {
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
}
