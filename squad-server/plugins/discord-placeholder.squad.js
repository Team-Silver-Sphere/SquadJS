import BasePlugin from './base-plugin.js';

export default class DiscordPlaceholder extends BasePlugin {
  static get description() {
    return (
      'The <code>DiscordPlaceholder</code> plugin allows you to make your bot create placeholder messages that ' +
      'can be used when configuring other plugins.'
    );
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      discordClient: {
        required: true,
        description: 'Discord connector name.',
        connector: 'discord',
        default: 'discord'
      },
      command: {
        required: false,
        description: 'Command to create Discord placeholder.',
        default: '!placeholder'
      },
      channelID: {
        required: true,
        description: 'The bot will only answer with a placeholder on this channel',
        default: ''
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    this.onMessage = this.onMessage.bind(this);
  }

  async mount() {
    this.options.discordClient.on('message', this.onMessage);
  }

  async unmount() {
    this.options.discordClient.removeEventListener('message', this.onMessage);
  }

  async onMessage(message) {
    if (message.author.bot) return;
    if (message.channel.id !== this.options.channelID) return;
    const prefixRegex = new RegExp(`^(${this.escapeRegex(this.options.command)})\\s*`);
    if (!prefixRegex.test(message.content)) return;
    await message.channel.send('Placeholder.');
  }
}
