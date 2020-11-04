import BasePlugin from './base-plugin.js';

export default class IntervalledBroadcasts extends BasePlugin {
  static get description() {
    return (
      'The <code>IntervalledBroadcasts</code> plugin allows you to set broadcasts, which will be broadcasted at ' +
      'preset intervals'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      broadcasts: {
        required: false,
        description: 'Messages to broadcast.',
        default: [],
        example: ['This server is powered by SquadJS.']
      },
      interval: {
        required: false,
        description: 'Frequency of the broadcasts in milliseconds.',
        default: 5 * 60 * 1000
      }
    };
  }

  async init() {
    this.intervalInstance = setInterval(async () => {
      await this.server.rcon.broadcast(this.options.broadcasts[0]);
      this.broadcasts.push(this.options.broadcasts.shift());
    }, this.options.interval);
  }

  destroy() {
    clearInterval(this.intervalInstance);
  }
}
