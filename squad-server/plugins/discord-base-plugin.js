import BasePlugin from './base-plugin.js';

import { COPYRIGHT_MESSAGE } from '../utils/constants.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export default class DiscordBasePlugin extends BasePlugin {
  static get optionsSpecification() {
    return {
      discordClient: {
        required: true,
        description: 'Discord connector name.',
        connector: 'discord',
        default: 'discord'
      }
    };
  }

  // #region Constructor
  constructor(server, options, connectors) {
    super(server, options, connectors);
    this.channels = new Map();
  }
  // #endregion

  // #region prepareToMount
  async prepareToMount() {
    if (!this.isEmpty(this.options.channelIDs)) {
      for (const obj of this.options.channelIDs) {
        try {
          if (typeof obj.channelID !== 'string') {
            throw new Error('Discord channelID must be a string.');
          }
          if (typeof obj.label !== 'string') {
            throw new Error('Discord label must be a string.');
          }
          this.channels.set(obj.label, {
            channel: this.options.discordClient.channels.cache.get(obj.channelID),
            ...obj
          });
        } catch (ex) {
          this.dbg(
            'DiscordJS',
            1,
            `Could not fetch Discord channel w/ channelID { ${JSON.stringify(obj)} }, ${ex.message}`
          );
          this.dbg('DiscordJS', 2, `${ex.stack}`);
        }
      }
    }
    if (!this.isEmpty(this.options.channelID)) {
      try {
        if (typeof this.options.channelID !== 'string') {
          throw new Error('Unknown Discord channelID type.');
        }
        this.channels.set('default', {
          channel: this.options.discordClient.channels.cache.get(this.options.channelID),
          channelID: this.options.channelID
        });
      } catch (error) {
        this.dbg(
          'DiscordJS',
          1,
          `Could not fetch Discord channel with channelID "${this.options.channelID}". Error: ${error.message}`
        );
        this.dbg('DiscordJS', 2, `${error.stack}`);
      }
    }
    this.dbg('DiscordJS', 1, `Loaded ${this.channels.size} Discord Channels.`);
  }
  // #endregion

  buildButton(CustomId, Label, style = 'Primary', link) {
    const btn = new ButtonBuilder().setLabel(Label).setStyle(ButtonStyle[style]);
    if (this.isEmpty(link)) {
      btn.setCustomId(CustomId);
    } else {
      btn.setURL(link);
    }
    return btn;
  }

  buildEmbed(color, time, author) {
    const { clan, iconURL, url } = this.options.embedInfo;
    const name = author ?? this.options.embedInfo.name;
    const embed = new EmbedBuilder();
    const authorFormat = {};
    // If this.options.embedInfo is invalid
    if (this.isEmpty(name)) {
      Object.assign(authorFormat, {
        name: 'SquadJS Server Watchdog',
        iconURL,
        url
      });
    } else {
      Object.assign(authorFormat, {
        name: `${clan ?? ''}${name}`,
        iconURL,
        url
      });
    }
    embed.setAuthor(authorFormat);
    if (!this.isEmpty(color)) {
      embed.setColor(color);
    }
    if (this.isNull(time)) {
      embed.setTimestamp(new Date());
    } else if (typeof time === 'string') {
      embed.setTimestamp(new Date(time));
    } else {
      embed.setTimestamp(time);
    }
    return embed;
  }

  /**
   * Convert and wrap embeds to object
   * @param {(Object|Object[]|string)} embed - Array, Set, or Embed class
   * @returns {Object} Object to be used with this.sendDiscordMessage
   */
  objEmbed(embed) {
    if (Array.isArray(embed)) {
      return {
        embeds: embed
      };
    }
    if (embed instanceof Set) {
      return {
        embeds: [...embed]
      };
    }
    return {
      embeds: [embed]
    };
  }

  objRow(buttons) {
    const row = new ActionRowBuilder().addComponents(...buttons);
    return {
      components: [row]
    };
  }

  // #region Send Discord Msg
  /**
   * sendDiscordMessage
   * @param {(Object|string)} message - Message to send to channel
   * @param {(Object[]|string)} labels - String or Array of channel labels
   */
  async sendDiscordMessage(message, labels) {
    try {
      if (this.isEmpty(message)) {
        this.dbg('DiscordJS', 1, 'Could not send Discord Message. Message is empty.');
        return;
      }
      if (this.isBlank(this.channels)) {
        this.dbg('DiscordJS', 1, `Could not send Discord Message. Channels not initialized.`);
        return;
      }
      const cLabels = [];
      if (this.isEmpty(labels) || this.channels.size === 1) {
        cLabels.push('default');
      } else if (typeof labels === 'string') {
        cLabels.push(labels);
      } else {
        cLabels.push(...this.normalizeTarget(labels));
      }
      if (typeof message === 'object') {
        if ('embed' in message) {
          message.embeds = message.embed;
          delete message.embed;
        }
        if ('embeds' in message) {
          const copyright = {
            text: COPYRIGHT_MESSAGE,
            icon_url: null
          };
          const addCopyright = (e) => {
            if (e instanceof EmbedBuilder) {
              if (!e.data.footer?.text.includes('SquadJS')) {
                e.setFooter(copyright);
              }
              return e;
            }
            const toEmbed = EmbedBuilder.from(e);
            if (!toEmbed.data.footer?.text.includes('SquadJS')) {
              toEmbed.setFooter(copyright);
            }
            return toEmbed;
          };
          if (!Array.isArray(message.embeds)) {
            if (message.embeds instanceof Set) {
              message.embeds = [...message.embeds];
            } else {
              message.embeds = [message.embeds];
            }
          }
          message.embeds = message.embeds.map(addCopyright);
        }
      }
      const toSend = [];
      for (const label of cLabels) {
        const c = this.channels.get(label);
        if (this.isEmpty(c)) {
          continue;
        }
        if (this.isEmpty(c.channel)) {
          this.dbg(
            'DiscordJS',
            1,
            'Could not send Discord Message, channel is not initialized.',
            c
          );
          break;
        }
        toSend.push(c.channel.send(message));
      }
      await Promise.all(toSend);
    } catch (ex) {
      console.error(ex);
    }
  }
  // #endregion
}
