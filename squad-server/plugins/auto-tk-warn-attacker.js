import BasePlugin from './base-plugin.js';

export default class AutoTKWarnAttacker extends BasePlugin {
  static get description() {
    return 'The <code>AutoTkWarnAttacker</code> plugin will automatically warn players with a message when they teamkill.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      message: {
        required: false,
        description: 'The message to warn players with.',
        default: 'Please apologise for ALL TKs in ALL chat!'
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
    if (!info.attacker) return;

    await this.server.rcon.warn(info.attacker.steamID, this.options.message);
  }
}
