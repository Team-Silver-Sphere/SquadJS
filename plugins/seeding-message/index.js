import { PLAYER_CONNECTED } from 'squad-server/events';

export default {
  name: 'seeding-message',
  description:
    'The <code>seeding-message</code> plugin broadcasts seeding rule messages to players at regular intervals or ' +
    'after a new player has connected to the server. It can also be configured to display live messages when the ' +
    'server goes live.',

  defaultEnabled: true,
  optionsSpec: {
    mode: {
      required: false,
      description:
        'Display seeding messages at a set interval or after players join. Either <code>interval</code> or <code>onjoin</code>.',
      default: 'interval'
    },
    interval: {
      required: false,
      description: 'How frequently to display the seeding messages in seconds.',
      default: 150 * 1000
    },
    delay: {
      required: false,
      description: 'How long to wait after a player joins to display the announcement in seconds.',
      default: 45 * 1000
    },
    seedingThreshold: {
      required: false,
      description: 'Number of players before the server is considered live.',
      default: 50
    },
    seedingMessage: {
      required: false,
      description: 'The seeding message to display.',
      default: 'Seeding Rules Active! Fight only over the middle flags! No FOB Hunting!'
    },
    liveEnabled: {
      required: false,
      description: 'Display a "Live" message when a certain player count is met.',
      default: true
    },
    liveThreshold: {
      required: false,
      description:
        'When above the seeding threshold, but within this number "Live" messages are displayed.',
      default: 2
    },
    liveMessage: {
      required: false,
      description: 'The "Live" message to display.',
      default: 'Live'
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
        server.on(PLAYER_CONNECTED, () => {
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
