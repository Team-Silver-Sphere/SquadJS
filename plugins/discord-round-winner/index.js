import { COPYRIGHT_MESSAGE } from 'core/constants';
import { NEW_GAME } from 'squad-server/events';

export default {
  name: 'discord-round-winner',
  description: 'The `discord-round-winner` plugin will send the round winner to a Discord channel.',

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

    server.on(NEW_GAME, async (info) => {
      channel.send({
        embed: {
          title: 'Round Winner',
          color: options.color,
          fields: [
            {
              name: 'Message',
              value: `${info.winner} won on ${info.layer}`
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
