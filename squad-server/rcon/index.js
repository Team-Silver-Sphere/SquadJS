import EventEmitter from 'events';
import net from 'net';

import { RCON_ERROR, RCON_CHAT_MESSAGE } from '../events/rcon.js';

import RCONProtocol from './protocol.js';

export default class Index extends EventEmitter {
  constructor(options = {}) {
    super();

    this.host = options.host;
    this.port = options.port;
    this.password = options.password;

    this.maximumPacketSize = options.maximumPacketSize || 4096;
    this.timeout = options.timeout || 1000;

    this.client = null;
    this.connected = false;
    this.authenticated = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.client = new net.Socket();

      const onConnect = () => {
        this.client.removeListener('error', onError);
        this.connected = true;
        resolve();
      };

      const onError = err => {
        this.client.removeListener('connect', onConnect);
        reject(err);
      };

      this.client.once('connect', onConnect);
      this.client.once('error', onError);

      this.client.setTimeout(this.timeout);

      // run action
      this.client.connect(this.port, this.host);
    });
  }

  write(type, id, body) {
    return new Promise((resolve, reject) => {
      const onData = packet => {
        const decodedPacket = this.decodePacket(packet);

        if (
          type === RCONProtocol.SERVERDATA_AUTH &&
          decodedPacket.type !== RCONProtocol.SERVERDATA_AUTH_RESPONSE
        )
          return;

        this.client.removeListener('data', onData);
        this.client.removeListener('error', onError);

        resolve(decodedPacket);
      };

      const onError = err => {
        this.client.removeListener('data', onData);
        reject(err);
      };

      this.client.on('data', onData);
      this.client.once('error', onError);

      const encodedPacket = this.encodePacket(type, id, body);

      if (
        this.maximumPacketSize > 0 &&
        encodedPacket.length > this.maximumPacketSize
      )
        reject(new Error('Packet too long'));

      this.client.write(encodedPacket);
    });
  }

  encodePacket(type, id, body, encoding = 'utf8') {
    const size = Buffer.byteLength(body) + 14;
    const buffer = Buffer.alloc(size);

    buffer.writeInt32LE(size - 4, 0);
    buffer.writeInt32LE(id, 4);
    buffer.writeInt32LE(type, 8);
    buffer.write(body, 12, size - 2, encoding);
    buffer.writeInt16LE(0, size - 2);

    return buffer;
  }

  decodePacket(buf, encoding = 'utf8') {
    return {
      size: buf.readInt32LE(0),
      id: buf.readInt32LE(4),
      type: buf.readInt32LE(8),
      body: buf.toString(encoding, 12, buf.byteLength - 2)
    };
  }

  async authenticate() {
    return new Promise((resolve, reject) => {
      if (!this.connected) reject(new Error('Not connected'));
      if (this.authenticated) reject(new Error('Already authenticated'));

      this.write(
        RCONProtocol.SERVERDATA_AUTH,
        RCONProtocol.ID_AUTH,
        this.password
      )
        .then(data => {
          if (data.id === RCONProtocol.ID_AUTH) {
            this.authenticated = true;
            this.bindListeners();
            resolve();
          } else {
            this.disconnect();
            reject(new Error('Unable to authenticate.'));
          }
        })
        .catch(reject);
    });
  }

  bindListeners() {
    this.client.on('data', packet => {
      const decodedPacket = this.decodePacket(packet);
      if (decodedPacket.type !== RCONProtocol.SERVERDATA_CHAT_VALUE) return;

      const message = decodedPacket.body.match(
        /\[(ChatAll|ChatTeam|ChatSquad|ChatAdmin)] \[SteamID:([0-9]{17})] (.+?) : (.*)/
      );

      this.emit(RCON_CHAT_MESSAGE, {
        raw: decodedPacket.body,
        chat: message[1],
        steamID: message[2],
        player: message[3],
        message: message[4],
        time: new Date()
      });
    });

    this.client.on('error', err => {
      this.emit(RCON_ERROR, err);
    });
  }

  async watch() {
    await this.connect();
    await this.authenticate();
  }

  async unwatch() {
    await this.disconnect();
  }

  async execute(command) {
    return new Promise((resolve, reject) => {
      if (!this.client.writable) reject(new Error('Unable to write to socket'));
      if (!this.connected) reject(new Error('Not connected'));
      if (!this.authenticated) reject(new Error('Not authenticated'));

      this.write(
        RCONProtocol.SERVERDATA_EXECCOMMAND,
        RCONProtocol.ID_REQUEST,
        command
      )
        .then(data => {
          resolve(data.body);
        })
        .catch(reject);
    });
  }

  async disconnect() {
    return new Promise((resolve, reject) => {
      const onClose = () => {
        this.client.removeListener('error', onError);
        resolve();
      };

      const onError = err => {
        this.client.removeListener('close', onClose);
        reject(err);
      };

      this.client.once('close', onClose);
      this.client.once('error', onError);

      this.client.destroy();
    });
  }
}
