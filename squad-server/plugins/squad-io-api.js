import { createServer } from 'http';
import { Server } from 'socket.io';

import BasePlugin from './base-plugin.js';

export default class SquadIOAPI extends BasePlugin {
  static get description() {
    return (
      'The <code>SquadIOAPI</code> plugin allows remote access to a SquadJS instance via Socket.IO' +
      '<br />As a client example you can use this to connect to the socket.io server;' +
      `<pre><code>
      const socket = io.connect('ws://IP:PORT', {
        withCredentials: true,
        extraHeaders: {
          "squadJS-connection-panel": "extraHeaders are optional"
        },
        auth: {
          token: "MySecretPassword"
        }
      })
    </code></pre>` +
      'If you need more documentation about socket.io please go ahead and read the following;' +
      '<br />General Socket.io documentation: <a href="https://socket.io/docs/v3" target="_blank">Socket.io Docs</a>' +
      '<br />Authentication and securing your websocket: <a href="https://socket.io/docs/v3/middlewares/#Sending-credentials" target="_blank">Sending-credentials</a>'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      websocketPort: {
        required: true,
        description: 'The port for the websocket.',
        default: '',
        example: '3000'
      },
      securityToken: {
        required: true,
        description: 'Your secret token/password for connecting.',
        default: '',
        example: 'MySecretPassword'
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.httpServer = createServer();

    this.io = new Server(this.httpServer, {
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['squadJS-connection-panel'],
        credentials: true
      }
    });

    this.io.use((socket, next) => {
      if (socket.handshake.auth && socket.handshake.auth.token === this.options.securityToken) {
        next();
      } else {
        next(new Error('Invalid token.'));
      }
    });

    this.io.on('connection', (socket) => {
      this.verbose(1, 'New Connection Made.');
      this.bindListeners(socket, this.server);
      this.bindListeners(socket, this.server.rcon, 'rcon.');
    });
  }

  async mount() {
    this.httpServer.listen(this.options.websocketPort);
  }

  async unmount() {
    this.httpServer.close();
  }

  bindListeners(socket, obj, prefix = '') {
    const ignore = [
      'options',
      'constructor',
      'watch',
      'unwatch',
      'setupRCON',
      'setupLogParser',
      'getPlayerByCondition',
      'pingSquadJSAPI',
      '_events',
      '_eventsCount',
      '_maxListeners',
      'plugins',
      'rcon',
      'logParser',
      'updatePlayerListInterval',
      'updatePlayerListTimeout',
      'updateLayerInformationInterval',
      'updateLayerInformationTimeout',
      'updateA2SInformationInterval',
      'updateA2SInformationTimeout',
      'pingSquadJSAPIInterval',
      'pingSquadJSAPI',
      'pingSquadJSAPITimeout',
      'rcon.constructor',
      'rcon.processChatPacket',
      'rcon._events',
      'rcon._eventsCount',
      'rcon._maxListeners',
      'rcon.password',
      'rcon.connect',
      'rcon.onData',
      'rcon.onClose',
      'rcon.onError',
      'rcon.client',
      'rcon.autoReconnect',
      'rcon.autoReconnectTimeout',
      'rcon.incomingData',
      'rcon.incomingResponse',
      'rcon.responseCallbackQueue'
    ];
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(obj))) {
      if (ignore.includes(`${prefix}${key}`)) continue;
      this.verbose(1, `Setting method listener for ${prefix}${key}...`);
      socket.on(`${prefix}${key}`, async (...rawArgs) => {
        const args = rawArgs.slice(0, rawArgs.length - 1);
        const callback = rawArgs[rawArgs.length - 1];
        this.verbose(1, `Call to ${prefix}${key}(${args.join(', ')})`);
        const reponse = await obj[key](...args);
        callback(reponse);
      });
    }

    for (const key of Object.getOwnPropertyNames(obj)) {
      if (ignore.includes(`${prefix}${key}`)) continue;
      this.verbose(1, `Setting properties listener for ${prefix}${key}...`);
      socket.on(`${prefix}${key}`, (callback) => {
        this.verbose(1, `Call to ${prefix}${key}...`);
        const reponse = obj[key];
        callback(reponse);
      });
    }
  }
}
