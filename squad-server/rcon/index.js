import EventEmitter from 'events';

import SocketHandler from './socket-handler.js';
import RCONProtocol from './protocol.js';

import { RCON_CHAT_MESSAGE, RCON_ERROR } from '../events/rcon.js';

export default class Rcon extends EventEmitter {
  constructor(options = {}) {
    super();

    this.password = options.password;

    this.socketHandler = new SocketHandler(options);
    this.socketHandler.on(RCON_CHAT_MESSAGE, info =>
      this.emit(RCON_CHAT_MESSAGE, info)
    );
    this.socketHandler.on(RCON_ERROR, err => this.emit(RCON_ERROR, err));

    this.authenticated = false;
  }

  async connect() {
    return this.socketHandler.connect();
  }

  async disconnect() {
    return this.socketHandler.disconnect();
  }

  async execute(command) {
    if (!this.authenticated) throw new Error('Not authenticated');
    return this.socketHandler.write(
      RCONProtocol.SERVERDATA_EXECCOMMAND,
      command
    );
  }

  async authenticate() {
    if (this.authenticated) throw new Error('Already authenticated');
    await this.socketHandler.write(RCONProtocol.SERVERDATA_AUTH, this.password);
    this.authenticated = true;
  }

  async watch() {
    await this.connect();
    await this.authenticate();
  }

  async unwatch() {
    await this.disconnect();
  }
}
