import { COPYRIGHT_MESSAGE } from 'core/config';
import { RCON_CHAT_MESSAGE } from 'squad-server/events/rcon';

export default async function(server, discordClient, channelID, options = {}) {
  if (!server) throw new Error('DiscordChat must be provided with a reference to the server.');

  if (!discordClient) throw new Error('DiscordChat must be provided with a Discord.js client.');

  if (!channelID) throw new Error('DiscordChat must be provided with a channel ID.');

  const ignoreChats = options.ignoreChats || ['ChatSquad', 'ChatAdmin'];

  options = {
    chatColors: {
      ...options.chatColors
    },
    color: 16761867,
    ...options
  };

  const channel = await discordClient.channels.fetch(channelID);

  server.on(RCON_CHAT_MESSAGE, async info => {
    if (ignoreChats.includes(info.chat)) return;

    const playerInfo = await server.getPlayerBySteamID(info.steamID);

    channel.send({
      embed: {
        title: info.chat,
        color: options.chatColors[info.chat] || options.color,
        fields: [
          {
            name: 'Player',
            value: playerInfo.name,
            inline: true
          },
          {
            name: 'SteamID',
            value: `[${playerInfo.steamID}](https://steamcommunity.com/profiles/${info.steamID})`,
            inline: true
          },
          {
            name: 'Team & Squad',
            value: `Team: ${playerInfo.teamID}, Squad: ${playerInfo.squadID || 'Unassigned'}`
          },
          {
            name: 'Message',
            value: `${info.message}`
          }
        ],
        timestamp: info.time.toISOString(),
        footer: {
          text: COPYRIGHT_MESSAGE
        }
      }
    });
  });
}
