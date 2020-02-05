import EventEmitter from 'events';
import net from 'net';

import Protocol from './protocol.js';
import { RCON_CHAT_MESSAGE, RCON_ERROR } from '../events/rcon.js';

export default class SocketHandler extends EventEmitter {
  constructor(options = {}) {
    super();

    this.host = options.host;
    this.port = options.port;
    this.password = options.password;

    this.maximumPacketSize = options.maximumPacketSize || 4096;
    this.timeout = options.timeout || 1000;

    this.client = null;
    this.connected = false;

    this.requestQueue = [];
    this.currentMultiPacket = [];
    this.ignoreNextEndPacket = false;
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
      this.client.on('data', this.onData.bind(this));
      this.client.on('error', err => this.emit(RCON_ERROR, err));

      // run action
      this.client.connect(this.port, this.host);
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

  write(type, body) {
    return new Promise((resolve, reject) => {
      if (!this.client.writable) reject(new Error('Unable to write to socket'));
      if (!this.connected) reject(new Error('Not connected'));

      const handleAuthMultiPacket = () => {
        this.client.removeListener('error', reject);

        for (const packet of this.currentMultiPacket) {
          if (packet.type === Protocol.SERVERDATA_RESPONSE_VALUE) continue;
          if (packet.id !== Protocol.ID_MID)
            reject(new Error('Unable to authenticate.'));
          resolve();
        }
      };

      const handleMultiPacket = () => {
        this.client.removeListener('error', reject);

        let response = '';
        for (const packet of this.currentMultiPacket) {
          response += packet.body;
        }
        resolve(response);
      };

      if (type === Protocol.SERVERDATA_AUTH)
        this.requestQueue.push(handleAuthMultiPacket);
      else this.requestQueue.push(handleMultiPacket);

      this.client.on('error', reject);

      // prepare packets to send
      const encodedPacket = this.encodePacket(type, Protocol.ID_MID, body);
      const encodedEmptyPacket = this.encodePacket(
        Protocol.SERVERDATA_EXECCOMMAND,
        Protocol.ID_END,
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

  onData(inputBuf) {
    let offset = 0;

    while (offset < inputBuf.byteLength) {
      const endOfPacket = offset + inputBuf.readInt32LE(offset) + 4;
      const packetBuf = inputBuf.slice(offset, endOfPacket);
      offset = endOfPacket;

      const decodedPacket = {
        size: packetBuf.readInt32LE(0),
        id: packetBuf.readInt32LE(4),
        type: packetBuf.readInt32LE(8),
        body: packetBuf.toString('utf8', 12, packetBuf.byteLength - 2)
      };

      if (decodedPacket.type === Protocol.SERVERDATA_CHAT_VALUE) {
        // emit chat messages to own event
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
      } else if (decodedPacket.id === Protocol.ID_END) {
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
}
