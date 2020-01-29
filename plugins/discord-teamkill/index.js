import DiscordConnector from 'connectors/discord';

import { COPYRIGHT_MESSAGE } from 'core/config';
import { LOG_PARSER_TEAMKILL } from 'core/events/log-parser';

export default async function plugin(server, channelID, options = {}) {
  if (!server)
    throw new Error(
      'DiscordTeamkill must be provided with a reference to the server'
    );
  if (!channelID)
    throw new Error('DiscordTeamkill must be provided with a channel ID.');

  options = {
    color: 7102418,
    ...options
  };

  const channel = await (await DiscordConnector.getClient()).channels.get(
    channelID
  );

  server.logParser.on(LOG_PARSER_TEAMKILL, info => {
    // ignore suicides
    if (!info.attacker) return;

    channel.send({
      embed: {
        title: `${info.attacker} Teamkilled`,
        color: options.color,
        fields: [
          {
            name: 'Attacker',
            value: info.attacker || 'Unknown'
          },
          {
            name: 'Weapon',
            value: info.weapon || 'Unknown'
          },
          {
            name: 'Victim',
            value: info.victim || 'Unknown'
          }
        ],
        footer: {
          text: COPYRIGHT_MESSAGE
        }
      }
    });
  });
}
