import { createServer } from 'http';
import { Server } from 'socket.io';

import BasePlugin from './base-plugin.js';

const eventsToBroadcast = [
  'CHAT_MESSAGE',
  'POSSESSED_ADMIN_CAMERA',
  'UNPOSSESSED_ADMIN_CAMERA',
  'RCON_ERROR',
  'ADMIN_BROADCAST',
  'DEPLOYABLE_DAMAGED',
  'NEW_GAME',
  'PLAYER_CONNECTED',
  'PLAYER_DISCONNECTED',
  'PLAYER_DAMAGED',
  'PLAYER_WOUNDED',
  'PLAYER_DIED',
  'PLAYER_REVIVED',
  'TEAMKILL',
  'PLAYER_POSSESS',
  'PLAYER_UNPOSSESS',
  'TICK_RATE',
  'PLAYER_TEAM_CHANGE',
  'PLAYER_SQUAD_CHANGE',
  'UPDATED_PLAYER_INFORMATION',
  'UPDATED_LAYER_INFORMATION',
  'UPDATED_A2S_INFORMATION',
  'PLAYER_AUTO_KICKED',
  'PLAYER_WARNED',
  'PLAYER_KICKED',
  'PLAYER_BANNED',
  'SQUAD_CREATED'
];

export default class SocketIOAPI extends BasePlugin {
  static get description() {
    return (
      'The <code>SocketIOAPI</code> plugin allows remote access to a SquadJS instance via Socket.IO' +
      '<br />As a client example you can use this to connect to the socket.io server;' +
      `<pre><code>
      const socket = io.connect('ws://IP:PORT', {
        auth: {
          token: "MySecretPassword"
        }
      })
    </code></pre>` +
      'If you need more documentation about socket.io please go ahead and read the following;' +
      '<br />General Socket.io documentation: <a href="https://socket.io/docs/v3" target="_blank">Socket.io Docs</a>' +
      '<br />Authentication and securing your websocket: <a href="https://socket.io/docs/v3/middlewares/#Sending-credentials" target="_blank">Sending-credentials</a>' +
      '<br />How to use, install and configure a socketIO-client: <a href="https://github.com/11TStudio/SocketIO-Examples-for-SquadJS" target="_blank">Usage Guide with Examples</a>'
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
        methods: ['GET', 'POST']
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
      // Events to broadcast
      for (const eventToBroadcast of eventsToBroadcast) {
        this.server.on(eventToBroadcast, (...args) => {
          socket.emit(eventToBroadcast, ...args);
        });
      }
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
