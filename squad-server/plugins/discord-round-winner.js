import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordRoundWinner extends DiscordBasePlugin {
  static get description() {
    return 'The <code>DiscordRoundWinner</code> plugin will send the round winner to a Discord channel.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
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
    super(server, options);

    server.on('NEW_GAME', async (info) => {
      await this.sendDiscordMessage({
        embed: {
          title: 'Round Winner',
          color: options.color,
          fields: [
            {
              name: 'Message',
              value: `${info.winner} won on ${info.layer}.`
            }
          ],
          timestamp: info.time.toISOString()
        }
      });
    });
  }
}
