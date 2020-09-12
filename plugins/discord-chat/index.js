import { COPYRIGHT_MESSAGE } from 'core/constants';
import { CHAT_MESSAGE } from 'squad-server/events';

export default {
  name: 'discord-chat',
  description: 'The <code>discord-chat</code> plugin will log in-game chat to a Discord channel.',

  defaultEnabled: true,
  optionsSpec: {
    discordClient: {
      required: true,
      description: 'The name of the Discord Connector to use.',
      default: 'discord'
    },
    channelID: {
      required: true,
      description: 'The ID of the channel to log admin broadcasts to.',
      default: '',
      example: '667741905228136459'
    },
    ignoreChats: {
      required: false,
      default: ['ChatSquad'],
      description: 'A list of chat names to ignore.'
    },
    chatColors: {
      required: false,
      description: 'The color of the embed for each chat.',
      default: {},
      example: { ChatAll: 16761867 }
    },
    color: {
      required: false,
      description: 'The color of the embed.',
      default: 16761867
    }
  },

  init: async (server, options) => {
    const channel = await options.discordClient.channels.fetch(options.channelID);

    server.on(CHAT_MESSAGE, async (info) => {
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
