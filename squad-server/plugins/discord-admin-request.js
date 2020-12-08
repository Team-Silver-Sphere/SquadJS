import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordAdminRequest extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>DiscordAdminRequest</code> plugin will ping admins in a Discord channel when a player requests ' +
      'an admin via the <code>!admin</code> command in in-game chat.'
    );
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
      ignoreChats: {
        required: false,
        description: 'A list of chat names to ignore.',
        default: [],
        example: ['ChatSquad']
      },
      ignorePhrases: {
        required: false,
        description: 'A list of phrases to ignore.',
        default: [],
        example: ['switch']
      },
      command: {
        required: false,
        description: 'The command that calls an admin.',
        default: 'admin'
      },
      pingGroups: {
        required: false,
        description: 'A list of Discord role IDs to ping.',
        default: [],
        example: ['500455137626554379']
      },
      pingDelay: {
        required: false,
        description: 'Cooldown for pings in milliseconds.',
        default: 60 * 1000
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

    this.lastPing = Date.now() - this.options.pingDelay;

    this.onChatCommand = this.onChatCommand.bind(this);
  }

  async mount() {
    this.server.on(`CHAT_COMMAND:${this.options.command}`, this.onChatCommand);
  }

  async unmount() {
    this.server.removeEventListener(`CHAT_COMMAND:${this.options.command}`, this.onChatCommand);
  }

  async onChatCommand(info) {
    if (this.options.ignoreChats.includes(info.chat)) return;

    for (const ignorePhrase of this.options.ignorePhrases) {
      if (info.message.includes(ignorePhrase)) return;
    }

    if (info.message.length === 0) {
      await this.server.rcon.warn(
        info.player.steamID,
        `Please specify what you would like help with when requesting an admin.`
      );
      return;
    }

    const message = {
      embed: {
        title: `${info.player.name} has requested admin support!`,
        color: this.options.color,
        fields: [
          {
            name: 'Player',
            value: info.player.name,
            inline: true
          },
          {
            name: 'SteamID',
            value: `[${info.player.steamID}](https://steamcommunity.com/profiles/${info.player.steamID})`,
            inline: true
          },
          {
            name: 'Team & Squad',
            value: `Team: ${info.player.teamID}, Squad: ${info.player.squadID || 'Unassigned'}`
          },
          {
            name: 'Message',
            value: info.message
          }
        ],
        timestamp: info.time.toISOString()
      }
    };

    if (this.options.pingGroups.length > 0 && Date.now() - this.options.pingDelay > this.lastPing) {
      message.content = this.options.pingGroups.map((groupID) => `<@&${groupID}>`).join(' ');
      this.lastPing = Date.now();
    }

    await this.sendDiscordMessage(message);

    await this.server.rcon.warn(
      info.player.steamID,
      `An admin has been notified, please wait for us to get back to you.`
    );
  }
}
