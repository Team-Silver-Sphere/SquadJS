import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordAdminBroadcast extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>DiscordAdminBroadcast</code> plugin will send a copy of admin broadcasts made in game to a Discord ' +
      'channel.'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log admin broadcasts to.',
        default: '',
        example: '667741905228136459'
      },
      color: {
        required: false,
        description: 'The color of the embed.',
        default: 16761867
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onAdminBroadcast = this.onAdminBroadcast.bind(this);
  }

  async mount() {
    this.server.on('ADMIN_BROADCAST', this.onAdminBroadcast);
  }

  async unmount() {
    this.server.removeEventListener('ADMIN_BROADCAST', this.onAdminBroadcast);
  }

  async onAdminBroadcast(info) {
    await this.sendDiscordMessage({
      embed: {
        title: 'Admin Broadcast',
        color: this.options.color,
        fields: [
          {
            name: 'Message',
            value: `${info.message}`
          }
        ],
        timestamp: info.time.toISOString()
      }
    });
  }
}
