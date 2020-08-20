import tinygradient from 'tinygradient';

import { COPYRIGHT_MESSAGE } from 'core/constants';
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

  if (options.connectLink)
    fields.push({
      name: 'Join Server',
      value: `steam://connect/${server.host}:${server.queryPort}`
    });

  return {
    embed: {
      title: server.serverName,
      color: options.colorGradient
        ? parseInt(gradient.rgbAt(server.playerCount / server.publicSlots).toHex(), 16)
        : options.color,
      fields: fields,
      timestamp: new Date().toISOString(),
      footer: {
        text: `Server Status by ${COPYRIGHT_MESSAGE}`
      }
    }
  };
}

export default {
  name: 'discord-server-status',
  description: 'This plugin displays server status embeds in Discord.',
  defaultDisabled: false,

  optionsSpec: {
    discordClient: {
      type: 'DiscordConnector',
      required: true,
      default: 'discord',
      description: 'The name of the Discord Connector to use.'
    },
    color: {
      type: 'Discord Color Code',
      required: false,
      default: 16761867,
      description: 'The color code of the Discord embed.'
    },
    colorGradient: {
      type: 'Boolean',
      required: false,
      default: true,
      description: 'Apply gradient color to Discord embed depending on the player count.'
    },
    connectLink: {
      type: 'Boolean',
      required: false,
      default: true,
      description: 'Display a Steam server connection link.'
    },
    command: {
      type: 'String',
      required: false,
      default: '!server',
      description: 'The command that displays the embed.'
    },
    disableStatus: {
      type: 'Boolean',
      required: false,
      default: false,
      description: 'Disable the bot status.'
    }
  },

  init: async (server, options) => {
    options.discordClient.on('message', async (message) => {
      if (message.content !== options.command) return;

      const serverStatus = await message.channel.send(makeEmbed(server, options));

      await serverStatus.react('🔄');
    });

    options.discordClient.on('messageReactionAdd', async (reaction) => {
      // confirm it's a status message
      if (
        reaction.message.embeds.length !== 1 ||
        reaction.message.embeds[0].footer.text !== `Server Status by ${COPYRIGHT_MESSAGE}`
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
      if (!options.disableStatus)
        options.discordClient.user.setActivity(
          `(${server.playerCount}/${server.publicSlots}) ${server.currentLayer}`,
          { type: 'WATCHING' }
        );
    });
  }
};
