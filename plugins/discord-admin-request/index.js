import { COPYRIGHT_MESSAGE } from 'core/constants';
import { RCON_CHAT_MESSAGE } from 'squad-server/events/rcon';

export default {
  name: 'discord-admin-request',
  description: 'Ping admins in Discord with the in game !admin command.',
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
    ignorePhrases: {
      type: 'Array',
      required: false,
      default: [],
      description: 'A list of phrases to ignore.'
    },
    adminPrefix: {
      type: 'String',
      required: false,
      default: '!admin',
      description: 'The command that calls an admin.'
    },
    pingGroups: {
      type: 'Array',
      required: false,
      default: [],
      description: 'A list of Discord role IDs to ping.'
    },
    pingDelay: {
      type: 'Number',
      required: false,
      default: 60 * 1000,
      description: 'Cooldown for pings.'
    },
    color: {
      type: 'Discord Color Code',
      required: false,
      default: 16761867,
      description: 'The color of the embed.'
    }
  },

  init: async (server, options) => {
    let lastPing = null;

    const channel = await options.discordClient.channels.fetch(options.channelID);

    server.on(RCON_CHAT_MESSAGE, async (info) => {
      if (options.ignoreChats.includes(info.chat)) return;
      if (!info.message.startsWith(`${options.adminPrefix}`)) return;

      for (const ignorePhrase of options.ignorePhrases) {
        if (info.message.includes(ignorePhrase)) return;
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
