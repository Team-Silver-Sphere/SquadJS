import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import ftp from 'basic-ftp';

import sleep from 'core/utils/sleep';

// THIS LOG READER IS CURRENTLY UNDER DEVELOPMENT. IT IS ADVISED THAT YOU DO NOT USE IT.
export default class FTPLogReader {
  constructor(queueLine, options = {}) {
    if (typeof queueLine !== 'function')
      throw new Error(
        'queueLine argument must be specified and be a function.'
      );
    if (!options.host) throw new Error('Host must be specified.');
    if (!options.ftpUser) throw new Error('FTP user must be specified.');
    if (!options.ftpPassword)
      throw new Error('FTP password must be specified.');
    if (!options.remotePath) throw new Error('Remote path must be specified.');

    this.queueLine = queueLine;
    this.host = options.host;
    this.port = options.ftpPort || 21;
    this.user = options.ftpUser;
    this.password = options.ftpPassword;
    this.remotePath = options.logDir;
    this.timeout = options.ftpTimeout || 3000;
    this.encoding = 'utf8';
    this.defaultInterval = options.ftpPullInterval || 500;
    this.interval = this.defaultInterval;
    this.tempFilePath = path.join(
      process.cwd(),
      'temp',
      crypto
        .createHash('md5')
        .update(this.host.replace(/\./g, '-') + this.port + this.remotePath)
        .digest('hex') + '.tmp'
    );
    this.maxTempFileSize = 5 * 1000 * 1000; // 5 MB
    this.tailLastBytes = 100 * 1000;
  }

  async watch() {
    this.client = new ftp.Client(this.timeout);
    this.client.ftp.encoding = this.encoding;

    await this.client.access({
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password
    });

    this.interval = this.defaultInterval;
    this.runLoop();
  }

  async unwatch() {
    this.client.close();
    this.interval = -1;
    if (fs.existsSync(this.tempFilePath)) {
      fs.unlinkSync(this.tempFilePath);
    }
  }

  async runLoop() {
    while (this.interval !== -1) {
      const runStartTime = Date.now();

      if (fs.existsSync(this.tempFilePath)) {
        const { size } = fs.statSync(this.tempFilePath);
        if (size > this.maxTempFileSize || !this.lastByteReceived) {
          fs.unlinkSync(this.tempFilePath);
        }
      }

      // If we haven't received any data yet, tail the end of the file; else download all data since last pull
      if (this.lastByteReceived == null) {
        const fileSize = await this.client.size(this.remotePath);
        this.lastByteReceived =
          fileSize -
          (this.tailLastBytes < fileSize ? this.tailLastBytes : fileSize);
      }

      // Download the data to a temp file, overwrite any previous data
      // we overwrite previous data to calculate how much data we've received
      await this.client.downloadTo(
        fs.createWriteStream(this.tempFilePath, { flags: 'w' }),
        this.remotePath,
        this.lastByteReceived
      );
      const downloadSize = fs.statSync(this.tempFilePath).size;
      this.lastByteReceived += downloadSize; // update the last byte marker - this is so we can get data since this position on the ftp download

      const fileData = await new Promise((resolve, reject) => {
        fs.readFile(this.tempFilePath, (err, data) => {
          if (err) reject(err);
          resolve(data);
        });
      });

      fileData
        .toString('utf8')
        .split('\r\n')
        .forEach(this.queueLine);

      const ftpDataTime = Date.now();
      const ftpDataTimeMs = ftpDataTime - runStartTime;

      console.log('FTP Retrieve took: ' + ftpDataTimeMs + 'ms');

      const waitTime = this.interval - ftpDataTimeMs;
      if (waitTime > 0) {
        await sleep(waitTime);
      }
      const runEndTime = Date.now();
      console.log('Run time: ' + (runEndTime - runStartTime) + 'ms');
    }
  }
}
