import { LOG_PARSER_PLAYER_CONNECTED } from 'squad-server/events/log-parser';

export default {
  name: 'seeding-message',
  description:
    'The `seeding-message` plugin broadcasts seeding rule messages to players at regular intervals or after a new' +
    'player has connected to the server. It can also be configured to display live messages when the server goes live.',

  defaultDisabled: false,
  optionsSpec: {
    mode: {
      type: '`interval` or `onjoin`',
      required: false,
      default: 'interval',
      description: 'Display seeding messages at a set interval or after players join.'
    },
    interval: {
      type: 'Number',
      required: false,
      default: 150 * 1000,
      description: 'How frequently to display the seeding messages in seconds.'
    },
    delay: {
      type: 'Number',
      required: false,
      default: 45 * 1000,
      description: 'How long to wait after a player joins to display the announcement in seconds.'
    },
    seedingThreshold: {
      type: 'Number',
      required: false,
      default: 50,
      description: 'Number of players before the server is considered live.'
    },
    seedingMessage: {
      type: 'String',
      required: false,
      default: 'Seeding Rules Active! Fight only over the middle flags! No FOB Hunting!',
      description: 'The seeding message to display.'
    },
    liveEnabled: {
      type: 'String',
      required: false,
      default: true,
      description: 'Display a "Live" message when a certain player count is met.'
    },
    liveThreshold: {
      type: 'Number',
      required: false,
      default: 2,
      description:
        'When above the seeding threshold, but within this number "Live" messages are displayed.'
    },
    liveMessage: {
      type: 'String',
      required: false,
      default: 'Live',
      description: 'The "Live" message to display.'
    }
  },

  init: async (server, options) => {
    switch (options.mode) {
      case 'interval':
        setInterval(() => {
          const playerCount = server.players.length;

          if (playerCount === 0) return;

          if (playerCount < options.seedingThreshold) {
            server.rcon.execute(`AdminBroadcast ${options.seedingMessage}`);
            return;
          }

          if (options.liveEnabled && playerCount < options.liveThreshold) {
            server.rcon.execute(`AdminBroadcast ${options.liveMessage}`);
          }
        }, options.interval);

        break;
      case 'onjoin':
        server.on(LOG_PARSER_PLAYER_CONNECTED, () => {
          setTimeout(() => {
            const playerCount = server.players.length;

            if (playerCount === 0) return;

            if (playerCount < options.seedingThreshold) {
              server.rcon.execute(`AdminBroadcast ${options.seedingMessage}`);
              return;
            }

            if (options.liveEnabled && playerCount < options.liveThreshold) {
              server.rcon.execute(`AdminBroadcast ${options.liveMessage}`);
            }
          }, options.delay);
        });

        break;
      default:
        throw new Error('Invalid SeedingMessage mode.');
    }
  }
};
