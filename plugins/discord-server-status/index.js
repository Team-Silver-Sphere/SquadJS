import tinygradient from 'tinygradient';

import { COPYRIGHT_MESSAGE } from 'core/config';
import { SERVER_A2S_UPDATED } from 'squad-server/events/server';

const gradient = tinygradient([
  { color: '#ff0000', pos: 0 },
  { color: '#ffff00', pos: 0.5 },
  { color: '#00ff00', pos: 1 }
]);

function makeEmbed(server, options) {
  let players = `${server.playerCount}`;
  if (server.publicQueue + server.reserveQueue > 0)
    players += ` (+${server.publicQueue + server.reserveQueue})`;
  players += ` / ${server.publicSlots}`;
  if (server.reserveSlots > 0) players += ` (+${server.reserveSlots})`;

  const fields = [
    {
      name: 'Players',
      value: `\`\`\`${players}\`\`\``
    },
    {
      name: 'Current Layer',
      value: `\`\`\`${server.currentLayer}\`\`\``,
      inline: true
    },
    {
      name: 'Next Layer',
      value: `\`\`\`${server.nextLayer || 'Unknown'}\`\`\``,
      inline: true
    }
  ];

  if(options.connectLink) fields.push({
    name: 'Join Server',
    value: `steam://connect/${server.host}:${server.queryPort}`
  });

  return {
    embed: {
      title: server.serverName,
      color: options.colorGradient ? parseInt(gradient.rgbAt(server.playerCount / server.publicSlots).toHex(), 16) : options.color,
      fields: fields,
      timestamp: new Date().toISOString(),
      footer: {
        text: `Server Status by ${COPYRIGHT_MESSAGE}`
      }
    }
  };
}

export default async function(server, discordClient, options = {}) {
  if (!server)
    throw new Error(
      'DiscordDebug must be provided with a reference to the server.'
    );

  if (!discordClient)
    throw new Error('DiscordDebug must be provided with a Discord.js client.');

  options = {
    color: 16761867,
    colorGradient: true,
    connectLink: true,
    command: '!server',
    disableStatus: false,
    ...options
  };

  discordClient.on('message', async message => {
    if (message.content !== options.command) return;

    const serverStatus = await message.channel.send(makeEmbed(server, options));

    await serverStatus.react('🔄');
  });

  discordClient.on('messageReactionAdd', async reaction => {
    // confirm it's a status message
    if (
      reaction.message.embeds.length !== 1 ||
      reaction.message.embeds[0].footer.text !==
        `Server Status by ${COPYRIGHT_MESSAGE}`
    )
      return;

    // ignore bots reacting
    if (reaction.count === 1) return;

    // remove reaction and readd it
    await reaction.remove();
    await reaction.message.react('🔄');

    // update the message
    await reaction.message.edit(makeEmbed(server, options));
  });

  server.on(SERVER_A2S_UPDATED, () => {
    if(!options.disableStatus) discordClient.user.setActivity(`(${server.playerCount}/${server.publicSlots}) ${server.currentLayer}`, { type: 'WATCHING' });
  });
}
