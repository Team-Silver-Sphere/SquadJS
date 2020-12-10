import path from 'path';

import TailModule from 'tail';

export default class TailLogReader {
  constructor(queueLine, options = {}) {
    if (!('logDir' in options)) throw new Error(`logDir must be specified.`);

    this.reader = new TailModule.Tail(path.join(options.logDir, options.filename), {
      useWatchFile: true
    });

    if (typeof queueLine !== 'function')
      throw new Error('queueLine argument must be specified and be a function.');

    this.reader.on('line', queueLine);
  }

  async watch() {
    this.reader.watch();
  }

  async unwatch() {
    this.reader.unwatch();
  }
}
