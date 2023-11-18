import { EventEmitter } from "node:events";
import net from "node:net";
import Logger from "./logger.js";
import fs from 'fs';
import path from 'path';
const RCON_LOG_FILEPATH = "RCON_RECEIVED_MESSAGES.log"
export default class Rcon extends EventEmitter {
  constructor(options = {}) {
    super();
    for (const option of [ "host", "port", "password" ]) if (!(option in options)) throw new Error(`${option} must be specified.`);
    this.host = options.host;
    this.port = options.port;
    this.password = options.password;
    this.client = null;
    this.stream = new Buffer.alloc(0);
    this.type = { auth: 0x03, command: 0x02, response: 0x00, server: 0x01 };
    this.soh = { size: 7, id: 0, type: this.type.response, body: "" };
    this.responseString = { id: 0, body: "" };
    this.connected = false;
    this.autoReconnect = false;
    this.autoReconnectDelay = options.autoReconnectDelay || 1000;
    this.connectionRetry;
    this.msgIdLow = 6;
    this.msgIdHigh = 16;
    this.specialId = 19;
    this.msgId = this.msgIdLow;
    this.passThrough = options.passThrough ? true : false;
    this.passThroughPort = options.passThroughPort || 8124;
    this.passThroughTimeOut = options.passThroughTimeOut || 60000;
    this.passThroughMaxClients = 1; //options.passThroughMaxClients || 10;
    this.passThroughChallenge = options.passThroughChallenge || options.password;
    this.dumpRconResponsesToFile = options.dumpRconResponsesToFile || false;
    this.rconClients = {};
    for (let i = 1; i <= this.passThroughMaxClients; i++) this.rconClients[ `${i}` ] = null;
    this.ptServer = null;

    this.steamIndex = { "76561198799344716": "00026e21ce3d43c792613bdbb6dec1ba" }; // example dtata
    this.eosIndex = { "00026e21ce3d43c792613bdbb6dec1ba": "76561198799344716" }; // example dtata

    this.rotateLogFile(RCON_LOG_FILEPATH)

  }
  processChatPacket(decodedPacket) {
    console.log(decodedPacket.body);
  } //
  async connect() {
    return new Promise((resolve, reject) => {
      if (this.client && this.connected && !this.client.destroyed) return reject(new Error("Rcon.connect() Rcon already connected."));
      this.removeAllListeners("server");
      this.removeAllListeners("auth");
      this.on("server", (pkt) => this.processChatPacket(pkt));
      this.once("auth", () => {
        Logger.verbose("RCON", 1, `Connected to: ${this.host}:${this.port}`);
        clearTimeout(this.connectionRetry);
        this.connected = true;
        if (this.passThrough) this.createServer();
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
      this.removeAllListeners("server");
      this.removeAllListeners("auth");
      this.autoReconnect = false;
      this.client.end();
      this.connected = false;
      this.closeServer();
      resolve();
    }).catch((error) => {
      Logger.verbose("RCON", 1, `Rcon.disconnect() ${error}`);
    });
  }
  async execute(body) {
    let steamID = body.match(/\d{17}/);
    if (steamID) {
      steamID = steamID[ 0 ]
      body = body.replace(/\d{17}/, this.steamIndex[ steamID ]);
    }

    return new Promise((resolve, reject) => {
      if (!this.connected) return reject(new Error("Rcon not connected."));
      if (!this.client.writable) return reject(new Error("Unable to write to node:net socket"));
      const string = String(body);
      const length = Buffer.from(string).length;
      if (length > 4154) Logger.verbose("RCON", 1, `Error occurred. Oversize, "${length}" > 4154`);
      else {
        const outputData = (data) => {
          clearTimeout(timeOut);
          resolve(data);
        };
        const timedOut = () => {
          console.warn("MISSED", listenerId)
          this.removeListener(listenerId, outputData);
          return reject(new Error(`Rcon response timed out`));
        };
        if (this.msgId > this.msgIdHigh - 2) this.msgId = this.msgIdLow;
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
    this.client.write(this.#encode(this.type.auth, 0, this.password).toString("binary"), "binary");//2147483647
  }
  #send(body, id = 99) {
    this.#write(this.type.command, id, body);
    this.#write(this.type.command, id + 2);
  }
  #write(type, id, body) {
    Logger.verbose("RCON", 2, `Writing packet with type "${type}", id "${id}" and body "${body || ""}"`);
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
    this.stream = Buffer.concat([ this.stream, data ], this.stream.byteLength + data.byteLength);
    while (this.stream.byteLength >= 7) {
      const packet = this.#decode();
      if (!packet) break;
      else Logger.verbose("RCON", 3, `Processing decoded packet: Size: ${packet.size}, ID: ${packet.id}, Type: ${packet.type}, Body: ${packet.body}`);
      this.appendToFile(RCON_LOG_FILEPATH, packet.body)

      if (packet.id > this.msgIdHigh) this.emit(`responseForward_1`, packet);
      else if (packet.type === this.type.response) this.#onResponse(packet);
      else if (packet.type === this.type.server) this.#onServer(packet);
      else if (packet.type === this.type.command) this.emit("auth");
    }
  }
  #onServer(packet) {
    this.emit("server", packet);
    for (const client in this.rconClients)
      if (this.rconClients[ client ]) {
        this.emit(`serverForward_${this.rconClients[ client ].rconIdClient}`, packet.body);
      }
  }
  #decode() {
    if (this.stream[ 0 ] === 0 && this.stream[ 1 ] === 1 && this.stream[ 2 ] === 0 && this.stream[ 3 ] === 0 && this.stream[ 4 ] === 0 && this.stream[ 5 ] === 0 && this.stream[ 6 ] === 0) {
      this.stream = this.stream.subarray(7);
      return this.soh;
    }
    const bufSize = this.stream.readInt32LE(0);
    if (bufSize > 4154 || bufSize < 10) return this.#badPacket();
    else if (bufSize <= this.stream.byteLength - 4 && this.stream.byteLength >= 12) {
      const bufId = this.stream.readInt32LE(4);
      const bufType = this.stream.readInt32LE(8);
      if (this.stream[ bufSize + 2 ] !== 0 || this.stream[ bufSize + 3 ] !== 0 || bufId < 0 || bufType < 0 || bufType > 5) return this.#badPacket();
      else {
        const response = { size: bufSize, id: bufId, type: bufType, body: this.stream.toString("utf8", 12, bufSize + 2) };
        this.stream = this.stream.subarray(bufSize + 4);
        if (response.body === "" && this.stream[ 0 ] === 0 && this.stream[ 1 ] === 1 && this.stream[ 2 ] === 0 && this.stream[ 3 ] === 0 && this.stream[ 4 ] === 0 && this.stream[ 5 ] === 0 && this.stream[ 6 ] === 0) {
          this.stream = this.stream.subarray(7);
          response.body = "";
        }
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
    Logger.verbose("RCON", 1, `Socket closed`);
    this.#cleanUp();
  }
  #onNetError(error) {
    Logger.verbose("RCON", 1, `node:net error:`, error);
    this.emit("RCON_ERROR", error);
    this.#cleanUp();
  }
  #cleanUp() {
    this.closeServer();
    this.connected = false;
    this.removeAllListeners();
    clearTimeout(this.connectionRetry);
    if (this.autoReconnect) {
      Logger.verbose("RCON", 1, `Sleeping ${this.autoReconnectDelay}ms before reconnecting`);
      this.connectionRetry = setTimeout(() => this.connect(), this.autoReconnectDelay);
    }
  }
  createServer() {
    this.ptServer = net.createServer((client) => this.#onNewClient(client));
    this.ptServer.maxConnections = this.passThroughMaxClients;
    this.ptServer.on("error", (error) => this.#onSerErr(error));
    this.ptServer.on("drop", () => Logger.verbose("RCON", 1, `Pass-through Server: Max Clients Reached (${this.passThroughMaxClients}) rejecting new connection`));
    this.ptServer.listen(this.passThroughPort, () => Logger.verbose("RCON", 1, `Pass-through Server: Listening on port ${this.passThroughPort}`));
  }
  closeServer() {
    for (const client in this.rconClients) if (this.rconClients[ client ]) this.rconClients[ client ].end();
    if (!this.ptServer) return;
    this.ptServer.close(() => this.#onServerClose());
  }
  #onServerClose() {
    if (!this.ptServer) return;
    this.ptServer.removeAllListeners();
    this.ptServer = null;
    Logger.verbose("RCON", 1, `Pass-through Server: Closed`);
  }
  #onNewClient(client) {
    client.setTimeout(this.passThroughTimeOut);
    client.on("end", () => this.#onClientEnd(client));
    client.on("error", () => this.#onClientEnd(client));
    client.on("timeout", () => this.#onClientTimeOut(client));
    client.on("data", (data) => this.#onClientData(client, data));
    Logger.verbose("RCON", 1, `Pass-through Server: Client connecting`);
  }
  #onSerErr(error) {
    this.closeServer();
    Logger.verbose("RCON", 1, `Pass-through Server: ${error}`);
  }
  #onClientEnd(client) {
    if (!client.rconIdClient) return;
    this.removeAllListeners(`serverForward_${client.rconIdClient}`);
    this.removeAllListeners(`responseForward_${client.rconIdClient}`);
    this.rconClients[ `${client.rconIdClient}` ] = null;
    Logger.verbose("RCON", 1, `Pass-through Server: Client-${client.rconIdClient} Disconnected`);
  }
  #onClientTimeOut(client) {
    client.end();
    Logger.verbose("RCON", 1, `Pass-through Server: Client-${client.rconIdClient} Timed Out`);
  }
  #onClientData(client, data) {
    if (!client.rconStream) client.rconStream = new Buffer.alloc(0);
    client.rconStream = Buffer.concat([ client.rconStream, data ], client.rconStream.byteLength + data.byteLength);
    while (client.rconStream.byteLength >= 4) {
      const packet = this.#decodeClient(client);
      if (!packet) break;
      if (!client.rconHasAuthed) this.#authClient(client, packet);
      else {

        if (!client.rconWheel || client.rconWheel > 20) client.rconWheel = 0;
        else client.rconWheel++;

        client.rconIdQueueNEW[ `${client.rconWheel}` ] = packet.id

        const encoded = this.#encode(packet.type, this.specialId + client.rconWheel, this.#steamToEosClient(packet.body)); ////////////////////////////////////////////////
        this.client.write(encoded.toString("binary"), "binary");
        // this.client.write(this.#encode(packet.type, this.specialId * client.rconIdClient).toString("binary"), "binary")
      }
    }
  }
  #decodeClient(client) {
    const bufSize = client.rconStream.readInt32LE(0);
    if (bufSize <= client.rconStream.byteLength - 4) {
      const response = {
        size: bufSize,
        id: client.rconStream.readInt32LE(4),
        type: client.rconStream.readInt32LE(8),
        body: client.rconStream.toString("utf8", 12, bufSize + 2),
      };
      client.rconStream = client.rconStream.subarray(bufSize + 4);
      return response;
    } else return null;
  }
  #authClient(client, packet) {
    if (packet.body !== this.passThroughChallenge) {
      client.end();
      Logger.verbose("RCON", 1, `Pass-through Server: Client [Rejected] Password not matched`);
    } else {
      client.rconHasAuthed = true;
      client.rconIdQueueNEW = {}
      for (let i = 1; i <= this.passThroughMaxClients; i++) {
        if (this.rconClients[ `${i}` ] === null) {
          client.rconIdClient = i;
          this.rconClients[ `${i}` ] = client;
          break;
        }
      }
      this.on(`serverForward_${client.rconIdClient}`, (body) => client.write(this.#encode(1, 0, this.#eosToSteam(body)).toString("binary"), "binary"));
      this.on(`responseForward_${client.rconIdClient}`, (packet) => this.#onForward(client, packet));
      client.write(this.#encode(0, packet.id));
      client.write(this.#encode(2, packet.id));
      Logger.verbose("RCON", 1, `Pass-through Server: Client-${client.rconIdClient} Connected`);
    }
  }
  #onForward(client, packet) {
    if (packet.body !== "" && packet.body !== "") {

      const int = packet.id - this.specialId

      //console.log(client.rconIdQueueNEW);//////////////////////////////////////////////////////////////////////////////////////////

      client.write(this.#encode(packet.type, client.rconIdQueueNEW[ int ], this.#eosToSteam(packet.body)).toString("binary"), "binary");
    } else if (packet.body != "") {
      const int = packet.id - this.specialId
      client.write(this.#encode(0, client.rconIdQueueNEW[ int ]).toString("binary"), "binary");
      client.write(this.#encodeSpecial(client.rconIdQueueNEW[ int ]).toString("binary"), "binary");
    }
  }
  #encodeSpecial(id) {
    const buffer = new Buffer.alloc(21);
    buffer.writeInt32LE(10, 0);
    buffer.writeInt32LE(id, 4);
    buffer.writeInt32LE(0, 8);
    buffer.writeInt32LE(1, 15);
    return buffer;
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

  addIds(steamId, eosId) {
    this.steamIndex[ steamId ] = eosId; // { "76561198799344716": "00026e21ce3d43c792613bdbb6dec1ba" };
    this.eosIndex[ eosId ] = steamId;
  }

  removeIds(eosId) {
    // clean up ids on leave
  }

  #steamToEosClient(body) {
    //assume client does not send more than 1 steamId per msg
    const m = body.match(/[0-9]{17}/);
    if (m && m[ 1 ] in this.steamIndex) return body.replaceAll(`${m[ 0 ]}`, this.steamIndex[ m[ 0 ] ]);
    return body;
  }

  #eosToSteam(body) {
    //split body to lines for matching (1 steamId per line)
    const lines = body.split("\n");
    const nBody = [];
    for (let line of lines) nBody.push(this.#matchRcon(line));
    return nBody.join("\n");
  }

  #matchRcon(line) {
    console.warn(line);
    for (const r of this.defs) {
      const match = line.match(r.regex);
      if (match && match.groups.eosId in this.eosIndex) return r.rep(line, this.eosIndex[ match.groups.eosId ], match.groups.eosId);
    }
    return line;
  }

  appendToFile(filePath, content) {
    if (!this.dumpRconResponsesToFile) return;
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.appendFile(filePath, content + "\n", (err) => {
      if (err) throw err;
    });
  }
  rotateLogFile(logFile) {
    if (!this.dumpRconResponsesToFile) return;
    if (fs.existsSync(logFile)) {
      const ext = path.extname(logFile);
      const base = path.basename(logFile, ext);
      const dir = path.dirname(logFile);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newFile = path.join(dir, `${base}_${timestamp}${ext}`);

      fs.renameSync(logFile, newFile);
    }
  }

  defs = [
    //strict matching to avoid 'name as steamId errors'
    {
      regex: /^ID: [0-9]+ \| SteamID: (?<eosId>[0-9a-f]{32}) \| Name: .+ \| Team ID: (1|2|N\/A) \| Squad ID: ([0-9]+|N\/A) \| Is Leader: (True|False|N\/A) \| Role: .+$/,
      rep: (line, steamId, eosId) => {
        return line.replace(` SteamID: ${eosId} `, ` SteamID: ${steamId} `);
      },
    },
    {
      regex: /^ID: (?<Id>[0-9]+) \| SteamID: (?<eosId>[0-9a-f]{32}) \| Since Disconnect: (?<SinceDc>.+) \| Name: (?<name>.+)$/,
      rep: (line, steamId, eosId) => {
        return line.replace(` SteamID: ${eosId} `, ` SteamID: ${steamId} `);
      },
    },
    {
      regex: /^ID: (?<sqdId>[0-9]+) \| Name: (?<sqdName>.+) \| Size: (?<sqdSize>[0-9]) \| Locked: (?<locked>True|False) \| Creator Name: (?<creatorName>.+) \| Creator Steam ID: (?<creatorSteamId>[0-9]{17})/,
      rep: (line, steamId, eosId) => {
        return line.replace(` Creator Steam ID: ${eosId}`, ` Creator Steam ID: ${steamId}`);
      },
    },
    {
      regex: /^Forced team change for player (?<id>[0-9]+). \[steamid=(?<eosId>[0-9a-f]{32})] (.+)/,
      rep: (line, steamId, eosId) => {
        return line.replace(` [steamid=${eosId}] `, ` [steamid=${steamId}] `);
      },
    },

    {
      regex: /^Could not find player (?<eosId>[0-9a-f]{32})/,
      rep: (line, steamId, eosId) => {
        return line.replace(`Could not find player ${eosId}`, `Could not find player ${steamId}`);
      },
    },

    {
      regex: /^\[ChatAll] \[SteamID:(?<eosId>[0-9a-f]{32})] ((?<name>.+) : (?<msg>.+))/,
      rep: (line, steamId, eosId) => {
        return line.replace(` [SteamID:${eosId}] `, ` [SteamID:${steamId}] `);
      },
    },
    {
      regex: /^\[ChatTeam] \[SteamID:(?<eosId>[0-9a-f]{32})] ((?<name>.+) : (?<msg>.+))/,
      rep: (line, steamId, eosId) => {
        return line.replace(` [SteamID:${eosId}] `, ` [SteamID:${steamId}] `);
      },
    },
    {
      regex: /^\[ChatSquad] \[SteamID:(?<eosId>[0-9a-f]{32})] ((?<name>.+) : (?<msg>.+))/,
      rep: (line, steamId, eosId) => {
        return line.replace(` [SteamID:${eosId}] `, ` [SteamID:${steamId}] `);
      },
    },
    {
      regex: /^\[ChatAdmin] \[SteamID:(?<eosId>[0-9a-f]{32})] ((?<name>.+) : (?<msg>.+))/,
      rep: (line, steamId, eosId) => {
        return line.replace(` [SteamID:${eosId}] `, ` [SteamID:${steamId}] `);
      },
    },
    {
      regex: /^(?<name>.+) \(Steam ID: (?<eosId>[0-9a-f]{32})\) has created Squad (?<squadNum>[0-9]+) \(Squad Name: (?<squadName>.+)\) on (?<teamName>.+)/,
      rep: (line, steamId, eosId) => {
        return line.replace(` (Steam ID: ${eosId}) `, ` (Steam ID: ${steamId}) `);
      },
    },
    {
      regex: /^Kicked player (?<Id>[0-9]+). \[steamid=(?<eosId>[0-9a-f]{32})] (?<name>.+)/,
      rep: (line, steamId, eosId) => {
        return line.replace(` [steamid=${eosId}] `, ` [steamid=${steamId}] `);
      },
    },

    {
      regex: /^ERROR: Unable to find player with name or id \((?<eosId>[0-9a-f]{32})\)$/,
      rep: (line, steamId, eosId) => {
        return line.replace(`name or id (${eosId})`, `name or id (${steamId})`);
      },
    },
    {
      regex: /^\[SteamID:(?<eosId>[0-9a-f]{32})] (?<name>.+) has possessed admin camera./,
      rep: (line, steamId, eosId) => {
        return line.replace(` [SteamID:${eosId}] `, ` [SteamID:${steamId}] `);
      },
    },
    {
      regex: /^\[SteamID:(?<eosId>[0-9a-f]{32})] (?<name>.+) has unpossessed admin camera./,
      rep: (line, steamId, eosId) => {
        return line.replace(` [SteamID:${eosId}] `, ` [SteamID:${steamId}] `);
      },
    },
  ];
}

//////////////////////////////////////////////////ALL BELOW IS FOR STANDALONE TESTING/RUNNING
// const Logger = {
//   level: 1,
//   verbose(type, lvl, msg, msg1 = "") {
//     if (lvl > this.level) return;
//     console.log(type, lvl, msg, msg1);
//   },
// };

// const squadJsStyle = async () => {
//   const getCurrentMap = async () => {
//     const response = await rcon.execute("ShowCurrentMap");
//     const match = response.match(/^Current level is (?<level>.+), layer is (?<layer>.+)/);
//     if (!match) {
//       debugger
//     }
//     return [match.groups.level, match.groups.layer];
//   };

//   const rcon = new Rcon({ port: "port", host: "ip", password: "password", passThrough: true, passThroughPort: "8124", passThroughTimeOut: 30000, passThroughChallenge: "password" }); //

//   try {
//     await rcon.connect();
//   } catch (e) {
//     console.warn(e);
//   }

//   rcon.interval = setInterval(async () => {

//     try {
//       const currentMap = await getCurrentMap();
//       console.log(currentMap);
//     } catch (e) {
//       console.warn(e);
//     }
//   }, 5000);
// };

// squadJsStyle();
