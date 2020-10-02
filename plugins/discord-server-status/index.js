import tinygradient from 'tinygradient';

import { COPYRIGHT_MESSAGE } from 'core/constants';
import { A2S_INFO_UPDATED } from 'squad-server/events';

export default {
  name: 'discord-server-status',
  description:
    'The <code>discord-server-status</code> plugin displays a server status embed to Discord when someone uses the ' +
    '<code>!server</code> command in a Discord channel.',

  defaultEnabled: true,
  optionsSpec: {
    discordClient: {
      required: true,
      description: 'The name of the Discord Connector to use.',
      default: 'discord'
    },
    color: {
      required: false,
      description: 'The color code of the Discord embed.',
      default: 16761867
    },
    colorGradient: {
      required: false,
      description: 'Apply gradient color to Discord embed depending on the player count.',
      default: true
    },
    connectLink: {
      required: false,
      description: 'Display a Steam server connection link.',
      default: true
    },
    command: {
      required: false,
      description: 'The command that displays the embed.',
      default: '!server'
    },
    disableStatus: {
      required: false,
      description: 'Disable the bot status.',
      default: false
    },
    interval: {
      required: false,
      description: 'Sets the interval for automatic reload, 0 = no reload',
      default: 0
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

      if (Number.isInteger(options.interval) && options.interval > 0) {
        // clear interval when clicked refresh by user
        if (refreshTimer) clearInterval(refreshTimer);

        // set new interval and update message periodicly
        try {
          refreshTimer = setInterval(async () => {
            await reaction.message.edit(makeEmbed(server, options));
          }, options.interval * 1000);
        } catch (e) {
          console.error(e);
        }
      }
    });

    server.on(A2S_INFO_UPDATED, () => {
      if (!options.disableStatus)
        options.discordClient.user.setActivity(
          `(${server.playerCount}/${server.publicSlots}) ${server.currentLayer}`,
          { type: 'WATCHING' }
        );
    });
  }
};

var refreshTimer;

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
