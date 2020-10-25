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

  constructor(server, options, optionsRaw) {
    super(server, options, optionsRaw);

    this.adminsInCam = {};

    this.server.on('PLAYER_POSSESS', async (info) => {
      if (info.player === null || info.possessClassname !== 'CameraMan') return;

      this.adminsInCam[info.player.steamID] = info.time;

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
    });

    this.server.on('PLAYER_UNPOSSESS', async (info) => {
      if (
        info.player === null ||
        info.switchPossess === true ||
        !(info.player.steamID in this.adminsInCam)
      )
        return;

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
              value: `${Math.round(
                (info.time.getTime() - this.adminsInCam[info.player.steamID].getTime()) / 60000
              )} mins`
            }
          ],
          timestamp: info.time.toISOString()
        }
      });

      delete this.adminsInCam[info.player.steamID];
    });
  }
}
