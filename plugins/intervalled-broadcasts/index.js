export default {
  name: 'intervalled-broadcasts',
  description:
    'The `intervalled-broadcasts` plugin allows you to set broadcasts, which will be broadcasted at preset intervals',

  defaultEnabled: false,
  optionsSpec: {
    broadcasts: {
      required: false,
      description: 'The broadcasted messages.',
      default: ['Server powered by SquadJS.']
    },
    interval: {
      required: false,
      description: 'How frequently to broadcast in seconds.',
      default: 5 * 60 * 1000
    }
  },

  init: async (server, options) => {
    setInterval(() => {
      server.rcon.broadcast(options.broadcasts[0]);

      options.broadcasts.push(options.broadcasts.shift());
    }, options.interval);
  }
};
