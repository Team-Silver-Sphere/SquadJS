import EventEmitter from 'events';
import net from 'net';
import util from 'util';

import Logger from 'core/logger';

const SERVERDATA_EXECCOMMAND = 0x02;
const SERVERDATA_RESPONSE_VALUE = 0x00;
const SERVERDATA_AUTH = 0x03;
const SERVERDATA_AUTH_RESPONSE = 0x02;
const SERVERDATA_CHAT_VALUE = 0x01;

const MID_PACKET_ID = 0x01;
const END_PACKET_ID = 0x02;

export default class Rcon extends EventEmitter {
  constructor(options = {}) {
    super();

    // store config
    for (const option of ['host', 'port', 'password'])
      if (!(option in options)) throw new Error(`${option} must be specified.`);

    this.host = options.host;
    this.port = options.port;
    this.password = options.password;
    this.autoReconnectDelay = options.autoReconnectDelay || 5000;

    // bind methods
    this.connect = this.connect.bind(this); // we bind this as we call it on the auto reconnect timeout
    this.onData = this.onData.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onError = this.onError.bind(this);

    // setup socket
    this.client = new net.Socket();
    this.client.on('data', this.onData);
    this.client.on('close', this.onClose);
    this.client.on('error', this.onError);

    // constants
    this.maximumPacketSize = 4096;

    // internal variables
    this.connected = false;
    this.autoReconnect = false;
    this.autoReconnectTimeout = null;

    this.responseActionQueue = [];
    this.responsePacketQueue = [];
  }

  onData(buf) {
    Logger.verbose('RCON', 4, `Got data: ${this.bufToHexString(buf)}`);

    const packets = this.splitPackets(buf);

    for (const packet of packets) {
      Logger.verbose('RCON', 4, `Processing packet: ${this.bufToHexString(packet)}`);

      const decodedPacket = this.decodePacket(packet);
      Logger.verbose(
        'RCON',
        3,
        `Processing decoded packet: ${this.decodedPacketToString(decodedPacket)}`
      );

      if (decodedPacket.type === SERVERDATA_RESPONSE_VALUE)
        this.processResponsePacket(decodedPacket);
      else if (decodedPacket.type === SERVERDATA_AUTH_RESPONSE)
        this.processAuthPacket(decodedPacket);
      else if (decodedPacket.type === SERVERDATA_CHAT_VALUE) this.processChatPacket(decodedPacket);
      else
        Logger.verbose(
          'RCON',
          2,
          `Unknown packet type ${decodedPacket.type} in: ${this.decodedPacketToString(
            decodedPacket
          )}`
        );
    }
  }

  splitPackets(buf) {
    const packets = [];

    let offset = 0;

    while (offset < buf.byteLength) {
      const size = buf.readInt32LE(offset);

      const endOfPacket = offset + size + 4;

      // The packet following an empty pocked will appear to be 10 long, it's not.
      if (size === 10) {
        // it's 21 bytes long (or 17 when ignoring the 4 size bytes), 7 bytes longer than it should be.
        const probeEndOfPacket = endOfPacket + 7;

        // check that there is room for the packet to be longer than it claims to be
        if (probeEndOfPacket <= buf.byteLength) {
          // it is, so probe that section of the buffer
          const probeBuf = buf.slice(offset, probeEndOfPacket);

          // we decode to see it's contents
          const decodedProbePacket = this.decodePacket(probeBuf);

          // if it matches this body then it's the broken length packet
          if (decodedProbePacket.body === '\x00\x00\x00\x01\x00\x00\x00') {
            // update the offset with the new correct length, then skip this packet as we don't care about it anyway
            offset = endOfPacket + 7;
            Logger.verbose('RCON', 4, `Ignoring some data: ${this.bufToHexString(probeBuf)}`);
            continue;
          }
        }
      }

      const packet = buf.slice(offset, endOfPacket);

      packets.push(packet);

      offset = endOfPacket;
    }

    if (packets.length !== 0) {
      Logger.verbose(
        'RCON',
        4,
        `Split data into packets: ${packets.map(this.bufToHexString).join(', ')}`
      );
    }

    return packets;
  }

  decodePacket(packet) {
    return {
      size: packet.readInt32LE(0),
      id: packet.readInt32LE(4),
      type: packet.readInt32LE(8),
      body: packet.toString('utf8', 12, packet.byteLength - 2)
    };
  }

  processResponsePacket(decodedPacket) {
    if (decodedPacket.id === MID_PACKET_ID) {
      Logger.verbose(
        'RCON',
        3,
        `Pushing packet to queue: ${this.decodedPacketToString(decodedPacket)}`
      );
      this.responsePacketQueue.push(decodedPacket);
    } else if (decodedPacket.id === END_PACKET_ID) {
      Logger.verbose('RCON', 3, 'Initiating processing of packet queue.');
      this.processCompleteResponse(this.responsePacketQueue);
      this.responsePacketQueue = [];
      this.ignoreNextResponsePacket = true;
    } else {
      Logger.verbose(
        'RCON',
        1,
        `Unknown packet id ${decodedPacket.id} in: ${this.decodedPacketToString(decodedPacket)}`
      );
    }
  }

  processCompleteResponse(decodedPackets) {
    Logger.verbose(
      'RCON',
      3,
      `Processing complete decoded packet response: ${decodedPackets
        .map(this.decodedPacketToString)
        .join(', ')}`
    );

    const response = decodedPackets.map((packet) => packet.body).join();

    this.responseActionQueue.shift()(response);
  }

  processAuthPacket(decodedPacket) {
    this.responseActionQueue.shift()(decodedPacket);
  }

  processChatPacket(decodedPacket) {
    const match = decodedPacket.body.match(
      /\[(ChatAll|ChatTeam|ChatSquad|ChatAdmin)] \[SteamID:([0-9]{17})] (.+?) : (.*)/
    );

    this.emit('CHAT_MESSAGE', {
      raw: decodedPacket.body,
      chat: match[1],
      steamID: match[2],
      name: match[3],
      message: match[4],
      time: new Date()
    });
  }

  onClose(hadError) {
    this.connected = false;

    Logger.verbose('RCON', 1, `Socket closed ${hadError ? 'without' : 'with'} an error.`);

    if (this.autoReconnect) {
      Logger.verbose('RCON', 1, `Sleeping ${this.autoReconnectDelay}ms before reconnecting.`);
      setTimeout(this.connect, this.autoReconnectDelay);
    }
  }

  onError(err) {
    Logger.verbose('RCON', 1, `Socket had error:`, err);
    this.emit('RCON_ERROR', err);
  }

  connect() {
    return new Promise((resolve, reject) => {
      Logger.verbose('RCON', 1, `Connecting to: ${this.host}:${this.port}`);

      const onConnect = async () => {
        this.client.removeListener('error', onError);
        this.connected = true;

        Logger.verbose('RCON', 1, `Connected to: ${this.host}:${this.port}`);

        try {
          // connected successfully, now try auth...
          await this.write(SERVERDATA_AUTH, this.password);

          // connected and authed successfully
          this.autoReconnect = true;
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      const onError = (err) => {
        this.client.removeListener('connect', onConnect);

        Logger.verbose('RCON', 1, `Failed to connect to: ${this.host}:${this.port}`, err);

        reject(err);
      };

      this.client.once('connect', onConnect);
      this.client.once('error', onError);

      this.client.connect(this.port, this.host);
    });
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      Logger.verbose('RCON', 1, `Disconnecting from: ${this.host}:${this.port}`);

      const onClose = () => {
        this.client.removeListener('error', onError);

        Logger.verbose('RCON', 1, `Disconnected from: ${this.host}:${this.port}`);

        resolve();
      };

      const onError = (err) => {
        this.client.removeListener('close', onClose);

        Logger.verbose('RCON', 1, `Failed to disconnect from: ${this.host}:${this.port}`, err);

        reject(err);
      };

      this.client.once('close', onClose);
      this.client.once('error', onError);

      // prevent any auto reconnection happening
      this.autoReconnect = false;
      // clear the timeout just in case the socket closed and then we DCed
      clearTimeout(this.autoReconnectTimeout);

      this.client.end();
    });
  }

  execute(command) {
    return this.write(SERVERDATA_EXECCOMMAND, command);
  }

  write(type, body) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected.'));
        return;
      }

      if (!this.client.writable) {
        reject(new Error('Unable to write to socket.'));
        return;
      }

      Logger.verbose('RCON', 2, `Writing packet with type "${type}" and body "${body}".`);

      const encodedPacket = this.encodePacket(
        type,
        type === SERVERDATA_AUTH ? END_PACKET_ID : MID_PACKET_ID,
        body
      );
      const encodedEmptyPacket = this.encodePacket(type, END_PACKET_ID, '');

      if (this.maximumPacketSize < encodedPacket.length) {
        reject(new Error('Packet too long.'));
        return;
      }

      let onResponse;
      if (type === SERVERDATA_AUTH) {
        onResponse = (decodedPacket) => {
          this.client.removeListener('error', onError);
          if (decodedPacket.id === -1) {
            Logger.verbose('RCON', 1, 'Authentication failed.');
            reject(new Error('Authentication failed.'));
          } else {
            Logger.verbose('RCON', 1, 'Authentication succeeded.');
            resolve();
          }
        };
      } else {
        onResponse = (response) => {
          this.client.removeListener('error', onError);

          Logger.verbose(
            'RCON',
            2,
            `Processing complete response: ${response.replace(/\r\n|\r|\n/g, '\\n')}`
          );

          resolve(response);
        };
      }

      const onError = (err) => {
        Logger.verbose('RCON', 1, 'Error occurred. Wiping response action queue.', err);
        this.responseActionQueue = [];
        reject(err);
      };

      // the auth packet also sends a normal response, so we add an extra empty action to ignore it
      if (type === SERVERDATA_AUTH) this.responseActionQueue.push(() => {});

      this.responseActionQueue.push(onResponse);

      this.client.once('error', onError);

      Logger.verbose('RCON', 4, `Sending packet: ${this.bufToHexString(encodedPacket)}`);
      this.client.write(encodedPacket);

      if (type !== SERVERDATA_AUTH) {
        Logger.verbose(
          'RCON',
          4,
          `Sending empty packet: ${this.bufToHexString(encodedEmptyPacket)}`
        );
        this.client.write(encodedEmptyPacket);
      }
    });
  }

  encodePacket(type, id, body, encoding = 'utf8') {
    const size = Buffer.byteLength(body) + 14;
    const buf = Buffer.alloc(size);

    buf.writeInt32LE(size - 4, 0);
    buf.writeInt32LE(id, 4);
    buf.writeInt32LE(type, 8);
    buf.write(body, 12, size - 2, encoding);
    buf.writeInt16LE(0, size - 2);

    return buf;
  }

  bufToHexString(buf) {
    return buf.toString('hex').match(/../g).join(' ');
  }

  decodedPacketToString(decodedPacket) {
    return util.inspect(decodedPacket, { breakLength: Infinity });
  }

  async warn(steamID, message) {
    await this.execute(`AdminWarn "${steamID}" ${message}`);
  }

  async kick(steamID, reason) {
    await this.execute(`AdminKick "${steamID}" ${reason}`);
  }

  async switchTeam(steamID) {
    await this.execute(`AdminForceTeamChange "${steamID}"`);
  }
}
