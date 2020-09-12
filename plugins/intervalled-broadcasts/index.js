export default {
  name: 'intervalled-broadcasts',
  description:
    'The `intervalled-broadcasts` plugin allows you to set broadcasts, which will be broadcasted at preset intervals',

  defaultEnabled: false,
  optionsSpec: {
    broadcasts: {
      type: 'Array',
      required: false,
      default: ['Server powered by SquadJS.'],
      description: 'The broadcasted messages.'
    },
    interval: {
      type: 'Number',
      required: false,
      default: 5 * 60 * 1000,
      description: 'How frequently to broadcast in seconds.'
    }
  },

  init: async (server, options) => {
    setInterval(() => {
      server.rcon.broadcast(options.broadcasts[0]);

      options.broadcasts.push(options.broadcasts.shift());
    }, options.interval);
  }
};
