import { COPYRIGHT_MESSAGE } from 'core/config';
import { LOG_PARSER_TEAMKILL } from 'squad-server/events/log-parser';

export default async function(server, discordClient, channelID, options = {}) {
  if (!server)
    throw new Error(
      'DiscordTeamKill must be provided with a reference to the server.'
    );

  if (!discordClient)
    throw new Error(
      'DiscordTeamkill must be provided with a Discord.js client.'
    );

  if (!channelID)
    throw new Error('DiscordTeamkill must be provided with a channel ID.');

  options = {
    teamkillColor: 16761867,
    suicideColor: 16761867,
    ignoreSuicides: false,
    disableSCBL: false,
    ...options
  };

  const channel = await discordClient.channels.fetch(channelID);

  server.on(LOG_PARSER_TEAMKILL, info => {
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
        title: `${info.suicide ? 'Suicide' : 'Teamkill'}: ${
          info.attacker.name
        }`,
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
