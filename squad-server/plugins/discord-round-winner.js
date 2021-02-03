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

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onNewGame = this.onNewGame.bind(this);
  }

  async mount() {
    this.server.on('NEW_GAME', this.onNewGame);
  }

  async unmount() {
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
  }

  async onNewGame(info) {
    await this.sendDiscordMessage({
      embed: {
        title: 'Round Winner',
        color: this.options.color,
        fields: [
          {
            name: 'Message',
            value: `${info.winner} won on ${this.server.layerHistory[1].layer.name}.`
          }
        ],
        timestamp: info.time.toISOString()
      }
    });
  }
}
