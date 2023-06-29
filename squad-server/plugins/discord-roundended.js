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

    this.onRoundEnd = this.onRoundEnd.bind(this);
  }

  async mount() {
    this.server.on('ROUND_ENDED', this.onRoundEnd);
  }

  async unmount() {
    this.server.removeEventListener('ROUND_ENDED', this.onRoundEnd);
  }

  async onRoundEnd(info) {
    const embed = this.buildEmbed(this.options.color, info.time);
    if (!info.winner || !info.loser) {
      embed.setTitle('Round Ended').setDescription('This match Ended in a Draw');
      await this.sendDiscordMessage(this.objEmbed(embed));
      return;
    }

    embed.setTitle('Round Ended').setDescription(`${info.winner.layer} - ${info.winner.level}`).addFields(
      {
        name: `Team ${info.winner.team} Won`,
        value: `${info.winner.subfaction}\n ${info.winner.faction}\n won with ${info.winner.tickets} tickets.`
      },
      {
        name: `Team ${info.loser.team} Lost`,
        value: `${info.loser.subfaction}\n ${info.loser.faction}\n lost with ${info.loser.tickets} tickets.`
      },
      {
        name: 'Ticket Difference',
        value: `${info.winner.tickets - info.loser.tickets}.`
      }
    );
    await this.sendDiscordMessage(this.objEmbed(embed));
  }
}
