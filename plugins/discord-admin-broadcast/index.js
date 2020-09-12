import { COPYRIGHT_MESSAGE } from 'core/constants';
import { ADMIN_BROADCAST } from 'squad-server/events';

export default {
  name: 'discord-admin-broadcast',
  description:
    'The <code>discord-admin-broadcast</code> plugin will send a copy of admin broadcasts made in game to a Discord ' +
    'channel.',

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
    color: {
      required: false,
      description: 'The color of the embed.',
      default: 16761867
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
