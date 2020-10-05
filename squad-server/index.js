import EventEmitter from 'events';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import Discord from 'discord.js';
import Gamedig from 'gamedig';
import mysql from 'mysql';

import { SquadLayers } from './utils/squad-layers.js';
import LogParser from 'log-parser';
import Rcon from 'rcon';

import plugins from './plugins/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class SquadServer extends EventEmitter {
  constructor(options = {}) {
    super();

    for (const option of ['host', 'queryPort'])
      if (!(option in options)) throw new Error(`${option} must be specified.`);

    this.host = options.host;
    this.queryPort = options.queryPort;

    this.layerHistory = [];
    this.layerHistoryMaxLength = options.layerHistoryMaxLength || 20;

    this.players = [];

    this.plugins = [];

    this.squadLayers = new SquadLayers(options.squadLayersSource);

    this.logParser = new LogParser({
      mode: options.logReaderMode,
      logDir: options.logDir,

      host: options.host,
      port: options.ftpPort,
      user: options.ftpUser,
      password: options.ftpPassword,
      secure: options.ftpSecure,
      timeout: options.ftpTimeout,
      verbose: options.ftpVerbose,
      fetchInterval: options.ftpFetchInterval,
      maxTempFileSize: options.ftpMaxTempFileSize
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

      if (data.victim && data.attacker) data.teamkill = data.victim.teamID === data.attacker.teamID;

      delete data.victimName;
      delete data.attackerName;

      this.emit('PLAYER_DAMAGED', data);
    });

    this.logParser.on('PLAYER_WOUNDED', async (data) => {
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByName(data.attackerName);

      if (data.victim && data.attacker) data.teamkill = data.victim.teamID === data.attacker.teamID;

      delete data.victimName;
      delete data.attackerName;

      this.emit('PLAYER_WOUNDED', data);
      if (data.teamkill) this.emit('TEAMKILL', data);
    });

    this.logParser.on('PLAYER_DIED', async (data) => {
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByName(data.attackerName);

      if (data.victim && data.attacker) data.teamkill = data.victim.teamID === data.attacker.teamID;

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

    this.rcon = new Rcon({
      host: options.host,
      port: options.rconPort,
      password: options.rconPassword,
      autoReconnectInterval: options.rconAutoReconnectInterval
    });

    this.rcon.on('CHAT_MESSAGE', async (data) => {
      data.player = await this.getPlayerBySteamID(data.steamID);
      this.emit('CHAT_MESSAGE', data);
    });

    this.rcon.on('RCON_ERROR', (data) => {
      this.emit('RCON_ERROR', data);
    });

    this.updatePlayerList = this.updatePlayerList.bind(this);
    this.updatePlayerListInterval = 30 * 1000;
    this.updatePlayerListTimeout = null;

    this.updateLayerInformation = this.updateLayerInformation.bind(this);
    this.updateLayerInformationInterval = 30 * 1000;
    this.updateLayerInformationTimeout = null;

    this.updateA2SInformation = this.updateA2SInformation.bind(this);
    this.updateA2SInformationInterval = 30 * 1000;
    this.updateA2SInformationTimeout = null;
  }

  async updatePlayerList() {
    if (this.updatePlayerListTimeout) clearTimeout(this.updatePlayerListTimeout);

    const oldPlayerInfo = {};
    for (const player of this.players) {
      oldPlayerInfo[player.steamID] = player;
    }

    this.players = (await this.rcon.getListPlayers()).map((player) => ({
      ...oldPlayerInfo[player.steamID],
      ...player
    }));

    this.updatePlayerListTimeout = setTimeout(this.updatePlayerList, this.updatePlayerListInterval);
  }

  async updateLayerInformation() {
    if (this.updateLayerInformationTimeout) clearTimeout(this.updateLayerInformationTimeout);

    const layerInfo = await this.rcon.getLayerInfo();

    if (this.layerHistory.length === 0) {
      const layer = SquadLayers.getLayerByLayerName(layerInfo.currentLayer);

      this.layerHistory.unshift({ ...layer, time: Date.now() });
      this.layerHistory = this.layerHistory.slice(0, this.layerHistoryMaxLength);
    }

    this.nextLayer = layerInfo.nextLayer;

    this.updateLayerInformationTimeout = setTimeout(
      this.updateLayerInformation,
      this.updateLayerInformationInterval
    );
  }

  async updateA2SInformation() {
    if (this.updateA2SInformationTimeout) clearTimeout(this.updateA2SInformationTimeout);

    const data = await Gamedig.query({ type: 'squad', host: this.host, port: this.queryPort });

    this.serverName = data.name;

    this.maxPlayers = parseInt(data.maxplayers);
    this.publicSlots = parseInt(data.raw.rules.NUMPUBCONN);
    this.reserveSlots = parseInt(data.raw.rules.NUMPRIVCONN);

    this.playerCount = parseInt(data.raw.rules.PlayerCount_i);
    this.publicQueue = parseInt(data.raw.rules.PublicQueue_i);
    this.reserveQueue = parseInt(data.raw.rules.ReservedQueue_i);

    this.matchTimeout = parseFloat(data.raw.rules.MatchTimeout_f);
    this.gameVersion = data.raw.version;

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
  }

  async unwatch() {
    await this.rcon.disconnect();
    await this.logParser.unwatch();
  }

  static async buildFromConfig(configPath = './config.json') {
    console.log('Reading config file...');
    configPath = path.resolve(__dirname, '../', configPath);
    if (!fs.existsSync(configPath)) throw new Error('Config file does not exist.');
    const unparsedConfig = fs.readFileSync(configPath, 'utf8');

    console.log('Parsing config file...');
    let config;
    try {
      config = JSON.parse(unparsedConfig);
    } catch (err) {
      throw new Error('Unable to parse config file.');
    }

    console.log('Creating SquadServer...');
    const server = new SquadServer(config.server);

    // pull layers read to use to create layer filter connectors
    await server.squadLayers.pull();

    console.log('Preparing connectors...');
    const connectors = {};
    for (const pluginConfig of config.plugins) {
      const Plugin = plugins[pluginConfig.plugin];

      for (const [optionName, option] of Object.entries(Plugin.optionsSpecification)) {
        if (!(optionName in pluginConfig))
          throw new Error(
            `${Plugin.name}: ${optionName} (${option.connector} connector) is missing.`
          );

        // ignore non connectors
        if (!option.connector) continue;

        const connectorName = pluginConfig[optionName];

        // skip already created connectors
        if (connectors[connectorName]) continue;

        const connectorConfig = config.connectors[connectorName];

        if (option.connector === 'discord') {
          console.log(`Starting discord connector ${connectorName}...`);
          connectors[connectorName] = new Discord.Client();
          await connectors[connectorName].login(connectorConfig);
        } else if (option.connector === 'mysql') {
          console.log(`Starting mysqlPool connector ${connectorName}...`);
          connectors[connectorName] = mysql.createPool(connectorConfig);
        } else if (option.connector === 'squadlayerpool') {
          console.log(`Starting squadlayerfilter connector ${connectorName}...`);
          connectors[connectorName] = server.squadLayers[connectorConfig.type](
            connectorConfig.filter,
            connectorConfig.activeLayerFilter
          );
        } else {
          throw new Error(`${option.connector} is an unsupported connector type.`);
        }
      }
    }

    console.log('Applying plugins to SquadServer...');
    for (const pluginConfig of config.plugins) {
      if (!plugins[pluginConfig.plugin])
        throw new Error(`Plugin ${pluginConfig.plugin} does not exist.`);

      const Plugin = plugins[pluginConfig.plugin];

      console.log(`Initialising ${Plugin.name}...`);

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

      server.plugins.push(new Plugin(server, options));
    }

    return server;
  }
}
