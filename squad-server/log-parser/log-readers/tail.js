import path from 'path';
import TailModule from 'tail';

export default class TailLogReader {
  constructor(queueLine, options = {}) {
    if (typeof queueLine !== 'function')
      throw new Error('queueLine argument must be specified and be a function.');
    if (!options.logDir) throw new Error('Log directory must be specified.');

    this.reader = new TailModule.Tail(path.join(options.logDir, 'SquadGame.log'), {
      useWatchFile: true
    });

    this.reader.on('line', queueLine);
  }

  async watch() {
    this.reader.watch();
  }

  async unwatch() {
    this.reader.unwatch();
  }
}
