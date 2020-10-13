import BasePlugin from './base-plugin.js';
import { COPYRIGHT_MESSAGE } from '../utils/constants.js';

export default class DiscordAdminRequest extends BasePlugin {
  static get description() {
    return (
      'The <code>DiscordAdminRequest</code> plugin will ping admins in a Discord channel when a player requests ' +
      'an admin via the <code>!admin</code> command in in-game chat.'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      discordClient: {
        required: true,
        description: 'Discord connector name.',
        connector: 'discord',
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
    };
  }

  constructor(server, options) {
    super();

    this.lastPing = Date.now();

    options.discordClient.channels.fetch(options.channelID).then((channel) => {
      server.on(`CHAT_COMMAND:${options.adminPrefix}`, async (info) => {
        if (options.ignoreChats.includes(info.chat)) return;

        for (const ignorePhrase of options.ignorePhrases) {
          if (info.message.includes(ignorePhrase)) return;
        }

        if (info.message.length === 0) {
          await server.rcon.warn(
            info.player.steamID,
            `Please specify what you would like help with when requesting an admin.`
          );
          return;
        }

        const message = {
          embed: {
            title: `${info.player.name} has requested admin support!`,
            color: options.color,
            fields: [
              {
                name: 'Player',
                value: info.player.name,
                inline: true
              },
              {
                name: 'SteamID',
                value: `[${info.player.steamID}](https://steamcommunity.com/profiles/${info.player.steamID})`,
                inline: true
              },
              {
                name: 'Team & Squad',
                value: `Team: ${info.player.teamID}, Squad: ${info.player.squadID || 'Unassigned'}`
              },
              {
                name: 'Message',
                value: info.message
              }
            ],
            timestamp: info.time.toISOString(),
            footer: {
              text: COPYRIGHT_MESSAGE
            }
          }
        };

        if (options.pingGroups.length > 0 && Date.now() - options.pingDelay > this.lastPing) {
          message.content = options.pingGroups.map((groupID) => `<@&${groupID}>`).join(' ');
          this.lastPing = Date.now();
        }

        await channel.send(message);

        await server.rcon.warn(
          info.player.steamID,
          `An admin has been notified, please wait for us to get back to you.`
        );
      });
    });
  }
}
