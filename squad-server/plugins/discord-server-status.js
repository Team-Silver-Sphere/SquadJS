import tinygradient from 'tinygradient';
import { COPYRIGHT_MESSAGE } from '../utils/constants.js';
import DiscordBaseMessageUpdater from './discord-base-message-updater.js';

export default class DiscordServerStatus extends DiscordBaseMessageUpdater {
  static get description() {
    return 'Enhanced DiscordServerStatus with recovery from map name messages and periodic announcements.';
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
        description: 'How frequently to update the message.',
        default: 60 * 1000
      },
      setBotStatus: {
        required: false,
        description: "Whether to update the bot's status.",
        default: true
      },
      channelId: {
        required: true,
        description: 'Channel to fetch and send layer info.',
        default: null
      },
      layerTagId: {
        required: false,
        description: 'Optional tag to distinguish this server in layer messages.',
        default: 'DEFAULT'
      },
      resendIntervalMinutes: {
        required: false,
        description: 'How often (in minutes) to resend the current map/layer to Discord.',
        default: 5
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);
    this.currentLayerInfo = null;
    this.updateMessages = this.updateMessages.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.onNewGame = this.onNewGame.bind(this);
    this.repeatLayerAnnouncement = this.repeatLayerAnnouncement.bind(this);
  }

  async mount() {
    await super.mount();
    this.server.on('NEW_GAME', this.onNewGame);
    this.updateInterval = setInterval(this.updateMessages, this.options.updateInterval);
    this.updateStatusInterval = setInterval(this.updateStatus, this.options.updateInterval);
    this.repeatLayerInterval = setInterval(this.repeatLayerAnnouncement, this.options.resendIntervalMinutes * 60 * 1000);
    await this.tryRecoverLayerFromDiscord();
  }

  async unmount() {
    await super.unmount();
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
    clearInterval(this.updateInterval);
    clearInterval(this.updateStatusInterval);
    clearInterval(this.repeatLayerInterval);
  }

  async tryRecoverLayerFromDiscord() {
    try {
      const channel = await this.options.discordClient.channels.fetch(this.options.channelId);
      const messages = await channel.messages.fetch({ limit: 10 });
      const marker = `[SQUADJS-LAYER][${this.options.layerTagId}]:`;

      for (const msg of messages.values()) {
        if (!msg.content.startsWith(marker)) continue;

        const raw = msg.content.replace(marker, '').trim();
        let name = raw;
        let id = this.slugify(raw);
        let factions = [];

        // Format 1: GE_VO_AlBasrah_Invasion_v2 GE_ussf GE_hez
        if (raw.match(/\s/)) {
          const [map, faction1, faction2] = raw.split(/\s+/);
          name = map;
          id = this.slugify(name);
          if (faction1 && faction2) {
            factions = [faction1.replace(/^GE_/, ''), faction2.replace(/^GE_/, '')];
          }
        }

        // Format 2: GE_Anvil_Invasion_v1_USSF-KG
        else if (raw.includes('_') && raw.includes('-')) {
          const match = raw.match(/(.+?)_([A-Za-z]+)-([A-Za-z]+)$/);
          if (match) {
            name = match[1];
            id = this.slugify(name);
            factions = [match[2], match[3]];
          }
        }

        this.currentLayerInfo = { name, id, factions };
        break;
      }
    } catch (err) {
      console.warn('Layer recovery from Discord failed:', err);
    }
  }

  async onNewGame(info) {
    this.currentLayerInfo = {
      name: info.layer?.name || info.layerClassname || 'Unknown Layer',
      id: info.layer?.id || this.slugify(info.layer?.name || info.layerClassname || 'Unknown'),
      factions: info.layer?.factions || []
    };

    try {
      const channel = await this.options.discordClient.channels.fetch(this.options.channelId);
      await channel.send(`[SQUADJS-LAYER][${this.options.layerTagId}]: ${this.currentLayerInfo.name}`);
    } catch (err) {
      console.warn('Failed to send layer name to Discord channel:', err);
    }
  }

  async repeatLayerAnnouncement() {
    if (!this.currentLayerInfo?.name) return;

    try {
      const channel = await this.options.discordClient.channels.fetch(this.options.channelId);
      await channel.send(`[SQUADJS-LAYER][${this.options.layerTagId}]: ${this.currentLayerInfo.name}`);
    } catch (err) {
      console.warn('Failed to resend layer name to Discord channel:', err);
    }
  }

  slugify(text) {
    return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  }

  async generateMessage() {
    const a2sPlayerCount = this.server.a2sPlayerCount ?? 0;
    const publicQueue = this.server.publicQueue ?? 0;
    const reserveQueue = this.server.reserveQueue ?? 0;
    const publicSlots = this.server.publicSlots ?? 100;
    const reserveSlots = this.server.reserveSlots ?? 0;

    let players = `${a2sPlayerCount}`;
    const totalQueue = publicQueue + reserveQueue;
    if (totalQueue > 0) players += ` (+${totalQueue})`;
    players += ` / ${publicSlots}`;
    if (reserveSlots > 0) players += ` (+${reserveSlots})`;

    const fallbackLayer = (await this.server.rcon.getCurrentMap())?.layer || 'Unknown';
    const layerName = this.currentLayerInfo?.name || fallbackLayer;

    const ratio = Math.min(1, Math.max(0, a2sPlayerCount / (publicSlots + reserveSlots || 1)));
    const color = parseInt(
      tinygradient([
        { color: '#ff0000', pos: 0 },
        { color: '#ffff00', pos: 0.5 },
        { color: '#00ff00', pos: 1 }
      ]).rgbAt(ratio).toHex(),
      16
    );

    const factions = this.currentLayerInfo?.factions || [];
    const factionsText = factions.length === 2 ? `${factions[0]} vs ${factions[1]}` : 'Unknown';

    let imageUrl;
    if (this.currentLayerInfo?.id) {
      imageUrl = `https://raw.githubusercontent.com/Squad-Wiki/squad-wiki-pipeline-map-data/master/completed_output/_Current%20Version/images/${this.currentLayerInfo.id}.jpg`;
    } else if (this.currentLayerInfo?.name) {
      const fallbackName = this.slugify(this.currentLayerInfo.name);
      imageUrl = `https://raw.githubusercontent.com/Squad-Wiki/squad-wiki-pipeline-map-data/master/completed_output/_Current%20Version/images/${fallbackName}.jpg`;
    }

    return {
      embeds: [
        {
          title: this.server.serverName || 'Squad Server',
          fields: [
            {
              name: 'Players',
              value: players,
              inline: true
            },
            {
              name: 'Queue',
              value: `Public: ${publicQueue}\nReserve: ${reserveQueue}`,
              inline: true
            },
            {
              name: 'Current Layer',
              value: `\u200B\n\u200B\n\u200B\n\`\`\`${layerName}\`\`\``,
              inline: true
            },
            {
              name: 'Factions',
              value: `\`\`\`${factionsText}\`\`\``,
              inline: true
            },
            {
              name: 'Next Layer',
              value: `\`\`\`${
                this.server.nextLayer?.name ||
                (this.server.nextLayerToBeVoted ? 'To be voted' : 'Unknown')
              }\`\`\``,
              inline: true
            }
          ],
          color: color,
          footer: { text: COPYRIGHT_MESSAGE },
          timestamp: new Date(),
          image: imageUrl ? { url: imageUrl } : undefined
        }
      ]
    };
  }

  async updateStatus() {
    if (!this.options.setBotStatus) return;

    const a2sPlayerCount = this.server.a2sPlayerCount ?? 0;
    const publicQueue = this.server.publicQueue ?? 0;
    const reserveQueue = this.server.reserveQueue ?? 0;
    const publicSlots = this.server.publicSlots ?? 100;
    const layerName = this.currentLayerInfo?.name || 'Unknown';

    await this.options.discordClient.user.setActivity(
      `(${a2sPlayerCount}/${publicSlots}) Q:${publicQueue}/${reserveQueue} ${layerName}`,
      { type: 4 }
    );
  }
}
