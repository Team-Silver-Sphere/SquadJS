import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordTeamkill extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>DiscordTeamkill</code> plugin logs teamkills to a Discord channel in a clean, aligned text format for admins to review.'
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
    this.onTeamkill = this.onTeamkill.bind(this);
  }

  async mount() {
    this.server.on('TEAMKILL', this.onTeamkill);
  }

  async unmount() {
    this.server.removeListener('TEAMKILL', this.onTeamkill);
  }

  async onTeamkill(info) {
    if (!info.attacker || !info.victim) return;

    // Helper for spacing between columns
    function pad(len) {
      return ' '.repeat(Math.max(0, Math.floor(2.4 * len + 1)));
    }

    const attackerName = info.attacker.name;
    const weaponName = info.weapon;
    const victimName = info.victim.name;
    const timestamp = info.time.toISOString();
    const trimmedTimestamp = timestamp.slice(5, -1);

    // Default widths for alignment
    const defaultColWidths = {
      attacker: 24,
      weapon: 28,
      victim: 24,
    };
    const actualColWidths = {
      attacker: attackerName.length,
      weapon: weaponName.length,
      victim: victimName.length,
    };

    // Calculate paddings
    let attackerPad = defaultColWidths.attacker - actualColWidths.attacker;
    let weaponPad = defaultColWidths.weapon - actualColWidths.weapon;
    let victimPad = defaultColWidths.victim - actualColWidths.victim;

    if (attackerPad < 0) {
      weaponPad += attackerPad;
      attackerPad = 0;
    }
    if (weaponPad < 0) {
      victimPad += weaponPad;
      weaponPad = 0;
    }

    attackerPad = Math.max(0, attackerPad);
    weaponPad = Math.max(0, weaponPad);
    victimPad = Math.max(0, victimPad);

    // Build aligned text message
    const textMsg =
      `\`${trimmedTimestamp}\` ` +
      `**Attacker**: [` +
      `\`${attackerName}\`` +
      `](<https://battlemetrics.com/rcon/players?filter[search]=${info.attacker.steamID}&method=quick&redirect=1>)` +
      pad(attackerPad) +
      `**Weapon**: \`${weaponName}\`` +
      pad(weaponPad) +
      `**Victim**: [` +
      `\`${victimName}\`` +
      `](<https://battlemetrics.com/rcon/players?filter[search]=${info.victim.steamID}&method=quick&redirect=1>)` +
      (
        !this.options.disableCBL
          ? ` [CBL](<https://communitybanlist.com/search/${info.attacker.steamID}>)`
          : ''
      );

    await this.sendDiscordMessage({
      content: textMsg
      /*embed: {
        title: `Teamkill: ${info.attacker.name}`,
        color: this.options.color,
        fields: [
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
            name: "Attacker's EosID",
            value: info.attacker.eosID,
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
          },
          {
            name: "Victim's EosID",
            value: info.victim.eosID,
            inline: true
          },
          {
            name: 'Community Ban List',
            value: `[Attacker's Bans](https://communitybanlist.com/search/${info.attacker.steamID})`
          }
        ],
        timestamp: info.time.toISOString()
      }*/
    });
  }
}
