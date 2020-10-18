import path from 'path';

import FTPTail from 'ftp-tail';

export default class TailLogReader {
  constructor(queueLine, options = {}) {
    if (typeof queueLine !== 'function')
      throw new Error('queueLine argument must be specified and be a function.');
    if (!options.host) throw new Error('host argument must be specified.');
    if (!options.ftpUser) throw new Error('user argument must be specified.');
    if (!options.ftpPassword) throw new Error('password argument must be specified.');

    this.reader = new FTPTail({
      host: options.host,
      port: options.ftpPort || 21,
      user: options.ftpUser,
      password: options.ftpPassword,
      secure: options.ftpSecure || false,
      timeout: options.ftpTimeout || 2000,
      encoding: 'utf8',
      verbose: options.ftpVerbose,

      path: path.join(options.logDir, 'SquadGame.log'),

      fetchInterval: options.ftpFetchInterval || 0,
      maxTempFileSize: options.ftpMaxTempFileSize || 5 * 1000 * 1000 // 5 MB
    });

    this.reader.on('line', queueLine);
  }

  async watch() {
    await this.reader.watch();
  }

  async unwatch() {
    await this.reader.unwatch();
  }
}
