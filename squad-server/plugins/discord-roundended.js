import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordRoundEnded extends DiscordBasePlugin {
  static get description() {
    return 'The <code>DiscordRoundEnded</code> plugin will send the round winner to a Discord channel.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log round end events to.',
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

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onNewGame = this.onNewGame.bind(this);
  }

  async mount() {
    this.server.on('ROUND_ENDED', this.onNewGame);
  }

  async unmount() {
    this.server.removeEventListener('ROUND_ENDED', this.onRoundEnd);
  }

  async onRoundEnd(info) {
    if (!info.winner || !info.loser) {
      await this.sendDiscordMessage({
        embed: {
          title: 'Round Ended',
          description: 'This match Ended in a Draw',
          color: this.options.color,
          timestamp: info.time.toISOString()
        }
      });
    }

    await this.sendDiscordMessage({
      embed: {
        title: 'Round Ended',
        description: `${info.winner.layer} - ${info.winner.level}`,
        color: this.options.color,
        fields: [
          {
            name: 'Winner',
            value: `${info.winner.subfaction} : ${info.winner.faction} won with ${info.winner.tickets}.`
          },
          {
            name: 'Loser',
            value: `${info.loser.subfaction} : ${info.loser.faction} lost with ${info.loser.tickets}.`
          },
          {
            name: 'Ticket Difference',
            value: `${info.winner.tickets - info.loser.tickets}.`
          }
        ],
        timestamp: info.time.toISOString()
      }
    });
  }
}
