import path from 'path';

import TailModule from 'tail';

export default class TailLogReader {
  constructor(queueLine, options = {}) {
    if (!('logDir' in options)) throw new Error(`logDir must be specified.`);

    // fs.watchFile checks the file every 5007 ms by default, which delayed log events by
    // about 2.5 s on average.
    this.reader = new TailModule.Tail(path.join(options.logDir, options.filename), {
      useWatchFile: true,
      fsWatchOptions: { interval: 500 }
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
