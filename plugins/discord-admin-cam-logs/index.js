import { COPYRIGHT_MESSAGE } from 'core/config';
import {
  LOG_PARSER_PLAYER_POSSESS,
  LOG_PARSER_PLAYER_UNPOSSESS
} from 'squad-server/events/log-parser';

export default async function(server, discordClient, channelID, options = {}) {
  if (!server)
    throw new Error('DiscordAdminCamLogs must be provided with a reference to the server.');

  if (!discordClient)
    throw new Error('DiscordAdminCamLogs must be provided with a Discord.js client.');

  if (!channelID) throw new Error('DiscordAdminCamLogs must be provided with a channel ID.');

  options = {
    color: 16761867,
    ...options
  };

  const channel = await discordClient.channels.fetch(channelID);

  const adminsInCam = {};

  server.on(LOG_PARSER_PLAYER_POSSESS, info => {
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

  server.on(LOG_PARSER_PLAYER_UNPOSSESS, info => {
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
