import EventEmitter from 'events';
import net from 'net';

import moment from 'moment';

import RCONProtocol from './protocol.js';

import { RCON_CHAT_MESSAGE, RCON_ERROR } from '../events/rcon.js';

export default class Rcon {
  constructor(options = {}, emitter) {
    if (!options.host) throw new Error('Host must be specified.');
    this.host = options.host;

    if (!options.rconPort) throw new Error('RCON port must be specified.');
    this.port = options.rconPort;

    if (!options.rconPassword)
      throw new Error('RCON password must be specified.');
    this.password = options.rconPassword;

    this.verboseEnabled = options.rconVerbose || false;

    this.emitter = emitter || new EventEmitter();

    this.reconnectInterval = null;
    this.rconAutoReconnectInterval = options.rconAutoReconnectInterval || 5000;

    this.maximumPacketSize = 4096;

    this.client = null;
    this.connected = false;
    this.autoReconnect = true;

    this.requestQueue = [];
    this.currentMultiPacket = [];
    this.ignoreNextEndPacket = false;

    this.onData = this.onData.bind(this);
  }

  /* RCON functionality */
  watch() {
    this.verbose('Method Exec: watch()');
    return this.connect();
  }

  unwatch() {
    this.verbose('Method Exec: unwatch()');
    return this.disconnect();
  }

  execute(command) {
    this.verbose(`Method Exec: execute(${command})`);
    return this.write(RCONProtocol.SERVERDATA_EXECCOMMAND, command);
  }

  async getMapInfo() {
    const response = await this.execute('ShowNextMap');
    const match = response.match(
      /^Current map is (.+), Next map is (.*)/
    );
    return {
      currentLayer: match[1],
      nextLayer: match[2].length === 0 ? null : match[2]
    };
  }

  async listPlayers() {
    const response = await this.execute('ListPlayers');

    const players = [];

    for (const line of response.split('\n')) {
      const match = line.match(
        /ID: ([0-9]+) \| SteamID: ([0-9]{17}) \| Name: (.+) \| Team ID: ([0-9]+) \| Squad ID: ([0-9]+|N\/A)/
      );
      if (!match) continue;

      players.push({
        playerID: match[1],
        steamID: match[2],
        name: match[3],
        teamID: match[4],
        squadID: match[5] !== 'N/A' ? match[5] : null
      });
    }

    return players;
  }

  /* Core socket functionality */
  connect() {
    this.verbose('Method Exec: connect()');
    return new Promise((resolve, reject) => {
      this.autoReconnect = true;

      // setup socket
      this.client = new net.Socket();

      this.client.on('data', this.onData);

      this.client.on('error', err => {
        this.verbose(`Socket Error: ${err.message}`);
        this.emitter.emit(RCON_ERROR, err);
      });

      this.client.on('close', async hadError => {
        this.verbose(`Socket Closed. AutoReconnect: ${this.autoReconnect}`);
        this.connected = false;
        this.client.removeListener('data', this.onData);
        if (!this.autoReconnect) return;
        if (this.reconnectInterval !== null) return;
        this.reconnectInterval = setInterval(async () => {
          this.verbose('Attempting AutoReconnect.');
          try {
            await this.connect();
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
            this.verbose('Cleaned AutoReconnect.');
          } catch (err) {
            this.verbose('AutoReconnect Failed.');
          }
        }, this.rconAutoReconnectInterval);
      });

      const onConnect = async () => {
        this.verbose('Socket Opened.');
        this.client.removeListener('error', onError);
        this.connected = true;
        this.verbose('Sending auth packet...');
        await this.write(RCONProtocol.SERVERDATA_AUTH, this.password);
        resolve();
      };

      const onError = err => {
        this.verbose(`Error Opening Socket: ${err.message}`);
        this.client.removeListener('connect', onConnect);
        reject(err);
      };

      this.client.once('connect', onConnect);
      this.client.once('error', onError);

      this.client.connect(this.port, this.host);
    });
  }

  async disconnect(disableAutoReconnect = true) {
    this.verbose(`Method Exec: disconnect(${disableAutoReconnect})`);
    return new Promise((resolve, reject) => {
      if (disableAutoReconnect) this.autoReconnect = false;

      const onClose = () => {
        this.verbose('Disconnect successful.');
        this.client.removeListener('error', onError);
        resolve();
      };

      const onError = err => {
        this.verbose(`Error disconnecting: ${err.message}`);
        this.client.removeListener('close', onClose);
        reject(err);
      };

      this.client.once('close', onClose);
      this.client.once('error', onError);

      this.client.end();
    });
  }

  write(type, body) {
    return new Promise((resolve, reject) => {
      if (!this.client.writable) {
        reject(new Error('Unable to write to socket'));
        return;
      }
      if (!this.connected) {
        reject(new Error('Not connected.'));
        return;
      }

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
        reject(new Error('Packet too long.'));

      // prepare to handle response.
      const handleAuthMultiPacket = async () => {
        this.client.removeListener('error', reject);

        for (const packet of this.currentMultiPacket) {
          if (packet.type === RCONProtocol.SERVERDATA_RESPONSE_VALUE) continue;
          if (packet.id !== RCONProtocol.ID_MID) {
            this.verbose('Unable to authenticate.');
            await this.disconnect(false);
            reject(new Error('Unable to authenticate.'));
          }

          this.currentMultiPacket = [];

          this.verbose('Authenticated.');
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

      this.client.once('error', reject);

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

        this.emitter.emit(RCON_CHAT_MESSAGE, {
          raw: decodedPacket.body,
          chat: message[1],
          steamID: message[2],
          player: message[3],
          message: message[4],
          time: moment.utc().toDate()
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

  verbose(msg) {
    if (this.verboseEnabled)
      console.log(`[${Date.now()}] RCON (Verbose): ${msg}`);
  }
}
