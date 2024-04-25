import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordKillFeed extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>DiscordKillFeed</code> plugin logs all wounds and related information to a Discord channel for ' +
      'admins to review.'
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
        description: 'The ID of the channel to log teamkills to.',
        default: '',
        example: '667741905228136459'
      },
      color: {
        required: false,
        description: 'The color of the embeds.',
        default: 16761867
      },
      disableCBL: {
        required: false,
        description: 'Disable Community Ban List information.',
        default: false
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onWound = this.onWound.bind(this);
  }

  async mount() {
    this.server.on('PLAYER_WOUNDED', this.onWound);
  }

  async unmount() {
    this.server.removeEventListener('PLAYER_WOUNDED', this.onWound);
  }

  async onWound(info) {
    if (!info.attacker) return;

    const fields = [
      {
        name: "Attacker's Name",
        value: info.attacker.name,
        inline: true
      },
      {
        name: "Attacker's SteamID",
        value: `[${info.attacker.steamID}](https://steamcommunity.com/profiles/${info.attacker.steamID})`,
        inline: true
      },
      {
        name: 'Weapon',
        value: info.weapon
      },
      {
        name: "Victim's Name",
        value: info.victim ? info.victim.name : 'Unknown',
        inline: true
      },
      {
        name: "Victim's SteamID",
        value: info.victim
          ? `[${info.victim.steamID}](https://steamcommunity.com/profiles/${info.victim.steamID})`
          : 'Unknown',
        inline: true
      }
    ];

    if (!this.options.disableCBL)
      fields.push({
        name: 'Community Ban List',
        value: `[Attacker's Bans](https://communitybanlist.com/search/${info.attacker.steamID})`
      });

    await this.sendDiscordMessage({
      embed: {
        title: `KillFeed: ${info.attacker.name}`,
        color: this.options.color,
        fields: fields,
        timestamp: info.time.toISOString()
      }
    });
  }
}
