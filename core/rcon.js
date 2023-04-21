import EventEmitter from "events";
import net from "net";
import Logger from "./logger.js";
export default class Rcon extends EventEmitter {
  constructor(options = {}) {
    super();
    for (const option of ["host", "port", "password"]) if (!(option in options)) throw new Error(`${option} must be specified.`);
    this.host = options.host;
    this.port = options.port;
    this.password = options.password;
    this.client = null;
    this.stream = new Buffer.alloc(0);
    this.type = { auth: 0x03, command: 0x02, response: 0x00, server: 0x01 };
    this.soh = { size: 7, id: 0, type: this.type.response, body: "" };
    this.connected = false;
    this.autoReconnect = false;
    this.autoReconnectDelay = options.autoReconnectDelay || 5000;
    this.connectionRetry;
    this.msgId = 20;
    this.responseString = { id: 0, body: "" };
  }
  processChatPacket(decodedPacket) {}
  async connect() {
    return new Promise((resolve, reject) => {
      if (this.client && this.connected && !this.client.destroyed) return reject(new Error("Rcon.connect() Rcon already connected."));
      this.on("server", (pkt) => this.processChatPacket(pkt)).once("auth", () => {
        Logger.verbose("RCON", 1, `Connected to: ${this.host}:${this.port}`);
        clearTimeout(this.connectionRetry);
        this.connected = true;
        resolve();
      });
      Logger.verbose("RCON", 1, `Connecting to: ${this.host}:${this.port}`);
      this.connectionRetry = setTimeout(() => this.connect(), this.autoReconnectDelay);
      this.autoReconnect = true;
      this.client = net
        .createConnection({ port: this.port, host: this.host }, () => this.#sendAuth())
        .on("data", (data) => this.#onData(data))
        .on("end", () => this.#onClose())
        .on("error", () => this.#onNetError());
    }).catch((error) => {
      Logger.verbose("RCON", 1, `Rcon.connect() ${error}`);
    });
  }
  async disconnect() {
    return new Promise((resolve, reject) => {
      Logger.verbose("RCON", 1, `Disconnecting from: ${this.host}:${this.port}`);
      clearTimeout(this.connectionRetry);
      this.removeAllListeners();
      this.autoReconnect = false;
      this.client.end();
      this.connected = false;
      resolve();
    }).catch((error) => {
      Logger.verbose("RCON", 1, `Rcon.disconnect() ${error}`);
    });
  }
  async execute(body) {
    return new Promise((resolve, reject) => {
      if (!this.connected) return reject(new Error("Rcon not connected."));
      if (!this.client.writable) return reject(new Error("Unable to write to node:net socket."));
      const string = String(body);
      const length = Buffer.from(string).length;
      if (length > 4096) Logger.verbose("RCON", 1, `Error occurred. Oversize, "${length}" > 4096.`);
      else {
        const outputData = (data) => {
          clearTimeout(timeOut);
          resolve(data);
        };
        const timedOut = () => {
          this.removeListener(listenerId, outputData);
          return reject(new Error(`Rcon response timed out`));
        };
        if (this.msgId > 80) this.msgId = 20;
        const listenerId = `response${this.msgId}`;
        const timeOut = setTimeout(timedOut, 10000);
        this.once(listenerId, outputData);
        this.#send(string, this.msgId);
        this.msgId++;
      }
    }).catch((error) => {
      Logger.verbose("RCON", 1, `Rcon.execute() ${error}`);
    });
  }
  #sendAuth() {
    Logger.verbose("RCON", 1, `Sending Token to: ${this.host}:${this.port}`);
    this.client.write(this.#encode(this.type.auth, 2147483647, this.password).toString("binary"), "binary");
  }
  #send(body, id = 99) {
    this.#write(this.type.command, id, body);
    this.#write(this.type.command, id + 2);
  }
  #write(type, id, body) {
    Logger.verbose("RCON", 2, `Writing packet with type "${type}", id "${id}" and body "${body || ""}".`);
    this.client.write(this.#encode(type, id, body).toString("binary"), "binary");
  }
  #encode(type, id, body = "") {
    const size = Buffer.byteLength(body) + 14;
    const buffer = new Buffer.alloc(size);
    buffer.writeInt32LE(size - 4, 0);
    buffer.writeInt32LE(id, 4);
    buffer.writeInt32LE(type, 8);
    buffer.write(body, 12, size - 2, "utf8");
    buffer.writeInt16LE(0, size - 2);
    return buffer;
  }
  #onData(data) {
    Logger.verbose("RCON", 4, `Got data: ${this.#bufToHexString(data)}`);
    this.stream = Buffer.concat([this.stream, data], this.stream.byteLength + data.byteLength);
    while (this.stream.byteLength >= 7) {
      const packet = this.#decode();
      if (!packet) break;
      else Logger.verbose("RCON", 3, `Processing decoded packet: Size: ${packet.size}, ID: ${packet.id}, Type: ${packet.type}, Body: ${packet.body}`);
      if (packet.type === this.type.response) this.#onResponse(packet);
      else if (packet.type === this.type.server) this.emit("server", packet);
      else if (packet.type === this.type.command) this.emit("auth");
    }
  }
  #decode() {
    if (this.stream[0] === 0 && this.stream[1] === 1 && this.stream[2] === 0 && this.stream[3] === 0 && this.stream[4] === 0 && this.stream[5] === 0 && this.stream[6] === 0) {
      this.stream = this.stream.subarray(7);
      return this.soh;
    }
    const bufSize = this.stream.readInt32LE(0);
    if (bufSize > 8192 || bufSize < 10) return this.#badPacket();
    else if (bufSize <= this.stream.byteLength - 4) {
      const bufId = this.stream.readInt32LE(4);
      const bufType = this.stream.readInt32LE(8);
      if (this.stream[bufSize + 2] !== 0 || this.stream[bufSize + 3] !== 0 || bufId < 0 || bufType < 0 || bufType > 5) return this.#badPacket();
      else {
        const response = { size: bufSize, id: bufId, type: bufType, body: this.stream.toString("utf8", 12, bufSize + 2) };
        this.stream = this.stream.subarray(bufSize + 4);
        return response;
      }
    } else return null;
  }
  #onResponse(packet) {
    if (packet.body === "") {
      this.emit(`response${this.responseString.id - 2}`, this.responseString.body);
      this.responseString.body = "";
    } else if (!packet.body.includes("")) {
      this.responseString.body = this.responseString.body += packet.body;
      this.responseString.id = packet.id;
    } else this.#badPacket();
  }
  #badPacket() {
    Logger.verbose("RCON", 1, `Bad packet, clearing: ${this.bufToHexString(this.stream)} Pending string: ${this.responseString}`);
    this.stream = Buffer.alloc(0);
    this.responseString = "";
    return null;
  }
  #onClose() {
    Logger.verbose("RCON", 1, `Socket closed.`);
    this.#cleanUp();
  }
  #onNetError(error) {
    Logger.verbose("RCON", 1, `node:net error:`, err);
    this.emit("RCON_ERROR", error);
    this.#cleanUp();
  }
  #cleanUp() {
    this.connected = false;
    this.removeAllListeners();
    clearTimeout(this.connectionRetry);
    if (this.autoReconnect) {
      Logger.verbose("RCON", 1, `Sleeping ${this.autoReconnectDelay}ms before reconnecting.`);
      this.connectionRetry = setTimeout(() => this.connect(), this.autoReconnectDelay);
    }
  }
  #bufToHexString(buf) {
    return buf.toString("hex").match(/../g).join(" ");
  }
  async warn(steamID, message) {
    this.execute(`AdminWarn "${steamID}" ${message}`);
  }
  async kick(steamID, reason) {
    this.execute(`AdminKick "${steamID}" ${reason}`);
  }
  async forceTeamChange(steamID) {
    this.execute(`AdminForceTeamChange "${steamID}"`);
  }
}
