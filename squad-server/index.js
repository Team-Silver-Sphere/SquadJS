import LogParser from './log-parser/index.js';
import Rcon from './rcon/index.js';

export default class Server {
  constructor(options = {}) {
    if (!('id' in options)) throw new Error('Server must have an ID.');
    this.id = options.id;

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
