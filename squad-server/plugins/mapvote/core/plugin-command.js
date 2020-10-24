const MAPVOTE_COMMANDS = {
  common: {
    mapvote: {
      text: 'mapvote',
      pattern: /^!mapvote ?(.*)/
    },
    vote: {
      pattern: /^([0-9])/
    }
  },
  players: {
    help: 'help',
    results: 'results'
  },
  admin: {
    start: 'start',
    restart: 'restart',
    end: 'end',
    destroy: 'destroy'
  }
};

export { MAPVOTE_COMMANDS };
