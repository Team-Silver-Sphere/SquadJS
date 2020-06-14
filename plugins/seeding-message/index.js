import { LOG_PARSER_PLAYER_CONNECTED } from 'squad-server/events/log-parser';

export default function(server, options = {}) {
  if (!server) throw new Error('SeedingMessage must be provided with a reference to the server.');

  const mode = options.mode || 'interval';
  const interval = options.interval || 150 * 1000;
  const delay = options.delay || 45 * 1000;

  const seedingThreshold = options.seedingThreshold || 50;
  const seedingMessage =
    options.seedingMessage ||
    'Seeding Rules Active! Fight only over the middle flags! No FOB Hunting!';

  const liveEnabled = options.liveEnabled || true;
  const liveThreshold = seedingThreshold + (options.liveThreshold || 2);
  const liveMessage = options.liveMessage || 'Live!';

  switch (mode) {
    case 'interval':
      setInterval(() => {
        const playerCount = server.players.length;

        if (playerCount === 0) return;

        if (playerCount < seedingThreshold) {
          server.rcon.execute(`AdminBroadcast ${seedingMessage}`);
          return;
        }

        if (liveEnabled && playerCount < liveThreshold) {
          server.rcon.execute(`AdminBroadcast ${liveMessage}`);
        }
      }, interval);

      break;
    case 'onjoin':
      server.on(LOG_PARSER_PLAYER_CONNECTED, () => {
        setTimeout(() => {
          const playerCount = server.players.length;

          if (playerCount === 0) return;

          if (playerCount < seedingThreshold) {
            server.rcon.execute(`AdminBroadcast ${seedingMessage}`);
            return;
          }

          if (liveEnabled && playerCount < liveThreshold) {
            server.rcon.execute(`AdminBroadcast ${liveMessage}`);
          }
        }, delay);
      });

      break;
    default:
      throw new Error('Invalid SeedingMessage mode.');
  }
}
