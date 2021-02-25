import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordAdminCamLogs extends DiscordBasePlugin {
  static get description() {
    return 'The <code>DiscordAdminCamLogs</code> plugin will log in game admin camera usage to a Discord channel.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log admin camera usage to.',
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

    this.adminsInCam = {};

    this.onEntry = this.onEntry.bind(this);
    this.onExit = this.onExit.bind(this);
  }

  async mount() {
    this.server.on('POSSESSED_ADMIN_CAMERA', this.onEntry);
    this.server.on('UNPOSSESSED_ADMIN_CAMERA', this.onExit);
  }

  async unmount() {
    this.server.removeEventListener('POSSESSED_ADMIN_CAMERA', this.onEntry);
    this.server.removeEventListener('UNPOSSESSED_ADMIN_CAMERA', this.onExit);
  }

  async onEntry(info) {
    await this.sendDiscordMessage({
      embed: {
        title: `Admin Entered Admin Camera`,
        color: this.options.color,
        fields: [
          {
            name: "Admin's Name",
            value: info.player.name,
            inline: true
          },
          {
            name: "Admin's SteamID",
            value: `[${info.player.steamID}](https://steamcommunity.com/profiles/${info.player.steamID})`,
            inline: true
          }
        ],
        timestamp: info.time.toISOString()
      }
    });
  }

  async onExit(info) {
    await this.sendDiscordMessage({
      embed: {
        title: `Admin Left Admin Camera`,
        color: this.options.color,
        fields: [
          {
            name: "Admin's Name",
            value: info.player.name,
            inline: true
          },
          {
            name: "Admin's SteamID",
            value: `[${info.player.steamID}](https://steamcommunity.com/profiles/${info.player.steamID})`,
            inline: true
          },
          {
            name: 'Time in Admin Camera',
            value: `${Math.round(info.duration / 60000)} mins`
          }
        ],
        timestamp: info.time.toISOString()
      }
    });
  }
}
