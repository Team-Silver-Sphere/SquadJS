import BasePlugin from './base-plugin.js';

export default class AutoKickAFK extends BasePlugin {
  static get description() {
    return 'The <code>AutoKickAFK</code> plugin will automatically kick players that are not in a squad after a specified ammount of time.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      warning: {
        required: false,
        description:
          'If enabled SquadJS will warn a player once before kicking them. To disable remove the message `""`',
        default: 'Players not in a squad are unassigned and will be kicked in 3 minutes'
      },
      updateInterval: {
        required: true,
        description: 'How frequently to check if players are AFK in minutes.',
        default: 3
      }
    };
  }

  constructor(server, options) {
    super();

    this.playerDict = {};

    const intervalMS = options.updateInterval * 60 * 1000;

    setInterval(async () => {
      console.log(server.players);
      const lookup = {};
      for (const player of server.players) {
        lookup[player.steamID] = player;

        // marks player if not in a Squad
        if (player.squadID === null) {
          if (player.steamID in this.playerDict) {
            this.playerDict[player.steamID] += 1;
          } else {
            this.playerDict[player.steamID] = 0;
          }
        } else if (player.steamID in this.playerDict) {
          // remove player from list if they joined a squad
          delete this.playerDict[player.steamID];
        }
      }

      const copy = Object.assign({}, this.playerDict);
      for (const [steamID, count] of Object.entries(copy)) {
        if (count >= 1) {
          await server.rcon.kick(steamID);
          delete this.playerDict[steamID];
        }
        if (count === 0 && options.warning !== '') {
          await server.rcon.warn(steamID, options.warning);
        } else {
          await server.rcon.kick(steamID);
          delete this.playerDict[steamID];
        }
      }
    }, intervalMS);
  }
}
