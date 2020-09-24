import { COPYRIGHT_MESSAGE } from 'core/constants';
import { CHAT_MESSAGE } from 'squad-server/events';

export default {
  name: 'discord-admin-request',
  description:
    'The <code>discord-admin-request</code> plugin will ping admins in a Discord channel when a player requests an ' +
    'admin via the <code>!admin</code> command in in-game chat.',

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
      description: 'A list of chat names to ignore.',
      default: [],
      example: ['ChatSquad']
    },
    ignorePhrases: {
      required: false,
      description: 'A list of phrases to ignore.',
      default: [],
      example: ['switch']
    },
    adminPrefix: {
      required: false,
      description: 'The command that calls an admin.',
      default: '!admin'
    },
    pingGroups: {
      required: false,
      description: 'A list of Discord role IDs to ping.',
      default: [],
      example: ['500455137626554379']
    },
    pingDelay: {
      required: false,
      description: 'Cooldown for pings in milliseconds.',
      default: 60 * 1000
    },
    color: {
      required: false,
      description: 'The color of the embed.',
      default: 16761867
    }
  },

  init: async (server, options) => {
    let lastPing = null;

    const channel = await options.discordClient.channels.fetch(options.channelID);

    server.on(CHAT_MESSAGE, async (info) => {
      if (options.ignoreChats.includes(info.chat)) return;
      if (!info.message.toLowerCase().startsWith(options.adminPrefix.toLowerCase())) return;

      for (const ignorePhrase of options.ignorePhrases) {
        if (info.message.toLowerCase().includes(ignorePhrase.toLowerCase())) return;
      }

      const playerInfo = await server.getPlayerBySteamID(info.steamID);
      const trimmedMessage = info.message.replace(options.adminPrefix, '').trim();

      if (trimmedMessage.length === 0) {
        await server.rcon.warn(
          info.steamID,
          `Please specify what you would like help with when requesting an admin.`
        );
        return;
      }

      const message = {
        embed: {
          title: `${playerInfo.name} has requested admin support!`,
          color: options.color,
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
              value: trimmedMessage
            }
          ],
          timestamp: info.time.toISOString(),
          footer: {
            text: COPYRIGHT_MESSAGE
          }
        }
      };

      if (
        options.pingGroups.length > 0 &&
        (lastPing === null || Date.now() - options.pingDelay > lastPing)
      ) {
        message.content = options.pingGroups.map((groupID) => `<@&${groupID}>`).join(' ');
        lastPing = Date.now();
      }

      channel.send(message);

      await server.rcon.warn(
        info.steamID,
        `An admin has been notified, please wait for us to get back to you.`
      );
    });
  }
};
