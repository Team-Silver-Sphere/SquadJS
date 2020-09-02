export default {
  name: 'discord-debug',
  description:
    'The `discord-debug` plugin can be used to help debug SquadJS by dumping SquadJS events to a Discord channel.',

  defaultEnabled: false,
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
    events: {
      type: 'Array',
      required: true,
      default: [],
      description: 'A list of events to dump.'
    }
  },

  init: async (server, options) => {
    const channel = await options.discordClient.channels.fetch(options.channelID);

    for (const event of options.events) {
      server.on(event, (info) => {
        info.event = event;
        channel.send(`\`\`\`${JSON.stringify(info, null, 2)}\`\`\``);
      });
    }
  }
};
