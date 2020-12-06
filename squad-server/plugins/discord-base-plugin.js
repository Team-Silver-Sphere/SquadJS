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

  async prepareToMount() {
    this.channel = await this.options.discordClient.channels.fetch(this.options.channelID);
  }

  async sendDiscordMessage(message) {
    if (typeof message === 'object' && 'embed' in message)
      message.embed.footer = { text: COPYRIGHT_MESSAGE };

    await this.channel.send(message);
  }
}
