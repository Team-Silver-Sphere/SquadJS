import Discord from 'discord.js';
import tinygradient from 'tinygradient';

import { COPYRIGHT_MESSAGE } from '../utils/constants.js';

import DiscordBaseMessageUpdater from './discord-base-message-updater.js';

export default class DiscordServerStatus extends DiscordBaseMessageUpdater {
  static get description() {
    return 'The <code>DiscordServerStatus</code> plugin can be used to get the server status in Discord.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBaseMessageUpdater.optionsSpecification,
      command: {
        required: false,
        description: 'Command name to get message.',
        default: '!status'
      },
      updateInterval: {
        required: false,
        description: 'How frequently to update the time in Discord.',
        default: 60 * 1000
      },
      setBotStatus: {
        required: false,
        description: "Whether to update the bot's status with server information.",
        default: true
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.updateMessages = this.updateMessages.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
  }

  async mount() {
    await super.mount();
    this.updateInterval = setInterval(this.updateMessages, this.options.updateInterval);
    this.updateStatusInterval = setInterval(this.updateStatus, this.options.updateInterval);
  }

  async unmount() {
    await super.unmount();
    clearInterval(this.updateInterval);
    clearInterval(this.updateStatusInterval);
  }

  async generateMessage() {
    const embed = new Discord.MessageEmbed();

    // Set embed title.
    embed.setTitle(this.server.serverName);

    // Set player embed field.
    let players = '';

    players += `${this.server.a2sPlayerCount}`;
    if (this.server.publicQueue + this.server.reserveQueue > 0)
      players += ` (+${this.server.publicQueue + this.server.reserveQueue})`;

    players += ` / ${this.server.publicSlots}`;
    if (this.server.reserveSlots > 0) players += ` (+${this.server.reserveSlots})`;

    embed.addField('Players', players);

    // Set layer embed fields.
    embed.addField(
      'Current Layer',
      `\`\`\`${this.server.currentLayer?.name || 'Unknown'}\`\`\``,
      true
    );
    embed.addField(
      'Next Layer',
      `\`\`\`${
        this.server.nextLayer?.name || (this.server.nextLayerToBeVoted ? 'To be voted' : 'Unknown')
      }\`\`\``,
      true
    );

    // Set layer image.
    embed.setImage(
      this.server.currentLayer
        ? `https://squad-data.nyc3.cdn.digitaloceanspaces.com/main/${this.server.currentLayer.layerid}.jpg`
        : undefined
    );

    // Set timestamp.
    embed.setTimestamp(new Date());

    // Set footer.
    embed.setFooter(COPYRIGHT_MESSAGE);

    // Set gradient embed color.
    embed.setColor(
      parseInt(
        tinygradient([
          { color: '#ff0000', pos: 0 },
          { color: '#ffff00', pos: 0.5 },
          { color: '#00ff00', pos: 1 }
        ])
          .rgbAt(this.server.a2sPlayerCount / (this.server.publicSlots + this.server.reserveSlots))
          .toHex(),
        16
      )
    );

    return embed;
  }

  async updateStatus() {
    if (!this.options.setBotStatus) return;

    await this.options.discordClient.user.setActivity(
      `(${this.server.a2sPlayerCount}/${this.server.publicSlots}) ${
        this.server.currentLayer?.name || 'Unknown'
      }`,
      { type: 'WATCHING' }
    );
  }
}
