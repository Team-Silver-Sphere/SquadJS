import BasePlugin from './base-plugin.js';

export default class AutoTKWarnVictim extends BasePlugin {
  static get description() {
    return 'The <code>AutoTkWarnVictim</code> plugin will automatically warn players with a message when they are teamkilled.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      message: {
        required: false,
        description: 'The message to warn teamkill victims with.',
        default: 'INFO: You were Teamkilled.'
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onTeamkill = this.onTeamkill.bind(this);
  }

  async mount() {
    this.server.on('TEAMKILL', this.onTeamkill);
  }

  async unmount() {
    this.server.removeEventListener('TEAMKILL', this.onTeamkill);
  }

  async onTeamkill(info) {
    if (!info.victim) return;

    await this.server.rcon.warn(info.victim.steamID, this.options.message);
  }
}
