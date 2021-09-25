import BasePlugin from './base-plugin.js';

export default class SeedingMode extends BasePlugin {
  static get description() {
    return (
      'The <code>SeedingMode</code> plugin broadcasts seeding rule messages to players at regular intervals ' +
      'when the server is below a specified player count. It can also be configured to display "Live" messages when ' +
      'the server goes live.'
    );
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      interval: {
        required: false,
        description: 'Frequency of seeding messages in milliseconds.',
        default: 2.5 * 60 * 1000
      },
      seedingThreshold: {
        required: false,
        description: 'Player count required for server not to be in seeding mode.',
        default: 50
      },
      seedingMessage1: {
        required: false,
        description: 'Seeding message to display.',
        default:
          'Seeding Rules Active! No shooting logies, fight over the middle point, stay on your side of the red line.'
      },
      seedingMessage2: {
        required: false,
        description: 'Seeding message to display.',
        default:
          'No hab hunting or hab camping, no emplaced guns, no vehicles that require a crewman kit.'
      },
      seedingMessage3: {
        required: false,
        description: 'Seeding message to display.',
        default: 'Each side gets one radio to be placed on certain coordinates.'
      },
      seedingMessageFallujahSkirmishv1: {
        required: false,
        description: 'Seeding message to display.',
        default:
          'Seeding Rules Active! Cap the two flags closest to your home base, fight ONLY over Main District, and stay on your side of the RED line'
      },
      seedingMessageJensens1: {
        required: false,
        description: 'Seeding message to display.',
        default:
          'Jensens Range Rules: Be Respectful. No Spawn camping. Do NOT destroy Heli\'s on Heli Pads. Do not mine armor area.'
      },
      seedingMessageJensens2: {
        required: false,
        description: 'Seeding message to display.',
        default:
          'Jensens Range Rules: Let Heli\'s safely take off. Then they are fair game. Fly Heli\'s at your own risk.'
      },
      seedingMessageJensens3: {
        required: false,
        description: 'Seeding message to display.',
        default:
          'Jensens Range Rules: Absolutly NO Heli Spawn area killing will be tolerated!'
      },
      liveEnabled: {
        required: false,
        description: 'Enable "Live" messages for when the server goes live.',
        default: true
      },
      liveThreshold: {
        required: false,
        description: 'Player count required for "Live" messages to not bee displayed.',
        default: 52
      },
      liveMessage: {
        required: false,
        description: '"Live" message to display.',
        default: 'Live!'
      },
      waitOnNewGames: {
        required: false,
        description: 'Should the plugin wait to be executed on NEW_GAME event.',
        default: true
      },
      waitTimeOnNewGame: {
        required: false,
        description: 'The time to wait before check player counts in seconds.',
        default: 30
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.stop = false;
    this.broadcast = this.broadcast.bind(this);
    this.onNewGame = this.onNewGame.bind(this);
  }

  async mount() {
    if (this.options.waitOnNewGames) {
      this.server.on('NEW_GAME', this.onNewGame);
    }

    this.interval = setInterval(this.broadcast, this.options.interval);
  }

  async unmount() {
    clearInterval(this.interval);
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
  }

  onNewGame() {
    this.stop = true;
    setTimeout(() => {
      this.stop = false;
    }, 30 * 1000);
  }

  async broadcast() {
    if (this.stop) return;
    if (
      this.server.a2sPlayerCount !== 0 &&
      this.server.a2sPlayerCount < this.options.seedingThreshold
    ) {
      const currentMap = await this.server.rcon.getCurrentMap();

      if (currentMap.layer.includes("Jensen")) {
        await this.server.rcon.broadcast(this.options.seedingMessageJensens1);
        await this.server.rcon.broadcast(this.options.seedingMessageJensens2);
        await this.server.rcon.broadcast(this.options.seedingMessageJensens3);
      }
      else if (currentMap.layer === 'Fallujah Skirmish v1') {
        await this.server.rcon.broadcast(this.options.seedingMessageFallujahSkirmishv1);
      } else {
        await this.server.rcon.broadcast(this.options.seedingMessage1);
        await this.server.rcon.broadcast(this.options.seedingMessage2);
        await this.server.rcon.broadcast(this.options.seedingMessage3);
      }
    } else if (
      this.server.a2sPlayerCount !== 0 &&
      this.options.liveEnabled &&
      this.server.a2sPlayerCount < this.options.liveThreshold
    ) {
      await this.server.rcon.broadcast(this.options.liveMessage);
    }
  }
}
