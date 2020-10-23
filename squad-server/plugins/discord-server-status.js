import tinygradient from 'tinygradient';
import BasePlugin from './base-plugin.js';
import { COPYRIGHT_MESSAGE } from '../utils/constants.js';

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

  constructor(server, options) {
    super(server, options);

    setInterval(async () => {
      for (const messageID of this.options.messageIDs) {
        try {
          const channel = await this.options.discordClient.channels.fetch(messageID.channelID);
          const message = await channel.messages.fetch(messageID.messageID);

          await message.edit(this.getEmbed(server));
        } catch (err) {
          console.log(err);
        }
      }

      await this.options.discordClient.user.setActivity(
        `(${server.a2sPlayerCount}/${server.publicSlots}) ${
          server.layerHistory[0].layer || 'Unknown'
        }`,
        { type: 'WATCHING' }
      );
    }, this.options.updateInterval);
  }

  getEmbed(server) {
    let players = '';

    players += `${server.a2sPlayerCount}`;
    if (server.publicQueue + server.reserveQueue > 0)
      players += ` (+${server.publicQueue + server.reserveQueue})`;

    players += ` / ${server.publicSlots}`;
    if (server.reserveSlots > 0) players += ` (+${server.reserveSlots})`;

    const fields = [
      {
        name: 'Players',
        value: `\`\`\`${players}\`\`\``
      },
      {
        name: 'Current Layer',
        value: `\`\`\`${server.layerHistory[0].layer || 'Unknown'}\`\`\``,
        inline: true
      },
      {
        name: 'Next Layer',
        value: `\`\`\`${server.nextLayer || 'Unknown'}\`\`\``,
        inline: true
      }
    ];

    return {
      content: '',
      embed: {
        title: server.serverName,
        color: parseInt(
          tinygradient([
            { color: '#ff0000', pos: 0 },
            { color: '#ffff00', pos: 0.5 },
            { color: '#00ff00', pos: 1 }
          ])
            .rgbAt(server.a2sPlayerCount / server.publicSlots)
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
