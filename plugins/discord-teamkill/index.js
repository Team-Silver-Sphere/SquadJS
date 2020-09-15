import { COPYRIGHT_MESSAGE } from 'core/constants';
import { TEAMKILL } from 'squad-server/events';

export default {
  name: 'discord-teamkill',
  description:
    'The <code>discord-teamkill</code> plugin logs teamkills and related information to a Discord channel for admin to review.',

  defaultEnabled: true,
  optionsSpec: {
    discordClient: {
      required: true,
      description: 'The name of the Discord Connector to use.',
      default: 'discord'
    },
    channelID: {
      required: true,
      description: 'The ID of the channel to log admin broadcasts to.',
      default: '',
      example: '667741905228136459'
    },
    teamkillColor: {
      required: false,
      description: 'The color of the embed for teamkills.',
      default: 16761867
    },
    suicideColor: {
      required: false,
      description: 'The color of the embed for suicides.',
      default: 16761867
    },
    ignoreSuicides: {
      required: false,
      description: 'Ignore suicides.',
      default: false
    },
    disableSCBL: {
      required: false,
      description: 'Disable Squad Community Ban List information.',
      default: false
    }
  },

  init: async (server, options) => {
    const channel = await options.discordClient.channels.fetch(options.channelID);

    server.on(TEAMKILL, (info) => {
      if (!info.attacker) return;
      if (options.ignoreSuicides && info.suicide) return;

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

      if (!options.disableSCBL)
        fields.push({
          name: 'Squad Community Ban List',
          value: `[Attacker's Bans](https://squad-community-ban-list.com/search/${info.attacker.steamID})\n[Victims's Bans](https://squad-community-ban-list.com/search/${info.victim.steamID})`
        });

      channel.send({
        embed: {
          title: `${info.suicide ? 'Suicide' : 'Teamkill'}: ${info.attacker.name}`,
          color: info.suicide ? options.suicideColor : options.teamkillColor,
          fields: fields,
          timestamp: info.time.toISOString(),
          footer: {
            text: COPYRIGHT_MESSAGE
          }
        }
      });
    });
  }
};
