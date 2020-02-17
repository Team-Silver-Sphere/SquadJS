import net from 'net';

import RCONProtocol from './protocol.js';

import { RCON_CHAT_MESSAGE, RCON_ERROR } from '../events/rcon.js';

export default class Rcon {
  constructor(server) {
    this.server = server;

    this.maximumPacketSize = 4096;

    this.client = null;
    this.connected = false;
    this.autoReconnect = true;

    this.authenticated = false;

    this.requestQueue = [];
    this.currentMultiPacket = [];
    this.ignoreNextEndPacket = false;
  }

  async watch() {
    await this.connect();
    await this.authenticate();
  }

  async unwatch() {
    await this.disconnect();
  }

  async execute(command) {
    if (!this.authenticated) throw new Error('Not authenticated');
    return this.write(RCONProtocol.SERVERDATA_EXECCOMMAND, command);
  }

  async authenticate() {
    if (this.authenticated) throw new Error('Already authenticated');
    return this.write(RCONProtocol.SERVERDATA_AUTH, this.server.rconPassword);
  }

  write(type, body) {
    return new Promise((resolve, reject) => {
      if (!this.client.writable) reject(new Error('Unable to write to socket'));
      if (!this.connected) reject(new Error('Not connected'));

      const handleAuthMultiPacket = () => {
        this.client.removeListener('error', reject);

        for (const packet of this.currentMultiPacket) {
          if (packet.type === RCONProtocol.SERVERDATA_RESPONSE_VALUE) continue;
          if (packet.id !== RCONProtocol.ID_MID)
            reject(new Error('Unable to authenticate.'));

          this.authenticated = true;
          this.currentMultiPacket = [];

          resolve();
        }
      };

      const handleMultiPacket = () => {
        this.client.removeListener('error', reject);

        let response = '';
        for (const packet of this.currentMultiPacket) {
          response += packet.body;
        }

        this.currentMultiPacket = [];

        resolve(response);
      };

      if (type === RCONProtocol.SERVERDATA_AUTH)
        this.requestQueue.push(handleAuthMultiPacket);
      else this.requestQueue.push(handleMultiPacket);

      this.client.on('error', reject);

      // prepare packets to send
      const encodedPacket = this.encodePacket(type, RCONProtocol.ID_MID, body);
      const encodedEmptyPacket = this.encodePacket(
        RCONProtocol.SERVERDATA_EXECCOMMAND,
        RCONProtocol.ID_END,
        ''
      );

      if (
        this.maximumPacketSize > 0 &&
        encodedPacket.length > this.maximumPacketSize
      )
        reject(new Error('Packet too long'));

      // send packets
      this.client.write(encodedPacket);
      this.client.write(encodedEmptyPacket);
    });
  }

  onData(inputBuf) {
    let offset = 0;

    while (offset < inputBuf.byteLength) {
      const endOfPacket = offset + inputBuf.readInt32LE(offset) + 4;
      const packetBuf = inputBuf.slice(offset, endOfPacket);
      offset = endOfPacket;

      const decodedPacket = this.decodePacket(packetBuf);

      if (decodedPacket.type === RCONProtocol.SERVERDATA_CHAT_VALUE) {
        // emit chat messages to own event
        const message = decodedPacket.body.match(
          /\[(ChatAll|ChatTeam|ChatSquad|ChatAdmin)] \[SteamID:([0-9]{17})] (.+?) : (.*)/
        );

        this.server.emit(RCON_CHAT_MESSAGE, {
          raw: decodedPacket.body,
          chat: message[1],
          steamID: message[2],
          player: message[3],
          message: message[4],
          time: new Date()
        });
      } else if (decodedPacket.id === RCONProtocol.ID_END) {
        if (this.ignoreNextEndPacket) {
          this.ignoreNextEndPacket = false;
          // boost the offset as the length seems wrong for this response
          offset += 7;
          continue;
        }
        this.ignoreNextEndPacket = true;

        // at end of multipacket resolve request queue
        const func = this.requestQueue.shift();
        func();
      } else {
        // push packet to multipacket queue
        this.currentMultiPacket.push(decodedPacket);
      }
    }
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

  decodePacket(buf) {
    return {
      size: buf.readInt32LE(0),
      id: buf.readInt32LE(4),
      type: buf.readInt32LE(8),
      body: buf.toString('utf8', 12, buf.byteLength - 2)
    };
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.autoReconnect = true;

      // setup socket
      this.client = new net.Socket();

      this.client.on('data', this.onData.bind(this));
      this.client.on('error', err => this.server.emit(RCON_ERROR, err));
      this.client.on('close', async hadError => {
        this.connected = false;
        this.authenticated = false;

        const reconnectInterval = setInterval(async () => {
          if (!this.autoReconnect) return;
          try {
            await this.connect();
            await this.authenticate();
            clearInterval(reconnectInterval);
          } catch (err) {}
        }, this.server.rconAutoReconnectInterval);
      });

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

      // run action
      this.client.connect(this.server.rconPort, this.server.host);
    });
  }

  async disconnect() {
    return new Promise((resolve, reject) => {
      this.autoReconnect = false;

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
