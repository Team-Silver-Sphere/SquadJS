import path from 'path';

import TailModule from 'tail';

export default class TailLogReader {
  constructor(queueLine, options = {}) {
    if (!('logDir' in options)) throw new Error(`logDir must be specified.`);

    // fs.watchFile checks the file every 5007 ms by default, which delayed log events by
    // about 2.5 s on average. Polling works on every file system, including network and
    // container mounts where fs.watch events can be missing. One check is one stat call.
    this.reader = new TailModule.Tail(path.join(options.logDir, options.filename), {
      useWatchFile: true,
      fsWatchOptions: { interval: options.pollInterval || 100 }
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
