import { COPYRIGHT_MESSAGE } from 'core/constants';
import { LOG_PARSER_TEAMKILL } from 'squad-server/events/log-parser';

export default {
  name: 'discord-teamkill',
  description:
    'The `discord-teamkill` plugin logs teamkills and related information to a Discord channel for admin to review.',

  defaultDisabled: false,
  optionsSpec: {
    discordClient: {
      type: 'DiscordConnector',
      required: true,
      default: 'discord',
      description: 'The name of the Discord Connector to use.'
    },
    channelID: {
      type: 'Discord Channel ID',
      required: true,
      default: 'Discord Channel ID',
      description: 'The ID of the channel to log admin broadcasts to.'
    },
    teamkillColor: {
      type: 'Discord Color Code',
      required: false,
      default: 16761867,
      description: 'The color of the embed for teamkills.'
    },
    suicideColor: {
      type: 'Discord Color Code',
      required: false,
      default: 16761867,
      description: 'The color of the embed for suicides.'
    },
    ignoreSuicides: {
      type: 'Boolean',
      required: false,
      default: false,
      description: 'Ignore suicides.'
    },
    disableSCBL: {
      type: 'Boolean',
      required: false,
      default: false,
      description: 'Disable Squad Community Ban List information.'
    }
  },

  init: async (server, options) => {
    const channel = await options.discordClient.channels.fetch(options.channelID);

    server.on(LOG_PARSER_TEAMKILL, (info) => {
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
