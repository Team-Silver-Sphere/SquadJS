import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordTeamkillExtra extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>DiscordTeamkill</code> plugin logs teamkills and related information to a Discord channel for ' +
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
      disableSCBL: {
        required: false,
        description: 'Disable Squad Community Ban List information.',
        default: false
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onTeamkill = this.onTeamkill.bind(this);
  }

  async mount() {
    this.server.on('TEAMKILL', this.onTeamkill);
  }

  async unmount() {
    this.server.removeEventListener('TEAMKILL', this.onTeamkill);
  }

  async onTeamkill(info) {
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
        value: info.victim.name,
        inline: true
      },
      {
        name: "Victim's SteamID",
        value: `[${info.victim.steamID}](https://steamcommunity.com/profiles/${info.victim.steamID})`,
        inline: true
      }
    ];

    if (!this.options.disableSCBL)
      fields.push({
        name: 'Squad Community Ban List',
        value: `[Attacker's Bans](https://squad-community-ban-list.com/search/${info.attacker.steamID})`
      });

    fields.push({
      name: "Note",
      value: `\`\`\`
Date:     ${new Date().toISOString()}
Attacker: ${info.attacker.name}
Victim:   ${info.victim.name}
Weapon:   ${info.weapon}
\`\`\``
    })

    await this.sendDiscordMessage({
      embed: {
        title: `${info.attacker.name}`,
        color: this.options.color,
        fields: fields,
        timestamp: info.time.toISOString()
      }
    });
  }
}
