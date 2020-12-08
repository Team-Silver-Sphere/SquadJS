import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordDebug extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>DiscordDebug</code> plugin can be used to help debug SquadJS by dumping SquadJS events to a ' +
      'Discord channel.'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log events to.',
        default: '',
        example: '667741905228136459'
      },
      events: {
        required: true,
        description: 'A list of events to dump.',
        default: [],
        example: ['PLAYER_DIED']
      }
    };
  }

  async mount() {
    for (const event of this.options.events) {
      this.server.on(event, async (info) => {
        await this.sendDiscordMessage(`\`\`\`${JSON.stringify({ ...info, event }, null, 2)}\`\`\``);
      });
    }
  }
}
