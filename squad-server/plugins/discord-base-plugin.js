import BasePlugin from './base-plugin.js';
import { COPYRIGHT_MESSAGE } from '../utils/constants.js';
import { EmbedBuilder } from 'discord.js';

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

  async prepareToMount() {
    try {
      this.channel = await this.options.discordClient.channels.fetch(this.options.channelID);
    } catch (error) {
      this.channel = null;
      this.verbose(
        1,
        `Could not fetch Discord channel with channelID "${this.options.channelID}". Error: ${error.message}`
      );
      this.verbose(2, `${error.stack}`);
    }
  }

  /**
   * Object is Null
   * @param {Object} obj - Object
   * @returns {boolean} Returns booleantrue or false
   */
  isNull(obj) {
    return Object.is(obj, null) || Object.is(obj, undefined);
  }

  /**
   * Object is Blank
   * @param {(Object|Object[]|string)} obj - Array, Set, Object or String
   * @returns {boolean} Returns boolean true or false
   */
  isBlank(obj) {
    return (
      (typeof obj === 'string' && Object.is(obj.trim(), '')) ||
      (obj instanceof Set && Object.is(obj.size, 0)) ||
      (Array.isArray(obj) && Object.is(obj.length, 0)) ||
      (obj instanceof Object &&
        typeof obj.entries !== 'function' &&
        Object.is(Object.keys(obj).length, 0))
    );
  }

  /**
   * Object is Empty
   * @param {(Object|Object[]|string)} obj - Array, object or string
   * @returns {boolean} Returns boolean true or false
   */
  isEmpty(obj) {
    return this.isNull(obj) || this.isBlank(obj);
  }

  isObj(obj) {
    return obj instanceof Object && typeof obj.entries !== 'function' || typeof obj === 'object';
  }

  /**
   * Has valid info
   * @param {Object} info - Root information
   * @param {string} template - template to use
   * 
   * Templates:
   * - steamID
   * - squadID
   * - squadName
   * - TeamID
   * - teamName
   * @returns {boolean} Returns boolean true or false
   */
  isValid(info, template) {
    const check = this.validate(info, template);
    if(Object.is(check, `<${template}>`)) {
      return false;
    };
    return check;
  }

  /**
   * Embed Builder
   * @param {Number|string} color - Color of embed message
   * @param {Date|string} time - Timestamp of embed message
   * @param {string} title - Title of embed message
   * @param {string} author - Author of embed message
   * @returns {class} embed - EmbedBuilder()
   */
  buildEmbed(color, time, title, author) {
    const embed = new EmbedBuilder();
    if(!this.isEmpty(author)) {
      if(isObj(author)) {
        embed.setAuthor(author);
      } else {
        embed.setAuthor({
          name: author,
          iconURL: null,
          url: null
        });
      }
    };
    if(!this.isEmpty(color)) {
      if(typeof color === 'string') {
        embed.setColor(this.options.chatColors[color])
      } else {
        embed.setColor(color)
      };
    };
    if(this.isNull(time)) {
      embed.setTimestamp(new Date());
    } else if(typeof time === 'string') {
      embed.setTimestamp(new Date(time));
    } else {
      embed.setTimestamp(time);
    };
    if(!this.isEmpty(title)) {
      embed.setTitle(title)
    };
    return embed;
  }

  /**
   * Embed to Object
   * @param {class|object} embed - EmbedBuilder() class
   * @returns {object} Embed Object
   */
  objEmbed(embed) {
    if(Array.isArray(embed)) {
      return {
        embeds: embed
      };
    };
    if(embed instanceof Set) {
      return {
        embeds: [...embed]
      };
    };
    return {
      embeds: [embed]
    };
  }

  validator(obj, locate) {
    let result = null;
    for(const key in obj) {
      if(key === locate) {
        result = obj[key];
        break;
      } else if(obj[key] instanceof Object) {
        result = this.validator(obj[key], locate);
      };
    };
    return result;
  }

  validate(info, template) {
    if (!this.isObj(info)) {
      return 'Undefined';
    };
    const formatted = template.replace(/(<[\w\d]+>)/g, (_match, root) => {
      const mfind = (txt) => {
        const reg = new RegExp(txt, 'g');
        const txtMatch = root.match(/[\w\d]+/g)[0].match(reg) || [];
        return !!txtMatch.length;
      };
      const mFormat = (key, alt) => {
        const extras = alt ?? key;
        return this.isNull(key) ? root : extras;
      };
      let response = null;
      if(mfind('steamID')) {
        response = mFormat(this.validator(info, 'steamID'))
      } else if(mfind('squadID')) {
        response = mFormat(this.validator(info, 'squadID'))
      } else if(mfind('squadName')) {
        response = mFormat(this.validator(info, 'squadName'))
      } else if(mfind('name')) {
        response = mFormat(this.validator(info, 'name'))
      } else if(mfind('TeamID')) {
        response = mFormat(this.validator(info, 'teamID'))
      } else if(mfind('teamName')) {
        response = mFormat(this.validator(info, 'teamName'))
      } else {
        response = root;
      }
      return response;
    });
    return formatted;
  }

  async sendDiscordMessage(message) {
    if (this.isEmpty(message)) {
      this.verbose(1, 'Could not send Discord Message. Message is empty.');
      return;
    }
    if (!this.channel) {
      this.verbose(1, `Could not send Discord Message. Channel not initialized.`);
      return;
    }
    if (typeof message === 'object' && 'embeds' in message) {
      for(const e of message.embeds) {
        e.setFooter({
          text: COPYRIGHT_MESSAGE,
          iconURL: null
        });
      };
    }

    await this.channel.send(message);
  }
}