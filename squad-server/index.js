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

import { ServerConfig } from '../serverconfig.js';
import glob from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class SquadServer extends EventEmitter {
  constructor() {
    super();
    Logger.verbose('SquadServer', 1, 'Creating SquadServer...');

    this.layerHistory = [];
    this.players = [];
    this.plugins = [];
    this.connectors = {};
    const config = ServerConfig.getInstance().config;

    Object.entries(config.verboseness).forEach(([module, verboseness]) => Logger.setVerboseness(module, verboseness));

    // ?? SquadLayers is present both in SquadServer and connectors array
    this.squadLayers = new SquadLayers(config.server.squadLayersSource);
    this.rcon = this.setupRCON(config.server);
    this.logParser = this.setupLogParser(config.server);
    this.setupUpdateIntervals();

    // move squadLayers pull to the SquadLayers constructor ?
    this.squadLayers.pull();
    this.setupPlugins(config.plugins).then(pluginInstances => {
      this.plugins = pluginInstances;
      
      Logger.verbose('SquadServer', 1, `Number of Plugins online [${this.plugins.length}]`);
      this.plugins.forEach(plugin => {
        Logger.verbose('SquadServer', 2, `Plugin online: ${plugin.constructor.name}`);
      });
    });
  }

  async setupPlugins(pluginsConfig) {
    Logger.verbose('SquadServer', 1, 'Seting up plugins...');
    // Get all potential plugin files from plugin directory
    return await glob.sync('./plugins/*.js', { cwd: './squad-server/'}).reduce(async (plugins, file) => {
      // import potential plugin class from file name
      const { default: plugin } = await import(file);
      plugins = await plugins;

      // check if BasePlugin is implemented to make shore its a plugin
      if (plugin.hasOwnProperty('optionsSpecification')) {
        // recover plugins configuration
        const currentConf = pluginsConfig.find(singleConfig => singleConfig.plugin === plugin.name);

        // if config is absent plugin is disabled or unconfigured
        if (currentConf) {
          const pluginOptions = await this.buildPluginOptions(plugin.optionsSpecification, currentConf);
          var pluginInstance;
          // try creating plugin instance
          // if failed dont crash the aplication just log and proceed with next plugin
          try {
            Logger.verbose('SquadServer', 1, `Creating ${plugin.name}...`);
            pluginInstance = new plugin(this, pluginOptions, currentConf);
            await pluginInstance.init();
            plugins.push(pluginInstance);
          } catch (e) {
            // if pligins initialisation fails try to destroy what you can and dont add it to the plugins list
            pluginInstance.destroy();
            // this may or may not accelerate the GC passage
            pluginInstance = null;
            Logger.error('SquadServer', `Unable to create plugin instance of ${plugin.name}.`, e.stack);
          }

          return plugins;
        } else {
          Logger.verbose('SquadServer', 2, `No configuration found for ${plugin.name}, could be disabled or missing.`);
        }
      } else {
        Logger.verbose('SquadServer', 2, `${file} is not a plugin`);
      }

      return plugins;
    }, []);
  }

  async buildPluginOptions(optionsSpecification, pluginConfig) {
    return await Object.entries(optionsSpecification).reduce(async (outputOptions, [optionName, option]) => {
      outputOptions = await outputOptions;

      if (option && option.connector) {
        if (optionName && this.connectors[pluginConfig[optionName]])
          outputOptions[optionName] = this.connectors[pluginConfig[optionName]];
        else
          outputOptions[optionName] = await this.setupConnector(pluginConfig[optionName], option);
      } else if (!outputOptions[optionName]) {
        outputOptions[optionName] = pluginConfig[optionName] || option.default;
      }
      return outputOptions;
    }, {});
  }

  async setupConnector(connectorName, option) {
    const connectorConfig = ServerConfig.getInstance().config.connectors[connectorName];
    var connector;

    switch (option.connector) {
      case 'discord':
        Logger.verbose('SquadServer', 1, `Starting discord connector ${connectorName}...`);
        connector = new Discord.Client();
        await connector.login(connectorConfig);
        break;
      case 'mysql':
        Logger.verbose('SquadServer', 1, `Starting mysqlPool connector ${connectorName}...`);
        connector = mysql.createPool(connectorConfig);
        break;
      case 'squadlayerpool':
        Logger.verbose('SquadServer', 1, `Starting squadlayerfilter connector ${connectorName}...`);
        // ?? SquadLayers is present both in SquadServer and connectors array
        connector = this.squadLayers[connectorConfig.type](connectorName.filter, connectorName.activeLayerFilter);
        break;
      case 'databaseClient':
        connector = new Seqelize(connectorConfig.database, connectorConfig.user, connectorConfig.password, connectorConfig.server);
        connector.authenticate();
        break;
      default:
        throw new Error(`${option.connector} is an unsupported connector type.`);
    }
    this.connectors[connectorName] = connector;

    return this.connectors[connectorName];
  }

  setupUpdateIntervals() {
    Logger.verbose('SquadServer', 1, 'Seting up update intervals...');
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

  setupRCON(serverSettings) {
    Logger.verbose('SquadServer', 1, 'Creating Rcon...');
    const rcon = new Rcon({
      host: serverSettings.host,
      port: serverSettings.rconPort,
      password: serverSettings.rconPassword,
      autoReconnectInterval: serverSettings.rconAutoReconnectInterval
    });

    rcon.on('CHAT_MESSAGE', async (data) => {
      data.player = await this.getPlayerBySteamID(data.steamID);
      this.emit('CHAT_MESSAGE', data);

      const command = data.message.match(/!([^ ]+) ?(.*)/);
      if (command)
        this.emit(`CHAT_COMMAND:${command[1].toLowerCase()}`, {
          ...data,
          message: command[2].trim()
        });
    });

    rcon.on('RCON_ERROR', (data) => {
      this.emit('RCON_ERROR', data);
    });

    return rcon;
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

  setupLogParser(serverSettings) {
    Logger.verbose('SquadServer', 1, 'Creating LogParser...');
    const logParser = new LogParser({
      mode: serverSettings.logReaderMode,
      logDir: serverSettings.logDir,

      host: serverSettings.ftpHost || serverSettings.host,
      port: serverSettings.ftpPort,
      user: serverSettings.ftpUser,
      password: serverSettings.ftpPassword,
      secure: serverSettings.ftpSecure,
      timeout: serverSettings.ftpTimeout,
      verbose: serverSettings.ftpVerbose,
      fetchInterval: serverSettings.ftpFetchInterval,
      maxTempFileSize: serverSettings.ftpMaxTempFileSize,

      // enable this for FTP servers that do not support SIZE
      useListForSize: serverSettings.ftpUseListForSize
    });

    logParser.on('ADMIN_BROADCAST', (data) => {
      this.emit('ADMIN_BROADCAST', data);
    });

    logParser.on('NEW_GAME', (data) => {
      let layer;
      if (data.layer) layer = this.squadLayers.getLayerByLayerName(data.layer);
      else layer = this.squadLayers.getLayerByLayerClassname(data.layerClassname);

      this.layerHistory.unshift({ ...layer, time: data.time });
      this.layerHistory = this.layerHistory.slice(0, this.layerHistoryMaxLength);

      this.emit('NEW_GAME', data);
    });

    logParser.on('PLAYER_CONNECTED', async (data) => {
      data.player = await this.getPlayerBySteamID(data.steamID);
      if (data.player) data.player.suffix = data.playerSuffix;

      delete data.steamID;
      delete data.playerSuffix;

      this.emit('PLAYER_CONNECTED', data);
    });

    logParser.on('PLAYER_DAMAGED', async (data) => {
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

    logParser.on('PLAYER_WOUNDED', async (data) => {
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

    logParser.on('PLAYER_DIED', async (data) => {
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

    logParser.on('PLAYER_REVIVED', async (data) => {
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByName(data.attackerName);
      data.reviver = await this.getPlayerByName(data.reviverName);

      delete data.victimName;
      delete data.attackerName;
      delete data.reviverName;

      this.emit('PLAYER_REVIVED', data);
    });

    logParser.on('PLAYER_POSSESS', async (data) => {
      data.player = await this.getPlayerByNameSuffix(data.playerSuffix);
      if (data.player) data.player.possessClassname = data.possessClassname;

      delete data.playerSuffix;

      this.emit('PLAYER_POSSESS', data);
    });

    logParser.on('PLAYER_UNPOSSESS', async (data) => {
      data.player = await this.getPlayerByNameSuffix(data.playerSuffix);

      delete data.playerSuffix;

      this.emit('PLAYER_UNPOSSESS', data);
    });

    logParser.on('TICK_RATE', (data) => {
      this.emit('TICK_RATE', data);
    });

    return logParser;
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
        host: ServerConfig.getInstance().config.server.host,
        port: ServerConfig.getInstance().config.server.queryPort
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
        host: ServerConfig.getInstance().config.host,
        queryPort: ServerConfig.getInstance().config.queryPort,
        logReaderMode: ServerConfig.getInstance().config.logReaderMode
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
