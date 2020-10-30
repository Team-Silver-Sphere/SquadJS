import EventEmitter from 'events';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import axios from 'axios';
import Discord from 'discord.js';
import Gamedig from 'gamedig';
import mysql from 'mysql';

import Logger from 'core/logger';
import { SQUADJS_API_DOMAIN } from 'core/constants';

import LogParser from 'log-parser';
import Rcon from 'rcon/squad';

import { SQUADJS_VERSION } from './utils/constants.js';
import { SquadLayers } from './utils/squad-layers.js';

import plugins from './plugins/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class SquadServer extends EventEmitter {
  constructor(options = {}) {
    super();

    for (const option of ['host', 'queryPort'])
      if (!(option in options)) throw new Error(`${option} must be specified.`);

    this.options = options;

    this.layerHistory = [];
    this.layerHistoryMaxLength = options.layerHistoryMaxLength || 20;

    this.players = [];
    this.admins = [];

    this.plugins = [];

    this.squadLayers = new SquadLayers(options.squadLayersSource);

    this.setupRCON();
    this.setupLogParser();
    this.setupAdminList();

    this.updatePlayerList = this.updatePlayerList.bind(this);
    this.updatePlayerListInterval = 30 * 1000;
    this.updatePlayerListTimeout = null;

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

  setupRCON() {
    this.rcon = new Rcon({
      host: this.options.host,
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

    this.rcon.on('RCON_ERROR', (data) => {
      this.emit('RCON_ERROR', data);
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
    this.logParser = new LogParser({
      mode: this.options.logReaderMode,
      logDir: this.options.logDir,

      host: this.options.ftpHost || this.options.host,
      port: this.options.ftpPort,
      user: this.options.ftpUser,
      password: this.options.ftpPassword,
      secure: this.options.ftpSecure,
      timeout: this.options.ftpTimeout,
      verbose: this.options.ftpVerbose,
      fetchInterval: this.options.ftpFetchInterval,
      maxTempFileSize: this.options.ftpMaxTempFileSize,

      // enable this for FTP servers that do not support SIZE
      useListForSize: this.options.ftpUseListForSize
    });

    this.logParser.on('ADMIN_BROADCAST', (data) => {
      this.emit('ADMIN_BROADCAST', data);
    });

    this.logParser.on('NEW_GAME', (data) => {
      let layer;
      if (data.layer) layer = this.squadLayers.getLayerByLayerName(data.layer);
      else layer = this.squadLayers.getLayerByLayerClassname(data.layerClassname);

      this.layerHistory.unshift({ ...layer, time: data.time });
      this.layerHistory = this.layerHistory.slice(0, this.layerHistoryMaxLength);

      this.emit('NEW_GAME', data);
    });

    this.logParser.on('PLAYER_CONNECTED', async (data) => {
      data.player = await this.getPlayerBySteamID(data.steamID);
      if (data.player) data.player.suffix = data.playerSuffix;

      delete data.steamID;
      delete data.playerSuffix;

      this.emit('PLAYER_CONNECTED', data);
    });

    this.logParser.on('PLAYER_DAMAGED', async (data) => {
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByName(data.attackerName);

      if (data.victim && data.attacker)
        data.teamkill =
          data.victim.teamID === data.attacker.teamID &&
          data.victim.steamID !== data.attacker.steamID;

      delete data.victimName;
      delete data.attackerName;

      this.emit('PLAYER_DAMAGED', data);
    });

    this.logParser.on('PLAYER_WOUNDED', async (data) => {
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByName(data.attackerName);

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
      data.attacker = await this.getPlayerByName(data.attackerName);

      if (data.victim && data.attacker)
        data.teamkill =
          data.victim.teamID === data.attacker.teamID &&
          data.victim.steamID !== data.attacker.steamID;

      delete data.victimName;
      delete data.attackerName;

      this.emit('PLAYER_DIED', data);
    });

    this.logParser.on('PLAYER_REVIVED', async (data) => {
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByName(data.attackerName);
      data.reviver = await this.getPlayerByName(data.reviverName);

      delete data.victimName;
      delete data.attackerName;
      delete data.reviverName;

      this.emit('PLAYER_REVIVED', data);
    });

    this.logParser.on('PLAYER_POSSESS', async (data) => {
      data.player = await this.getPlayerByNameSuffix(data.playerSuffix);
      if (data.player) data.player.possessClassname = data.possessClassname;

      delete data.playerSuffix;

      this.emit('PLAYER_POSSESS', data);
    });

    this.logParser.on('PLAYER_UNPOSSESS', async (data) => {
      data.player = await this.getPlayerByNameSuffix(data.playerSuffix);

      delete data.playerSuffix;

      this.emit('PLAYER_UNPOSSESS', data);
    });

    this.logParser.on('TICK_RATE', (data) => {
      this.emit('TICK_RATE', data);
    });
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

  async setupAdminList() {
    try {
      for (const list of this.options.remoteAdminLists) {
        const resp = await axios({
          method: 'GET',
          url: `${list}`
        });

        const rawData = resp.data;

        const groupRgx = /(?<=Group=)(.*?):(.*)(?=\n)/g;
        const adminRgx = /(?<=Admin=)(\d+):(\S+)(?=\s)/g;

        const adminGroups = {};

        /* eslint-disable no-unused-vars */
        for (const [match, groupID, groupPerms] of rawData.matchAll(groupRgx)) {
          adminGroups[groupID] = groupPerms.split(',');
        }
        for (const [match, steamID, groupID] of rawData.matchAll(adminRgx)) {
          const perms = adminGroups[groupID];
          // exclude whitelist only "admins"
          if (!(perms.includes('reserve') && perms.length === 1)) {
            this.admins.push({ steamID: steamID, perms: perms });
          }
        }
        /* eslint-enable no-unused-vars */
        Logger.verbose('SquadServer', 3, 'Admin list:', this.admins);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async updatePlayerList() {
    if (this.updatePlayerListTimeout) clearTimeout(this.updatePlayerListTimeout);

    try {
      const oldPlayerInfo = {};
      for (const player of this.players) {
        oldPlayerInfo[player.steamID] = player;
      }

      this.players = (await this.rcon.getListPlayers()).map((player) => ({
        ...oldPlayerInfo[player.steamID],
        ...player
      }));

      for (const player of this.players) {
        if (typeof oldPlayerInfo[player.steamID] === 'undefined') continue;
        if (player.teamID !== oldPlayerInfo[player.steamID].teamID)
          this.emit('PLAYER_TEAM_CHANGE', player);
        if (player.squadID !== oldPlayerInfo[player.steamID].squadID)
          this.emit('PLAYER_SQUAD_CHANGE', player);
      }
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to update player list.', err);
    }

    this.updatePlayerListTimeout = setTimeout(this.updatePlayerList, this.updatePlayerListInterval);
  }

  async updateLayerInformation() {
    if (this.updateLayerInformationTimeout) clearTimeout(this.updateLayerInformationTimeout);

    try {
      const layerInfo = await this.rcon.getLayerInfo();

      if (this.layerHistory.length === 0) {
        const layer = this.squadLayers.getLayerByLayerName(layerInfo.currentLayer);

        this.layerHistory.unshift({ ...layer, time: Date.now() });
        this.layerHistory = this.layerHistory.slice(0, this.layerHistoryMaxLength);
      }

      this.nextLayer = layerInfo.nextLayer;
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to update layer information.', err);
    }

    this.updateLayerInformationTimeout = setTimeout(
      this.updateLayerInformation,
      this.updateLayerInformationInterval
    );
  }

  async updateA2SInformation() {
    if (this.updateA2SInformationTimeout) clearTimeout(this.updateA2SInformationTimeout);

    try {
      const data = await Gamedig.query({
        type: 'squad',
        host: this.options.host,
        port: this.options.queryPort
      });

      this.serverName = data.name;

      this.maxPlayers = parseInt(data.maxplayers);
      this.publicSlots = parseInt(data.raw.rules.NUMPUBCONN);
      this.reserveSlots = parseInt(data.raw.rules.NUMPRIVCONN);

      this.a2sPlayerCount = parseInt(data.raw.rules.PlayerCount_i);
      this.publicQueue = parseInt(data.raw.rules.PublicQueue_i);
      this.reserveQueue = parseInt(data.raw.rules.ReservedQueue_i);

      this.matchTimeout = parseFloat(data.raw.rules.MatchTimeout_f);
      this.gameVersion = data.raw.version;
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to update A2S information.', err);
    }

    this.updateA2SInformationTimeout = setTimeout(
      this.updateA2SInformation,
      this.updateA2SInformationInterval
    );
  }

  async getPlayerByCondition(condition, retry = true) {
    let matches;

    matches = this.players.filter(condition);
    if (matches.length === 1) return matches[0];

    if (!retry) return null;

    await this.updatePlayerList();

    matches = this.players.filter(condition);
    if (matches.length === 1) return matches[0];

    return null;
  }

  async getPlayerBySteamID(steamID) {
    return this.getPlayerByCondition((player) => player.steamID === steamID);
  }

  async getPlayerByName(name) {
    return this.getPlayerByCondition((player) => player.name === name);
  }

  async getPlayerByNameSuffix(suffix) {
    return this.getPlayerByCondition((player) => player.suffix === suffix, false);
  }

  async watch() {
    await this.squadLayers.pull();

    await this.rcon.connect();
    await this.logParser.watch();

    await this.updatePlayerList();
    await this.updateLayerInformation();
    await this.updateA2SInformation();

    Logger.verbose('SquadServer', 1, `Watching ${this.serverName}...`);

    await this.pingSquadJSAPI();
  }

  async unwatch() {
    await this.rcon.disconnect();
    await this.logParser.unwatch();
  }

  static async buildFromConfig(config) {
    // Setup logging levels
    for (const [module, verboseness] of Object.entries(config.verboseness)) {
      Logger.setVerboseness(module, verboseness);
    }

    Logger.verbose('SquadServer', 1, 'Creating SquadServer...');
    const server = new SquadServer(config.server);

    // pull layers read to use to create layer filter connectors
    await server.squadLayers.pull();

    Logger.verbose('SquadServer', 1, 'Preparing connectors...');
    const connectors = {};
    for (const pluginConfig of config.plugins) {
      if (!pluginConfig.enabled) continue;

      const Plugin = plugins[pluginConfig.plugin];

      for (const [optionName, option] of Object.entries(Plugin.optionsSpecification)) {
        // ignore non connectors
        if (!option.connector) continue;

        if (!(optionName in pluginConfig))
          throw new Error(
            `${Plugin.name}: ${optionName} (${option.connector} connector) is missing.`
          );

        const connectorName = pluginConfig[optionName];

        // skip already created connectors
        if (connectors[connectorName]) continue;

        const connectorConfig = config.connectors[connectorName];

        if (option.connector === 'discord') {
          Logger.verbose('SquadServer', 1, `Starting discord connector ${connectorName}...`);
          connectors[connectorName] = new Discord.Client();
          await connectors[connectorName].login(connectorConfig);
        } else if (option.connector === 'mysql') {
          Logger.verbose('SquadServer', 1, `Starting mysqlPool connector ${connectorName}...`);
          connectors[connectorName] = mysql.createPool(connectorConfig);
        } else if (option.connector === 'squadlayerpool') {
          Logger.verbose(
            'SquadServer',
            1,
            `Starting squadlayerfilter connector ${connectorName}...`
          );
          connectors[connectorName] = server.squadLayers[connectorConfig.type](
            connectorConfig.filter,
            connectorConfig.activeLayerFilter
          );
        } else {
          throw new Error(`${option.connector} is an unsupported connector type.`);
        }
      }
    }

    Logger.verbose('SquadServer', 1, 'Applying plugins to SquadServer...');
    for (const pluginConfig of config.plugins) {
      if (!pluginConfig.enabled) continue;

      if (!plugins[pluginConfig.plugin])
        throw new Error(`Plugin ${pluginConfig.plugin} does not exist.`);

      const Plugin = plugins[pluginConfig.plugin];

      Logger.verbose('SquadServer', 1, `Initialising ${Plugin.name}...`);

      const options = {};
      for (const [optionName, option] of Object.entries(Plugin.optionsSpecification)) {
        if (option.connector) {
          options[optionName] = connectors[pluginConfig[optionName]];
        } else {
          if (option.required) {
            if (!(optionName in pluginConfig))
              throw new Error(`${Plugin.name}: ${optionName} is required but missing.`);
            if (option.default === pluginConfig[optionName])
              throw new Error(
                `${Plugin.name}: ${optionName} is required but is the default value.`
              );
          }

          options[optionName] = pluginConfig[optionName] || option.default;
        }
      }

      server.plugins.push(new Plugin(server, options, pluginConfig));
    }

    return server;
  }

  static buildFromConfigString(configString) {
    let config;
    try {
      config = JSON.parse(configString);
    } catch (err) {
      throw new Error('Unable to parse config file.');
    }

    return SquadServer.buildFromConfig(config);
  }

  static buildFromConfigFile(configPath = './config.json') {
    Logger.verbose('SquadServer', 1, 'Reading config file...');
    configPath = path.resolve(__dirname, '../', configPath);
    if (!fs.existsSync(configPath)) throw new Error('Config file does not exist.');
    const configString = fs.readFileSync(configPath, 'utf8');

    return SquadServer.buildFromConfigString(configString);
  }

  async pingSquadJSAPI() {
    if (this.pingSquadJSAPITimeout) clearTimeout(this.pingSquadJSAPITimeout);

    Logger.verbose('SquadServer', 1, 'Pinging SquadJS API...');

    const config = {
      // send minimal information on server
      server: {
        host: this.options.host,
        queryPort: this.options.queryPort,
        logReaderMode: this.options.logReaderMode
      },

      // we send all plugin information as none of that is sensitive.
      plugins: this.plugins.map((plugin) => ({
        ...plugin.optionsRaw,
        plugin: plugin.constructor.name
      })),

      // send additional information about SquadJS
      version: SQUADJS_VERSION
    };

    try {
      const { data } = await axios.post(SQUADJS_API_DOMAIN + '/api/v1/ping', { config });

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
      Logger.verbose('SquadServer', 1, 'Failed to ping the SquadJS API: ', err);
    }

    this.pingSquadJSAPITimeout = setTimeout(this.pingSquadJSAPI, this.pingSquadJSAPIInterval);
  }
}
