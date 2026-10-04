import EventEmitter from 'events';
import path from 'path';
import readline from 'readline';

import TailFile from '@logdna/tail-file';

import Logger from '../../logger.js';

export default class TailLogReader {
  constructor(queueLine, options = {}) {
    if (!('logDir' in options)) throw new Error(`logDir must be specified.`);

    if (typeof queueLine !== 'function')
      throw new Error('queueLine argument must be specified and be a function.');

    this.filePath = path.join(options.logDir, options.filename);

    // Plugins can listen to this emitter for raw log lines.
    this.reader = new EventEmitter();
    this.reader.on('line', queueLine);
  }

  async watch() {
    // TailFile follows the file by inode. When the game moves the log to a backup file on a
    // restart, it reads the rest of the old file and then the new file from its start.
    this.tail = new TailFile(this.filePath, {
      // Polling works on every file system, including network and container mounts where
      // fs.watch events can be missing. One check is one stat call.
      pollFileIntervalMs: 100,
      // The default stops tailing after the file is missing for 10 checks (2 seconds).
      maxPollFailures: Infinity
    });
    this.tail.on('tail_error', (error) => {
      Logger.verbose('LogParser', 1, `Error while tailing ${this.filePath}: ${error.message}`);
    });

    this.lines = readline.createInterface({ input: this.tail, crlfDelay: Infinity });
    this.lines.on('line', (line) => this.reader.emit('line', line));
    // readline forwards errors from TailFile. TailFile emits one when it stops tailing.
    this.lines.on('error', (error) => {
      Logger.verbose('LogParser', 1, `Stopped tailing ${this.filePath}: ${error.message}`);
    });

    await this.tail.start();
  }

  async unwatch() {
    this.lines?.close();
    // Not awaited: quit() waits for a final read, which does not finish while the file is missing.
    this.tail?.quit().catch(() => {});
  }
}
