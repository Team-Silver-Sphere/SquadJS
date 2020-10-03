import EventEmitter from 'events';

import Gamedig from 'gamedig';

import LogParser from './log-parser/index.js';
import Rcon from './rcon/index.js';

import {
  LAYER_CHANGE,
  PLAYERS_UPDATED,
  LAYERS_UPDATED,
  A2S_INFO_UPDATED,
  NEW_GAME
} from './events.js';

export default class Server extends EventEmitter {
  constructor(options = {}) {
    super();

    // store options
    if (!('id' in options)) throw new Error('Server must have an ID.');
    this.id = options.id;

    if (!('host' in options)) throw new Error('Server must have a host.');
    this.host = options.host;

    if (!('queryPort' in options)) throw new Error('Server must have a queryPort.');
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
    this.on(NEW_GAME, this.onLayerChange.bind(this));

    // setup period updaters
    this.updatePlayers = this.updatePlayers.bind(this);
    this.updatePlayerTimeout = setTimeout(this.updatePlayers, this.updateInterval);

    setInterval(async () => {
      const data = await this.rcon.getMapInfo();
      this.currentLayer = data.currentLayer;
      this.nextLayer = data.nextLayer;
      this.emit(LAYERS_UPDATED, data);
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

      this.playerCount = parseInt(data.raw.rules.PlayerCount_i);
      this.publicQueue = parseInt(data.raw.rules.PublicQueue_i);
      this.reserveQueue = parseInt(data.raw.rules.ReservedQueue_i);

      this.matchTimeout = parseFloat(data.raw.rules.MatchTimeout_f);
      this.gameVersion = data.raw.version;

      this.emit(A2S_INFO_UPDATED, {
        serverName: this.serverName,
        maxPlayers: this.maxPlayers,
        publicSlots: this.publicSlots,
        reserveSlots: this.reserveSlots,
        playerCount: this.playerCount,
        publicQueue: this.publicQueue,
        reserveQueue: this.reserveQueue,
        matchTimeout: this.matchTimeout,
        gameVersion: this.gameVersion
      });
    }, this.updateInterval);
  }

  async watch() {
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
    this.updatePlayerTimeout = setTimeout(this.updatePlayers, this.updateInterval);

    this.emit(PLAYERS_UPDATED, this.players);
  }

  async getPlayerByName(name, suffix = false) {
    let matchingPlayers;

    matchingPlayers = [];
    for (const player of this.players) {
      if (player[suffix ? 'suffix' : 'name'] !== name) continue;
      matchingPlayers.push(player);
    }

    if (matchingPlayers.length === 0 && suffix === false) {
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
    this.emit(LAYER_CHANGE, info);
  }
}
