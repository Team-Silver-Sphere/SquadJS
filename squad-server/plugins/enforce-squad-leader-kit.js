import BasePlugin from './base-plugin.js';

export default class EnforceSquadLeaderKit extends BasePlugin {
  static get description() {
    return 'Ensures squad leaders take the correct Squad Leader kit, warns them if they do not, and disbands the squad if they fail to comply.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      warningMessage: {
        required: false,
        description: 'Warning message for squad leaders without the correct kit.',
        default: 'You must take the Squad Leader kit, or your squad will be disbanded!'
      },
      checkInterval: {
        required: false,
        description: 'Interval (in seconds) to check all squad leaders.',
        default: 30
      },
      maxWarnings: {
        required: false,
        description: 'Number of warnings before disbanding the squad.',
        default: 3
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);
    this.warningCounts = {};
    this.checkSquadLeaders = this.checkSquadLeaders.bind(this);
  }

  async mount() {
    this.checkInterval = setInterval(this.checkSquadLeaders, this.options.checkInterval * 1000);
  }

  async unmount() {
    clearInterval(this.checkInterval);
  }

  async checkSquadLeaders() {
    for (const player of this.server.players) {
      if (player.isLeader) {
        if (!player.role.includes('SL')) {
          this.issueWarning(player);
        } else if (this.warningCounts[player.steamID]) {
          this.server.rcon.warn(player.steamID, "Thank you for taking the correct kit!");
          this.warningCounts[player.steamID] = 0;
        }
      }
    }
  }

  async issueWarning(player) {
    const warnings = this.warningCounts[player.steamID] || 0;
    this.warningCounts[player.steamID] = warnings + 1;

    this.server.rcon.warn(player.steamID, `${this.options.warningMessage} (${warnings + 1}/${this.options.maxWarnings})`);

    if (this.warningCounts[player.steamID] >= this.options.maxWarnings) {
      this.server.rcon.execute(`AdminDisbandSquad ${player.teamID} ${player.squadID}`);
      this.warningCounts[player.steamID] = 0;
    }
  }
}
