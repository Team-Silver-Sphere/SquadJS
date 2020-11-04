import BasePlugin from './base-plugin.js';

export default class AutoTKWarn extends BasePlugin {
  static get description() {
    return 'The <code>AutoTkWarn</code> plugin will automatically warn players with a message when they teamkill.';
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

  async init() {
    this.server.on('TEAMKILL', this.onTeamkill.bind(this));
  }

  async onTeamkill(info) {
    await this.server.rcon.warn(info.attacker.steamID, this.options.message);
  }

  destroy() {
    this.server.removeListener('TEAMKILL', this.onTeamkill);
  }
}
