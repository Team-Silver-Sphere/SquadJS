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
      attackerMessage: {
        required: false,
        description: 'The message to warn attacking players with.',
        default: 'Please apologise for ALL TKs in ALL chat!'
      },
      warnVictim: {
        required: false,
        description: 'Should we nottify the the victim, telling them that they were teamkilled via a warning message',
        default: false
      },
      victimMessage: {
        required: false,
        description: 'The message that will be sent to the victim',
        default: 'You were killed by your own team.'
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
    if (info.attacker) {
      this.server.rcon.warn(info.attacker.steamID, this.options.attackerMessage);
    }
    if (this.options.warnVictim && info.victim) {
      this.server.rcon.warn(info.victim.steamID, this.options.victimMessage);
    }
  }
}
