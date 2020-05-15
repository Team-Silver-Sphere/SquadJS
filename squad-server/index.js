import EventEmitter from 'events';

import Gamedig from 'gamedig';

import printLogo from 'core/utils/print-logo';

import LogParser from './log-parser/index.js';
import Rcon from './rcon/index.js';

import {
  SERVER_LAYER_CHANGE,
  SERVER_PLAYERS_UPDATED,
  SERVER_LAYERS_UPDATED,
  SERVER_A2S_UPDATED
} from './events/server.js';

import { LOG_PARSER_NEW_GAME } from './events/log-parser.js';

export default class Server extends EventEmitter {
  constructor(options = {}) {
    super();

    // store options
    if (!('id' in options)) throw new Error('Server must have an ID.');
    this.id = options.id;

    if (!('host' in options)) throw new Error('Server must have a host.');
    this.host = options.host;

    if (!('queryPort' in options))
      throw new Error('Server must have a queryPort.');
    this.queryPort = options.queryPort;

    this.updateInterval = options.updateInterval || 30 * 1000;

    // setup additional classes
    this.rcon = new Rcon(options, this);
    this.logParser = new LogParser(options, this);

    // setup internal data storage
    this.layerHistory = options.layerHistory || [];
    this.layerHistoryMaxLength = options.layerHistoryMaxLength || 20;

    this.players = [];

    // store additional information about players by SteamID
    this.suffixStore = {};

    // setup internal listeners
    this.on(LOG_PARSER_NEW_GAME, this.onLayerChange.bind(this));

    // setup period updaters
    this.updatePlayers = this.updatePlayers.bind(this);
    this.updatePlayerTimeout = setTimeout(
      this.updatePlayers,
      this.updateInterval
    );

    setInterval(async () => {
      const data = await this.rcon.getMapInfo();
      this.currentLayer = data.currentLayer;
      this.nextLayer = data.nextLayer;
      this.emit(SERVER_LAYERS_UPDATED, data);
    }, this.updateInterval);

    setInterval(async () => {
      const data = await Gamedig.query({
        type: 'squad',
        host: this.host,
        port: this.queryPort
      });

      this.serverName = data.name;

      this.maxPlayers = parseInt(data.maxplayers);
      this.publicSlots = parseInt(data.raw.rules.NUMPUBCONN);
      this.reserveSlots = parseInt(data.raw.rules.NUMPRIVCONN);

      this.a2sPlayerCount = Math.min(data.players.length, this.maxPlayers);
      this.publicQueue = parseInt(data.raw.rules.PublicQueue_i);
      this.reserveQueue = parseInt(data.raw.rules.ReservedQueue_i);

      this.matchTimeout = parseFloat(data.raw.rules.MatchTimeout_f);
      this.gameVersion = data.raw.version;

      this.emit(SERVER_A2S_UPDATED, {
        serverName: this.serverName,
        maxPlayers: this.maxPlayers,
        publicSlots: this.publicSlots,
        reserveSlots: this.reserveSlots,
        publicQueue: this.publicQueue,
        reserveQueue: this.reserveQueue,
        matchTimeout: this.matchTimeout,
        gameVersion: this.gameVersion
      });
    }, this.updateInterval);
  }

  async watch() {
    printLogo();
    console.log(`Watching server ${this.id}...`);
    if (this.logParser) await this.logParser.watch();
    if (this.rcon) await this.rcon.watch();
  }

  async unwatch() {
    if (this.logParser) await this.logParser.unwatch();
    if (this.rcon) await this.rcon.unwatch();
    console.log('Stopped watching.');
  }

  async updatePlayers() {
    clearTimeout(this.updatePlayerTimeout);

    this.players = await this.rcon.listPlayers();

    // readd additional information about the player we have collected
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].suffix = this.suffixStore[this.players[i].steamID];
    }

    // delay another update
    this.updatePlayerTimeout = setTimeout(
      this.updatePlayers,
      this.updateInterval
    );

    this.emit(SERVER_PLAYERS_UPDATED, this.players);
  }

  async getPlayerByName(name, suffix = false) {
    let matchingPlayers;

    matchingPlayers = [];
    for (const player of this.players) {
      if (player[suffix ? 'suffix' : 'name'] !== name) continue;
      matchingPlayers.push(player);
    }

    if (matchingPlayers.length === 0) {
      await this.updatePlayers();

      matchingPlayers = [];
      for (const player of this.players) {
        if (player[suffix ? 'suffix' : 'name'] !== name) continue;
        matchingPlayers.push(player);
      }
    }

    if (matchingPlayers.length === 1) return matchingPlayers[0];
    else return null;
  }

  async getPlayerBySteamID(steamID) {
    let matchingPlayers;

    matchingPlayers = [];
    for (const player of this.players) {
      if (player.steamID !== steamID) continue;
      matchingPlayers.push(player);
    }

    if (matchingPlayers.length === 0) {
      await this.updatePlayers();

      matchingPlayers = [];
      for (const player of this.players) {
        if (player.steamID !== steamID) continue;
        matchingPlayers.push(player);
      }
    }

    return matchingPlayers[0];
  }

  onLayerChange(info) {
    this.layerHistory.unshift(info);
    this.layerHistory = this.layerHistory.slice(0, this.layerHistoryMaxLength);
    this.emit(SERVER_LAYER_CHANGE, info);
  }
}
