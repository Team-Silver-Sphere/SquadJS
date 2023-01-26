import BasePlugin from './base-plugin.js';

export default class FogOfWar extends BasePlugin {
  static get description() {
    return 'The <code>FogOfWar</code> plugin can be used to automate setting fog of war mode.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      mode: {
        required: false,
        description: 'Fog of war mode to set.',
        default: 1
      },
      delay: {
        required: false,
        description: 'Delay before setting fog of war mode.',
        default: 10 * 1000
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onNewGame = this.onNewGame.bind(this);
  }

  async mount() {
    this.server.on('NEW_GAME', this.onNewGame);
  }

  async unmount() {
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
  }

  async onNewGame() {
    setTimeout(() => {
      this.server.rcon.setFogOfWar(this.options.mode);
    }, this.options.delay);
  }
}
