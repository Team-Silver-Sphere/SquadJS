import { COPYRIGHT_MESSAGE } from 'core/config';
import { LOG_PARSER_ADMIN_BROADCAST } from 'squad-server/events/log-parser';

export default async function(server, discordClient, channelID, options = {}) {
  if (!server) throw new Error('DiscordChat must be provided with a reference to the server.');

  if (!discordClient) throw new Error('DiscordChat must be provided with a Discord.js client.');

  if (!channelID) throw new Error('DiscordChat must be provided with a channel ID.');

  options = {
    color: 16761867,
    ...options
  };

  const channel = await discordClient.channels.fetch(channelID);

  server.on(LOG_PARSER_ADMIN_BROADCAST, async info => {
    channel.send({
      embed: {
        title: 'Admin Broadcast',
        color: options.color,
        fields: [
          {
            name: 'Message',
            value: `${info.message}`
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
