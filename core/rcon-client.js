import EventEmitter from 'events';
import net from 'net';
import util from 'util';

import logger from '../utils/logger.js';

const SERVERDATA_EXECCOMMAND = 0x02;
const SERVERDATA_RESPONSE_VALUE = 0x00;
const SERVERDATA_AUTH = 0x03;
const SERVERDATA_AUTH_RESPONSE = 0x02;
const SERVERDATA_CHAT_VALUE = 0x01;

const MID_PACKET_ID = 0x01;
const END_PACKET_ID = 0x02;

export default class RconClient extends EventEmitter {
  constructor(options = {}) {
    // Initialise EventEmitter.
    super();

    // Check required options are specified.
    for (const option of ['host', 'port', 'password'])
      if (!(option in options)) throw new Error(`${option} must be specified.`);

    // Store options.
    this.host = options.host;
    this.port = options.port;
    this.password = options.password;

    // Bind methods.
    this.connect = this.connect.bind(this); // we bind this as we call it on the auto reconnect timeout
    this.onData = this.onData.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onError = this.onError.bind(this);

    // Setup socket.
    this.client = new net.Socket();
    this.client.on('data', this.onData);
    this.client.on('close', this.onClose);
    this.client.on('error', this.onError);

    // Define constants.
    this.autoReconnectDelay = 5000;
    this.maximumPacketSize = 4096;

    // Initialise internal variables.
    this.connected = false;
    this.autoReconnect = false;
    this.autoReconnectTimeout = null;

    this.incomingData = Buffer.from([]);
    this.incomingResponse = [];

    this.responseCallbackQueue = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      logger.verbose(`Connecting to: ${this.host}:${this.port}`);

      const onConnect = async () => {
        this.client.removeListener('error', onError);
        this.connected = true;

        logger.verbose(`Connected to: ${this.host}:${this.port}`);

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

        logger.verbose(`Failed to connect to: ${this.host}:${this.port}`, err);

        reject(err);
      };

      this.client.once('connect', onConnect);
      this.client.once('error', onError);

      this.client.connect(this.port, this.host);
    });
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      logger.verbose(`Disconnecting from: ${this.host}:${this.port}`);

      const onClose = () => {
        this.client.removeListener('error', onError);

        logger.verbose(`Disconnected from: ${this.host}:${this.port}`);

        resolve();
      };

      const onError = (err) => {
        this.client.removeListener('close', onClose);

        logger.verbose(`Failed to disconnect from: ${this.host}:${this.port}`, err);

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

  onData(data) {
    logger.silly(`Got data: ${this.bufToHexString(data)}`);

    // the logic in this method simply splits data sent via the data event into packets regardless of how they're
    // distributed in the event calls
    const packets = this.decodeData(data);

    for (const packet of packets) {
      logger.silly(`Processing packet: ${this.bufToHexString(packet)}`);

      const decodedPacket = this.decodePacket(packet);
      logger.silly(`Processing decoded packet: ${this.decodedPacketToString(decodedPacket)}`);

      switch (decodedPacket.type) {
        case SERVERDATA_RESPONSE_VALUE:
        case SERVERDATA_AUTH_RESPONSE:
          switch (decodedPacket.id) {
            case MID_PACKET_ID:
              this.incomingResponse.push(decodedPacket);
              break;
            case END_PACKET_ID:
              this.responseCallbackQueue.shift()(
                this.incomingResponse.map((packet) => packet.body).join()
              );
              this.incomingResponse = [];
              break;
            default:
              logger.warn(
                `Unknown packet ID ${decodedPacket.id} in: ${this.decodedPacketToString(
                  decodedPacket
                )}`
              );
          }
          break;

        case SERVERDATA_CHAT_VALUE:
          this.emit('CHAT_MESSAGE', decodedPacket.body);
          break;

        default:
          logger.warn(
            `Unknown packet type ${decodedPacket.type} in: ${this.decodedPacketToString(
              decodedPacket
            )}`
          );
      }
    }
  }

  decodeData(data) {
    this.incomingData = Buffer.concat([this.incomingData, data]);

    const packets = [];

    // we check that it's greater than 4 as if it's not then the length header is not fully present which breaks the
    // rest of the code. We just need to wait for more data.
    while (this.incomingData.byteLength >= 4) {
      const size = this.incomingData.readInt32LE(0);
      const packetSize = size + 4;

      // The packet following an empty packet will report to be 10 long (14 including the size header bytes), but in
      // it should report 17 long (21 including the size header bytes). Therefore, if the packet is 10 in size
      // and there's enough data for it to be a longer packet then we need to probe to check it's this broken packet.
      const probeSize = 17;
      const probePacketSize = 21;

      if (size === 10 && this.incomingData.byteLength >= probeSize) {
        // copy the section of the incoming data of interest
        const probeBuf = this.incomingData.slice(0, probePacketSize);
        // decode it
        const decodedProbePacket = this.decodePacket(probeBuf);
        // check whether body matches
        if (decodedProbePacket.body === '\x00\x00\x00\x01\x00\x00\x00') {
          // it does so it's the broken packet
          // remove the broken packet from the incoming data
          this.incomingData = this.incomingData.slice(probePacketSize);
          logger.silly(`Ignoring some data: ${this.bufToHexString(probeBuf)}`);
          continue;
        }
      }

      if (this.incomingData.byteLength < packetSize) {
        logger.silly(`Waiting for more data...`);
        break;
      }

      const packet = this.incomingData.slice(0, packetSize);
      packets.push(packet);

      this.incomingData = this.incomingData.slice(packetSize);
    }

    return packets;
  }

  processChatPacket(decodedPacket) {}

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

      logger.verbose(`Writing packet with type "${type}" and body "${body}".`);

      const encodedPacket = this.encodePacket(
        type,
        type !== SERVERDATA_AUTH ? MID_PACKET_ID : END_PACKET_ID,
        body
      );

      const encodedEmptyPacket = this.encodePacket(type, END_PACKET_ID, '');

      if (this.maximumPacketSize < encodedPacket.length) {
        reject(new Error('Packet too long.'));
        return;
      }

      const onError = (err) => {
        logger.error('Error occurred. Wiping response action queue.', err);
        this.responseCallbackQueue = [];
        reject(err);
      };

      // the auth packet also sends a normal response, so we add an extra empty action to ignore it
      if (type === SERVERDATA_AUTH) {
        this.responseCallbackQueue.push(() => {});
        this.responseCallbackQueue.push((decodedPacket) => {
          this.client.removeListener('error', onError);
          if (decodedPacket.id === -1) {
            logger.error('Authentication failed.');
            reject(new Error('Authentication failed.'));
          } else {
            logger.verbose('Authentication succeeded.');
            resolve();
          }
        });
      } else {
        this.responseCallbackQueue.push((response) => {
          this.client.removeListener('error', onError);
          logger.verbose(`Returning complete response: ${response.replace(/\r\n|\r|\n/g, '\\n')}`);
          resolve(response);
        });
      }

      this.client.once('error', onError);

      logger.silly(`Sending packet: ${this.bufToHexString(encodedPacket)}`);
      this.client.write(encodedPacket);

      if (type !== SERVERDATA_AUTH) {
        logger.silly(`Sending empty packet: ${this.bufToHexString(encodedEmptyPacket)}`);
        this.client.write(encodedEmptyPacket);
      }
    });
  }

  execute(command) {
    return this.write(SERVERDATA_EXECCOMMAND, command);
  }

  onClose(hadError) {
    this.connected = false;

    logger.silly(`Socket closed ${hadError ? 'without' : 'with'} an error.`);

    if (this.autoReconnect) {
      logger.silly(`Sleeping ${this.autoReconnectDelay}ms before reconnecting.`);
      setTimeout(this.connect, this.autoReconnectDelay);
    }
  }

  onError(err) {
    logger.verbose(`Socket had error:`, err);
    this.emit('RCON_ERROR', err);
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

  decodePacket(packet) {
    return {
      size: packet.readInt32LE(0),
      id: packet.readInt32LE(4),
      type: packet.readInt32LE(8),
      body: packet.toString('utf8', 12, packet.byteLength - 2)
    };
  }

  bufToHexString(buf) {
    return buf.toString('hex').match(/../g).join(' ');
  }

  decodedPacketToString(decodedPacket) {
    return util.inspect(decodedPacket, { breakLength: Infinity });
  }
}
