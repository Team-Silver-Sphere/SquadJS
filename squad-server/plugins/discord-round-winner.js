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
    this.server.removeListener('NEW_GAME', this.onNewGame);
  }

  async onNewGame(info) {
    // The layer is null when it is not in the layer list, and the history has no previous
    // entry when the layer information was not loaded before the round ended.
    const previousLayer = this.server.layerHistory[1]?.layer;
    const layerName = previousLayer ? previousLayer.name : 'an unknown layer';

    await this.sendDiscordMessage({
      embed: {
        title: 'Round Winner',
        color: this.options.color,
        fields: [
          {
            name: 'Message',
            // winner is null when the round was a draw, for example when an admin ended it.
            value: info.winner
              ? `${info.winner} won on ${layerName}.`
              : `The round on ${layerName} was a draw.`
          }
        ],
        timestamp: info.time.toISOString()
      }
    });
  }
}
