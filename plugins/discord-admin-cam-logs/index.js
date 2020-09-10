import { COPYRIGHT_MESSAGE } from 'core/constants';
import { PLAYER_POSSESS, PLAYER_UNPOSSESS } from 'squad-server/events';

export default {
  name: 'discord-admin-cam-logs',
  description:
    'The <code>discord-admin-cam-logs</code> plugin will log in game admin camera usage to a Discord channel.',

  defaultEnabled: true,
  optionsSpec: {
    discordClient: {
      required: true,
      description: 'The name of the Discord Connector to use.',
      default: 'discord'
    },
    channelID: {
      required: true,
      description: 'The ID of the channel to log admin cam usage to.',
      default: '',
      example: '667741905228136459'
    },
    color: {
      required: false,
      description: 'The color of the embed.',
      default: 16761867
    }
  },

  init: async (server, options) => {
    const channel = await options.discordClient.channels.fetch(options.channelID);

    const adminsInCam = {};

    server.on(PLAYER_POSSESS, (info) => {
      if (info.player === null || info.possessClassname !== 'CameraMan') return;

      adminsInCam[info.player.steamID] = info.time;

      channel.send({
        embed: {
          title: `Admin Entered Admin Camera`,
          color: options.color,
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
          timestamp: info.time.toISOString(),
          footer: {
            text: COPYRIGHT_MESSAGE
          }
        }
      });
    });

    server.on(PLAYER_UNPOSSESS, (info) => {
      if (info.switchPossess === true || !(info.player.steamID in adminsInCam)) return;

      channel.send({
        embed: {
          title: `Admin Left Admin Camera`,
          color: options.color,
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
                (info.time.getTime() - adminsInCam[info.player.steamID].getTime()) / 60000
              )} mins`
            }
          ],
          timestamp: info.time.toISOString(),
          footer: {
            text: COPYRIGHT_MESSAGE
          }
        }
      });

      delete adminsInCam[info.player.steamID];
    });
  }
};
