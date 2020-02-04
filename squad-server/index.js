import EventEmitter from 'events';
import LogParser from './log-parser/index.js';
import Rcon from './rcon/index.js';

import { LOG_PARSER_NEW_GAME } from './events/log-parser.js';
import { SERVER_LAYER_CHANGE } from './events/server.js';

export default class Server extends EventEmitter {
  constructor(options = {}) {
    super();

    if (!('id' in options)) throw new Error('Server must have an ID.');
    this.id = options.id;

    this.layerHistory = options.layerHistory || [];
    this.layerHistoryMaxLength = options.layerHistoryMaxLength || 20;

    if (options.logParserEnabled) {
      this.logParser = new LogParser({
        logDir: options.logParserLogDir,
        testMode: options.logParserTestMode
      });
    }

    if (options.rconEnabled) {
      this.rcon = new Rcon({
        host: options.host,
        port: options.rconPort,
        password: options.rconPassword
      });
    }

    this.bindListeners();
  }

  /*
    Here we bind events related to the server's data that is available from
    multiple sources, i.e. layer change, prioritising those with better reliability
    and speed of updating.

    All must produce the same input to the related class method to ensure plugins
    relying on them are supported equally.

    Those with multiple methods that have yet to be implemented should still be
    included below.
   */
  bindListeners() {
    // Bind layer change event
    this.logParser.on(LOG_PARSER_NEW_GAME, this.onLayerChange.bind(this));
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
