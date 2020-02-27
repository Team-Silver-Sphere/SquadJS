import DiscordConnector from 'connectors/discord';

import { COPYRIGHT_MESSAGE } from 'core/config';
import { RCON_CHAT_MESSAGE } from '../../events/rcon.js';

export default async function plugin(server, channelID, options = {}) {
  if (!server)
    throw new Error(
      'DiscordChat must be provided with a reference to the server.'
    );

  if (!channelID)
    throw new Error('DiscordChat must be provided with a channel ID.');

  const ignoreChats = options.ignoreChats || ['ChatSquad', 'ChatAdmin'];

  options = {
    color: 16761867,
    ...options
  };

  const channel = await (await DiscordConnector.getClient()).channels.get(
    channelID
  );

  server.on(RCON_CHAT_MESSAGE, info => {
    if (ignoreChats.includes(info.chat)) return;

    channel.send({
      embed: {
        title: info.chat,
        color: options.color,
        fields: [
          {
            name: 'Player',
            value: info.player,
            inline: true
          },
          {
            name: 'SteamID',
            value: info.steamID,
            inline: true
          },
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
