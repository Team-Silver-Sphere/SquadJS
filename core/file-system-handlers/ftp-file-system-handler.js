import FTPTail from 'ftp-tail';

import BaseFileSystemHandler, { ACTIVE_LOG_FILE } from './base-file-system-handler.js';

export default class FTPFileSystemHandler extends BaseFileSystemHandler {
  constructor(options = {}) {
    super(options);

    this.ftpTail = new FTPTail(options.ftpTail);
    this.ftpTail.on('line', (line) => this.emit('line', line));
  }

  async startTailingLogs() {
    await this.ftpTail.watch(this.getPathTo(ACTIVE_LOG_FILE));
  }

  async stopTailingLogs() {
    await this.ftpTail.unwatch();
  }
}
