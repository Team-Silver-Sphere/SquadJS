import { COPYRIGHT_MESSAGE } from 'core/constants';
import { ADMIN_BROADCAST } from 'squad-server/events';

export default {
  name: 'discord-admin-broadcast',
  description:
    'The `discord-admin-broadcast` plugin will send a copy of admin broadcasts made in game to a Discord channel.',

  defaultEnabled: true,
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
    color: {
      type: 'Discord Color Code',
      required: false,
      default: 16761867,
      description: 'The color of the embed.'
    }
  },

  init: async (server, options) => {
    const channel = await options.discordClient.channels.fetch(options.channelID);

    server.on(ADMIN_BROADCAST, async (info) => {
      channel.send({
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
  }
};
