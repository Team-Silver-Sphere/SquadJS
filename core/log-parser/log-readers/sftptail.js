import crypto from 'crypto';
import EventEmitter from 'events';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import SftpClient from 'ssh2-sftp-client';

export default class SFTPTail extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;

    // Setup basic-ftp client.
    this.client = new SftpClient();

    // Setup logger.
    if (typeof this.options.log === 'function') {
      this.log = this.options.log;
    } else if (this.options.log) {
      this.log = console.log;
    } else {
      this.log = () => {};
    }

    // Setup internal properties.
    this.filePath = options.path;
    this.lastByteReceived = 0;

    this.fetchLoopActive = false;
    this.fetchLoopPromise = null;
  }

  async watch() {
    // Setup temp file.
    this.tmpFilePath = path.join(
      process.cwd(),
      crypto
        .createHash('md5')
        .update(`${this.options.host}:${this.options.port}:${this.filePath}`)
        .digest('hex') + '.tmp'
    );

    // Connect.
    await this.connect();

    // Start fetch loop.
    this.log('Starting fetch loop...');
    this.fetchLoopActive = true;
    this.fetchLoopPromise = this.fetchLoop();
  }

  async unwatch() {
    this.log('Stopping fetch loop...');
    this.fetchLoopActive = false;
    await this.fetchLoopPromise;
  }

  async fetchLoop() {
    while (this.fetchLoopActive) {
      try {
        // Store the start time of the loop.
        const fetchStartTime = Date.now();

        // Reconnect the FTP client in case it has disconnected.
        const connection = await this.connect();

        // Get the size of the file on the FTP server.
        this.log(`Fetching size of file...${this.filePath}`);
        const fileSize = await connection.stat(this.filePath).size;
        this.log(`File size is ${fileSize}.`);

        // If the file size has not changed then skip this loop iteration.
        if (fileSize === this.lastByteReceived) {
          this.log('File has not changed.');
          await this.sleep(this.options.fetchInterval);
        }

        // If the file has not been tailed before or it has been decreased in size download the last
        // few bytes.
        if (this.lastByteReceived === null || this.lastByteReceived > fileSize) {
          this.log('File has not been tailed before or has decreased in size.');
          this.lastByteReceived = Math.max(0, fileSize - this.options.tailLastBytes);
        }

        // Download the data to a temp file overwritting any previous data.
        this.log(`Downloading file with...`);
        await this.client.get(
          this.filePath,
          fs.createWriteStream(this.tmpFilePath, { flags: 'w' }),
          { readStreamOptions: { start: this.lastByteReceived } }
        );

        // Update the last byte marker - this is so we can get data since this position on the next
        // FTP download.
        const downloadSize = fs.statSync(this.tmpFilePath).size;
        this.lastByteReceived += downloadSize;
        this.log(`Downloaded file of size ${downloadSize}.`);

        // Get contents of download.
        const data = await readFile(this.tmpFilePath, 'utf8');

        // Only continue if something was fetched.
        if (data.length === 0) {
          this.log('No data was fetched.');
          await this.sleep(this.options.fetchInterval);
          continue;
        }

        data
          // Remove trailing new lines.
          .replace(/\r\n$/, '')
          // Split the data on the lines.
          .split('\r\n')
          // Emit each line.
          .forEach((line) => this.emit('line', line));

        // Log the loop runtime.
        const fetchEndTime = Date.now();
        const fetchTime = fetchEndTime - fetchStartTime;
        this.log(`Fetch loop took ${fetchTime}ms.`);

        await this.sleep(this.options.fetchInterval);
      } catch (err) {
        this.emit('error', err);
        this.log(`Error in fetch loop: ${err.stack}`);
      }
    }

    if (fs.existsSync(this.tmpFilePath)) {
      fs.unlinkSync(this.tmpFilePath);
      this.log('Deleted temp file.');
    }

    await this.disconnect();
  }

  async connect() {
    if (this.client.sftp) return this.client;
    console.log('Connecting to SFTP server...');
    await this.client.connect({
      host: this.options.host,
      port: this.options.port || 22,
      user: this.options.user,
      password: this.options.password
    });
    this.emit('connected');
    console.log('Connected to SFTP server.');
    return this.client;
  }

  async disconnect() {
    if (this.client.closed) return;

    this.log('Disconnecting from SFTP server...');
    await this.client.close();
    this.emit('disconnect');
    this.log('Disconnected from SFTP server.');
  }

  async sleep(ms) {
    this.log(`Sleeping for ${ms} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
