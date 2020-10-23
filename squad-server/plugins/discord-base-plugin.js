import BasePlugin from './base-plugin.js';

import { COPYRIGHT_MESSAGE } from '../utils/constants.js';

export default class DiscordBasePlugin extends BasePlugin {
  static get optionsSpecification() {
    return {
      discordClient: {
        required: true,
        description: 'Discord connector name.',
        connector: 'discord',
        default: 'discord'
      }
    };
  }

  constructor(server, options) {
    super(server, options);

    this.channel = null;
  }

  async sendDiscordMessage(message, channelID = this.options.channelID) {
    if (this.channel === null) this.channel = await this.options.discordClient.channels.fetch(channelID);

    if (typeof message === 'object' && 'embed' in message)
      message.embed.footer = { text: COPYRIGHT_MESSAGE };

    await this.channel.send(message);
  }
}
