import EventEmitter from 'events';

import axios from 'axios';

import Logger from 'core/logger';
import { SQUADJS_API_DOMAIN } from 'core/constants';

import { Layers } from './layers/index.js';

import LogParser from './log-parser/index.js';
import Rcon from './rcon.js';

import { SQUADJS_VERSION } from './utils/constants.js';

import fetchAdminLists from './utils/admin-lists.js';

export default class SquadServer extends EventEmitter {
  constructor(options = {}) {
    super();

    for (const option of ['host'])
      if (!(option in options)) throw new Error(`${option} must be specified.`);

    this.id = options.id;
    this.options = options;

    this.layerHistory = [];
    this.layerHistoryMaxLength = options.layerHistoryMaxLength || 20;

    this.players = [];

    this.squads = [];

    this.admins = {};
    this.adminsInAdminCam = {};

    this.plugins = [];

    this.setupRCON();
    this.setupLogParser();

    this.updatePlayerList = this.updatePlayerList.bind(this);
    this.updatePlayerListInterval = 30 * 1000;
    this.updatePlayerListTimeout = null;

    this.updateSquadList = this.updateSquadList.bind(this);
    this.updateSquadListInterval = 30 * 1000;
    this.updateSquadListTimeout = null;

    this.updateLayerInformation = this.updateLayerInformation.bind(this);
    this.updateLayerInformationInterval = 30 * 1000;
    this.updateLayerInformationTimeout = null;

    this.updateA2SInformation = this.updateA2SInformation.bind(this);
    this.updateA2SInformationInterval = 30 * 1000;
    this.updateA2SInformationTimeout = null;

    this.pingSquadJSAPI = this.pingSquadJSAPI.bind(this);
    this.pingSquadJSAPIInterval = 5 * 60 * 1000;
    this.pingSquadJSAPITimeout = null;
  }

  async watch() {
    Logger.verbose(
      'SquadServer',
      1,
      `Beginning to watch ${this.options.host}:${this.options.queryPort}...`
    );

    await Layers.pull();

    this.admins = await fetchAdminLists(this.options.adminLists);

    await this.rcon.connect();
    await this.updateSquadList();
    await this.updatePlayerList(this);
    await this.updateLayerInformation();
    await this.updateA2SInformation();

    await this.logParser.watch();

    Logger.verbose('SquadServer', 1, `Watching ${this.serverName}...`);

    await this.pingSquadJSAPI();
  }

  async unwatch() {
    await this.rcon.disconnect();
    await this.logParser.unwatch();
  }

  setupRCON() {
    this.rcon = new Rcon({
      host: this.options.rconHost || this.options.host,
      port: this.options.rconPort,
      password: this.options.rconPassword,
      autoReconnectInterval: this.options.rconAutoReconnectInterval
    });

    this.rcon.on('CHAT_MESSAGE', async (data) => {
      data.player = await this.getPlayerBySteamID(data.steamID);
      this.emit('CHAT_MESSAGE', data);

      const command = data.message.match(/!([^ ]+) ?(.*)/);
      if (command)
        this.emit(`CHAT_COMMAND:${command[1].toLowerCase()}`, {
          ...data,
          message: command[2].trim()
        });
    });

    this.rcon.on('POSSESSED_ADMIN_CAMERA', async (data) => {
      data.player = await this.getPlayerBySteamID(data.steamID);

      this.adminsInAdminCam[data.steamID] = data.time;

      this.emit('POSSESSED_ADMIN_CAMERA', data);
    });

    this.rcon.on('UNPOSSESSED_ADMIN_CAMERA', async (data) => {
      data.player = await this.getPlayerBySteamID(data.steamID);
      if (this.adminsInAdminCam[data.steamID]) {
        data.duration = data.time.getTime() - this.adminsInAdminCam[data.steamID].getTime();
      } else {
        data.duration = 0;
      }

      delete this.adminsInAdminCam[data.steamID];

      this.emit('UNPOSSESSED_ADMIN_CAMERA', data);
    });

    this.rcon.on('RCON_ERROR', (data) => {
      this.emit('RCON_ERROR', data);
    });

    this.rcon.on('PLAYER_WARNED', async (data) => {
      data.player = await this.getPlayerByName(data.name);

      this.emit('PLAYER_WARNED', data);
    });

    this.rcon.on('PLAYER_KICKED', async (data) => {
      data.player = await this.getPlayerBySteamID(data.steamID);

      this.emit('PLAYER_KICKED', data);
    });

    this.rcon.on('PLAYER_BANNED', async (data) => {
      data.player = await this.getPlayerBySteamID(data.steamID);

      this.emit('PLAYER_BANNED', data);
    });

    this.rcon.on('SQUAD_CREATED', async (data) => {
      data.player = await this.getPlayerByEOSID(data.playerEOSID, true);
      data.player.squadID = data.squadID;

      delete data.playerName;
      delete data.playerSteamID;
      delete data.playerEOSID;

      this.emit('SQUAD_CREATED', data);
    });
  }

  async restartRCON() {
    try {
      await this.rcon.disconnect();
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to stop RCON instance when restarting.', err);
    }

    Logger.verbose('SquadServer', 1, 'Setting up new RCON instance...');
    this.setupRCON();
    await this.rcon.connect();
  }

  setupLogParser() {
    this.logParser = new LogParser(
      Object.assign(this.options.ftp, {
        mode: this.options.logReaderMode,
        logDir: this.options.logDir,
        host: this.options.ftp.host || this.options.host
      })
    );

    this.logParser.on('ADMIN_BROADCAST', (data) => {
      this.emit('ADMIN_BROADCAST', data);
    });

    this.logParser.on('DEPLOYABLE_DAMAGED', async (data) => {
      data.player = await this.getPlayerByNameSuffix(data.playerSuffix);

      delete data.playerSuffix;

      this.emit('DEPLOYABLE_DAMAGED', data);
    });

    this.logParser.on('NEW_GAME', async (data) => {
      data.layer = await Layers.getLayerByClassname(data.layerClassname);

      this.layerHistory.unshift({ layer: data.layer, time: data.time });
      this.layerHistory = this.layerHistory.slice(0, this.layerHistoryMaxLength);

      this.currentLayer = data.layer;
      await this.updateAdmins();
      this.emit('NEW_GAME', data);
    });

    this.logParser.on('PLAYER_CONNECTED', async (data) => {
      Logger.verbose(
        'SquadServer',
        1,
        `Player connected ${data.playerSuffix} - SteamID: ${data.steamID} - EOSID: ${data.eosID} - IP: ${data.ip}`
      );

      data.player = await this.getPlayerByEOSID(data.eosID);
      if (data.player) data.player.suffix = data.playerSuffix;

      delete data.steamID;
      delete data.playerSuffix;

      this.emit('PLAYER_CONNECTED', data);
    });

    this.logParser.on('PLAYER_DISCONNECTED', async (data) => {
      data.player = await this.getPlayerByEOSID(data.eosID);

      delete data.steamID;

      this.emit('PLAYER_DISCONNECTED', data);
    });

    this.logParser.on('PLAYER_DAMAGED', async (data) => {
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByEOSID(data.attackerEOSID);

      if (data.attacker && !data.attacker.playercontroller && data.attackerController)
        data.attacker.playercontroller = data.attackerController;

      if (data.victim && data.attacker) {
        data.teamkill =
          data.victim.teamID === data.attacker.teamID &&
          data.victim.steamID !== data.attacker.steamID;
      }

      delete data.victimName;
      delete data.attackerName;

      this.emit('PLAYER_DAMAGED', data);
    });

    this.logParser.on('PLAYER_WOUNDED', async (data) => {
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByEOSID(data.attackerEOSID);
      if (!data.attacker)
        data.attacker = await this.getPlayerByController(data.attackerPlayerController);

      if (data.victim && data.attacker)
        data.teamkill =
          data.victim.teamID === data.attacker.teamID &&
          data.victim.steamID !== data.attacker.steamID;

      delete data.victimName;
      delete data.attackerName;

      this.emit('PLAYER_WOUNDED', data);
      if (data.teamkill) this.emit('TEAMKILL', data);
    });

    this.logParser.on('PLAYER_DIED', async (data) => {
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByEOSID(data.attackerEOSID);
      if (!data.attacker)
        data.attacker = await this.getPlayerByController(data.attackerPlayerController);

      if (data.victim && data.attacker)
        data.teamkill =
          data.victim.teamID === data.attacker.teamID &&
          data.victim.steamID !== data.attacker.steamID;

      delete data.victimName;
      delete data.attackerName;

      this.emit('PLAYER_DIED', data);
    });

    this.logParser.on('PLAYER_REVIVED', async (data) => {
      data.victim = await this.getPlayerByEOSID(data.victimEOSID);
      data.attacker = await this.getPlayerByEOSID(data.attackerEOSID);
      data.reviver = await this.getPlayerByEOSID(data.reviverEOSID);

      delete data.victimName;
      delete data.attackerName;
      delete data.reviverName;

      this.emit('PLAYER_REVIVED', data);
    });

    this.logParser.on('PLAYER_POSSESS', async (data) => {
      data.player = await this.getPlayerByEOSID(data.playerEOSID);
      if (data.player) data.player.possessClassname = data.possessClassname;

      delete data.playerSuffix;

      this.emit('PLAYER_POSSESS', data);
    });

    this.logParser.on('PLAYER_UNPOSSESS', async (data) => {
      data.player = await this.getPlayerByEOSID(data.playerEOSID);

      delete data.playerSuffix;

      this.emit('PLAYER_UNPOSSESS', data);
    });

    this.logParser.on('ROUND_ENDED', async (data) => {
      this.emit('ROUND_ENDED', data);
    });

    this.logParser.on('TICK_RATE', (data) => {
      this.emit('TICK_RATE', data);
    });

    this.logParser.on('CLIENT_EXTERNAL_ACCOUNT_INFO', (data) => {
      this.rcon.addIds(data.steamID, data.eosID);
    });
    // this.logParser.on('CLIENT_CONNECTED', (data) => {
    //   Logger.verbose("SquadServer", 1, `Client connected. Connection: ${data.connection} - SteamID: ${data.steamID}`)
    // })
    // this.logParser.on('CLIENT_LOGIN_REQUEST', (data) => {
    //   Logger.verbose("SquadServer", 1, `Login request. ChainID: ${data.chainID} - Suffix: ${data.suffix} - EOSID: ${data.eosID}`)

    // })
    // this.logParser.on('RESOLVED_EOS_ID', (data) => {
    //   Logger.verbose("SquadServer", 1, `Resolved EOSID. ChainID: ${data.chainID} - Suffix: ${data.suffix} - EOSID: ${data.eosID}`)
    // })
    // this.logParser.on('ADDING_CLIENT_CONNECTION', (data) => {
    //   Logger.verbose("SquadServer", 1, `Adding client connection`, data)
    // })
  }

  async restartLogParser() {
    try {
      await this.logParser.unwatch();
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to stop LogParser instance when restarting.', err);
    }

    Logger.verbose('SquadServer', 1, 'Setting up new LogParser instance...');
    this.setupLogParser();
    await this.logParser.watch();
  }

  getAdminPermsBySteamID(steamID) {
    return this.admins[steamID];
  }

  getAdminsWithPermission(perm) {
    const ret = [];
    for (const [steamID, perms] of Object.entries(this.admins)) {
      if (perm in perms) ret.push(steamID);
    }
    return ret;
  }

  async updateAdmins() {
    this.admins = await fetchAdminLists(this.options.adminLists);
  }

  async updatePlayerList() {
    if (this.updatePlayerListTimeout) clearTimeout(this.updatePlayerListTimeout);

    Logger.verbose('SquadServer', 1, `Updating player list...`);

    try {
      const oldPlayerInfo = {};
      for (const player of this.players) {
        oldPlayerInfo[player.steamID] = player;
      }

      const players = [];
      for (const player of await this.rcon.getListPlayers(this))
        players.push({
          ...oldPlayerInfo[player.steamID],
          ...player,
          playercontroller: this.logParser.eventStore.players[player.steamID]
            ? this.logParser.eventStore.players[player.steamID].controller
            : null,
          squad: await this.getSquadByID(player.teamID, player.squadID)
        });

      this.players = players;

      for (const player of this.players) {
        if (typeof oldPlayerInfo[player.steamID] === 'undefined') continue;
        if (player.teamID !== oldPlayerInfo[player.steamID].teamID)
          this.emit('PLAYER_TEAM_CHANGE', {
            player: player,
            oldTeamID: oldPlayerInfo[player.steamID].teamID,
            newTeamID: player.teamID
          });
        if (player.squadID !== oldPlayerInfo[player.steamID].squadID)
          this.emit('PLAYER_SQUAD_CHANGE', {
            player: player,
            oldSquadID: oldPlayerInfo[player.steamID].squadID,
            newSquadID: player.squadID
          });
      }

      if (this.a2sPlayerCount > 0 && players.length === 0)
        Logger.verbose(
          'SquadServer',
          1,
          `Real Player Count: ${this.a2sPlayerCount} but loaded ${players.length}`
        );

      this.emit('UPDATED_PLAYER_INFORMATION');
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to update player list.', err);
    }

    Logger.verbose('SquadServer', 1, `Updated player list.`);

    this.updatePlayerListTimeout = setTimeout(this.updatePlayerList, this.updatePlayerListInterval);
  }

  async updateSquadList() {
    if (this.updateSquadListTimeout) clearTimeout(this.updateSquadListTimeout);

    Logger.verbose('SquadServer', 1, `Updating squad list...`);

    try {
      this.squads = await this.rcon.getSquads();
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to update squad list.', err);
    }

    Logger.verbose('SquadServer', 1, `Updated squad list.`);

    this.updateSquadListTimeout = setTimeout(this.updateSquadList, this.updateSquadListInterval);
  }

  async updateLayerInformation() {
    if (this.updateLayerInformationTimeout) clearTimeout(this.updateLayerInformationTimeout);

    Logger.verbose('SquadServer', 1, `Updating layer information...`);

    try {
      const currentMap = await this.rcon.getCurrentMap();
      const nextMap = await this.rcon.getNextMap();
      const nextMapToBeVoted = nextMap.layer === 'To be voted';

      const currentLayer = await Layers.getLayerByName(currentMap.layer);
      const nextLayer = nextMapToBeVoted ? null : await Layers.getLayerByName(nextMap.layer);

      if (this.layerHistory.length === 0) {
        this.layerHistory.unshift({ layer: currentLayer, time: Date.now() });
        this.layerHistory = this.layerHistory.slice(0, this.layerHistoryMaxLength);
      }

      this.currentLayer = currentLayer;
      this.nextLayer = nextLayer;
      this.nextLayerToBeVoted = nextMapToBeVoted;

      this.emit('UPDATED_LAYER_INFORMATION');
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to update layer information.', err);
    }

    Logger.verbose('SquadServer', 1, `Updated layer information.`);

    this.updateLayerInformationTimeout = setTimeout(
      this.updateLayerInformation,
      this.updateLayerInformationInterval
    );
  }

  updateA2SInformation() {
    return this.updateServerInformation();
  }

  async updateServerInformation() {
    if (this.updateA2SInformationTimeout) clearTimeout(this.updateA2SInformationTimeout);

    Logger.verbose('SquadServer', 1, `Updating server information...`);

    try {
      const rawData = await this.rcon.execute(`ShowServerInfo`);
      Logger.verbose('SquadServer', 3, `Server information raw data`, rawData);
      const data = JSON.parse(rawData);
      Logger.verbose('SquadServer', 2, `Server information data`, JSON.data);

      const info = {
        raw: data,
        serverName: data.ServerName_s,

        maxPlayers: parseInt(data.MaxPlayers),
        publicQueueLimit: parseInt(data.PublicQueueLimit_I),
        reserveSlots: parseInt(data.PlayerReserveCount_I),

        playerCount: parseInt(data.PlayerCount_I),
        a2sPlayerCount: parseInt(data.PlayerCount_I),
        publicQueue: parseInt(data.PublicQueue_I),
        reserveQueue: parseInt(data.ReservedQueue_I),

        currentLayer: data.MapName_s,
        nextLayer: data.NextLayer_s,

        teamOne: data.TeamOne_s?.replace(new RegExp(data.MapName_s, 'i'), '') || '',
        teamTwo: data.TeamTwo_s?.replace(new RegExp(data.MapName_s, 'i'), '') || '',

        matchTimeout: parseFloat(data.MatchTimeout_d),
        matchStartTime: this.getMatchStartTimeByPlaytime(data.PLAYTIME_I),
        gameVersion: data.GameVersion_s
      };

      this.serverName = info.serverName;

      this.maxPlayers = info.maxPlayers;
      this.publicSlots = info.maxPlayers - info.reserveSlots;
      this.reserveSlots = info.reserveSlots;

      this.a2sPlayerCount = info.playerCount;
      this.playerCount = info.playerCount;
      this.publicQueue = info.publicQueue;
      this.reserveQueue = info.reserveQueue;

      this.matchTimeout = info.matchTimeout;
      this.matchStartTime = info.matchStartTime;
      this.gameVersion = info.gameVersion;

      if (!this.currentLayer) this.currentLayer = Layers.getLayerByClassname(info.currentLayer);
      if (!this.nextLayer) this.nextLayer = Layers.getLayerByClassname(info.nextLayer);

      this.emit('UPDATED_A2S_INFORMATION', info);
      this.emit('UPDATED_SERVER_INFORMATION', info);
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to update server information.', err);
    }

    Logger.verbose('SquadServer', 1, `Updated server information.`);

    this.updateA2SInformationTimeout = setTimeout(
      this.updateA2SInformation,
      this.updateA2SInformationInterval
    );
  }

  async getPlayerByCondition(condition, forceUpdate = false, retry = true) {
    let matches;

    if (!forceUpdate) {
      matches = this.players.filter(condition);
      if (matches.length === 1) return matches[0];

      if (!retry) return null;
    }

    await this.updatePlayerList();

    matches = this.players.filter(condition);
    if (matches.length === 1) return matches[0];

    return null;
  }

  async getSquadByCondition(condition, forceUpdate = false, retry = true) {
    let matches;

    if (!forceUpdate) {
      matches = this.squads.filter(condition);
      if (matches.length === 1) return matches[0];

      if (!retry) return null;
    }

    await this.updateSquadList();

    matches = this.squads.filter(condition);
    if (matches.length === 1) return matches[0];

    return null;
  }

  async getSquadByID(teamID, squadID) {
    if (squadID === null) return null;
    return this.getSquadByCondition(
      (squad) => squad.teamID === teamID && squad.squadID === squadID
    );
  }

  async getPlayerBySteamID(steamID, forceUpdate) {
    return this.getPlayerByCondition((player) => player.steamID === steamID, forceUpdate);
  }

  async getPlayerByEOSID(eosID, forceUpdate) {
    return this.getPlayerByCondition((player) => player.eosID === eosID, forceUpdate);
  }

  async getPlayerByName(name, forceUpdate) {
    return this.getPlayerByCondition((player) => player.name === name, forceUpdate);
  }

  async getPlayerByNameSuffix(suffix, forceUpdate) {
    return this.getPlayerByCondition((player) => player.suffix === suffix, forceUpdate, false);
  }

  async getPlayerByController(controller, forceUpdate) {
    return this.getPlayerByCondition(
      (player) => player.playercontroller === controller,
      forceUpdate
    );
  }

  async pingSquadJSAPI() {
    if (this.pingSquadJSAPITimeout) clearTimeout(this.pingSquadJSAPITimeout);

    Logger.verbose('SquadServer', 1, 'Pinging SquadJS API...');

    const payload = {
      // Send information about the server.
      server: {
        host: this.options.host,
        queryPort: this.options.queryPort,

        name: this.serverName,
        playerCount: this.a2sPlayerCount + this.publicQueue + this.reserveQueue
      },

      // Send information about SquadJS.
      squadjs: {
        version: SQUADJS_VERSION,
        logReaderMode: this.options.logReaderMode,

        // Send the plugin config so we can see what plugins they're using (none of the config is sensitive).
        plugins: this.plugins.map((plugin) => ({
          ...plugin.rawOptions,
          plugin: plugin.constructor.name
        }))
      }
    };

    try {
      const { data } = await axios.post(SQUADJS_API_DOMAIN + '/api/v1/ping', payload);

      if (data.error)
        Logger.verbose(
          'SquadServer',
          1,
          `Successfully pinged the SquadJS API. Got back error: ${data.error}`
        );
      else
        Logger.verbose(
          'SquadServer',
          1,
          `Successfully pinged the SquadJS API. Got back message: ${data.message}`
        );
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to ping the SquadJS API: ', err.message);
    }

    this.pingSquadJSAPITimeout = setTimeout(this.pingSquadJSAPI, this.pingSquadJSAPIInterval);
  }

  getMatchStartTimeByPlaytime(playtime) {
    return new Date(Date.now() - +playtime * 1000);
  }
}
