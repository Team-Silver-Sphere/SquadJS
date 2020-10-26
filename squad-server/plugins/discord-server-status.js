import tinygradient from 'tinygradient';
import BasePlugin from './base-plugin.js';
import { COPYRIGHT_MESSAGE } from '../utils/constants.js';
import { ServerConfig } from "../../serverconfig.js";

export default class DiscordServerStatus extends BasePlugin {
  static get description() {
    return (
      'The <code>DiscordServerStatus</code> plugin updates a message in Discord with current server information, ' +
      'e.g. player count.'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      discordClient: {
        required: true,
        description: 'Discord connector name.',
        connector: 'discord',
        default: 'discord'
      },
      messageIDs: {
        required: true,
        description: 'ID of messages to update.',
        default: [],
        example: [{ channelID: '667741905228136459', messageID: '766688383043895387' }]
      },
      updateInterval: {
        required: false,
        description: 'How frequently to update the status in Discord.',
        default: 60 * 1000
      },
      disableStatus: {
        required: false,
        description: 'Disable the bot status.',
        default: false
      }
    };
  }

  constructor(server, options, optionsRaw) {
    super(server, options, optionsRaw);

    setInterval(async () => {
      for (const messageID of this.options.messageIDs) {
        try {
          const channel = await this.options.discordClient.channels.fetch(messageID.channelID);
          const message = await channel.messages.fetch(messageID.messageID);

          await message.edit(this.getEmbed());
        } catch (err) {
          console.log(err);
        }
      }

      await this.options.discordClient.user.setActivity(
        `(${this.server.a2sPlayerCount}/${this.server.publicSlots}) ${
          this.server.layerHistory[0].layer || 'Unknown'
        }`,
        { type: 'WATCHING' }
      );
    }, this.options.updateInterval);
  }

  getEmbed() {
    let players = '';

    players += `${this.server.a2sPlayerCount}`;
    if (this.server.publicQueue + this.server.reserveQueue > 0)
      players += ` (+${this.server.publicQueue + this.server.reserveQueue})`;

    players += ` / ${this.server.publicSlots}`;
    if (this.server.reserveSlots > 0) players += ` (+${this.server.reserveSlots})`;

    const fields = [
      {
        name: 'Players',
        value: `\`\`\`${players}\`\`\``
      },
      {
        name: 'Current Layer',
        value: `\`\`\`${this.server.layerHistory[0].layer || 'Unknown'}\`\`\``,
        inline: true
      },
      {
        name: 'Next Layer',
        value: `\`\`\`${this.server.nextLayer || 'Unknown'}\`\`\``,
        inline: true
      }
    ];

    return {
      content: '',
      embed: {
        title: this.server.serverName,
        color: parseInt(
          tinygradient([
            { color: '#ff0000', pos: 0 },
            { color: '#ffff00', pos: 0.5 },
            { color: '#00ff00', pos: 1 }
          ])
            .rgbAt(this.server.a2sPlayerCount / this.server.publicSlots)
            .toHex(),
          16
        ),
        fields: fields,
        timestamp: new Date().toISOString(),
        footer: { text: COPYRIGHT_MESSAGE }
      }
    };
  }
}
