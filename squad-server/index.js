import EventEmitter from 'events';
import LogParser from './log-parser/index.js';
import Rcon from './rcon/index.js';

import { SERVER_LAYER_CHANGE } from './events/server.js';

export default class Server extends EventEmitter {
  constructor(options = {}) {
    super();

    if (!('id' in options)) throw new Error('Server must have an ID.');
    this.id = options.id;

    this.host = options.host;

    this.rconPort = options.rconPort;
    this.rconPassword = options.rconPassword;
    this.rconAutoReconnectInterval = options.rconAutoReconnectInterval || 1000;

    this.logParserLogDir = options.logParserLogDir;
    this.logParserTestMode = options.logParserTestMode;

    if (options.rconEnabled) {
      if (this.host === undefined)
        throw new Error('Host must be specified when RCON is enabled');
      if (this.rconPort === undefined)
        throw new Error('RCON Port must be specified when RCON is enabled');
      if (this.rconPassword === undefined)
        throw new Error('RCON Password must be specified when RCON is enabled');
      this.rcon = new Rcon(this);
    }

    if (options.logParserEnabled) {
      if (this.logParserLogDir === undefined)
        throw new Error(
          'Log Directory must be specified when LogParser is enabled.'
        );
      this.logParser = new LogParser(this);
    }

    this.layerHistory = options.layerHistory || [];
    this.layerHistoryMaxLength = options.layerHistoryMaxLength || 20;
  }

  onLayerChange(info) {
    const outputInfo = {
      time: info.time,
      map: info.map,
      layer: info.layer
    };

    this.layerHistory.unshift(outputInfo);
    this.layerHistory = this.layerHistory.slice(0, this.layerHistoryMaxLength);

    this.emit(SERVER_LAYER_CHANGE, outputInfo);
  }

  async watch() {
    if (this.logParser) this.logParser.watch();
    if (this.rcon) await this.rcon.watch();
  }

  async unwatch() {
    if (this.logParser) this.logParser.unwatch();
    if (this.rcon) await this.rcon.unwatch();
  }
}
