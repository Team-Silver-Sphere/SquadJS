import Discord from 'discord.js';
import tinygradient from 'tinygradient';

import DiscordBaseMessageUpdater from './discord-base-message-updater.js';

export default class DiscordServerStatusExtra extends DiscordBaseMessageUpdater {
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
      },
      includeLayerImage: {
        required: false,
        description: "Whether to include the layer image within the embed.",
        default: false
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onNewGame = this.onNewGame.bind(this);
    this.onServerOffline = this.onServerOffline.bind(this);
    this.updateMessages = this.updateMessages.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
  }

  async mount() {
    await super.mount();
    this.server.on('NEW_GAME', this.onNewGame);
    this.server.on('RCON_ERROR', this.onServerOffline);
    this.updateInterval = setInterval(this.updateMessages, this.options.updateInterval);
    this.updateStatusInterval = setInterval(this.updateStatus, this.options.updateInterval);
  }

  async unmount() {
    await super.unmount();
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
    this.server.removeEventListener('RCON_ERROR', this.onServerOffline);
    clearInterval(this.updateInterval);
    clearInterval(this.updateStatusInterval);
  }

  async onNewGame(info) {
    this.isOffline = false;
    this.roundStart = new Date();
  }

  async onServerOffline(info) {
    this.isOffline = true;
  }

  async generateMessage() {
    const embed = new Discord.MessageEmbed();

    embed.setTitle(`Server ${this.isOffline ? 'Offline' : 'Online'}`);

    embed.setDescription(this.server.serverName);

    let players = '';

    players += `${this.server.a2sPlayerCount}`;
    if (this.server.publicQueue + this.server.reserveQueue > 0)
      players += ` (+${this.server.publicQueue + this.server.reserveQueue})`;

    players += ` / ${this.server.publicSlots}`;
    if (this.server.reserveSlots > 0) players += ` (+${this.server.reserveSlots})`;

    embed.addField(
      'Players', 
      `\`\`\`${players}\`\`\``,
      true
    );

    embed.addField(
      'Round Duration', 
      `\`\`\`${this.getRoundDuration()}\`\`\``,
      true
    );

    embed.addField(
      'Current Layer',
      `\`\`\`${this.server.currentLayer?.name || this.server.currentLayerClassname?.replace(/["_"]/g, " ") || 'Unknown'}\`\`\``
    );
    embed.addField(
      'Next Layer',
      `\`\`\`${
        this.server.nextLayer?.name || this.server.nextLayerClassname?.replace(/["_"]/g, " ") || (this.server.nextLayerToBeVoted ? 'To be voted' : 'Unknown')
      }\`\`\``
    );

    if (this.options.includeLayerImage) {
      embed.setImage(
        this.server.currentLayer
          ? `https://raw.githubusercontent.com/Squad-Wiki-Editorial/squad-wiki-pipeline-map-data/master/completed_output/_Current%20Version/images/${this.server.currentLayer.classname}.jpg`
          : undefined
      );
    }

    embed.setTimestamp(new Date());

    embed.setColor(this.isOffline ? '#e74d3c' : '#2ecc70');

    return embed;
  }

  async updateStatus() {
    if (!this.options.setBotStatus || this.isOffline) return;

    await this.options.discordClient.user.setActivity(
      `(${this.server.a2sPlayerCount}/${this.server.publicSlots}) ${
        this.server.currentLayer?.name || this.server.currentLayerClassname?.replace(/["_"]/g, " ") || 'Unknown'
      }`,
      { type: 'WATCHING' }
    );
  }

  getRoundDuration() {
    if (this.isOffline || !this.roundStart) return ' ';

    let ms = new Date() - this.roundStart;
    let seconds = Math.floor(ms / 1000) % 60;
    let minutes = Math.floor(ms / 1000 / 60) % 60;
    let hours = Math.floor(ms / 1000 / 60 / 60) % 24;

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}
