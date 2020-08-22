import { COPYRIGHT_MESSAGE } from 'core/constants';
import { RCON_CHAT_MESSAGE } from 'squad-server/events/rcon';

export default {
  name: 'discord-chat',
  description: 'The `discord-chat` plugin will log in-game chat to a Discord channel.',

  defaultDisabled: false,
  optionsSpec: {
    discordClient: {
      type: 'DiscordConnector',
      required: true,
      default: 'discord',
      description: 'The name of the Discord Connector to use.'
    },
    channelID: {
      type: 'Discord Channel ID',
      required: true,
      default: 'Discord Channel ID',
      description: 'The ID of the channel to log admin broadcasts to.'
    },
    ignoreChats: {
      type: 'Array',
      required: false,
      default: ['ChatSquad'],
      description: 'A list of chat names to ignore.'
    },
    chatColors: {
      type: 'Object',
      required: false,
      default: {},
      description: 'The color of the embed for each chat. Example: `{ ChatAll: 16761867 }`.'
    },
    color: {
      type: 'Discord Color Code',
      required: false,
      default: 16761867,
      description: 'The color of the embed.'
    }
  },

  init: async (server, options) => {
    const channel = await options.discordClient.channels.fetch(options.channelID);

    server.on(RCON_CHAT_MESSAGE, async (info) => {
      if (options.ignoreChats.includes(info.chat)) return;

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
};
