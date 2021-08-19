import async from 'async';

import A2SClient from './a2s-client.js';
import RconClient from './rcon-client.js';

import FTPFileSystemHandler from './file-system-handlers/ftp-file-system-handler.js';

import logger from '../utils/logger.js';

export default class Server {
  constructor(options = {}) {
    // Store options.
    this.a2sOptions = {
      host: options.a2sOptions.host || options.host,
      port: options.a2sOptions.port || options.queryPort, // Make it possible to store the query port separately as it's a fairly commonly used port.
      type: options.a2sOptions.type || 'squad'
    };

    this.rconOptions = {
      host: options.rconOptions.host || options.host,
      port: options.rconOptions.port || options.rconPort,
      password: options.rconOptions.password || options.rconPassword
    };

    switch (options.fileSystemHandler) {
      case 'ftp':
        this.FileSystemHandler = FTPFileSystemHandler;
        this.fileSystemHandlerOptions = {
          ...options.fileSystemHandlerOptions,
          ftp: {
            host: options.host,
            ...options.fileSystemHandlerOptions?.ftp
          },
          ftpTail: {
            fetchInterval: 1 * 1000,
            ...options.fileSystemHandlerOptions?.ftpTail,
            ...(options.fileSystemHandlerOptions?.ftpTail?.log && {
              log: (msg) => {
                logger.silly(msg);
              }
            }),
            ftp: {
              host: options.host,
              ...options.fileSystemHandlerOptions?.ftp,
              ...options.fileSystemHandlerOptions?.ftpTail?.ftp
            }
          }
        };
        break;
      default:
        throw new Error('Unsupported file system handler.');
    }

    // Define log parsing rules.
    this.logQueue = async.queue(this.handleLogLine.bind(this));
    this.logLineHandlers = [];

    // Define chat parsing rules.
    this.chatQueue = async.queue(this.handleChatMessage.bind(this));
    this.chatMessageHandlers = [];

    // Initialise server properties.
    this.intervaledTasks = {};

    // Initialise plugin system properties.
    this.plugins = [];
  }

  async watch() {
    await this.initialiseA2SClient();
    await this.initialiseRconClient();
    await this.initialiseFileSystemHandler();
  }

  async unwatch() {
    await this.destroyA2SClient();
    await this.destroyRconClient();
    await this.destroyFileSystemHandler();
  }

  async initialiseA2SClient() {
    this.a2s = new A2SClient(this.a2sOptions);
  }

  async destroyA2SClient() {
    this.a2s = null;
  }

  async initialiseRconClient() {
    this.rcon = new RconClient(this.rconOptions);

    this.rcon.on('CHAT_MESSAGE', (message) => this.chatQueue.push(message));

    await this.rcon.connect();
  }

  async destroyRconClient() {
    await this.rcon.disconnect();

    this.rcon = null;
  }

  async initialiseFileSystemHandler() {
    this.fileSystemHandler = new this.FileSystemHandler(this.fileSystemHandlerOptions);

    this.fileSystemHandler.on('line', (line) => this.logQueue.push(line));

    await this.fileSystemHandler.startTailingLogs();
  }

  async destroyFileSystemHandler() {
    await this.fileSystemHandler.stopTailingLogs();

    this.fileSystemHandler = null;
  }

  async handleLogLine(line) {
    logger.silly(`Processing log line: ${line}`);

    for (const logLineHandler of this.logLineHandlers) {
      // Attempt to match line against the log handler's regex.
      const match = line.match(logLineHandler.handles);

      // Ignore non matches.
      if (!match) continue;

      // Log the match.
      logger.verbose(`Processing log line matching the '${logLineHandler.name}' rule: ${line}`);

      // Handle the log line.
      await logLineHandler.handle.bind(this)(match);

      // Ignore other handles.
      break;
    }
  }

  async handleChatMessage(message) {
    logger.silly(`Processing chat message: ${message}`);

    for (const chatMessageHandler of this.chatMessageHandlers) {
      // Attempt to match message against the chat handler's regex.
      const match = message.match(chatMessageHandler.handles);

      // Ignore non matches.
      if (!match) continue;

      // Log the match.
      logger.verbose(
        `Processing chat message matching the '${chatMessageHandler.name}' rule: ${message}`
      );

      // Handle the chat message.
      await chatMessageHandler.handle.bind(this)(match);

      // Ignore other handles.
      break;
    }
  }

  initialiseIntervaledTask(name, func, interval) {
    // Stop old task under the same name.
    this.stopIntervaledTask(name);

    // Store new task info.
    this.intervaledTasks[name] = { func: func.bind(this), interval, timeout: null };
  }

  startIntervaledTask(name) {
    this.intervaledTasks[name].timeout = setTimeout(
      this.intervaledTasks[name].func,
      this.intervaledTasks[name].interval
    );
  }

  stopIntervaledTask(name) {
    clearTimeout(this.intervaledTasks[name]?.timeout);
  }

  async getObjectByCondition(store, updater, condition, mode = 1) {
    // Bind this to the updater.
    updater = updater.bind(this);

    // Mode 0 - Cache or null.
    if (mode === 0) {
      let matches = this[store].filter(condition);
      return matches.length === 1 ? matches[0] : null;
    }

    // Mode 1 - Cache, refresh or null.
    else if (mode === 1) {
      let matches = this[store].filter(condition);
      if (matches.length === 1) return matches[0];

      await updater();

      matches = this[store].filter(condition);
      return matches.length === 1 ? matches[0] : null;
    }

    // Mode 2 - Refresh or null.
    else if (mode === 2) {
      await updater();

      let matches = this[store].filter(condition);
      return matches.length === 1 ? matches[0] : null;
    }

    // If the mode is not recognised then throw an error.
    else {
      throw new Error('Invalid mode.');
    }
  }

  async getObjectsByCondition(store, updater, condition, mode = 0) {
    // Bind this to the updater.
    updater = updater.bind(this);

    // Mode 0 - Cache or null.
    if (mode === 0) {
      return this[store].filter(condition);
    }

    // Mode 2 - Refresh or null.
    else if (mode === 2) {
      await updater();

      return this[store].filter(condition);
    }

    // If the mode is not recognised then throw an error.
    else {
      throw new Error('Invalid mode.');
    }
  }

  mountPlugin(pluginInstanceToMount) {
    this.plugins.push(pluginInstanceToMount);
    pluginInstanceToMount.mount();
  }

  unmountPlugin(pluginInstanceToUnmount) {
    this.plugins = this.plugins.filter(
      (pluginInstance) => pluginInstance !== pluginInstanceToUnmount
    );
    pluginInstanceToUnmount.unmount();
  }

  emitEvent(event) {
    logger.verbose(`Server emitting event (${event.toString()}).`);
    this.plugins.forEach((pluginInstance) => pluginInstance.handleEvent(event));
  }
}
