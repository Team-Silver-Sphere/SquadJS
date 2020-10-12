import BasePlugin from './base-plugin.js';
import { COPYRIGHT_MESSAGE } from '../utils/constants.js';

export default class DiscordAdminBroadcast extends BasePlugin {
  static get description() {
    return (
      'The <code>DiscordAdminBroadcast</code> plugin will send a copy of admin broadcasts made in game to a Discord ' +
      'channel.'
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
      color: {
        required: false,
        description: 'The color of the embed.',
        default: 16761867
      }
    };
  }

  constructor(server, options) {
    super();

    options.discordClient.channels.fetch(options.channelID).then((channel) => {
      server.on('ADMIN_BROADCAST', async (info) => {
        await channel.send({
          embed: {
            title: 'Admin Broadcast',
            color: options.color,
            fields: [
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
    });
  }
}
