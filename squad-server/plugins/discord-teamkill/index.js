import DiscordConnector from 'connectors/discord';

import { COPYRIGHT_MESSAGE } from 'core/config';
import { LOG_PARSER_TEAMKILL } from '../../events/log-parser.js';

export default async function plugin(server, channelID, options = {}) {
  if (!server)
    throw new Error(
      'DiscordTeamkill must be provided with a reference to the server'
    );
  if (!('logParser' in server))
    throw new Error(
      'LogParser must be enabled in the server for this plugin to work.'
    );
  if (!channelID)
    throw new Error('DiscordTeamkill must be provided with a channel ID.');

  options = {
    color: 16761867,
    ...options
  };

  const channel = await (await DiscordConnector.getClient()).channels.get(
    channelID
  );

  server.on(LOG_PARSER_TEAMKILL, info => {
    // ignore suicides
    if (!info.attacker) return;

    channel.send({
      embed: {
        title: `Teamkill: ${info.attacker}`,
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
        timestamp: info.time.toISOString(),
        footer: {
          text: COPYRIGHT_MESSAGE
        }
      }
    });
  });
}
