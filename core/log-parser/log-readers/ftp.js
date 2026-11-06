import path from 'path';
import { FTPTail } from 'ftp-tail';

import Logger from '../../logger.js';

export default class TailLogReader {
  constructor(queueLine, options = {}) {
    for (const option of ['ftp', 'logDir'])
      if (!(option in options)) throw new Error(`${option} must be specified.`);

    this.options = options;

    this.reader = new FTPTail({
      ftp: options.ftp,
      fetchInterval: options.fetchInterval || 0,
      maxTempFileSize: options.maxTempFileSize || 5 * 1000 * 1000 // 5 MB
    });

    if (typeof queueLine !== 'function')
      throw new Error('queueLine argument must be specified and be a function.');

    this.reader.on('line', queueLine);
    // ftp-tail emits 'error' when a fetch fails and then tries again. Without a listener, the
    // emit throws and the unhandled rejection ends the process.
    this.reader.on('error', (err) => {
      Logger.verbose('LogParser', 1, `FTP log reader error: ${err.message}`);
    });
  }

  async watch() {
    await this.reader.watch(
      path.join(this.options.logDir, this.options.filename).replace(/\\/g, '/')
    );
  }

  async unwatch() {
    await this.reader.unwatch();
  }
}
