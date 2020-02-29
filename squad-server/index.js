import EventEmitter from 'events';
import LogParser from './log-parser/index.js';
import Rcon from './rcon/index.js';

import { SERVER_LAYER_CHANGE } from './events/server.js';
import { LOG_PARSER_NEW_GAME } from './events/log-parser.js';

export default class Server extends EventEmitter {
  constructor(options = {}) {
    super();

    // store options
    if (!('id' in options)) throw new Error('Server must have an ID.');
    this.id = options.id;
    this.host = options.host;
    this.updateInterval = options.updateInterval || 30 * 1000;

    // setup additional classes
    this.rcon = new Rcon(
      {
        host: options.host,
        port: options.rconPort,
        password: options.rconPassword,
        verbose: options.rconVerbose
      },
      this
    );

    this.logParser = new LogParser(
      {
        logDir: options.logDir,
        testMode: options.logParserTestMode,
        testModeFileName: options.logParserTestModeFileName
      },
      this
    );

    // setup internal data storage
    this.layerHistory = options.layerHistory || [];
    this.layerHistoryMaxLength = options.layerHistoryMaxLength || 20;

    this.players = [];

    // setup internal listeners
    this.on(LOG_PARSER_NEW_GAME, this.onLayerChange.bind(this));

    // setup period updaters
    setInterval(async () => {
      this.players = await this.rcon.listPlayers();
    }, this.updateInterval);
  }

  async watch() {
    if (this.logParser) this.logParser.watch();
    if (this.rcon) await this.rcon.watch();
  }

  async unwatch() {
    if (this.logParser) this.logParser.unwatch();
    if (this.rcon) await this.rcon.unwatch();
  }

  getPlayerByName(name) {
    const matchingPlayers = [];

    for (const player of this.players) {
      if (player.name !== name) continue;
      matchingPlayers.push(player);
    }

    if (matchingPlayers.length === 1) return matchingPlayers[0];
    else return null;
  }

  onLayerChange(info) {
    this.layerHistory.unshift(info);
    this.layerHistory = this.layerHistory.slice(0, this.layerHistoryMaxLength);
    this.emit(SERVER_LAYER_CHANGE, info);
  }
}
