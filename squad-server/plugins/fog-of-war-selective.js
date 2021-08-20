import BasePlugin from './base-plugin.js';

export default class SelectiveFogOfWar extends BasePlugin {
  static get description() {
    return 'The <code>SeletiveFogOfWar</code> plugin can be used to automate setting fog of war mode for specific layers.';
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
      },
      layers: {
        required: false,
        description: 'Layers to affect. Either the full layer name, a partial match or use an empty array to select all layers.',
        default: ['RAAS']
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
    this.verbose(1, `New Layer: ${this.server.currentLayer?.name}` );
    this.verbose(1, `Layer Filter: ${this.options.layers?.length > 0 ? this.options.layers?.map(l => `'${l}'`).join(', ') : 'All'}`)

    if (this.options.layers?.length > 0 && 
       !this.options.layers?.some(l => this.server.currentLayer?.name?.toUpperCase().includes(l.toUpperCase()))) {
          this.verbose(1, 'Not matched');
          return;
    }

    this.verbose(1, 'Matched');

    setTimeout(() => {
      this.verbose(1, 'Setting FoW: ' + this.options.mode);
      this.server.rcon.setFogOfWar(this.options.mode);
    }, this.options.delay);
  }
}
