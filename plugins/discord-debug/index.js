export default {
  name: 'discord-debug',
  description:
    'The <code>discord-debug</code> plugin can be used to help debug SquadJS by dumping SquadJS events to a ' +
    'Discord channel.',

  defaultEnabled: false,
  optionsSpec: {
    discordClient: {
      required: true,
      description: 'The name of the Discord Connector to use.',
      default: 'discord'
    },
    channelID: {
      required: true,
      description: 'The ID of the channel to log admin broadcasts to.',
      default: '',
      example: '667741905228136459'
    },
    events: {
      required: true,
      description: 'A list of events to dump.',
      default: [],
      example: ['PLAYER_DIED']
    }
  },

  init: async (server, options) => {
    const channel = await options.discordClient.channels.fetch(options.channelID);

    for (const event of options.events) {
      server.on(event, (info) => {
        channel.send(`\`\`\`${JSON.stringify({ ...info, event }, null, 2)}\`\`\``);
      });
    }
  }
};
