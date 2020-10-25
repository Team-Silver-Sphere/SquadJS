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
      seedingMessage: {
        required: false,
        description: 'Seeding message to display.',
        default: 'Seeding Rules Active! Fight only over the middle flags! No FOB Hunting!'
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
      }
    };
  }

  constructor(server, options, optionsRaw) {
    super(server, options, optionsRaw);

    setInterval(async () => {
      if (
        this.server.a2sPlayerCount !== 0 &&
        this.server.a2sPlayerCount < this.options.liveThreshold
      )
        await this.server.rcon.broadcast(this.options.seedingMessage);
      else if (
        this.server.a2sPlayerCount !== 0 &&
        this.options.liveEnabled &&
        this.server.a2sPlayerCount < this.options.liveThreshold
      )
        await this.server.rcon.broadcast(this.options.liveMessage);
    }, this.options.interval);
  }
}
