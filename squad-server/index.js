import LogParser from 'log-parser';

export default class Server {
  constructor(options = {}) {
    if (!('id' in options)) throw new Error('Server must have an ID.');
    this.id = options.id;

    if (options.logDir) {
      this.logParser = new LogParser({
        logDir: options.logDir,
        testMode: options.testMode
      });
    }
  }

  watch() {
    if (this.logParser) this.logParser.watch();
  }

  unwatch() {
    if (this.logParser) this.logParser.unwatch();
  }
}
