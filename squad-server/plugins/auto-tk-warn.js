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

  constructor(server, options) {
    super(server, options);

    server.on('TEAMKILL', async (info) => {
      await server.rcon.warn(info.attacker.steamID, this.options.message);
    });
  }
}
