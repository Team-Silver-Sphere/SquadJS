import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordSquadCreated extends DiscordBasePlugin {
  static get description() {
    return 'The <code>SquadCreated</code> plugin will log Squad Creation events to a Discord channel.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log Squad Creation events to.',
        default: '',
        example: '667741905228136459'
      },
      color: {
        required: false,
        description: 'The color of the embed.',
        default: 16761867
      },
      useEmbed: {
        required: false,
        description: `Send message as Embed`,
        default: true
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onSquadCreated = this.onSquadCreated.bind(this);
  }

  async mount() {
    this.server.on('SQUAD_CREATED', this.onSquadCreated);
  }

  async unmount() {
    this.server.removeEventListener('SQUAD_CREATED', this.onSquadCreated);
  }

  async onSquadCreated(info) {
    if (this.options.useEmbed) {
      const embed = this.buildEmbed(this.options.color, info.time, 'Squad Created').addFields(
        {
          name: 'Player',
          value: info.player.name,
          inline: true
        },
        {
          name: 'Team',
          value: info.teamName,
          inline: true
        },
        {
          name: 'Squad Number & Squad Name',
          value: `${info.player.squadID} : ${info.squadName}`
        }
      );
      await this.sendDiscordMessage(this.objEmbed(embed));
    } else {
      await this.sendDiscordMessage(
        ` \`\`\`Player: ${info.player.name}\n created Squad ${info.player.squadID} : ${info.squadName}\n on ${info.teamName}\`\`\` `
      );
    }
  }
}
