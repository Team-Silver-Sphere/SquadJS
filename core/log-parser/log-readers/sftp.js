import path from 'path';
import SFTPTail from './sftptail.js';

export default class TailLogReader {
  constructor(queueLine, options = {}) {
    for (const option of ['host', 'user', 'password', 'logDir'])
      if (!(option in options)) throw new Error(`${option} must be specified.`);

    this.reader = new SFTPTail({
      host: options.host,
      port: options.port || 22,
      user: options.user,
      password: options.password,
      secure: options.secure || false,
      timeout: options.timeout || 2000,
      encoding: 'utf8',
      verbose: options.verbose,

      path: path.join(options.logDir, options.filename),

      fetchInterval: options.fetchInterval || 0,
      maxTempFileSize: options.maxTempFileSize || 5 * 1000 * 1000, // 5 MB

      useListForSize: options.useListForSize
    });

    if (typeof queueLine !== 'function')
      throw new Error('queueLine argument must be specified and be a function.');
    this.reader.on('line', queueLine);
  }

  async watch() {
    await this.reader.watch();
  }

  async unwatch() {
    await this.reader.unwatch();
  }
}
